/**
 * Records against the real Mt Glorious 2026 base paper log (8 Nov 2026,
 * 461 entries, 49 calls, bibs only). Base found these by hand on the day;
 * Records must flag the same numbers. CP5 (11 km only) is left out so the
 * 22 km course CP1–CP4 is checked on its own.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runChecks } from '../../src/modules/base-operations/services/dataChecks.js';
import { boardCheckpoints, sightingsByCheckpoint } from '../../src/modules/base-operations/services/receive.js';
import { recordItems, issueCounts } from '../../src/modules/base-operations/services/records.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const lines = fs.readFileSync(path.join(HERE, 'fixtures/mt-glorious-2026-paper-log.csv'), 'utf8').trim().split('\n').slice(1);
const at = (hm) => new Date(`2026-11-08T${hm}:00+10:00`).toISOString();

const baseRows = lines.map((l, i) => {
  const [call, cp, time, bib] = l.split(',');
  return { id: i + 1, checkpointNumber: Number(cp.slice(2)), number: Number(bib), status: 'passed', commonTime: at(time), callId: Number(call) };
}).filter(r => r.checkpointNumber <= 4);

const order = boardCheckpoints([1, 2, 3, 4].map(n => ({ number: n, name: `CP${n}` })));
const input = { baseRows, order, sightings: sightingsByCheckpoint(baseRows), outByNumber: new Map(), radioCalls: [], distances: new Map(), raceNumbers: null, batchOf: new Map() };
const issues = runChecks(input);
const at_ = (cp) => recordItems({ cp, baseRows, issues, allIssues: issues });
const bibs = (items, issue) => [...new Set(items.filter(i => i.flag.issue === issue).map(i => i.number))].sort((a, b) => a - b);

describe('Mt Glorious 2026 paper log', () => {
  it('has every CP1–CP4 entry from the sheets', () => {
    expect(baseRows).toHaveLength(461 - 43);
  });

  it('flags the duplicates base circled on the sheets', () => {
    expect(bibs(at_(1), 'dup')).toEqual([29]);
    expect(bibs(at_(2), 'dup')).toEqual([39, 83]);
    expect(bibs(at_(3), 'dup')).toEqual([58, 78, 108, 128]);
    expect(bibs(at_(4), 'dup')).toEqual([57]);
    expect(at_(4).filter(i => i.number === 57 && i.flag.issue === 'dup')).toHaveLength(3);
  });

  it('flags 118 out of order at CP2 and the runners each checkpoint missed', () => {
    expect(at_(2).find(i => i.number === 118).flag).toMatchObject({ issue: 'other', note: 'Before CP1' });
    expect(bibs(at_(1), 'missed')).toEqual([24, 119]);
    expect(bibs(at_(2), 'missed')).toEqual([119]);
    expect(bibs(at_(3), 'missed')).toEqual([56, 106, 126]);
    expect(issueCounts(at_(3))).toMatchObject({ dup: 4, missed: 3 });
  });
});
