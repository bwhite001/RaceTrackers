import { describe, it, expect } from 'vitest';
import {
  EVENT_TYPES,
  STOP_EVENTS,
  validateRecord,
  naturalKey,
  mergeRecords,
  encodeJson,
  decodeJson,
} from '../../../src/services/cef/record';

const SEEN = {
  site: { checkpoint: 3 },
  competitor: '123',
  event: EVENT_TYPES.SEEN,
  time: '2026-07-31T23:06:00Z',
};

describe('EVENT_TYPES', () => {
  it('defines exactly the five spec event types', () => {
    expect(Object.keys(EVENT_TYPES)).toEqual([
      'SEEN', 'WITHDRAWN', 'VET_OUT', 'DNF', 'NON_STARTER',
    ]);
  });

  it('lists the four stop events, excluding SEEN', () => {
    expect(STOP_EVENTS).toHaveLength(4);
    expect(STOP_EVENTS).not.toContain(EVENT_TYPES.SEEN);
  });
});

describe('validateRecord', () => {
  it('accepts a minimal valid record', () => {
    expect(validateRecord(SEEN)).toEqual({ valid: true, errors: [] });
  });

  it('accepts a location site reference', () => {
    const r = { ...SEEN, site: { location: 2 } };
    expect(validateRecord(r).valid).toBe(true);
  });

  it('rejects a site with both checkpoint and location', () => {
    const r = { ...SEEN, site: { checkpoint: 3, location: 2 } };
    const { valid, errors } = validateRecord(r);
    expect(valid).toBe(false);
    expect(errors.join(' ')).toMatch(/exactly one/i);
  });

  it('rejects a site with neither', () => {
    expect(validateRecord({ ...SEEN, site: {} }).valid).toBe(false);
  });

  it('rejects an unknown event type', () => {
    const { valid, errors } = validateRecord({ ...SEEN, event: 'CALLED_IN' });
    expect(valid).toBe(false);
    expect(errors.join(' ')).toMatch(/event/i);
  });

  it('rejects a non-alphanumeric competitor number', () => {
    expect(validateRecord({ ...SEEN, competitor: '12-3' }).valid).toBe(false);
    expect(validateRecord({ ...SEEN, competitor: '' }).valid).toBe(false);
  });

  it('accepts an alphanumeric competitor number', () => {
    expect(validateRecord({ ...SEEN, competitor: '12A' }).valid).toBe(true);
  });

  it('rejects an unparseable time', () => {
    expect(validateRecord({ ...SEEN, time: 'yesterday' }).valid).toBe(false);
  });

  it('rejects an ISO date-time with no UTC offset', () => {
    // Date.parse reads an offset-less date-time as LOCAL time — spec §6.2
    // requires an explicit offset at every module boundary.
    expect(validateRecord({ ...SEEN, time: '2026-07-31T23:06:00' }).valid).toBe(false);
  });

  it('rejects a date-only string', () => {
    expect(validateRecord({ ...SEEN, time: '2026-07-31' }).valid).toBe(false);
  });

  it('rejects a non-ISO date string accepted by the Date.parse fallback', () => {
    expect(validateRecord({ ...SEEN, time: 'Jul 31 2026' }).valid).toBe(false);
  });

  it('accepts a +HH:MM offset as well as Z', () => {
    expect(validateRecord({ ...SEEN, time: '2026-08-01T09:06:00+10:00' }).valid).toBe(true);
  });

  it('rejects a non-string source', () => {
    expect(validateRecord({ ...SEEN, source: {} }).valid).toBe(false);
  });

  it('rejects a non-integer msgId', () => {
    expect(validateRecord({ ...SEEN, msgId: 'abc' }).valid).toBe(false);
  });

  it('rejects relays containing a non-string entry', () => {
    expect(validateRecord({ ...SEEN, relays: [{}] }).valid).toBe(false);
  });

  it('rejects a reason on a SEEN event', () => {
    const { valid, errors } = validateRecord({ ...SEEN, reason: 'LAME' });
    expect(valid).toBe(false);
    expect(errors.join(' ')).toMatch(/reason/i);
  });

  it('accepts a reason on a stop event', () => {
    const r = { ...SEEN, event: EVENT_TYPES.VET_OUT, reason: 'LAME' };
    expect(validateRecord(r).valid).toBe(true);
  });

  it('reports every problem at once, not just the first', () => {
    const { errors } = validateRecord({ site: {}, competitor: '', event: 'X', time: 'no' });
    expect(errors.length).toBeGreaterThan(3);
  });
});

describe('naturalKey', () => {
  it('is checkpoint, competitor and event type', () => {
    expect(naturalKey(SEEN)).toBe('3|123|SEEN');
  });

  it('distinguishes event types at the same checkpoint', () => {
    const withdrawn = { ...SEEN, event: EVENT_TYPES.WITHDRAWN };
    expect(naturalKey(withdrawn)).not.toBe(naturalKey(SEEN));
  });

  it('ignores time, source and relays', () => {
    const other = { ...SEEN, time: '2026-07-31T23:59:00Z', source: 'VK4BWI-14' };
    expect(naturalKey(other)).toBe(naturalKey(SEEN));
  });

  it('throws for an unresolved location reference', () => {
    expect(() => naturalKey({ ...SEEN, site: { location: 2 } }))
      .toThrow(/resolve/i);
  });
});

describe('mergeRecords', () => {
  it('keeps the earliest time when the same event arrives twice', () => {
    const early = { ...SEEN, time: '2026-07-31T23:06:00Z', source: 'direct' };
    const late = { ...SEEN, time: '2026-07-31T23:09:00Z', source: 'relayed' };
    const merged = mergeRecords([late, early]);
    expect(merged).toHaveLength(1);
    expect(merged[0].time).toBe('2026-07-31T23:06:00Z');
    expect(merged[0].source).toBe('direct');
  });

  it('is order-independent', () => {
    const early = { ...SEEN, time: '2026-07-31T23:06:00Z' };
    const late = { ...SEEN, time: '2026-07-31T23:09:00Z' };
    expect(mergeRecords([early, late])).toEqual(mergeRecords([late, early]));
  });

  it('keeps distinct events separate', () => {
    const other = { ...SEEN, competitor: '234' };
    expect(mergeRecords([SEEN, other])).toHaveLength(2);
  });

  it('preserves input order of distinct records', () => {
    const a = { ...SEEN, competitor: '234' };
    const b = { ...SEEN, competitor: '123' };
    expect(mergeRecords([a, b]).map(r => r.competitor)).toEqual(['234', '123']);
  });

  it('returns an empty array for no input', () => {
    expect(mergeRecords([])).toEqual([]);
  });

  it('never lets an unparseable time displace a valid one, regardless of order', () => {
    const bad = { ...SEEN, time: 'not-a-time' };
    const good = { ...SEEN, time: '2026-07-31T23:06:00Z' };
    expect(mergeRecords([bad, good])[0].time).toBe(good.time);
    expect(mergeRecords([good, bad])[0].time).toBe(good.time);
  });
});

describe('JSON profile', () => {
  it('round-trips a single record', () => {
    expect(decodeJson(encodeJson(SEEN))).toEqual([SEEN]);
  });

  it('round-trips an array of records', () => {
    const records = [SEEN, { ...SEEN, competitor: '234' }];
    expect(decodeJson(encodeJson(records))).toEqual(records);
  });

  it('accepts a bare object as well as an array', () => {
    expect(decodeJson(JSON.stringify(SEEN))).toEqual([SEEN]);
  });

  it('omits absent optional fields rather than emitting null', () => {
    expect(encodeJson(SEEN)).not.toMatch(/null/);
  });

  it('preserves optional provenance fields', () => {
    const r = { ...SEEN, source: 'VK4BWI-14', relays: ['VK4RWI-3'], msgId: 7 };
    expect(decodeJson(encodeJson(r))[0]).toEqual(r);
  });

  it('throws with the validation errors for an invalid record', () => {
    expect(() => decodeJson('[{"site":{},"event":"X"}]')).toThrow(/site|event/i);
  });

  it('throws for malformed JSON', () => {
    expect(() => decodeJson('not json')).toThrow();
  });
});
