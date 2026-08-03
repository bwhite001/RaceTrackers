/**
 * Checkpoint Event Format (CEF) v0.1.
 * Spec: docs/protocol/checkpoint-event-format.md
 * Conformance vectors: docs/protocol/test-vectors.json
 */

export {
  EVENT_TYPES,
  STOP_EVENTS,
  validateRecord,
  naturalKey,
  mergeRecords,
  encodeJson,
  decodeJson,
} from './record';

export {
  APRS_MAX_LENGTH,
  APRS_LINE_RE,
  VERBS,
  encodeTime,
  decodeTime,
  encodeAprs,
  decodeAprs,
} from './aprsText';

export { eventToStatus, statusToEvent, resolveSite } from './mapping';
