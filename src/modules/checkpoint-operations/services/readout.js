/**
 * Read-out mode (spec §4.7): numbers are read in "overs" of up to `overSize`
 * so base can confirm or ask for a repeat without losing the rest.
 * Every bib stays its own item — there is no range collapsing anywhere here.
 */

export const OVER_SIZE_DEFAULT = 5;
export const OVER_SIZE_MIN = 3;
export const OVER_SIZE_MAX = 10;

export function clampOverSize(n) {
  const v = Number.isFinite(Number(n)) ? Math.round(Number(n)) : OVER_SIZE_DEFAULT;
  return Math.min(OVER_SIZE_MAX, Math.max(OVER_SIZE_MIN, v));
}

/** [130, 135, …] → [[130, 135, 140, 142, 147], [151, …]] */
export function splitIntoOvers(numbers, overSize = OVER_SIZE_DEFAULT) {
  const size = clampOverSize(overSize);
  const overs = [];
  for (let i = 0; i < numbers.length; i += size) overs.push(numbers.slice(i, i + size));
  return overs;
}

/**
 * Overs across several common-time blocks, in block order. A block never
 * shares an over with another block, so each over has one common time.
 * @param {Array<{ block: string, numbers: number[] }>} blocks
 * @returns {Array<{ block: string, numbers: number[], first: boolean }>}
 */
export function buildOvers(blocks, overSize = OVER_SIZE_DEFAULT) {
  return blocks.flatMap(({ block, numbers }) =>
    splitIntoOvers(numbers, overSize).map((nums, i) => ({ block, numbers: nums, first: i === 0 })));
}
