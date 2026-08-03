import { describe, it, expect } from 'vitest';
import { RUNNER_STATUSES } from '../../../src/types/index';
import { EVENT_TYPES } from '../../../src/services/cef/record';
import { eventToStatus, statusToEvent, resolveSite } from '../../../src/services/cef/mapping';

describe('eventToStatus', () => {
  it('maps SEEN to passed with no side effect', () => {
    expect(eventToStatus(EVENT_TYPES.SEEN))
      .toEqual({ status: RUNNER_STATUSES.PASSED, sideEffect: null });
  });

  it('maps DNF to dnf with no side effect', () => {
    expect(eventToStatus(EVENT_TYPES.DNF))
      .toEqual({ status: RUNNER_STATUSES.DNF, sideEffect: null });
  });

  it('maps NON_STARTER to non-starter', () => {
    expect(eventToStatus(EVENT_TYPES.NON_STARTER).status)
      .toBe(RUNNER_STATUSES.NON_STARTER);
  });

  it('flags WITHDRAWN as needing a withdrawal_records row', () => {
    expect(eventToStatus(EVENT_TYPES.WITHDRAWN).sideEffect).toBe('withdrawal');
  });

  it('flags VET_OUT as needing a vet_out_records row', () => {
    expect(eventToStatus(EVENT_TYPES.VET_OUT).sideEffect).toBe('vetOut');
  });

  it('gives WITHDRAWN and VET_OUT distinct side effects despite a shared status', () => {
    const w = eventToStatus(EVENT_TYPES.WITHDRAWN);
    const v = eventToStatus(EVENT_TYPES.VET_OUT);
    expect(w.status).toBe(v.status);
    expect(w.sideEffect).not.toBe(v.sideEffect);
  });

  it('throws for an unknown event', () => {
    expect(() => eventToStatus('CALLED_IN')).toThrow(/event/i);
  });
});

describe('statusToEvent', () => {
  it('maps passed to SEEN', () => {
    expect(statusToEvent(RUNNER_STATUSES.PASSED)).toBe(EVENT_TYPES.SEEN);
  });

  it('maps dnf to DNF', () => {
    expect(statusToEvent(RUNNER_STATUSES.DNF)).toBe(EVENT_TYPES.DNF);
  });

  it('maps non-starter to NON_STARTER', () => {
    expect(statusToEvent(RUNNER_STATUSES.NON_STARTER)).toBe(EVENT_TYPES.NON_STARTER);
  });

  it('returns null for local device states, which are not protocol events', () => {
    for (const status of [
      RUNNER_STATUSES.NOT_STARTED,
      RUNNER_STATUSES.CALLED_IN,
      RUNNER_STATUSES.MARKED_OFF,
      RUNNER_STATUSES.PENDING,
    ]) {
      expect(statusToEvent(status)).toBeNull();
    }
  });

  it('returns null for disqualified, excluded from CEF v0.1', () => {
    expect(statusToEvent(RUNNER_STATUSES.DISQUALIFIED)).toBeNull();
  });

  it('returns null for an unrecognised status rather than throwing', () => {
    expect(statusToEvent('invented')).toBeNull();
  });
});

describe('resolveSite', () => {
  const site = { location: 2 };
  const hosted = [3, 8, 14, 27];

  it('passes an already-resolved checkpoint through unchanged', () => {
    expect(resolveSite({ checkpoint: 5 }, {})).toEqual({ checkpoint: 5 });
  });

  it('picks the earliest hosted checkpoint for a first arrival', () => {
    expect(resolveSite(site, { locationCheckpoints: hosted, seenCheckpoints: [] }))
      .toEqual({ checkpoint: 3 });
  });

  it('picks the next unvisited hosted checkpoint on a return', () => {
    expect(resolveSite(site, { locationCheckpoints: hosted, seenCheckpoints: [3] }))
      .toEqual({ checkpoint: 8 });
  });

  it('skips bypassed checkpoints when the competitor is already past them', () => {
    // Spec §5.1: last seen at 24, so 3, 8 and 14 do not reopen.
    expect(resolveSite(site, { locationCheckpoints: hosted, seenCheckpoints: [24] }))
      .toEqual({ checkpoint: 27 });
  });

  it('does not require locationCheckpoints to be sorted', () => {
    expect(resolveSite(site, { locationCheckpoints: [27, 3, 14, 8], seenCheckpoints: [3] }))
      .toEqual({ checkpoint: 8 });
  });

  it('throws when every hosted checkpoint is already recorded', () => {
    expect(() => resolveSite(site, { locationCheckpoints: hosted, seenCheckpoints: hosted }))
      .toThrow(/no unrecorded checkpoint/i);
  });

  it('throws when the location hosts nothing', () => {
    expect(() => resolveSite(site, { locationCheckpoints: [], seenCheckpoints: [] }))
      .toThrow(/no checkpoint/i);
  });

  it('throws when locationCheckpoints is absent — a receiver must reject, not guess', () => {
    expect(() => resolveSite(site, {})).toThrow();
  });
});
