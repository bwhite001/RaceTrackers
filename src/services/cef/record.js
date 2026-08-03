/**
 * Checkpoint Event Format (CEF) v0.1 — record model and JSON profile.
 * Spec: docs/protocol/checkpoint-event-format.md §4, §5.3, §6.2
 */

export const EVENT_TYPES = Object.freeze({
  SEEN: 'SEEN',
  WITHDRAWN: 'WITHDRAWN',
  VET_OUT: 'VET_OUT',
  DNF: 'DNF',
  NON_STARTER: 'NON_STARTER',
});

export const STOP_EVENTS = Object.freeze([
  EVENT_TYPES.WITHDRAWN,
  EVENT_TYPES.VET_OUT,
  EVENT_TYPES.DNF,
  EVENT_TYPES.NON_STARTER,
]);

const COMPETITOR_RE = /^[0-9A-Za-z]+$/;
export const REASON_RE = /^[A-Z][A-Z0-9_]*$/;

// Field order for the JSON profile — spec §6.2 lists them in this order.
const FIELDS = ['site', 'competitor', 'event', 'time', 'reason', 'source', 'relays', 'msgId'];

function isPositiveInt(value) {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Validate a record against spec §4.1. Collects every problem rather than
 * failing on the first, so an operator sees one complete report.
 * @param {object} record
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRecord(record) {
  const errors = [];

  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['record must be an object'] };
  }

  // site — exactly one of checkpoint or location
  const site = record.site;
  if (!site || typeof site !== 'object') {
    errors.push('site is required');
  } else {
    const hasCp = site.checkpoint !== undefined;
    const hasLoc = site.location !== undefined;
    if (hasCp === hasLoc) {
      errors.push('site must have exactly one of checkpoint or location');
    } else if (hasCp && !isPositiveInt(site.checkpoint)) {
      errors.push('site.checkpoint must be a non-negative integer');
    } else if (hasLoc && !isPositiveInt(site.location)) {
      errors.push('site.location must be a non-negative integer');
    }
  }

  if (typeof record.competitor !== 'string' || !COMPETITOR_RE.test(record.competitor)) {
    errors.push('competitor must be a non-empty alphanumeric string');
  }

  if (!Object.values(EVENT_TYPES).includes(record.event)) {
    errors.push(`event must be one of ${Object.values(EVENT_TYPES).join(', ')}`);
  }

  if (typeof record.time !== 'string' || Number.isNaN(Date.parse(record.time))) {
    errors.push('time must be an ISO 8601 string');
  }

  if (record.reason !== undefined) {
    if (record.event === EVENT_TYPES.SEEN) {
      errors.push('reason is only valid on a stop event');
    } else if (typeof record.reason !== 'string' || !REASON_RE.test(record.reason)) {
      errors.push('reason must be an uppercase token');
    }
  }

  if (record.relays !== undefined && !Array.isArray(record.relays)) {
    errors.push('relays must be an array');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * The deduplication identity from spec §5.3: (resolved checkpoint, competitor,
 * event type). A location reference has no identity until resolved — see
 * mapping.resolveSite.
 * @param {object} record
 * @returns {string}
 */
export function naturalKey(record) {
  if (record?.site?.checkpoint === undefined) {
    throw new Error('naturalKey requires a resolved checkpoint; resolve the location reference first');
  }
  return `${record.site.checkpoint}|${record.competitor}|${record.event}`;
}

/**
 * Deduplicate by natural key. Earliest time wins — spec §5.3. This is
 * deliberately the opposite of the last-write-wins rule used when syncing two
 * copies of one device's database: here we are reconciling independent
 * observations of one physical event, and a relay can only add latency.
 * @param {object[]} records
 * @returns {object[]} deduplicated, in first-seen input order
 */
export function mergeRecords(records) {
  const byKey = new Map();
  for (const record of records) {
    const key = naturalKey(record);
    const existing = byKey.get(key);
    if (!existing || Date.parse(record.time) < Date.parse(existing.time)) {
      byKey.set(key, record);
    }
  }
  return [...byKey.values()];
}

function normalise(record) {
  const out = {};
  for (const field of FIELDS) {
    if (record[field] !== undefined) out[field] = record[field];
  }
  return out;
}

/**
 * Encode to the JSON profile (spec §6.2).
 * @param {object|object[]} recordOrRecords
 * @returns {string}
 */
export function encodeJson(recordOrRecords) {
  const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
  const payload = records.map(normalise);
  return JSON.stringify(Array.isArray(recordOrRecords) ? payload : payload[0], null, 2);
}

/**
 * Decode the JSON profile. Validates every record; throws on the first invalid
 * one with its full error list.
 * @param {string} jsonString
 * @returns {object[]}
 */
export function decodeJson(jsonString) {
  const parsed = JSON.parse(jsonString);
  const records = Array.isArray(parsed) ? parsed : [parsed];
  return records.map(record => {
    const { valid, errors } = validateRecord(record);
    if (!valid) throw new Error(`Invalid CEF record: ${errors.join('; ')}`);
    return normalise(record);
  });
}
