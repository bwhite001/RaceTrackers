import { describe, it, expect } from 'vitest';
import { EVENT_TYPES } from '../../../src/services/cef/record';
import {
  VERBS,
  APRS_LINE_RE,
  APRS_MAX_LENGTH,
  encodeAprs,
  decodeAprs,
} from '../../../src/services/cef/aprsText';

const RECEIVED = '2026-08-01T00:00:00Z';
const T = '2026-07-31T23:06:00.000Z';

const seenAt = (competitor, site = { checkpoint: 3 }) => ({
  site, competitor, event: EVENT_TYPES.SEEN, time: T,
});

describe('VERBS', () => {
  it('maps N to SEEN, preserving the 2020 format', () => {
    expect(VERBS.N).toBe(EVENT_TYPES.SEEN);
  });

  it('assigns a distinct letter to every event type', () => {
    expect(Object.keys(VERBS)).toHaveLength(5);
    expect(new Set(Object.values(VERBS)).size).toBe(5);
  });
});

describe('encodeAprs', () => {
  it('encodes a single sighting', () => {
    expect(encodeAprs(seenAt('123'))).toEqual(['CP3T@am0qWAN123']);
  });

  it('batches several competitors sharing site, event and time', () => {
    const records = ['123', '234', '345', '456'].map(n => seenAt(n));
    expect(encodeAprs(records)).toEqual(['CP3T@am0qWAN123 234 345 456']);
  });

  it('uses the LC prefix for a location reference', () => {
    expect(encodeAprs(seenAt('123', { location: 2 }))).toEqual(['LC2T@am0qWAN123']);
  });

  it('encodes each stop event with its own verb', () => {
    const cases = [
      [EVENT_TYPES.WITHDRAWN, 'CP3T@am0qWAW123'],
      [EVENT_TYPES.VET_OUT, 'CP3T@am0qWAV123'],
      [EVENT_TYPES.DNF, 'CP3T@am0qWAF123'],
      [EVENT_TYPES.NON_STARTER, 'CP3T@am0qWAS123'],
    ];
    for (const [event, expected] of cases) {
      expect(encodeAprs({ ...seenAt('123'), event })).toEqual([expected]);
    }
  });

  it('appends a reason code to a stop event', () => {
    const record = { ...seenAt('234'), event: EVENT_TYPES.VET_OUT, reason: 'LAME' };
    expect(encodeAprs(record)).toEqual(['CP3T@am0qWAV234 LAME']);
  });

  it('splits a batch too large for one line', () => {
    const records = Array.from({ length: 30 }, (_, i) => seenAt(String(100 + i)));
    const lines = encodeAprs(records);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(APRS_MAX_LENGTH);
  });

  it('loses no competitors when splitting', () => {
    const records = Array.from({ length: 30 }, (_, i) => seenAt(String(100 + i)));
    const decoded = encodeAprs(records).flatMap(line => decodeAprs(line, RECEIVED));
    expect(decoded.map(r => r.competitor).sort())
      .toEqual(records.map(r => r.competitor).sort());
  });

  it('never emits a line containing braces', () => {
    expect(encodeAprs(seenAt('123'))[0]).not.toMatch(/[{}]/);
  });

  it('groups mixed input by site, event and time rather than dropping records', () => {
    const lines = encodeAprs([
      seenAt('123'),
      { ...seenAt('234'), event: EVENT_TYPES.WITHDRAWN },
      seenAt('345', { checkpoint: 8 }),
    ]);
    expect(lines).toHaveLength(3);
    expect(lines).toContain('CP3T@am0qWAN123');
    expect(lines).toContain('CP3T@am0qWAW234');
    expect(lines).toContain('CP8T@am0qWAN345');
  });

  it('throws for an invalid record rather than emitting a bad line', () => {
    expect(() => encodeAprs({ ...seenAt('123'), competitor: 'bad-number' })).toThrow();
  });
});

describe('decodeAprs', () => {
  it('decodes a batched sighting into one record per competitor', () => {
    const records = decodeAprs('CP3T@am0qWAN123 234 345 456', RECEIVED);
    expect(records).toHaveLength(4);
    expect(records[0]).toEqual({
      site: { checkpoint: 3 }, competitor: '123', event: EVENT_TYPES.SEEN, time: T,
    });
  });

  it('accepts the optional space after CP', () => {
    expect(decodeAprs('CP 3T2306ZN123', RECEIVED)[0].site).toEqual({ checkpoint: 3 });
  });

  it('decodes a location reference', () => {
    expect(decodeAprs('LC2T@am0qWAN123', RECEIVED)[0].site).toEqual({ location: 2 });
  });

  it('decodes a stop event with a reason code', () => {
    const [record] = decodeAprs('CP3T@am0qWAV234 LAME', RECEIVED);
    expect(record.event).toBe(EVENT_TYPES.VET_OUT);
    expect(record.competitor).toBe('234');
    expect(record.reason).toBe('LAME');
  });

  it('decodes a stop event without a reason code', () => {
    const [record] = decodeAprs('CP3T@am0qWAW123', RECEIVED);
    expect(record.event).toBe(EVENT_TYPES.WITHDRAWN);
    expect(record.reason).toBeUndefined();
  });

  it('decodes an alphanumeric competitor number', () => {
    expect(decodeAprs('CP3T@am0qWAN12A', RECEIVED)[0].competitor).toBe('12A');
  });

  it('round-trips every encodeAprs output', () => {
    const record = { ...seenAt('234'), event: EVENT_TYPES.VET_OUT, reason: 'LAME' };
    const [line] = encodeAprs(record);
    expect(decodeAprs(line, RECEIVED)).toEqual([record]);
  });

  it('rejects an unknown verb rather than assuming SEEN', () => {
    // Fail-safe requirement, spec §6.1.2.
    expect(() => decodeAprs('CP3T@am0qWAQ123', RECEIVED)).toThrow();
  });

  it('rejects a stop event carrying multiple competitors', () => {
    expect(() => decodeAprs('CP3T@am0qWAW123 234', RECEIVED)).toThrow(/one competitor/i);
  });

  it('rejects a stop event with too many items (invalid reason code not uppercase)', () => {
    // Distinguish the items.length === 2 with invalid reason format case
    expect(() => decodeAprs('CP3T@am0qWAW123 lowercase', RECEIVED)).toThrow(/one competitor/i);
  });

  it('rejects a line with no items', () => {
    expect(() => decodeAprs('CP3T@am0qWAN', RECEIVED)).toThrow();
  });

  it('rejects a malformed line', () => {
    expect(() => decodeAprs('hello there', RECEIVED)).toThrow(/grammar|malformed/i);
  });

  it('rejects a line exceeding the character limit', () => {
    const tooLong = 'CP3T@am0qWAN' + Array.from({ length: 40 }, (_, i) => 100 + i).join(' ');
    expect(tooLong.length).toBeGreaterThan(APRS_MAX_LENGTH);
    expect(() => decodeAprs(tooLong, RECEIVED)).toThrow(/length|67/i);
  });
});

describe('APRS_LINE_RE', () => {
  it('matches the spec §6.1.4 reference grammar examples', () => {
    const valid = [
      'CP3T@am0qWAN123 234 345 456',
      'CP 3T2306ZN123',
      'LC2T@am0qWAN123',
      'CP3T@am0qggV234 LAME',
      'CP3T0906KN123',
    ];
    for (const line of valid) expect(APRS_LINE_RE.test(line)).toBe(true);
  });

  it('does not match a line with an unknown verb', () => {
    expect(APRS_LINE_RE.test('CP3T@am0qWAQ123')).toBe(false);
  });
});
