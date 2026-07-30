/**
 * M-5 / #42, #44: Base Station overview checkpoint columns were always empty
 *
 * BaseStationView fed HeadsUpGrid `r.checkpoints ?? {}`, but nothing ever sets a
 * `checkpoints` field on a runner row. The store's `runners` is a flat list of
 * checkpoint_runners rows (checkpointNumber 1..N) concatenated with
 * base_station_runners rows (checkpointNumber 0), so:
 *   - every checkpoint cell rendered "—" even for runners who had passed
 *   - a runner with 3 checkpoint records produced 3 duplicate grid rows
 *
 * buildHeadsUpRunners groups those flat rows into one row per runner with a
 * checkpointNumber -> status map.
 */
import { describe, it, expect } from 'vitest';
import { buildHeadsUpRunners } from 'modules/base-operations/utils/buildHeadsUpRunners';

const BASE_CP = 0;

describe('M-5 / #42: buildHeadsUpRunners groups flat rows per runner', () => {
  it('collapses multiple checkpoint rows into a single runner row', () => {
    const rows = [
      { number: 1, checkpointNumber: 1, status: 'passed' },
      { number: 1, checkpointNumber: 2, status: 'passed' },
      { number: 1, checkpointNumber: BASE_CP, status: 'passed' },
    ];

    const result = buildHeadsUpRunners(rows);

    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(1);
  });

  it('exposes each checkpoint status in the checkpointStatuses map', () => {
    const rows = [
      { number: 1, checkpointNumber: 1, status: 'passed' },
      { number: 1, checkpointNumber: 2, status: 'dnf' },
    ];

    const [runner] = buildHeadsUpRunners(rows);

    expect(runner.checkpointStatuses[1]).toBe('passed');
    expect(runner.checkpointStatuses[2]).toBe('dnf');
  });

  it('excludes the base station row (cp 0) from the checkpoint map', () => {
    const rows = [
      { number: 1, checkpointNumber: BASE_CP, status: 'passed' },
      { number: 1, checkpointNumber: 1, status: 'passed' },
    ];

    const [runner] = buildHeadsUpRunners(rows);

    expect(runner.checkpointStatuses[BASE_CP]).toBeUndefined();
    expect(Object.keys(runner.checkpointStatuses)).toEqual(['1']);
  });

  it('takes the overall status from the base station row when present', () => {
    const rows = [
      { number: 1, checkpointNumber: 1, status: 'passed' },
      { number: 1, checkpointNumber: BASE_CP, status: 'dnf' },
    ];

    const [runner] = buildHeadsUpRunners(rows);
    expect(runner.status).toBe('dnf');
  });

  it('falls back to the highest checkpoint status when there is no base row', () => {
    const rows = [
      { number: 1, checkpointNumber: 1, status: 'passed' },
      { number: 1, checkpointNumber: 3, status: 'dnf' },
      { number: 1, checkpointNumber: 2, status: 'passed' },
    ];

    const [runner] = buildHeadsUpRunners(rows);
    expect(runner.status).toBe('dnf');
  });

  it('returns runners sorted by bib number', () => {
    const rows = [
      { number: 10, checkpointNumber: 1, status: 'passed' },
      { number: 2, checkpointNumber: 1, status: 'passed' },
      { number: 7, checkpointNumber: 1, status: 'passed' },
    ];

    expect(buildHeadsUpRunners(rows).map(r => r.number)).toEqual([2, 7, 10]);
  });

  it('keeps a runner who only has a base station record', () => {
    const rows = [{ number: 5, checkpointNumber: BASE_CP, status: 'passed' }];

    const [runner] = buildHeadsUpRunners(rows);
    expect(runner.number).toBe(5);
    expect(runner.status).toBe('passed');
    expect(runner.checkpointStatuses).toEqual({});
  });

  it('handles an empty or missing input', () => {
    expect(buildHeadsUpRunners([])).toEqual([]);
    expect(buildHeadsUpRunners(null)).toEqual([]);
    expect(buildHeadsUpRunners(undefined)).toEqual([]);
  });

  it('does not let a not-started checkpoint row mask a real pass', () => {
    // Checkpoint records are pre-created as not-started for every runner
    const rows = [
      { number: 1, checkpointNumber: 1, status: 'passed' },
      { number: 1, checkpointNumber: 2, status: 'not-started' },
    ];

    const [runner] = buildHeadsUpRunners(rows);
    expect(runner.checkpointStatuses[1]).toBe('passed');
    expect(runner.status).toBe('not-started'); // highest cp reached is still pending
  });
});
