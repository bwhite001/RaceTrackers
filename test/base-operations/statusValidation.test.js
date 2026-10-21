import { describe, it, expect } from 'vitest';
import { checkStatusNumber, outRecords, reasonLabel } from '../../src/modules/base-operations/services/statusValidation.js';

const order = [{ number: 1, short: 'CP1' }, { number: 2, short: 'CP2' }, { number: 3, short: 'CP3' }, { number: 0, short: 'Finish' }];
const base = {
  raceNumbers: new Set([146, 150, 186, 212, 218, 224, 233]),
  out: new Map([[146, { status: 'DNS' }], [150, { status: 'DNF' }]]),
  sightings: new Map([[2, new Map([[186, 'x']])], [3, new Map([[212, 'x']])]]),
  order,
};

const check = (num, idx, extra) => checkStatusNumber(num, idx, { ...base, ...extra });

describe('checkStatusNumber (spec §4.11)', () => {
  it('rejects bibs not in the race and numbers listed twice', () => {
    expect(check(999, 0, { mode: 'dnf', where: 2, pending: [999] })).toEqual({ kind: 'bad', note: 'Not in race' });
    expect(check(212, 1, { mode: 'dnf', where: 2, pending: [212, 212] })).toEqual({ kind: 'bad', note: 'Listed twice' });
  });
  it('rejects a runner who already has this status', () => {
    expect(check(150, 0, { mode: 'dnf', where: 2, pending: [150] })).toEqual({ kind: 'bad', note: 'Already DNF' });
  });
  it('warns when the runner currently has the other status', () => {
    expect(check(146, 0, { mode: 'dnf', where: 2, pending: [146] })).toEqual({ kind: 'warn', note: 'Was DNS — will change' });
  });
  it('warns when a DNS runner was recorded at a checkpoint', () => {
    expect(check(186, 0, { mode: 'dns', where: null, pending: [186] })).toEqual({ kind: 'warn', note: 'Seen CP2 — started' });
  });
  it('warns when a DNF at CPx was seen at a later checkpoint', () => {
    expect(check(212, 0, { mode: 'dnf', where: 2, pending: [212] })).toEqual({ kind: 'warn', note: 'Seen later at CP3' });
    expect(check(186, 0, { mode: 'dnf', where: 2, pending: [186] })).toEqual({ kind: 'ok', note: '' });
    expect(check(212, 0, { mode: 'dnf', where: null, pending: [212] }).kind).toBe('ok');
  });
});

describe('outRecords', () => {
  it('describes DNS, DNF withdrawals (with checkpoint / on course) and checkpoint DNFs', () => {
    const rows = outRecords([
      { number: 233, status: 'non-starter' },
      { number: 150, status: 'withdrawn', withdrawalDetails: { checkpoint: 2, reason: 'Injury', withdrawalTime: '2026-11-08T07:12:00.000Z' } },
      { number: 175, status: 'withdrawn', withdrawalDetails: { checkpoint: null, reason: 'Medical', withdrawalTime: null } },
      { number: 118, status: 'dnf' },
    ]);
    expect(rows.map(r => [r.number, r.status, r.clearable])).toEqual([
      [118, 'DNF', false], [150, 'DNF', true], [175, 'DNF', true], [233, 'DNS', true],
    ]);
    expect(rows.find(r => r.number === 150).detail).toMatch(/^CP2 · Injury · \d\d:\d\d$/);
    expect(rows.find(r => r.number === 175).detail).toBe('On course · Medical');
    expect(rows.find(r => r.number === 233).detail).toBe('Did not start');
  });

  it('shows reasons from the old withdrawal dialog as today\'s list, without rewriting them', () => {
    expect(['Illness', 'Time Cutoff', 'Voluntary Withdrawal', 'Personal Emergency', 'Injury', 'Medical'].map(reasonLabel))
      .toEqual(['Medical', 'Cut-off', 'Self-withdrew', 'Other', 'Injury', 'Medical']);
    const rec = { number: 160, status: 'withdrawn', withdrawalDetails: { checkpoint: 1, reason: 'Time Cutoff', withdrawalTime: null } };
    expect(outRecords([rec])[0].detail).toBe('CP1 · Cut-off');
    expect(rec.withdrawalDetails.reason).toBe('Time Cutoff');
  });
});

describe('checkStatusNumber — non-base DNF (review fix)', () => {
  it('refuses to change a checkpoint DNF or vet-out to DNS', () => {
    const r = checkStatusNumber(150, 0, {
      ...base, mode: 'dns', where: null, pending: [150],
      out: new Map([[150, { status: 'DNF', clearable: false }]]),
    });
    expect(r).toEqual({ kind: 'bad', note: 'DNF at checkpoint' });
  });
});
