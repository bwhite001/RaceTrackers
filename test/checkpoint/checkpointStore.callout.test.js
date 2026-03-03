import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock CheckpointRepository before importing the store
vi.mock('modules/checkpoint-operations/services/CheckpointRepository', () => ({
  default: {
    getCheckpointRunners: vi.fn(),
    markGroupCalledIn: vi.fn(),
    initializeCheckpoint: vi.fn(),
    updateRunner: vi.fn(),
    markRunner: vi.fn(),
    bulkMarkRunners: vi.fn(),
    exportCheckpointData: vi.fn(),
  }
}));

import useCheckpointStore from '../../src/modules/checkpoint-operations/store/checkpointStore.js';
import CheckpointRepository from '../../src/modules/checkpoint-operations/services/CheckpointRepository.js';

// Helper to set up store state before tests
const setState = (overrides = {}) => {
  useCheckpointStore.setState({
    currentRaceId: 1,
    checkpointNumber: 1,
    loading: false,
    error: null,
    lastSync: null,
    runners: [],
    ...overrides,
  });
};

describe('checkpointStore — getTimeSegments()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setState({ runners: [] });
  });

  it('returns empty array when no runners', () => {
    setState({ runners: [] });
    const segments = useCheckpointStore.getState().getTimeSegments();
    expect(segments).toEqual([]);
  });

  it('returns empty array when no runners have passed status', () => {
    setState({
      runners: [
        { number: 1, status: 'not-started', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: false },
      ]
    });
    const segments = useCheckpointStore.getState().getTimeSegments();
    expect(segments).toEqual([]);
  });

  it('returns empty array when passed runners have no commonTimeLabel', () => {
    setState({
      runners: [
        { number: 1, status: 'passed', commonTimeLabel: null, commonTime: null, calledIn: false },
      ]
    });
    const segments = useCheckpointStore.getState().getTimeSegments();
    expect(segments).toEqual([]);
  });

  it('groups passed runners into segments by commonTimeLabel', () => {
    setState({
      runners: [
        { number: 1, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: false },
        { number: 2, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: false },
        { number: 3, status: 'passed', commonTimeLabel: '07:45–07:50', commonTime: '2024-01-01T07:45:00.000Z', calledIn: true },
      ]
    });
    const segments = useCheckpointStore.getState().getTimeSegments();
    expect(segments).toHaveLength(2);
    expect(segments[0].commonTimeLabel).toBe('07:40–07:45');
    expect(segments[0].runners).toHaveLength(2);
    expect(segments[1].commonTimeLabel).toBe('07:45–07:50');
    expect(segments[1].runners).toHaveLength(1);
  });

  it('segment calledIn is false when any runner in the group is not called in', () => {
    setState({
      runners: [
        { number: 1, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: true },
        { number: 2, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: false },
      ]
    });
    const segments = useCheckpointStore.getState().getTimeSegments();
    expect(segments[0].calledIn).toBe(false);
  });

  it('segment calledIn is true when all runners in the group are called in', () => {
    setState({
      runners: [
        { number: 1, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: true },
        { number: 2, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: true },
      ]
    });
    const segments = useCheckpointStore.getState().getTimeSegments();
    expect(segments[0].calledIn).toBe(true);
  });

  it('sorts segments by commonTime ascending', () => {
    setState({
      runners: [
        { number: 3, status: 'passed', commonTimeLabel: '07:50–07:55', commonTime: '2024-01-01T07:50:00.000Z', calledIn: false },
        { number: 1, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: false },
        { number: 2, status: 'passed', commonTimeLabel: '07:45–07:50', commonTime: '2024-01-01T07:45:00.000Z', calledIn: false },
      ]
    });
    const segments = useCheckpointStore.getState().getTimeSegments();
    expect(segments[0].commonTimeLabel).toBe('07:40–07:45');
    expect(segments[1].commonTimeLabel).toBe('07:45–07:50');
    expect(segments[2].commonTimeLabel).toBe('07:50–07:55');
  });
});

describe('checkpointStore — markSegmentCalledIn()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when no active checkpoint session', async () => {
    setState({ currentRaceId: null, checkpointNumber: null });
    await expect(
      useCheckpointStore.getState().markSegmentCalledIn('07:40–07:45')
    ).rejects.toThrow('No active checkpoint session');
  });

  it('calls CheckpointRepository.markGroupCalledIn with correct args', async () => {
    const updatedRunners = [
      { number: 1, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: true },
    ];
    CheckpointRepository.markGroupCalledIn.mockResolvedValue(undefined);
    CheckpointRepository.getCheckpointRunners.mockResolvedValue(updatedRunners);

    setState({ currentRaceId: 5, checkpointNumber: 2, runners: [] });

    await useCheckpointStore.getState().markSegmentCalledIn('07:40–07:45');

    expect(CheckpointRepository.markGroupCalledIn).toHaveBeenCalledWith(5, 2, '07:40–07:45');
  });

  it('refreshes runners in store after marking called in', async () => {
    const updatedRunners = [
      { number: 1, status: 'passed', commonTimeLabel: '07:40–07:45', commonTime: '2024-01-01T07:40:00.000Z', calledIn: true },
    ];
    CheckpointRepository.markGroupCalledIn.mockResolvedValue(undefined);
    CheckpointRepository.getCheckpointRunners.mockResolvedValue(updatedRunners);

    setState({ currentRaceId: 1, checkpointNumber: 1, runners: [] });

    await useCheckpointStore.getState().markSegmentCalledIn('07:40–07:45');

    const { runners } = useCheckpointStore.getState();
    expect(runners).toEqual(updatedRunners);
  });

  it('sets loading false after completion', async () => {
    CheckpointRepository.markGroupCalledIn.mockResolvedValue(undefined);
    CheckpointRepository.getCheckpointRunners.mockResolvedValue([]);

    setState({ currentRaceId: 1, checkpointNumber: 1 });
    await useCheckpointStore.getState().markSegmentCalledIn('07:40–07:45');

    expect(useCheckpointStore.getState().loading).toBe(false);
  });

  it('sets error and re-throws on failure', async () => {
    CheckpointRepository.markGroupCalledIn.mockRejectedValue(new Error('DB error'));

    setState({ currentRaceId: 1, checkpointNumber: 1 });

    await expect(
      useCheckpointStore.getState().markSegmentCalledIn('07:40–07:45')
    ).rejects.toThrow('DB error');

    expect(useCheckpointStore.getState().error).toBe('DB error');
  });
});
