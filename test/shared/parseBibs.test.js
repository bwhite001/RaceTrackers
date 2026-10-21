import { describe, it, expect } from 'vitest';
import { parseBibs } from '../../src/shared/utils/parseBibs.js';

describe('parseBibs', () => {
  it('parses individual bib numbers', () => {
    expect(parseBibs('101, 105, 120')).toEqual([101, 105, 120]);
  });

  it('expands ranges', () => {
    expect(parseBibs('105-110')).toEqual([105, 106, 107, 108, 109, 110]);
  });

  it('handles mixed individual and ranges', () => {
    expect(parseBibs('1, 5, 10-12')).toEqual([1, 5, 10, 11, 12]);
  });

  it('ignores whitespace and empty tokens', () => {
    expect(parseBibs('  101 ,  202  , ')).toEqual([101, 202]);
  });

  it('handles newlines as separators', () => {
    expect(parseBibs('101\n102\n103')).toEqual([101, 102, 103]);
  });

  it('returns empty array for empty input', () => {
    expect(parseBibs('')).toEqual([]);
  });

  it('ignores invalid tokens', () => {
    expect(parseBibs('abc, 101, xyz')).toEqual([101]);
  });
});

import { parseBibList } from '../../src/shared/utils/parseBibs.js';

describe('parseBibList (individual numbers only)', () => {
  it('splits on commas, spaces, semicolons and newlines', () => {
    expect(parseBibList('212, 218 224;230\n231').numbers).toEqual([212, 218, 224, 230, 231]);
  });
  it('never expands ranges', () => {
    expect(parseBibList('100-105')).toEqual({ numbers: [], rejected: ['100-105'] });
  });
  it('keeps duplicates so callers can flag "listed twice"', () => {
    expect(parseBibList('5 5').numbers).toEqual([5, 5]);
  });
});
