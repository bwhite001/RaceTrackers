import { describe, it, expect } from 'vitest';
import { splitIntoOvers, buildOvers, clampOverSize } from '../../src/modules/checkpoint-operations/services/readout.js';

describe('readout overs', () => {
  const nums = [130, 135, 140, 142, 147, 151, 153, 158, 163, 166, 170, 175];

  it('splits into overs of up to 5, every bib its own item', () => {
    const overs = splitIntoOvers(nums, 5);
    expect(overs).toEqual([[130, 135, 140, 142, 147], [151, 153, 158, 163, 166], [170, 175]]);
    // never produces ranges — consecutive bibs stay separate numbers
    const consecutive = splitIntoOvers([144, 145, 146, 147, 148], 5);
    expect(consecutive).toEqual([[144, 145, 146, 147, 148]]);
    expect(consecutive.flat().every(n => typeof n === 'number')).toBe(true);
  });

  it('clamps over size to 3–10', () => {
    expect(clampOverSize(1)).toBe(3);
    expect(clampOverSize(20)).toBe(10);
    expect(clampOverSize('x')).toBe(5);
    expect(splitIntoOvers(nums, 1)[0]).toHaveLength(3);
  });

  it('does not share an over between blocks; first over of each block is flagged', () => {
    const overs = buildOvers([{ block: 'A', numbers: [1, 2, 3, 4, 5, 6] }, { block: 'B', numbers: [7] }], 5);
    expect(overs.map(o => [o.block, o.numbers, o.first])).toEqual([
      ['A', [1, 2, 3, 4, 5], true], ['A', [6], false], ['B', [7], true],
    ]);
  });
});
