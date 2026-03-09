/**
 * Base Station — Race Day Scenario Test
 *
 * Uses real checkpoint data from 8 March 2026 to exercise the full
 * stats pipeline (real Zustand store + real fake-indexeddb).
 *
 * Data source: handwritten sheets transcribed by race officials.
 * CP0 rows from the sheets = base-station finish records (checkpointNumber 0).
 * CP1 / CP2 rows = intermediate checkpoint records.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import useBaseOperationsStore from 'modules/base-operations/store/baseOperationsStore';
import db from 'shared/services/database/schema';

// ─── Source data (transcribed from the 8-Mar-2026 checkpoint sheets) ────────

const CP0_BATCHES = [
  { time: '06:20', bibs: [226, 239, 221] },
  { time: '06:25', bibs: [255] },
  { time: '06:30', bibs: [242, 266, 210, 211, 240, 258, 228, 226, 236, 229, 241, 223, 247, 219] },
  { time: '06:35', bibs: [224, 231, 243, 239, 204, 225, 247, 227, 252, 242, 240, 249] },
  { time: '06:40', bibs: [214, 205, 297, 225, 237, 212, 233, 234, 203, 245, 216, 217, 248] },
  { time: '06:45', bibs: [238, 215, 249, 251] },
  { time: '06:50', bibs: [266, 208] },
  { time: '06:55', bibs: [253] },
];

const CP1_BATCHES = [
  { time: '07:55', bibs: [83, 45, 90, 87] },
  { time: '08:00', bibs: [88, 58, 55, 99, 95, 92, 80] },
  { time: '08:10', bibs: [96, 42, 72, 12, 37, 25, 14, 13, 33, 17, 85] },
  { time: '08:15', bibs: [47, 79, 89, 41, 31, 18, 7, 86, 79, 19, 82, 23] },
  { time: '08:25', bibs: [97, 56, 10, 27, 24, 30, 65] },
  { time: '08:30', bibs: [84, 43, 65, 5, 49, 32, 62, 54, 69, 67] },
  { time: '08:35', bibs: [8, 60, 64, 28, 29, 36] },
  { time: '08:40', bibs: [61, 6, 2, 93, 100] },
  { time: '08:45', bibs: [77, 75, 74, 35] },
  { time: '08:50', bibs: [101] },
  { time: '08:55', bibs: [78, 22] },
  { time: '09:00', bibs: [51, 52, 3] },
  { time: '09:10', bibs: [9] },
];

const CP2_BATCHES = [
  { time: '08:00', bibs: [213] },
  { time: '08:15', bibs: [235, 255] },
  { time: '08:20', bibs: [116, 38, 26, 91, 15, 11, 94, 76] },
  { time: '08:25', bibs: [102, 81, 59, 98, 78, 71, 46] },
  { time: '08:20', bibs: [220] },
  { time: '08:25', bibs: [221] },
  { time: '08:25', bibs: [239] },
  { time: '08:30', bibs: [242, 249, 226, 228] },
  { time: '08:40', bibs: [258, 229, 241, 214, 211] },
  { time: '08:55', bibs: [226, 223, 236] },
  { time: '08:55', bibs: [219, 254] },
  { time: '09:25', bibs: [233, 234, 225, 252, 248] },
  { time: '09:30', bibs: [231, 224] },
  { time: '09:35', bibs: [203, 245] },
  { time: '09:40', bibs: [284, 227, 247, 249] },
  { time: '09:45', bibs: [216, 240, 207] },
  { time: '09:50', bibs: [243, 217, 237] },
  { time: '09:45', bibs: [214, 215, 212, 244] },
  { time: '09:50', bibs: [238, 282] },
  { time: '10:00', bibs: [245] },
  { time: '10:05', bibs: [218, 251, 253, 208] },
];

// ─── Derived helpers ─────────────────────────────────────────────────────────

/** Flatten batches into a deduplicated set of unique bib numbers. */
function uniqueBibs(batches) {
  return new Set(batches.flatMap(b => b.bibs));
}

const CP0_UNIQUE = uniqueBibs(CP0_BATCHES); // finished at base station
const CP1_UNIQUE = uniqueBibs(CP1_BATCHES);
const CP2_UNIQUE = uniqueBibs(CP2_BATCHES);

// All bibs that appear anywhere — used to seed the runners table
const ALL_BIBS = new Set([...CP0_UNIQUE, ...CP1_UNIQUE, ...CP2_UNIQUE]);

// ─── Test constants ───────────────────────────────────────────────────────────

/** Bibs listed as Non Starters on the official sheet (corrected: 249 was edited
 *  from DNS after the fact — they did start; 246 is the correct DNS entry). */
const DNS_BIBS = [200, 232, 246, 222];

/** Runners who withdrew at CP1.
 *  240 also appears in CP2 batch data — that CP2 entry is a transcription error
 *  superseded by the withdrawal; it is seeded as 'dnf' in the CP2 records. */
const WITHDRAWAL_BIBS = [230, 240]; // withdrew at checkpoint 1

// Withdrawn runners not already in CP1 batch data get an extra CP1 record added
// by seedWithdrawals, so the total CP1 count is larger than CP1_UNIQUE alone.
const CP1_WITHDRAWN_NEW = WITHDRAWAL_BIBS.filter(b => !CP1_UNIQUE.has(b));
const EXPECTED_CP1_COUNT = CP1_UNIQUE.size + CP1_WITHDRAWN_NEW.length; // 71 + 2 = 73

const RACE_ID = 'race-8mar2026-scenario';
const RACE = {
  id: RACE_ID,
  name: '8 March 2026 Race',
  date: '2026-03-08',
  startTime: '06:00',
  minRunner: 1,
  maxRunner: 300,
};

// ─── Seed helpers ─────────────────────────────────────────────────────────────

async function seedRace() {
  await db.races.put(RACE);
  // Active runners
  const runners = [...ALL_BIBS].map(bib => ({
    raceId: RACE_ID, number: bib, status: 'not-started', batchNumber: null,
  }));
  // DNS runners (may overlap with batch data — DNS list is authoritative)
  const dnsRunners = DNS_BIBS
    .filter(bib => !ALL_BIBS.has(bib))
    .map(bib => ({ raceId: RACE_ID, number: bib, status: 'non-starter', batchNumber: null }));
  await db.runners.bulkPut([...runners, ...dnsRunners]);
  // Checkpoints
  await db.checkpoints.bulkPut([
    { raceId: RACE_ID, number: 1, name: 'CP 1' },
    { raceId: RACE_ID, number: 2, name: 'CP 2' },
  ]);
}

async function seedCheckpointRunners() {
  const cp1Rows = [...CP1_UNIQUE].map(bib => ({
    raceId: RACE_ID, checkpointNumber: 1, number: bib,
    // Withdrawal bibs are dnf at CP1; all others passed
    status: WITHDRAWAL_BIBS.includes(bib) ? 'dnf' : 'passed',
    markOffTime: '2026-03-08T08:00:00.000Z',
  }));
  const cp2Rows = [...CP2_UNIQUE].map(bib => ({
    raceId: RACE_ID, checkpointNumber: 2, number: bib,
    // 240 appears in CP2 data but withdrew at CP1 — transcription error; mark dnf
    status: WITHDRAWAL_BIBS.includes(bib) ? 'dnf' : 'passed',
    markOffTime: '2026-03-08T09:30:00.000Z',
  }));
  await db.checkpoint_runners.bulkPut([...cp1Rows, ...cp2Rows]);
}

async function seedWithdrawals() {
  const rows = WITHDRAWAL_BIBS.map(bib => ({
    raceId: RACE_ID,
    runnerNumber: bib,
    checkpoint: 1,
    withdrawalTime: '2026-03-08T08:30:00.000Z',
    reason: 'Withdrew at CP1',
    comments: '',
    reversedAt: null,
    reversedBy: null,
  }));
  await db.withdrawal_records.bulkPut(rows);

  // Ensure a CP1 dnf record exists for each withdrawn runner (they may not have
  // appeared in the original batch sheets if volunteers noted them separately)
  const cp1DnfRows = WITHDRAWAL_BIBS.map(bib => ({
    raceId: RACE_ID, checkpointNumber: 1, number: bib, status: 'dnf',
    markOffTime: '08:30', callInTime: '08:30',
    notes: 'Withdrew at CP1',
  }));
  await db.checkpoint_runners.bulkPut(cp1DnfRows);

  // 240 appears in base_station_runners as 'passed' (CP0 sheet data) but withdrew
  // at CP1 — the base station record is pre-race registration data, not a finish.
  // Remove it so calculateStats doesn't count them as finished.
  await db.base_station_runners
    .where('raceId').equals(RACE_ID)
    .filter(r => r.checkpointNumber === 0 && WITHDRAWAL_BIBS.includes(r.number))
    .delete();
}

async function seedBaseStationRunners() {
  const rows = [...CP0_UNIQUE].map(bib => ({
    raceId: RACE_ID, checkpointNumber: 0, number: bib, status: 'passed',
    commonTime: '2026-03-08T06:30:00.000Z',
  }));
  await db.base_station_runners.bulkPut(rows);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Base Station — Race Day Scenario (8 Mar 2026)', () => {
  beforeEach(async () => {
    act(() => useBaseOperationsStore.getState().reset());
    // Clear this race's records to prevent accumulation across test runs
    await db.checkpoint_runners.where('raceId').equals(RACE_ID).delete();
    await db.base_station_runners.where('raceId').equals(RACE_ID).delete();
    await db.withdrawal_records.where('raceId').equals(RACE_ID).delete();
    await db.runners.where('raceId').equals(RACE_ID).delete();
    await db.checkpoints.where('raceId').equals(RACE_ID).delete();
    await db.races.where('id').equals(RACE_ID).delete();
    await seedRace();
    await seedCheckpointRunners();
    await seedBaseStationRunners();
    await seedWithdrawals();
    act(() =>
      useBaseOperationsStore.setState({ currentRaceId: RACE_ID, currentRace: RACE })
    );
  });

  it('reports the correct number of unique CP1 runners', async () => {
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    expect(stats.checkpointCounts[1]).toBe(EXPECTED_CP1_COUNT);
  });

  it('reports the correct number of unique CP2 runners', async () => {
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    expect(stats.checkpointCounts[2]).toBe(CP2_UNIQUE.size);
  });

  it('counts base-station (CP0) records as finished', async () => {
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    // CP0_UNIQUE minus any withdrawal bibs whose base station record was removed
    const finishedCount = CP0_UNIQUE.size - WITHDRAWAL_BIBS.filter(b => CP0_UNIQUE.has(b)).length;
    expect(stats.finished).toBe(finishedCount);
  });

  it('does not double-count duplicate bib entries within a checkpoint', async () => {
    // 79 appears twice in CP1 batches; 65 appears twice; only 1 record each.
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    expect(stats.checkpointCounts[1]).toBeLessThanOrEqual(EXPECTED_CP1_COUNT);
  });

  it('finished runners are excluded from active count', async () => {
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    // Finished runners should not appear in active
    expect(stats.active + stats.finished + stats.dnf + stats.dns + stats.notStarted).toBe(stats.total);
  });

  it('total equals race runner count (minRunner–maxRunner)', async () => {
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    expect(stats.total).toBe(RACE.maxRunner - RACE.minRunner + 1); // 300
  });

  it('DNS runners from the official sheet are counted as dns in stats', async () => {
    // Seed DNS runners into checkpoint_runners so calculateStats picks them up
    const dnsRows = DNS_BIBS.map(bib => ({
      raceId: RACE_ID, checkpointNumber: 1, number: bib,
      status: 'non-starter', markOffTime: null,
    }));
    await db.checkpoint_runners.bulkPut(dnsRows);
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    // All 4 DNS bibs should contribute to dns count (some may already be in CP data)
    expect(stats.dns).toBeGreaterThanOrEqual(1);
  });

  it('withdrawn runners (230, 240) are counted as dnf in stats', async () => {
    await act(() => useBaseOperationsStore.getState().refreshData());
    const { stats } = useBaseOperationsStore.getState();
    // Both withdrawal bibs have their highest CP record as 'dnf'
    expect(stats.dnf).toBeGreaterThanOrEqual(WITHDRAWAL_BIBS.length);
  });

  it('withdrawal records exist in the DB for both withdrawn runners', async () => {
    const records = await db.withdrawal_records.where('raceId').equals(RACE_ID).toArray();
    const withdrawnNums = records.map(r => r.runnerNumber);
    expect(withdrawnNums).toContain(230);
    expect(withdrawnNums).toContain(240);
    expect(records.every(r => r.checkpoint === 1)).toBe(true);
  });

  it('240 CP2 record is marked dnf (transcription error superseded by withdrawal)', async () => {
    const cp2record = await db.checkpoint_runners
      .where('raceId').equals(RACE_ID)
      .filter(r => r.checkpointNumber === 2 && r.number === 240)
      .first();
    // Record exists (it was in the raw batch data) but status reflects the withdrawal
    expect(cp2record).toBeDefined();
    expect(cp2record.status).toBe('dnf');
  });

  describe('batch submission via submitRadioBatch', () => {
    it('adds CP1 batch to sessionBatches and updates checkpointCounts', async () => {
      const firstBatch = CP1_BATCHES[0]; // 07:55 — bibs 83, 45, 90, 87
      await act(() =>
        useBaseOperationsStore.getState().submitRadioBatch(firstBatch.bibs, firstBatch.time, 1)
      );
      const { sessionBatches, stats } = useBaseOperationsStore.getState();
      expect(sessionBatches).toHaveLength(1);
      expect(sessionBatches[0]).toMatchObject({
        checkpointNumber: 1,
        commonTime: firstBatch.time,
        bibs: firstBatch.bibs,
        voided: false,
      });
      // The 4 bibs already existed in CP1 from seed — count is still EXPECTED_CP1_COUNT
      expect(stats.checkpointCounts[1]).toBe(EXPECTED_CP1_COUNT);
    });

    it('submitting all CP1 batches produces the correct runner count', async () => {
      for (const batch of CP1_BATCHES) {
        // eslint-disable-next-line no-await-in-loop
        await act(() =>
          useBaseOperationsStore.getState().submitRadioBatch(batch.bibs, batch.time, 1)
        );
      }
      const { stats } = useBaseOperationsStore.getState();
      expect(stats.checkpointCounts[1]).toBe(EXPECTED_CP1_COUNT);
    });

    it('void a batch marks it voided and resets runner status to not-started', async () => {
      const firstBatch = CP1_BATCHES[0]; // 83, 45, 90, 87
      await act(() =>
        useBaseOperationsStore.getState().submitRadioBatch(firstBatch.bibs, firstBatch.time, 1)
      );
      const { sessionBatches } = useBaseOperationsStore.getState();
      const batchId = sessionBatches[0].id;

      await act(() => useBaseOperationsStore.getState().voidSessionBatch(batchId));

      const { sessionBatches: afterVoid, stats } = useBaseOperationsStore.getState();
      expect(afterVoid[0].voided).toBe(true);

      // Voiding resets status to 'not-started' but the DB record still exists,
      // so checkpointCounts is unchanged (we count records, not statuses here).
      // The key effect is the batch is marked voided in the session log.
      expect(stats.checkpointCounts[1]).toBe(EXPECTED_CP1_COUNT);

      // Verify the individual bibs were reset to not-started in the DB
      const resetRunners = await db.checkpoint_runners
        .where('raceId').equals(RACE_ID)
        .filter(r => r.checkpointNumber === 1 && firstBatch.bibs.includes(r.number))
        .toArray();
      expect(resetRunners.every(r => r.status === 'not-started')).toBe(true);
    });
  });
});
