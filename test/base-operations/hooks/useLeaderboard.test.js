import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLeaderboard from '../../../src/modules/base-operations/components/Leaderboard/hooks/useLeaderboard';

const iso = (offsetSec) => new Date(Date.UTC(2025, 0, 1, 6, 0, offsetSec)).toISOString();
const batchStart = iso(0);

const runners = [
  { number: 1, firstName: 'Alice', lastName: 'A', gender: 'F', batchNumber: 1, commonTime: iso(3600), status: 'finished' },
  { number: 2, firstName: 'Bob', lastName: 'B', gender: 'M', batchNumber: 1, commonTime: iso(7200), status: 'finished' },
];
const batches = [{ batchNumber: 1, batchName: 'Wave 1', startTime: batchStart }];
const race = { startTime: batchStart };

describe('useLeaderboard', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns overall ranked entries sorted by elapsedMs', () => {
    const { result } = renderHook(() => useLeaderboard(runners, batches, race));
    expect(result.current.overall).toHaveLength(2);
    expect(result.current.overall[0].number).toBe(1); // Alice is faster
    expect(result.current.overall[0].rank).toBe(1);
  });

  it('groups by gender correctly', () => {
    const { result } = renderHook(() => useLeaderboard(runners, batches, race));
    expect(result.current.grouped.gender.M).toHaveLength(1);
    expect(result.current.grouped.gender.F).toHaveLength(1);
  });

  it('provides a manual refresh function', () => {
    const mockRefresh = vi.fn();
    const { result } = renderHook(() => useLeaderboard(runners, batches, race, { onRefresh: mockRefresh }));
    act(() => { result.current.refresh(); });
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it('updates lastUpdated timestamp on refresh', () => {
    const { result } = renderHook(() => useLeaderboard(runners, batches, race));
    const before = result.current.lastUpdated;
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.refresh();
    });
    expect(result.current.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('returns empty arrays when no finisher data', () => {
    const { result } = renderHook(() => useLeaderboard([], batches, race));
    expect(result.current.overall).toHaveLength(0);
    expect(result.current.grouped.gender.M).toHaveLength(0);
  });
});
