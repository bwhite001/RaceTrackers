/**
 * Crew & vehicle log (insurance): pure rules, supersede/undo in the
 * repository, and the data staying out of the race setup package.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import TimeUtils from '../../src/services/timeUtils.js';
import { BaseOperationsRepository } from '../../src/modules/base-operations/services/BaseOperationsRepository.js';
import { ExportService } from '../../src/services/import-export/ExportService.js';
import {
  vehicleProblem, vehicleRecord, vehicleState, cardPill, crewSummary, summaryText, crewPillByCheckpoint,
  crewCheckpoints, crewReportRows, stepTime, normaliseRego, activeVehicles, timesText,
} from '../../src/modules/base-operations/services/crews.js';

const t = (hm) => `2026-11-07T${hm}:00.000Z`; // UTC; the race date doesn't matter here
const NOW = t('19:52');
const draft = (over = {}) => ({ checkpointNumber: 4, rego: '147 STU', driver: 'VK4AJG', occupants: [], leftHomeAt: null, arrivedAt: null, leftSiteAt: null, homeSafeAt: null, notes: '', ...over });

describe('clampPast', () => {
  it('allows times before the race start and pulls future times back to now', () => {
    expect(TimeUtils.clampPast(t('04:30'), NOW)).toBe(t('04:30'));
    expect(TimeUtils.clampPast(t('20:10'), NOW)).toBe(NOW);
    expect(TimeUtils.clampPast(null, NOW)).toBeNull();
  });
  it('stepping a time never passes now and starts from now when unset', () => {
    expect(stepTime(t('19:50'), 5, NOW)).toBe(NOW);
    expect(stepTime(null, -5, NOW)).toBe(t('19:47'));
    expect(stepTime(t('04:45'), -1, NOW)).toBe(t('04:44'));
  });
});

describe('vehicle rules', () => {
  it('needs a rego of 2+ characters and a driver', () => {
    expect(vehicleProblem(draft({ rego: 'A' }), NOW)).toBe('Enter rego');
    expect(vehicleProblem(draft({ driver: ' ' }), NOW)).toBe('Pick a driver');
    expect(vehicleProblem(draft(), NOW)).toBeNull();
  });
  it('locks Save when arrived is before left home, or any time is out of order or in the future', () => {
    expect(vehicleProblem(draft({ leftHomeAt: t('05:00'), arrivedAt: t('04:50') }), NOW)).toBe('Arrived before left');
    expect(vehicleProblem(draft({ leftHomeAt: t('05:00'), arrivedAt: t('05:30'), homeSafeAt: t('05:10') }), NOW)).toBe('Times out of order');
    expect(vehicleProblem(draft({ leftHomeAt: t('20:00') }), NOW)).toBe('Time in the future');
    expect(vehicleProblem(draft({ leftHomeAt: t('04:30'), arrivedAt: t('05:38') }), NOW)).toBeNull();
  });
  it('upper-cases the rego and drops the driver from the occupants', () => {
    expect(normaliseRego('abc  123 xyz99')).toBe('ABC 123 XY');
    expect(vehicleRecord(draft({ rego: ' 147 STU ', occupants: ['VK4AJG', 'VK4DTB', ' '] }))).toMatchObject({ rego: '147 STU', occupants: ['VK4DTB'] });
  });
});

describe('summary and pills', () => {
  const rows = [
    { id: 1, checkpointNumber: 1, rego: 'A1', leftHomeAt: t('04:45'), arrivedAt: t('05:38') },
    { id: 2, checkpointNumber: 1, rego: 'A2', leftHomeAt: t('05:00'), arrivedAt: null },
    { id: 3, checkpointNumber: 2, rego: 'B1', leftHomeAt: t('04:50'), arrivedAt: t('05:44') },
    { id: 4, checkpointNumber: 3, rego: 'C1', leftHomeAt: null, arrivedAt: null },
    { id: 5, checkpointNumber: 3, rego: 'OLD', leftHomeAt: null, arrivedAt: null, supersededAt: t('05:00') },
  ];
  it('counts current vehicles only', () => {
    const s = crewSummary(activeVehicles(rows));
    expect(s).toEqual({ vehicles: 4, arrived: 2, onWay: 1, notLeft: 1, notArrived: 2 });
    expect(summaryText(s)).toBe('4 vehicles · 2 arrived · 1 on the way · 1 not left');
  });
  it('card pill: on the way beats on site; not left; nothing logged', () => {
    expect(cardPill(rows.filter(v => v.checkpointNumber === 1))).toEqual({ kind: 'way', text: '1 on the way' });
    expect(cardPill(rows.filter(v => v.checkpointNumber === 2)).text).toBe('On site');
    expect(cardPill([rows[3]]).text).toBe('Not left yet');
    expect(cardPill([]).text).toBe('Nothing logged');
    expect(vehicleState(rows[1])).toBe('on-the-way');
    expect(timesText(rows[0])).toMatch(/^Left home \d\d:\d\d · arrived \d\d:\d\d$/);
    expect(timesText(rows[1])).toMatch(/^Left home \d\d:\d\d · on the way$/);
    expect(timesText(rows[3])).toBe('Not left yet');
  });
  it('Receive pills show only on the way / on site', () => {
    expect([...crewPillByCheckpoint(rows)]).toEqual([[1, 'way'], [2, 'site']]);
  });
  it('report lists every current vehicle under its checkpoint, Base first', () => {
    const cps = crewCheckpoints([{ number: 2, name: 'Two' }, { number: 1, name: 'One' }]);
    expect(cps.map(c => c.short)).toEqual(['Base', 'CP1', 'CP2']);
    const report = crewReportRows([...rows, { id: 6, checkpointNumber: 0, rego: 'BASE1', driver: 'VK4GJW', occupants: ['VK4ENE'] }], [{ number: 1 }, { number: 2 }, { number: 3 }]);
    expect(report[0]).toContain('Left home');
    expect(report.slice(1).map(r => `${r[0]} ${r[1]}`)).toEqual(['Base BASE1', 'CP1 A1', 'CP1 A2', 'CP2 B1', 'CP3 C1']);
  });
});

describe('repository: supersede, never delete; exact undo', () => {
  const raceId = 901;
  const repo = new BaseOperationsRepository();
  beforeEach(async () => {
    await Promise.all(['races', 'crew_vehicles', 'audit_log', 'runners', 'checkpoints'].map(tb => db[tb].clear()));
    await db.races.put({ id: raceId, name: 'Crew Race', date: '2026-11-08', startTime: '06:30', minRunner: 1, maxRunner: 5 });
  });

  it('an edit supersedes the old row; undo puts it back exactly', async () => {
    const { addedId: first } = await repo.saveVehicle(raceId, vehicleRecord(draft()));
    const before = await db.crew_vehicles.get(first);
    const edit = await repo.saveVehicle(raceId, vehicleRecord(draft({ rego: '147 STV' })), first);
    let rows = await repo.getCrewVehicles(raceId);
    expect(rows).toHaveLength(2);
    expect(activeVehicles(rows).map(v => v.rego)).toEqual(['147 STV']);
    expect((await db.crew_vehicles.get(first)).supersededBy).toBe(edit.addedId);

    await repo.undoCrewChange(raceId, edit);
    rows = await repo.getCrewVehicles(raceId);
    expect(rows).toHaveLength(2); // nothing deleted
    expect(await db.crew_vehicles.get(first)).toEqual(before);
    expect(activeVehicles(rows).map(v => v.id)).toEqual([first]);
    expect((await db.audit_log.where('raceId').equals(raceId).toArray()).map(a => a.action)).toEqual(['crew-add', 'crew-edit', 'crew-undo']);
  });

  it('remove supersedes; undo restores; a stale edit is refused', async () => {
    const { addedId } = await repo.saveVehicle(raceId, vehicleRecord(draft()));
    const removed = await repo.removeVehicle(raceId, addedId);
    expect(activeVehicles(await repo.getCrewVehicles(raceId))).toHaveLength(0);
    await expect(repo.saveVehicle(raceId, vehicleRecord(draft()), addedId)).rejects.toThrow(/changed elsewhere/);
    await repo.undoCrewChange(raceId, removed);
    expect(activeVehicles(await repo.getCrewVehicles(raceId)).map(v => v.id)).toEqual([addedId]);
  });

  it('full backups carry the crew log; the race setup package never does', async () => {
    await repo.saveVehicle(raceId, vehicleRecord(draft({ leftHomeAt: t('18:45') })));
    const full = await ExportService.exportRace(raceId);
    expect(full.data.crewVehicles).toHaveLength(1);
    const setup = await ExportService.exportRaceSetup(raceId);
    expect(setup.data.crewVehicles).toBeUndefined();
    expect(JSON.stringify(setup)).not.toContain('147 STU');
  });
});
