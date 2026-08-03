/**
 * Checkpoint Event Format (CEF) v0.1 — APRS text profile.
 * Spec: docs/protocol/checkpoint-event-format.md §6.1
 */

export const APRS_MAX_LENGTH = 67;

const MAX_EPOCH = 0xFFFFFFFF;

/**
 * Military time zone letters (spec §6.1.1). J means "local time at the sending
 * station" and has no fixed offset. Note the deliberate absence of J from the
 * numeric sequence — I is +9 and K is +10.
 */
const ZONE_OFFSETS = {
  Z: 0,
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  K: 10, L: 11, M: 12,
  N: -1, O: -2, P: -3, Q: -4, R: -5, S: -6, T: -7, U: -8, V: -9,
  W: -10, X: -11, Y: -12,
};

const EPOCH_TOKEN_RE = /^@([0-9a-zA-Z+/]{6})$/;
const CLOCK_TOKEN_RE = /^(\d\d)\.?(\d\d)(?:\.?(\d\d))?([A-Z])$/;

const TWELVE_HOURS_MS = 12 * 3600 * 1000;

/**
 * Encode an instant as the canonical `@` form: a big-endian uint32 Unix
 * timestamp, base64 with padding stripped. Six characters, 1-second precision,
 * valid until 2106.
 * @param {string} isoString
 * @returns {string} e.g. '@am0qWA'
 */
export function encodeTime(isoString) {
  const ms = Date.parse(isoString);
  if (Number.isNaN(ms)) throw new Error(`Unparseable time: ${isoString}`);

  const epoch = Math.floor(ms / 1000);
  if (epoch < 0 || epoch > MAX_EPOCH) {
    throw new Error(`Time out of range for a uint32 epoch: ${isoString}`);
  }

  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, epoch, false); // big-endian
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return '@' + btoa(binary).replace(/=+$/, '');
}

function decodeEpochToken(chars) {
  const binary = atob(chars + '==');
  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) bytes[i] = binary.charCodeAt(i);
  const epoch = new DataView(bytes.buffer).getUint32(0, false);
  return new Date(epoch * 1000).toISOString();
}

/**
 * Resolve a dateless clock time against the receipt instant (spec §6.1.1):
 * the most recent matching instant that is not in the future, rejected if it
 * lands more than 12 hours back.
 */
function decodeClockToken(hh, mm, ss, zone, receivedAt) {
  const hours = Number(hh);
  const minutes = Number(mm);
  const seconds = ss === undefined ? 0 : Number(ss);
  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new Error(`Invalid clock time: ${hh}${mm}${ss ?? ''}${zone}`);
  }

  const received = Date.parse(receivedAt);
  if (Number.isNaN(received)) throw new Error(`Unparseable receivedAt: ${receivedAt}`);

  let offsetMinutes;
  if (zone === 'J') {
    // Local time at this station. getTimezoneOffset is minutes *behind* UTC.
    offsetMinutes = -new Date(received).getTimezoneOffset();
  } else if (zone in ZONE_OFFSETS) {
    offsetMinutes = ZONE_OFFSETS[zone] * 60;
  } else {
    throw new Error(`Unknown time zone letter: ${zone}`);
  }

  const recv = new Date(received);
  let candidate = Date.UTC(
    recv.getUTCFullYear(), recv.getUTCMonth(), recv.getUTCDate(),
    hours, minutes, seconds,
  ) - offsetMinutes * 60000;

  // Walk back a day if the same-day reading would be in the future.
  if (candidate > received) candidate -= 24 * 3600 * 1000;

  if (received - candidate > TWELVE_HOURS_MS) {
    throw new Error(
      `Clock time ${hh}${mm}${zone} resolves to more than 12 hours before receipt; ` +
      'retransmit using the @ epoch form'
    );
  }

  return new Date(candidate).toISOString();
}

/**
 * Decode any spec §6.1.1 time token to an ISO 8601 UTC instant.
 * @param {string} token e.g. '@am0qWA', '2306Z', '230642Z', '23.06.42Z'
 * @param {string} receivedAt ISO instant of receipt, used only for clock forms
 * @returns {string}
 */
export function decodeTime(token, receivedAt) {
  const epochMatch = EPOCH_TOKEN_RE.exec(token);
  if (epochMatch) return decodeEpochToken(epochMatch[1]);

  const clockMatch = CLOCK_TOKEN_RE.exec(token);
  if (clockMatch) {
    const [, hh, mm, ss, zone] = clockMatch;
    return decodeClockToken(hh, mm, ss, zone, receivedAt);
  }

  throw new Error(`Unrecognised time token: ${token}`);
}
