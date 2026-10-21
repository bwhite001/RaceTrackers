import { describe, it, expect } from 'vitest';
import TimeUtils from '../../src/services/timeUtils.js';
import { hhmm } from '../../src/services/blocks.js';
import {
  computeStats, pendingRunners, groupByBlock, calledBlocks, isCallDue, oldestWaitingMinutes, bibGroups,
} from '../../src/modules/checkpoint-operations/services/checkpointStats.js';

const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', h, m);
const R = [
  { number: 140, status: 'passed', calledIn: true, actualTime: at(7, 31), callInTime: at(7, 36) },
  { number: 141, status: 'passed', calledIn: true, actualTime: at(7, 33), callInTime: at(7, 36) },
  { number: 143, status: 'passed', calledIn: false, actualTime: at(7, 41) },
  { number: 142, status: 'passed', calledIn: false, actualTime: at(7, 44), correction: true },
  { number: 144, status: 'not-started' },
  { number: 145, status: 'not-started', unmarkedTime: at(7, 37) },
  { number: 146, status: 'non-starter' },
  { number: 150, status: 'dnf' },
];

describe('checkpointStats', () => {
  it('counts passed, to call, to come, DNS and DNF', () => {
    expect(computeStats(R)).toEqual({ total: 8, passed: 4, called: 2, toCall: 2, toCome: 2, dns: 1, dnf: 1 });
  });

  it('pending = passed not called in, oldest first', () => {
    expect(pendingRunners(R).map(r => r.number)).toEqual([143, 142]);
  });

  it('groups by 5-minute block with individual numbers in bib order', () => {
    const groups = groupByBlock(pendingRunners(R));
    expect(groups.map(g => hhmm(g.block))).toEqual(['07:40']);
    expect(groups[0].runners.map(r => r.number)).toEqual([142, 143]);
  });

  it('called blocks carry the send time', () => {
    const c = calledBlocks(R);
    expect(c).toHaveLength(1);
    expect(hhmm(c[0].block)).toBe('07:30');
    expect(c[0].sentAt).toBe(at(7, 36));
  });

  it('call is due at 5 waiting or 5 minutes old', () => {
    expect(isCallDue({ waiting: 0, oldestMinutes: 30 })).toBe(false);
    expect(isCallDue({ waiting: 5, oldestMinutes: 0 })).toBe(true);
    expect(isCallDue({ waiting: 2, oldestMinutes: 6 })).toBe(true);
    expect(isCallDue({ waiting: 2, oldestMinutes: 3 })).toBe(false);
    expect(isCallDue({ waiting: 2, oldestMinutes: 3 }, { minutes: 3 })).toBe(true);
    expect(oldestWaitingMinutes(R, at(7, 47))).toBe(6);
  });

  it('chunks bibs into groups of 20 for the mark-off chips', () => {
    const g = bibGroups(Array.from({ length: 45 }, (_, i) => 100 + i));
    expect(g.map(x => [x.first, x.last])).toEqual([[100, 119], [120, 139], [140, 144]]);
  });
});
