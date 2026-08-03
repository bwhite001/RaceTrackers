import { describe, it, expect } from 'vitest';
import { encodeTime, decodeTime, APRS_MAX_LENGTH } from '../../../src/services/cef/aprsText';

// Verified against Node: Buffer.writeUInt32BE(1785539160).toString('base64')
const EPOCH_VECTORS = [
  ['2026-07-31T23:06:00Z', '@am0qWA'],
  ['2026-07-31T23:06:42Z', '@am0qgg'],
];

describe('APRS_MAX_LENGTH', () => {
  it('is the 67-character spec limit', () => {
    expect(APRS_MAX_LENGTH).toBe(67);
  });
});

describe('encodeTime', () => {
  it.each(EPOCH_VECTORS)('encodes %s as %s', (iso, token) => {
    expect(encodeTime(iso)).toBe(token);
  });

  it('always produces an @ plus exactly six characters', () => {
    expect(encodeTime('2026-07-31T23:06:00Z')).toMatch(/^@[0-9a-zA-Z+/]{6}$/);
  });

  it('never emits base64 padding', () => {
    expect(encodeTime('2026-01-01T00:00:00Z')).not.toContain('=');
  });

  it('normalises a non-UTC offset to the same instant', () => {
    expect(encodeTime('2026-08-01T09:06:00+10:00')).toBe(encodeTime('2026-07-31T23:06:00Z'));
  });

  it('truncates sub-second precision rather than rounding', () => {
    expect(encodeTime('2026-07-31T23:06:00.999Z')).toBe('@am0qWA');
  });

  it('throws for a time before the epoch', () => {
    expect(() => encodeTime('1969-12-31T00:00:00Z')).toThrow(/range/i);
  });

  it('throws for an unparseable time', () => {
    expect(() => encodeTime('yesterday')).toThrow();
  });
});

describe('decodeTime — epoch form', () => {
  it.each(EPOCH_VECTORS)('decodes %s back from %s', (iso, token) => {
    expect(decodeTime(token, '2026-08-01T00:00:00Z')).toBe(iso.replace('Z', '.000Z'));
  });

  it('round-trips through encodeTime', () => {
    const iso = '2026-07-31T23:06:42.000Z';
    expect(decodeTime(encodeTime(iso), '2026-08-01T00:00:00Z')).toBe(iso);
  });

  it('ignores receivedAt entirely — the epoch form carries its own date', () => {
    expect(decodeTime('@am0qWA', '2030-01-01T00:00:00Z'))
      .toBe(decodeTime('@am0qWA', '2026-08-01T00:00:00Z'));
  });
});

describe('decodeTime — clock forms', () => {
  const RECEIVED = '2026-08-01T00:30:00Z';

  it('decodes HHMM with a UTC zone letter', () => {
    expect(decodeTime('2306Z', RECEIVED)).toBe('2026-07-31T23:06:00.000Z');
  });

  it('decodes HHMMSS with a UTC zone letter', () => {
    expect(decodeTime('230642Z', RECEIVED)).toBe('2026-07-31T23:06:42.000Z');
  });

  it('decodes the dot-separated form', () => {
    expect(decodeTime('23.06.42Z', RECEIVED)).toBe('2026-07-31T23:06:42.000Z');
  });

  it('applies the K zone letter as UTC+10', () => {
    expect(decodeTime('0906K', RECEIVED)).toBe('2026-07-31T23:06:00.000Z');
  });

  it('applies a negative zone letter', () => {
    // W is UTC-10, so 13:06W is 23:06Z the same day.
    expect(decodeTime('1306W', RECEIVED)).toBe('2026-07-31T23:06:00.000Z');
  });

  it('treats J as local time using the receiving offset', () => {
    // Derive the clock reading from the host's own offset so this holds in any
    // timezone: J-decoding the receipt instant's local clock time must return
    // that same instant.
    const received = new Date(RECEIVED);
    const hh = String(received.getHours()).padStart(2, '0');
    const mm = String(received.getMinutes()).padStart(2, '0');
    expect(decodeTime(`${hh}${mm}J`, RECEIVED)).toBe('2026-08-01T00:30:00.000Z');
  });

  it('skips J when assigning numeric offsets — I is +9 and K is +10', () => {
    const i = Date.parse(decodeTime('0000I', RECEIVED));
    const k = Date.parse(decodeTime('0000K', RECEIVED));
    expect((i - k) / 3600000).toBe(1);
  });

  it('resolves to the most recent matching instant, not a future one', () => {
    // 23:06Z is in the past relative to 00:30Z on 1 Aug, so it is 31 July.
    expect(decodeTime('2306Z', RECEIVED)).toBe('2026-07-31T23:06:00.000Z');
  });

  it('uses the same day when that instant is already in the past', () => {
    expect(decodeTime('0006Z', RECEIVED)).toBe('2026-08-01T00:06:00.000Z');
  });

  it('rejects a clock time resolving to more than 12 hours before receipt', () => {
    // 11:00Z is 13.5 hours before 00:30Z on 1 Aug.
    expect(() => decodeTime('1100Z', RECEIVED)).toThrow(/12 hours/i);
  });

  it('throws for an unrecognised token', () => {
    expect(() => decodeTime('lunchtime', RECEIVED)).toThrow(/time/i);
  });

  it('throws for an out-of-range clock time', () => {
    expect(() => decodeTime('2506Z', RECEIVED)).toThrow();
  });
});
