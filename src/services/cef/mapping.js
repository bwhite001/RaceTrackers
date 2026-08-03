/**
 * Checkpoint Event Format (CEF) v0.1 — mapping onto RaceTracker's own model.
 * Spec: docs/protocol/checkpoint-event-format.md §4.2, §5.1
 *
 * This file tracks *our* schema, not the spec. Keep spec-driven logic in
 * record.js and aprsText.js.
 */

import { RUNNER_STATUSES } from '../../types/index';
import { EVENT_TYPES } from './record';

/**
 * RUNNER_STATUSES has no 'withdrawn' or 'vet-out' value — those are recorded in
 * the withdrawal_records and vet_out_records tables. Both therefore map to the
 * same status and are distinguished by the side effect a caller must also apply.
 */
const EVENT_TO_STATUS = Object.freeze({
  [EVENT_TYPES.SEEN]: { status: RUNNER_STATUSES.PASSED, sideEffect: null },
  [EVENT_TYPES.DNF]: { status: RUNNER_STATUSES.DNF, sideEffect: null },
  [EVENT_TYPES.NON_STARTER]: { status: RUNNER_STATUSES.NON_STARTER, sideEffect: null },
  [EVENT_TYPES.WITHDRAWN]: { status: RUNNER_STATUSES.DNF, sideEffect: 'withdrawal' },
  [EVENT_TYPES.VET_OUT]: { status: RUNNER_STATUSES.DNF, sideEffect: 'vetOut' },
});

/**
 * @param {string} event a CEF event type
 * @returns {{ status: string, sideEffect: 'withdrawal'|'vetOut'|null }}
 */
export function eventToStatus(event) {
  const mapped = EVENT_TO_STATUS[event];
  if (!mapped) throw new Error(`Unknown CEF event type: ${event}`);
  return { ...mapped };
}

/**
 * Inverse mapping, for transmitting our own records.
 *
 * Returns null for statuses that are not protocol events: local device
 * bookkeeping (not-started, called-in, marked-off, pending) describes an
 * operator's workflow rather than anything a competitor did, and
 * disqualification is excluded from CEF v0.1 as an organiser's ruling.
 *
 * Note the asymmetry: 'dnf' maps to DNF, so a caller that needs WITHDRAWN or
 * VET_OUT must check withdrawal_records and vet_out_records first.
 *
 * @param {string} status a RUNNER_STATUSES value
 * @returns {string|null} a CEF event type, or null if not transmissible
 */
export function statusToEvent(status) {
  switch (status) {
    case RUNNER_STATUSES.PASSED: return EVENT_TYPES.SEEN;
    case RUNNER_STATUSES.DNF: return EVENT_TYPES.DNF;
    case RUNNER_STATUSES.NON_STARTER: return EVENT_TYPES.NON_STARTER;
    default: return null;
  }
}

/**
 * Resolve a location reference to a concrete checkpoint (spec §5.1): the
 * earliest checkpoint hosted at that location which the competitor has not been
 * recorded at and which is not earlier than their last recorded checkpoint.
 *
 * A receiver that cannot resolve must reject the record rather than guess, so
 * every failure here throws.
 *
 * @param {{checkpoint?: number, location?: number}} site
 * @param {{ locationCheckpoints?: number[], seenCheckpoints?: number[] }} context
 * @returns {{ checkpoint: number }}
 */
export function resolveSite(site, { locationCheckpoints, seenCheckpoints = [] } = {}) {
  if (site?.checkpoint !== undefined) return { checkpoint: site.checkpoint };

  if (site?.location === undefined) {
    throw new Error('site must have a checkpoint or a location');
  }
  if (!Array.isArray(locationCheckpoints) || locationCheckpoints.length === 0) {
    throw new Error(`No checkpoints known for location ${site.location}; cannot resolve`);
  }

  const seen = new Set(seenCheckpoints);
  const lastSeen = seenCheckpoints.length ? Math.max(...seenCheckpoints) : -Infinity;

  const candidate = [...locationCheckpoints]
    .sort((a, b) => a - b)
    .find(cp => !seen.has(cp) && cp >= lastSeen);

  if (candidate === undefined) {
    throw new Error(
      `No unrecorded checkpoint at location ${site.location} at or after checkpoint ${lastSeen}`
    );
  }
  return { checkpoint: candidate };
}
