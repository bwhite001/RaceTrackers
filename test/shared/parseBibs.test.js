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
