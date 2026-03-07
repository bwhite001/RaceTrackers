import pako from 'pako';
import db from '../../../shared/services/database/schema';

// Payload size thresholds (compressed bytes)
const STATIC_QR_MAX_BYTES = 2048; // < 2KB → single static QR

// ─── Device identity ──────────────────────────────────────────────────────────

async function getOrCreateDeviceId() {
  const existing = await db.settings.get('device.id');
  if (existing?.value) return existing.value;
  const id = crypto.randomUUID();
  await db.settings.put({ key: 'device.id', value: id });
  return id;
}

// ─── Last-share timestamp ─────────────────────────────────────────────────────

function lastShareKey(raceId, checkpointNumber, deviceId) {
  return `transfer.lastShare.${raceId}.cp${checkpointNumber}.${deviceId}`;
}

async function getLastShareTimestamp(raceId, checkpointNumber) {
  const deviceId = await getOrCreateDeviceId();
  const row = await db.settings.get(lastShareKey(raceId, checkpointNumber, deviceId));
  return row?.value ?? null;
}

async function saveLastShareTimestamp(raceId, checkpointNumber) {
  const deviceId = await getOrCreateDeviceId();
  const key = lastShareKey(raceId, checkpointNumber, deviceId);
  await db.settings.put({ key, value: new Date().toISOString() });
}

// ─── Checksum ─────────────────────────────────────────────────────────────────

async function computeChecksum(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 8);
}

// ─── Build payload ────────────────────────────────────────────────────────────

/**
 * Build a transfer packet from IndexedDB checkpoint_runners.
 * @param {number} raceId
 * @param {number} checkpointNumber
 * @param {{ isDelta: boolean, sinceTimestamp: string|null }} options
 * @returns {Promise<object>} transfer packet (not yet compressed)
 */
async function buildPayload(raceId, checkpointNumber, { isDelta = false, sinceTimestamp = null } = {}) {
  const deviceId = await getOrCreateDeviceId();

  let runners = await db.checkpoint_runners
    .where('[raceId+checkpointNumber+number]')
    .between([raceId, checkpointNumber, -Infinity], [raceId, checkpointNumber, Infinity])
    .toArray();

  // Only include runners that have actually been marked (have an actualTime)
  runners = runners.filter(r => r.actualTime);

  // Delta: filter to entries newer than sinceTimestamp
  if (isDelta && sinceTimestamp) {
    runners = runners.filter(r => r.actualTime > sinceTimestamp);
  }

  const entries = runners.map(r => ({
    rn: r.number,
    at: r.actualTime,
    ct: r.commonTime ?? null,
    cl: r.commonTimeLabel ?? null,
    st: r.status,
    cin: r.calledIn ?? false,
  }));

  const entriesJson = JSON.stringify(entries);
  const checksum = await computeChecksum(entriesJson);

  return {
    v: '1.0',
    type: 'checkpoint-sync',
    deviceId,
    raceId,
    checkpointNumber,
    exportedAt: new Date().toISOString(),
    isDelta,
    sinceTimestamp: isDelta ? (sinceTimestamp ?? null) : null,
    entries,
    count: entries.length,
    checksum,
  };
}

// ─── Compress + encode ────────────────────────────────────────────────────────

/**
 * Gzip-compress and base64url-encode a packet.
 * @param {object} packet
 * @returns {{ encoded: string, sizeBytes: number, method: 'static'|'stream' }}
 */
function compressAndEncode(packet) {
  const json = JSON.stringify(packet);
  const compressed = pako.gzip(json);
  const encoded = uint8ToBase64Url(compressed);
  const sizeBytes = compressed.length;
  const method = sizeBytes < STATIC_QR_MAX_BYTES ? 'static' : 'stream';
  return { encoded, sizeBytes, method };
}

// ─── Decode + decompress ──────────────────────────────────────────────────────

/**
 * Decode and decompress a base64url-encoded gzipped packet string.
 * Validates the checksum. Throws on failure.
 * @param {string} encoded
 * @returns {Promise<object>} validated packet
 */
async function decodeAndDecompress(encoded) {
  const compressed = base64UrlToUint8(encoded);
  const json = pako.ungzip(compressed, { to: 'string' });
  const packet = JSON.parse(json);

  if (!packet.entries || !Array.isArray(packet.entries)) {
    throw new Error('Invalid transfer packet: missing entries array');
  }

  const entriesJson = JSON.stringify(packet.entries);
  const expectedChecksum = await computeChecksum(entriesJson);
  if (packet.checksum !== expectedChecksum) {
    throw new Error(`Checksum mismatch: expected ${expectedChecksum}, got ${packet.checksum}`);
  }

  return packet;
}

// ─── Apply to DB (last-write-wins merge) ─────────────────────────────────────

/**
 * Merge incoming packet entries into checkpoint_runners.
 * Last-write-wins: incoming actualTime wins if it is strictly newer.
 * @param {number} raceId
 * @param {object} packet decoded transfer packet
 * @param {{ dryRun?: boolean }} options
 * @returns {Promise<{ imported: number, updated: number, skipped: number }>}
 */
async function applyToCheckpointRunners(raceId, packet, { dryRun = false } = {}) {
  const { checkpointNumber, entries } = packet;
  let imported = 0, updated = 0, skipped = 0;

  if (dryRun) {
    // Read-only pass — calculate stats without writing
    for (const entry of entries) {
      const existing = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpointNumber, entry.rn])
        .first();
      if (!existing) imported++;
      else if (!existing.actualTime || entry.at > existing.actualTime) updated++;
      else skipped++;
    }
    return { imported, updated, skipped };
  }

  await db.transaction('rw', db.checkpoint_runners, async () => {
    for (const entry of entries) {
      const existing = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([raceId, checkpointNumber, entry.rn])
        .first();

      const fields = {
        actualTime: entry.at,
        commonTime: entry.ct,
        commonTimeLabel: entry.cl,
        status: entry.st,
        calledIn: entry.cin,
        markOffTime: entry.at, // back-compat
      };

      if (!existing) {
        await db.checkpoint_runners.add({
          raceId,
          checkpointNumber,
          number: entry.rn,
          callInTime: null,
          notes: null,
          ...fields,
        });
        imported++;
      } else if (!existing.actualTime || entry.at > existing.actualTime) {
        await db.checkpoint_runners.update(existing.id, fields);
        updated++;
      } else {
        skipped++;
      }
    }
  });

  return { imported, updated, skipped };
}

// ─── Base64url helpers (no external dep needed) ───────────────────────────────

function uint8ToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToUint8(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

const TransferService = {
  getOrCreateDeviceId,
  getLastShareTimestamp,
  saveLastShareTimestamp,
  buildPayload,
  compressAndEncode,
  decodeAndDecompress,
  applyToCheckpointRunners,
  STATIC_QR_MAX_BYTES,
};

export default TransferService;
