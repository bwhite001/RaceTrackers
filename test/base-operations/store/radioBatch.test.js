import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

vi.mock('services/storage', () => ({
  default: {
    getCheckpointRunners: vi.fn().mockResolvedValue([]),
    updateCheckpointRunner: vi.fn().mockResolvedValue({}),
    getBaseStationRunners: vi.fn().mockResolvedValue([]),
    updateBaseStationRunner: vi.fn().mockResolvedValue({}),
  }
}));

import useBaseOperationsStore from 'modules/base-operations/store/baseOperationsStore';
import StorageService from 'services/storage';

describe('submitRadioBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => useBaseOperationsStore.getState().reset());
    act(() => useBaseOperationsStore.setState({ currentRaceId: 'r1' }));
  });

  it('writes to checkpoint_runners via updateCheckpointRunner', async () => {
    await act(() => useBaseOperationsStore.getState().submitRadioBatch([42, 7], '10:30', 3));
    expect(StorageService.updateCheckpointRunner).toHaveBeenCalledWith(
      'r1', 3, 42, expect.objectContaining({ markOffTime: '10:30', status: 'passed' })
    );
    expect(StorageService.updateCheckpointRunner).toHaveBeenCalledWith(
      'r1', 3, 7, expect.objectContaining({ markOffTime: '10:30', status: 'passed' })
    );
  });

  it('does NOT write to base_station_runners', async () => {
    await act(() => useBaseOperationsStore.getState().submitRadioBatch([42], '10:30', 3));
    expect(StorageService.updateBaseStationRunner).not.toHaveBeenCalled();
  });

  it('records the batch in sessionBatches', async () => {
    await act(() => useBaseOperationsStore.getState().submitRadioBatch([42, 7], '10:30', 3));
    const { sessionBatches } = useBaseOperationsStore.getState();
    expect(sessionBatches).toHaveLength(1);
    expect(sessionBatches[0]).toMatchObject({ checkpointNumber: 3, commonTime: '10:30', bibs: [42, 7], voided: false });
    expect(sessionBatches[0].id).toBeDefined();
  });

  it('throws if checkpointNumber is missing', async () => {
    await expect(
      act(() => useBaseOperationsStore.getState().submitRadioBatch([42], '10:30'))
    ).rejects.toThrow('checkpointNumber is required');
  });
});

describe('loadRunners reads from checkpoint_runners and base_station_runners', () => {
  it('calls getCheckpointRunners and getBaseStationRunners with raceId', async () => {
    act(() => useBaseOperationsStore.setState({ currentRaceId: 'r1' }));
    await act(() => useBaseOperationsStore.getState().loadRunners('r1'));
    expect(StorageService.getCheckpointRunners).toHaveBeenCalledWith('r1');
    expect(StorageService.getBaseStationRunners).toHaveBeenCalledWith('r1');
  });
});

describe('calculateStats deduplication', () => {
  it('counts base station (CP 0) records as finished, not checkpoint passes', () => {
    const runners = [
      { number: 42, checkpointNumber: 0, status: 'passed' }, // base station = finished
      { number: 7,  checkpointNumber: 1, status: 'dnf' },
    ];
    act(() => useBaseOperationsStore.setState({ currentRace: { minRunner: 1, maxRunner: 10 } }));
    const stats = useBaseOperationsStore.getState().calculateStats(runners);
    expect(stats.total).toBe(10);
    expect(stats.finished).toBe(1);
    expect(stats.dnf).toBe(1);
  });

  it('uses highest-checkpoint record status for each runner', () => {
    const runners = [
      { number: 10, checkpointNumber: 1, status: 'passed' },
      { number: 10, checkpointNumber: 3, status: 'dnf' },
    ];
    act(() => useBaseOperationsStore.setState({ currentRace: { minRunner: 1, maxRunner: 20 } }));
    const stats = useBaseOperationsStore.getState().calculateStats(runners);
    expect(stats.dnf).toBe(1);
    expect(stats.finished).toBe(0);
  });

  it('does not count checkpoint passes as finished', () => {
    const runners = [
      { number: 42, checkpointNumber: 1, status: 'passed' },
      { number: 42, checkpointNumber: 3, status: 'passed' },
    ];
    act(() => useBaseOperationsStore.setState({ currentRace: { minRunner: 1, maxRunner: 10 } }));
    const stats = useBaseOperationsStore.getState().calculateStats(runners);
    expect(stats.finished).toBe(0);
    expect(stats.active).toBe(1);
  });
});
