import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RUNNER_STATUS } from '../../src/shared/types/store.types';

// Mock CheckpointRepository before importing the store
vi.mock('modules/checkpoint-operations/services/CheckpointRepository', () => ({
  default: {
    getCheckpointRunners: vi.fn(),
    initializeCheckpoint: vi.fn(),
    markRunner: vi.fn(),
    bulkMarkRunners: vi.fn(),
    updateRunner: vi.fn(),
    markGroupCalledIn: vi.fn(),
  },
}));

import useDualCheckpointStore from '../../src/modules/checkpoint-operations/store/useDualCheckpointStore.js';
import CheckpointRepository from '../../src/modules/checkpoint-operations/services/CheckpointRepository.js';

const makeRunners = (cpNumber, count) =>
  Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    checkpointNumber: cpNumber,
    status: 'not-started',
    commonTimeLabel: null,
    calledIn: false,
  }));

const reset = () => useDualCheckpointStore.getState().reset();

describe('useDualCheckpointStore — initialize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reset();
  });

  it('loads runners for both checkpoints on init', async () => {
    const primary = makeRunners(1, 3);
    const secondary = makeRunners(4, 3);
    CheckpointRepository.getCheckpointRunners
      .mockResolvedValueOnce(primary)   // init check CP1
      .mockResolvedValueOnce(secondary) // init check CP4
      .mockResolvedValueOnce(primary)   // final load CP1
      .mockResolvedValueOnce(secondary); // final load CP4
    CheckpointRepository.initializeCheckpoint.mockResolvedValue();

    await useDualCheckpointStore.getState().initialize('race-1', 1, 4);

    const state = useDualCheckpointStore.getState();
    expect(state.currentRaceId).toBe('race-1');
    expect(state.primaryCpNumber).toBe(1);
    expect(state.secondaryCpNumber).toBe(4);
    expect(state.primaryRunners).toHaveLength(3);
    expect(state.secondaryRunners).toHaveLength(3);
    expect(state.activeTab).toBe('primary');
    expect(state.loading).toBe(false);
  });

  it('calls initializeCheckpoint when no existing runners', async () => {
    CheckpointRepository.getCheckpointRunners
      .mockResolvedValueOnce([]) // empty → will init
      .mockResolvedValueOnce([]) // empty → will init
      .mockResolvedValueOnce([]) // final load CP1
      .mockResolvedValueOnce([]); // final load CP4
    CheckpointRepository.initializeCheckpoint.mockResolvedValue();

    await useDualCheckpointStore.getState().initialize('race-1', 1, 4);

    expect(CheckpointRepository.initializeCheckpoint).toHaveBeenCalledTimes(2);
  });
});

describe('useDualCheckpointStore — activeTab and getActiveRunners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reset();
    useDualCheckpointStore.setState({
      currentRaceId: 'race-1',
      primaryCpNumber: 1,
      secondaryCpNumber: 4,
      primaryRunners: [{ number: 1 }],
      secondaryRunners: [{ number: 2 }],
      activeTab: 'primary',
    });
  });

  it('getActiveRunners returns primary runners when activeTab=primary', () => {
    const runners = useDualCheckpointStore.getState().getActiveRunners();
    expect(runners[0].number).toBe(1);
  });

  it('getActiveRunners returns secondary runners after setActiveTab', () => {
    useDualCheckpointStore.getState().setActiveTab('secondary');
    const runners = useDualCheckpointStore.getState().getActiveRunners();
    expect(runners[0].number).toBe(2);
  });
});

describe('useDualCheckpointStore — markRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reset();
    useDualCheckpointStore.setState({
      currentRaceId: 'race-1',
      primaryCpNumber: 1,
      secondaryCpNumber: 4,
      primaryRunners: [],
      secondaryRunners: [],
      activeTab: 'primary',
    });
  });

  it('marks runner in primary checkpoint when activeTab=primary', async () => {
    CheckpointRepository.markRunner.mockResolvedValue();
    CheckpointRepository.getCheckpointRunners.mockResolvedValue([]);

    await useDualCheckpointStore.getState().markRunner(23);

    expect(CheckpointRepository.markRunner).toHaveBeenCalledWith(
      'race-1', 1, 23, null, null, RUNNER_STATUS.PASSED
    );
  });

  it('marks runner in secondary checkpoint when activeTab=secondary', async () => {
    useDualCheckpointStore.getState().setActiveTab('secondary');
    CheckpointRepository.markRunner.mockResolvedValue();
    CheckpointRepository.getCheckpointRunners.mockResolvedValue([]);

    await useDualCheckpointStore.getState().markRunner(23);

    expect(CheckpointRepository.markRunner).toHaveBeenCalledWith(
      'race-1', 4, 23, null, null, RUNNER_STATUS.PASSED
    );
  });
});

describe('useDualCheckpointStore — getTimeSegments', () => {
  beforeEach(() => {
    reset();
    useDualCheckpointStore.setState({
      currentRaceId: 'race-1',
      primaryCpNumber: 1,
      secondaryCpNumber: 4,
      primaryRunners: [
        { number: 1, status: 'passed', commonTimeLabel: '1000-1005', commonTime: '2026-01-01T10:00:00', calledIn: false },
        { number: 2, status: 'passed', commonTimeLabel: '1000-1005', commonTime: '2026-01-01T10:00:00', calledIn: true },
      ],
      secondaryRunners: [
        { number: 1, status: 'passed', commonTimeLabel: '1100-1105', commonTime: '2026-01-01T11:00:00', calledIn: true },
      ],
    });
  });

  it('returns segments for primary tab', () => {
    const segs = useDualCheckpointStore.getState().getTimeSegments('primary');
    expect(segs).toHaveLength(1);
    expect(segs[0].commonTimeLabel).toBe('1000-1005');
    expect(segs[0].calledIn).toBe(false); // one runner not called in
  });

  it('returns segments for secondary tab', () => {
    const segs = useDualCheckpointStore.getState().getTimeSegments('secondary');
    expect(segs).toHaveLength(1);
    expect(segs[0].commonTimeLabel).toBe('1100-1105');
    expect(segs[0].calledIn).toBe(true);
  });
});

describe('useDualCheckpointStore — reset', () => {
  it('resets all state to defaults', () => {
    useDualCheckpointStore.setState({ currentRaceId: 'race-1', primaryCpNumber: 1, secondaryCpNumber: 4 });
    useDualCheckpointStore.getState().reset();
    const state = useDualCheckpointStore.getState();
    expect(state.currentRaceId).toBeNull();
    expect(state.primaryCpNumber).toBeNull();
    expect(state.secondaryCpNumber).toBeNull();
    expect(state.primaryRunners).toHaveLength(0);
    expect(state.secondaryRunners).toHaveLength(0);
  });
});
