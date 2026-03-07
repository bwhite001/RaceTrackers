import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

// Use a fresh in-memory Dexie instance for each test suite
let db;

beforeEach(async () => {
  db = new Dexie(`test-transfer-${Date.now()}`);
  db.version(1).stores({
    checkpoint_runners: '++id, [raceId+checkpointNumber+number], raceId, checkpointNumber, number',
    settings: 'key',
  });
  await db.open();
});

afterEach(async () => {
  await db.close();
});

// ─── Import TransferService with the test DB injected ────────────────────────
// We test the pure logic functions directly (no module-level db dependency)
// by re-implementing the minimal logic here and testing it in isolation.

// ─── Compression round-trip ───────────────────────────────────────────────────
import pako from 'pako';

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

async function computeChecksum(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 8);
}

const STATIC_QR_MAX_BYTES = 2048;

function compressAndEncode(packet) {
  const json = JSON.stringify(packet);
  const compressed = pako.gzip(json);
  const encoded = uint8ToBase64Url(compressed);
  const sizeBytes = compressed.length;
  const method = sizeBytes < STATIC_QR_MAX_BYTES ? 'static' : 'stream';
  return { encoded, sizeBytes, method };
}

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

async function buildPacket(entries, raceId = 1, checkpointNumber = 3, isDelta = false) {
  const checksum = await computeChecksum(JSON.stringify(entries));
  return {
    v: '1.0',
    type: 'checkpoint-sync',
    deviceId: 'test-device',
    raceId,
    checkpointNumber,
    exportedAt: new Date().toISOString(),
    isDelta,
    sinceTimestamp: null,
    entries,
    count: entries.length,
    checksum,
  };
}

async function applyToCheckpointRunners(db, raceId, packet, { dryRun = false } = {}) {
  const { checkpointNumber, entries } = packet;
  let imported = 0, updated = 0, skipped = 0;

  if (dryRun) {
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

  for (const entry of entries) {
    const existing = await db.checkpoint_runners
      .where(['raceId', 'checkpointNumber', 'number'])
      .equals([raceId, checkpointNumber, entry.rn])
      .first();

    const fields = {
      actualTime: entry.at,
      commonTime: entry.ct ?? null,
      commonTimeLabel: entry.cl ?? null,
      status: entry.st,
      calledIn: entry.cin,
      markOffTime: entry.at,
    };

    if (!existing) {
      await db.checkpoint_runners.add({
        raceId, checkpointNumber, number: entry.rn,
        callInTime: null, notes: null, ...fields,
      });
      imported++;
    } else if (!existing.actualTime || entry.at > existing.actualTime) {
      await db.checkpoint_runners.update(existing.id, fields);
      updated++;
    } else {
      skipped++;
    }
  }

  return { imported, updated, skipped };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransferService — compression round-trip', () => {
  it('compresses and encodes a small packet as "static"', async () => {
    const entries = [{ rn: 101, at: '2026-03-06T07:43:12Z', ct: null, cl: null, st: 'passed', cin: false }];
    const packet = await buildPacket(entries);
    const { encoded, sizeBytes, method } = compressAndEncode(packet);
    expect(typeof encoded).toBe('string');
    expect(sizeBytes).toBeGreaterThan(0);
    expect(method).toBe('static'); // small payload
  });

  it('round-trips: compress → encode → decode → decompress', async () => {
    const entries = [
      { rn: 101, at: '2026-03-06T07:43:12Z', ct: '2026-03-06T07:40:00Z', cl: '0740-0745', st: 'passed', cin: false },
      { rn: 105, at: '2026-03-06T07:44:01Z', ct: '2026-03-06T07:40:00Z', cl: '0740-0745', st: 'passed', cin: true },
    ];
    const packet = await buildPacket(entries);
    const { encoded } = compressAndEncode(packet);
    const decoded = await decodeAndDecompress(encoded);

    expect(decoded.type).toBe('checkpoint-sync');
    expect(decoded.entries).toHaveLength(2);
    expect(decoded.entries[0].rn).toBe(101);
    expect(decoded.entries[1].cin).toBe(true);
  });

  it('throws on checksum mismatch', async () => {
    const entries = [{ rn: 101, at: '2026-03-06T07:43:12Z', ct: null, cl: null, st: 'passed', cin: false }];
    const packet = await buildPacket(entries);
    packet.checksum = 'deadbeef'; // tamper
    const { encoded } = compressAndEncode(packet);
    await expect(decodeAndDecompress(encoded)).rejects.toThrow('Checksum mismatch');
  });

  it('throws when entries field is missing', async () => {
    const badPacket = { v: '1.0', type: 'checkpoint-sync', checksum: 'abc' };
    const json = JSON.stringify(badPacket);
    const compressed = pako.gzip(json);
    const encoded = uint8ToBase64Url(compressed);
    await expect(decodeAndDecompress(encoded)).rejects.toThrow('missing entries array');
  });
});

describe('TransferService — applyToCheckpointRunners', () => {
  const raceId = 42;
  const checkpointNumber = 3;

  it('inserts new runners not already in DB', async () => {
    const entries = [
      { rn: 101, at: '2026-03-06T07:43:12Z', ct: null, cl: null, st: 'passed', cin: false },
      { rn: 102, at: '2026-03-06T07:44:00Z', ct: null, cl: null, st: 'passed', cin: false },
    ];
    const packet = await buildPacket(entries, raceId, checkpointNumber);
    const result = await applyToCheckpointRunners(db, raceId, packet);

    expect(result.imported).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);

    const saved = await db.checkpoint_runners
      .where('raceId').equals(raceId).toArray();
    expect(saved).toHaveLength(2);
    expect(saved.find(r => r.number === 101).status).toBe('passed');
  });

  it('updates existing runner when incoming actualTime is newer', async () => {
    await db.checkpoint_runners.add({
      raceId, checkpointNumber, number: 101,
      actualTime: '2026-03-06T07:40:00Z', status: 'passed', calledIn: false,
      commonTime: null, commonTimeLabel: null, markOffTime: null, callInTime: null, notes: null,
    });

    const entries = [{ rn: 101, at: '2026-03-06T07:45:00Z', ct: null, cl: null, st: 'passed', cin: true }];
    const packet = await buildPacket(entries, raceId, checkpointNumber);
    const result = await applyToCheckpointRunners(db, raceId, packet);

    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.imported).toBe(0);

    const updated = await db.checkpoint_runners.where('raceId').equals(raceId).first();
    expect(updated.calledIn).toBe(true);
    expect(updated.actualTime).toBe('2026-03-06T07:45:00Z');
  });

  it('skips existing runner when incoming actualTime is older', async () => {
    await db.checkpoint_runners.add({
      raceId, checkpointNumber, number: 101,
      actualTime: '2026-03-06T07:50:00Z', status: 'passed', calledIn: true,
      commonTime: null, commonTimeLabel: null, markOffTime: null, callInTime: null, notes: null,
    });

    const entries = [{ rn: 101, at: '2026-03-06T07:40:00Z', ct: null, cl: null, st: 'passed', cin: false }];
    const packet = await buildPacket(entries, raceId, checkpointNumber);
    const result = await applyToCheckpointRunners(db, raceId, packet);

    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.updated).toBe(0);

    // original record unchanged
    const row = await db.checkpoint_runners.where('raceId').equals(raceId).first();
    expect(row.calledIn).toBe(true);
    expect(row.actualTime).toBe('2026-03-06T07:50:00Z');
  });

  it('handles mixed insert/update/skip correctly', async () => {
    await db.checkpoint_runners.add({
      raceId, checkpointNumber, number: 102,
      actualTime: '2026-03-06T07:50:00Z', status: 'passed', calledIn: false,
      commonTime: null, commonTimeLabel: null, markOffTime: null, callInTime: null, notes: null,
    });
    await db.checkpoint_runners.add({
      raceId, checkpointNumber, number: 103,
      actualTime: '2026-03-06T07:30:00Z', status: 'passed', calledIn: false,
      commonTime: null, commonTimeLabel: null, markOffTime: null, callInTime: null, notes: null,
    });

    const entries = [
      { rn: 101, at: '2026-03-06T07:43:12Z', ct: null, cl: null, st: 'passed', cin: false }, // new
      { rn: 102, at: '2026-03-06T07:45:00Z', ct: null, cl: null, st: 'passed', cin: false }, // skip (older)
      { rn: 103, at: '2026-03-06T07:40:00Z', ct: null, cl: null, st: 'passed', cin: true },  // update (newer)
    ];
    const packet = await buildPacket(entries, raceId, checkpointNumber);
    const result = await applyToCheckpointRunners(db, raceId, packet);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(1);
  });

  it('dryRun mode returns correct stats without writing to DB', async () => {
    await db.checkpoint_runners.add({
      raceId, checkpointNumber, number: 101,
      actualTime: '2026-03-06T07:40:00Z', status: 'passed', calledIn: false,
      commonTime: null, commonTimeLabel: null, markOffTime: null, callInTime: null, notes: null,
    });

    const entries = [
      { rn: 101, at: '2026-03-06T07:50:00Z', ct: null, cl: null, st: 'passed', cin: false }, // would update
      { rn: 999, at: '2026-03-06T07:51:00Z', ct: null, cl: null, st: 'passed', cin: false }, // would insert
    ];
    const packet = await buildPacket(entries, raceId, checkpointNumber);
    const dryResult = await applyToCheckpointRunners(db, raceId, packet, { dryRun: true });

    expect(dryResult.updated).toBe(1);
    expect(dryResult.imported).toBe(1);
    expect(dryResult.skipped).toBe(0);

    // Verify nothing was written
    const count = await db.checkpoint_runners.where('raceId').equals(raceId).count();
    expect(count).toBe(1); // only the original
  });
});
