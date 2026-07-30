/**
 * M-4 / #26: grid-clicked runners must appear on the Callout Sheet
 *
 * Root cause: the Callout Sheet groups runners by `commonTimeLabel`, but only
 * one of the two write paths into checkpoint_runners ever set it.
 *
 *   QuickEntryBar → checkpointStore.markRunner → CheckpointRepository.markRunner
 *       → computes commonTime + commonTimeLabel      ✔ appears on callout sheet
 *   RunnerGrid    → useRaceStore.markCheckpointRunner → StorageService
 *       → set status/callInTime/markOffTime only      ✘ invisible to callout sheet
 *
 * The fix belongs in StorageService, not in RunnerGrid: every caller of
 * markCheckpointRunner / bulkMarkCheckpointRunners needs the segment label, and
 * moving RunnerGrid onto the other store would stop the grid re-rendering (it
 * reads its runners from useRaceStore).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import StorageService from 'services/storage';
import TimeUtils from 'services/timeUtils';
import db from 'shared/services/database/schema';

const RACE_ID = 8801;
const CP = 1;
const MARK_TIME = '2026-03-04T09:07:30.000Z';

describe('M-4 / #26: StorageService.markCheckpointRunner sets segment fields', () => {
  beforeEach(async () => {
    await db.races.put({ id: RACE_ID, name: 'Callout Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.checkpoints.put({ id: 8810, raceId: RACE_ID, number: CP, name: 'Ridgeline' });
    await db.checkpoint_runners.clear();
    await db.checkpoint_runners.bulkPut([
      { id: 88101, raceId: RACE_ID, checkpointNumber: CP, number: 1, status: 'not-started' },
      { id: 88102, raceId: RACE_ID, checkpointNumber: CP, number: 2, status: 'not-started' },
    ]);
  });

  const readRunner = (number) => db.checkpoint_runners
    .where(['raceId', 'checkpointNumber', 'number'])
    .equals([RACE_ID, CP, number])
    .first();

  it('records commonTimeLabel so the runner joins a callout segment', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, MARK_TIME, 'passed');

    const runner = await readRunner(1);
    expect(runner.commonTimeLabel).toBeTruthy();
  });

  it('uses the same 5-minute segment label as the CheckpointRepository path', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, MARK_TIME, 'passed');

    const expected = TimeUtils.getCommonTimeLabel(MARK_TIME);
    const runner = await readRunner(1);
    expect(runner.commonTimeLabel).toBe(expected.commonTimeLabel);
    expect(runner.commonTime).toBe(expected.commonTime);
  });

  it('records actualTime alongside the legacy markOffTime', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, MARK_TIME, 'passed');

    const runner = await readRunner(1);
    expect(runner.actualTime).toBe(MARK_TIME);
    expect(runner.markOffTime).toBe(MARK_TIME);
  });

  it('leaves the runner uncalled so it lands in Pending Callouts', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, MARK_TIME, 'passed');

    const runner = await readRunner(1);
    expect(runner.calledIn).toBe(false);
  });

  it('groups two runners marked in the same 5 minutes under one label', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, '2026-03-04T09:06:00.000Z', 'passed');
    await StorageService.markCheckpointRunner(RACE_ID, CP, 2, null, '2026-03-04T09:09:59.000Z', 'passed');

    const [a, b] = [await readRunner(1), await readRunner(2)];
    expect(a.commonTimeLabel).toBe(b.commonTimeLabel);
  });

  it('separates runners marked in different 5-minute segments', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, '2026-03-04T09:04:00.000Z', 'passed');
    await StorageService.markCheckpointRunner(RACE_ID, CP, 2, null, '2026-03-04T09:06:00.000Z', 'passed');

    const [a, b] = [await readRunner(1), await readRunner(2)];
    expect(a.commonTimeLabel).not.toBe(b.commonTimeLabel);
  });

  it('falls back to callInTime when no markOffTime is supplied', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, MARK_TIME, null, 'passed');

    const runner = await readRunner(1);
    expect(runner.commonTimeLabel).toBe(TimeUtils.getCommonTimeLabel(MARK_TIME).commonTimeLabel);
  });
});

describe('M-4 / #26: bulkMarkCheckpointRunners sets segment fields too', () => {
  beforeEach(async () => {
    await db.races.put({ id: RACE_ID, name: 'Callout Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.checkpoint_runners.clear();
    await db.checkpoint_runners.bulkPut([
      { id: 88201, raceId: RACE_ID, checkpointNumber: CP, number: 1, status: 'not-started' },
      { id: 88202, raceId: RACE_ID, checkpointNumber: CP, number: 2, status: 'not-started' },
      { id: 88203, raceId: RACE_ID, checkpointNumber: CP, number: 3, status: 'not-started' },
    ]);
  });

  it('labels every runner in the batch with the same segment', async () => {
    await StorageService.bulkMarkCheckpointRunners(RACE_ID, CP, [1, 2, 3], null, MARK_TIME, 'passed');

    const expected = TimeUtils.getCommonTimeLabel(MARK_TIME).commonTimeLabel;
    for (const number of [1, 2, 3]) {
      const runner = await db.checkpoint_runners
        .where(['raceId', 'checkpointNumber', 'number'])
        .equals([RACE_ID, CP, number])
        .first();
      expect(runner.commonTimeLabel).toBe(expected);
      expect(runner.status).toBe('passed');
    }
  });
});

describe('M-4 / #26: unmarking clears the segment fields', () => {
  beforeEach(async () => {
    await db.races.put({ id: RACE_ID, name: 'Callout Race', date: '2026-03-04', minRunner: 1, maxRunner: 10 });
    await db.checkpoint_runners.clear();
    await db.checkpoint_runners.put({
      id: 88301, raceId: RACE_ID, checkpointNumber: CP, number: 1, status: 'not-started',
    });
  });

  const readRunner = () => db.checkpoint_runners
    .where(['raceId', 'checkpointNumber', 'number'])
    .equals([RACE_ID, CP, 1])
    .first();

  it('does not leave a phantom time on an unmarked runner', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, MARK_TIME, 'passed');
    expect((await readRunner()).commonTimeLabel).toBeTruthy();

    // Unmarking goes through the same function with status not-started
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, null, 'not-started');

    const runner = await readRunner();
    expect(runner.status).toBe('not-started');
    expect(runner.commonTimeLabel).toBeNull();
    expect(runner.commonTime).toBeNull();
    expect(runner.actualTime).toBeNull();
    expect(runner.markOffTime).toBeNull();
  });

  it('an unmarked runner is excluded from callout segments', async () => {
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, MARK_TIME, 'passed');
    await StorageService.markCheckpointRunner(RACE_ID, CP, 1, null, null, 'not-started');

    const runners = await db.checkpoint_runners.where('raceId').equals(RACE_ID).toArray();
    const inSegments = runners.filter(r => r.status === 'passed' && r.commonTimeLabel);
    expect(inSegments).toHaveLength(0);
  });
});
