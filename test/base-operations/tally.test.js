import { describe, it, expect } from 'vitest';
import { outBefore, checkpointTally, missingAt } from '../../src/modules/base-operations/services/tally';
import { outRecords } from '../../src/modules/base-operations/services/statusValidation';

const order = [
  { number: 1, short: 'CP1' },
  { number: 2, short: 'CP2', allowedBatches: [1] }, // only wave 1 passes CP2
  { number: 3, short: 'CP3' },
  { number: 0, short: 'Finish' },
];
const seen = (obj) => new Map(Object.entries(obj).map(([cp, bibs]) => [Number(cp), new Map(bibs.map(b => [b, 't']))]));
const field = [101, 102, 103, 104, 105, 106];
const batchOf = new Map([[101, 1], [102, 1], [103, 1], [104, 1], [105, 2], [106, 2]]);

describe('outBefore (WICEN2 rule)', () => {
  it('DNS is out everywhere; DNF at CP2 only after CP2; DNF on course everywhere', () => {
    expect(outBefore({ status: 'DNS', checkpoint: null }, 0, order)).toBe(true);
    const dnf2 = { status: 'DNF', checkpoint: 2 };
    expect([0, 1, 2, 3].map(i => outBefore(dnf2, i, order))).toEqual([false, false, true, true]);
    expect(outBefore({ status: 'DNF', checkpoint: null }, 0, order)).toBe(true);
  });
});

describe('checkpointTally', () => {
  const sightings = seen({ 1: [101, 102, 105], 2: [101] });
  it('past and to come, wave-aware, DNF at CP2 lowers CP3 and Finish only', () => {
    const outRecs = [{ number: 103, status: 'DNF', checkpoint: 2 }, { number: 106, status: 'DNS', checkpoint: null }];
    const t = checkpointTally({ order, sightings, raceNumbers: field, outRecs, batchOf });
    expect(t.get(1)).toEqual({ past: 3, toCome: 2 });   // 103, 104 (106 DNS)
    expect(t.get(2)).toEqual({ past: 1, toCome: 3 });   // wave 1 only: 102, 103, 104
    expect(t.get(3)).toEqual({ past: 0, toCome: 4 });   // 101 102 104 105 (103 out after CP2)
    expect(t.get(0)).toEqual({ past: 0, toCome: 4 });
  });
  it('DNF on course is out at every checkpoint; late entries count', () => {
    const outRecs = [{ number: 104, status: 'DNF', checkpoint: null }];
    const t = checkpointTally({ order, sightings, raceNumbers: [...field, 150], outRecs, batchOf });
    expect(t.get(1).toCome).toBe(3); // 103, 106, 150
  });
  it('field not known → to come is null', () => {
    expect(checkpointTally({ order, sightings, raceNumbers: [], fieldKnown: false }).get(1).toCome).toBeNull();
  });
});

describe('missingAt', () => {
  const sightings = seen({ 1: [101, 103], 3: [102] });
  it('lists every bib not recorded there, numerically, with last seen; out runners left out', () => {
    const outRecs = [{ number: 104, status: 'DNS', checkpoint: null }, { number: 105, status: 'DNF', checkpoint: 2 }];
    const { rows } = missingAt({ cpNumber: 1, order, sightings, raceNumbers: [106, 102, 104, 105], outRecs, batchOf });
    expect(rows).toEqual([
      { number: 102, last: 'CP3', seenAt: 'CP3' },  // seen further on: missed here
      { number: 105, last: null, seenAt: null },    // DNF at CP2 — still due at CP1
      { number: 106, last: null, seenAt: null },
    ]);
  });
  it('wave filter, and a checkpoint a wave skips', () => {
    expect(missingAt({ cpNumber: 1, order, sightings, raceNumbers: field, batchOf, wave: 2 }).rows.map(r => r.number)).toEqual([105, 106]);
    expect(missingAt({ cpNumber: 2, order, sightings, raceNumbers: field, batchOf }).rows.map(r => r.number)).toEqual([101, 102, 103, 104]);
  });
  it('field not known', () => {
    expect(missingAt({ cpNumber: 1, order, sightings, fieldKnown: false })).toEqual({ rows: [], fieldKnown: false });
  });
});

describe('outRecords keeps the checkpoint of a checkpoint DNF', () => {
  it('dnfCheckpoint', () => {
    expect(outRecords([{ number: 145, status: 'dnf', dnfCheckpoint: 2 }])[0]).toMatchObject({ status: 'DNF', checkpoint: 2, detail: 'CP2' });
  });
});
