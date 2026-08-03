import { describe, it, expect } from 'vitest';
import vectors from '../../../docs/protocol/test-vectors.json';
import { encodeTime, decodeTime, encodeAprs, decodeAprs } from '../../../src/services/cef/aprsText';

describe('spec §9 epoch vectors', () => {
  it.each(vectors.epochVectors)('encodes $iso as $token', ({ iso, token }) => {
    expect(encodeTime(iso)).toBe(token);
  });

  it.each(vectors.epochVectors)('decodes $token as $iso', ({ iso, token }) => {
    expect(decodeTime(token, vectors.receivedAt)).toBe(iso);
  });

  it.each(vectors.epochVectors)('$token is the documented epoch $epoch', ({ epoch, iso }) => {
    expect(Math.floor(Date.parse(iso) / 1000)).toBe(epoch);
  });
});

describe('spec §9 line vectors', () => {
  it.each(vectors.lineVectors)('decodes $line', ({ line, records }) => {
    expect(decodeAprs(line, vectors.receivedAt)).toEqual(records);
  });

  const canonical = vectors.lineVectors.filter(v => v.canonical);

  it.each(canonical)('re-encodes $line byte-for-byte', ({ line, records }) => {
    expect(encodeAprs(records)).toEqual([line]);
  });

  it('covers every event type', () => {
    const seen = new Set(vectors.lineVectors.flatMap(v => v.records.map(r => r.event)));
    expect(seen).toEqual(new Set(['SEEN', 'WITHDRAWN', 'VET_OUT', 'DNF', 'NON_STARTER']));
  });

  it('keeps every line within the APRS character limit', () => {
    for (const { line } of vectors.lineVectors) expect(line.length).toBeLessThanOrEqual(67);
  });
});
