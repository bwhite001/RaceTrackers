/**
 * Base — checkpoint Records (fix what base already holds), pure logic.
 *
 * Every flag comes from the Needs attention checks (dataChecks.runChecks) and
 * their issue keys — nothing is detected twice. Records lists one checkpoint:
 * base's active rows, the numbers heard but rejected on its calls, the
 * runners it missed (seen further on), and, with history on, superseded rows.
 */
import { hhmm, toBlock } from '../../../services/blocks.js';
import { recordTime } from './receive.js';
import { lateNumbers } from './field.js';

export const REASONS = [
  { id: 'correction', label: 'Checkpoint correction' },
  { id: 'base-error', label: 'Base typing error' },
  { id: 'other', label: 'Other' },
];

/** Actions that change data and so need a reason. */
export const NEEDS_REASON = new Set(['time', 'number', 'cp', 'remove', 'keep', 'late']);

/** supersededReason stored on the old row, by edit kind (a time change keeps the reason). */
export function supersededReasonFor(kind, reason) {
  return { keep: 'duplicate', cp: 'moved', number: 'renumbered', remove: 'removed' }[kind] ?? reason;
}

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'attn', label: 'Needs attention' },
  { id: 'dup', label: 'Duplicate' },
  { id: 'missed', label: 'Missed' },
  { id: 'wrong', label: 'Wrong number' },
  { id: 'other', label: 'Other' },
];

const shortOf = (order, n) => order.find(c => c.number === n)?.short ?? `CP${n}`;

/** Open issues at this checkpoint, keyed for the rows they flag. */
function issuesHere(issues, cp) {
  const dupRows = new Map();   // row id → issue
  const other = new Map();     // bib → issue (first wins: after > order > pace)
  for (const i of issues.dup ?? []) if (i.rows[0].checkpointNumber === cp) for (const r of i.rows) dupRows.set(r.id, i);
  const put = (number, issue, flag) => { if (!other.has(number)) other.set(number, { issue, flag }); };
  for (const i of issues.after ?? []) if (i.cp.number === cp) put(i.number, i, { kind: 'alert', note: `After ${i.out.status}` });
  for (const i of issues.order ?? []) if (i.askCp.number === cp) put(i.number, i, { kind: 'warn', note: `Before ${i.alsoAskCp.short}` });
  for (const i of issues.pace ?? []) {
    if (i.askCp.number !== cp) continue;
    const kmh = /(\d+) km\/h/.exec(i.detail)?.[1];
    put(i.number, i, { kind: 'warn', note: kmh ? `Pace ${kmh} km/h` : 'Pace' });
  }
  const missed = (issues.skip ?? []).filter(i => i.askCp.number === cp);
  const wrong = (issues.unknown ?? []).filter(i => i.checkpointNumber === cp);
  return { dupRows, other, missed, wrong };
}

/**
 * Every record Records shows for one checkpoint.
 * @param {object} p
 * @param {object[]} p.baseRows   all base rows (superseded included)
 * @param {object} p.issues       open issues (runChecks with resolutions applied)
 * @param {object} p.allIssues    the same checks without resolutions — to show "Checked"
 * @returns {object[]} items { id, type: 'row'|'wrong'|'missed'|'history', number, time, manual, callId, flag, issue?, row? }
 */
export function recordItems({ cp, baseRows, issues, allIssues, fieldChanges = [], resolutions = [] }) {
  const here = issuesHere(issues, cp);
  const before = issuesHere(allIssues, cp);
  const checkedKeys = new Set(resolutions.filter(r => r.resolution === 'checked').map(r => r.issueKey));
  const late = lateNumbers(fieldChanges);
  const items = [];
  for (const r of baseRows) {
    if (r.checkpointNumber !== cp) continue;
    const callId = r.callId ?? r.fromCallId ?? null;
    if (r.status === 'superseded') {
      items.push({ id: `row:${r.id}`, type: 'history', number: r.number, time: r.commonTime ?? null, manual: r.manualTime === true, callId, row: r, edited: !!r.editId, flag: { kind: 'old', note: historyNote(r) } });
      continue;
    }
    if (!recordTime(r)) continue;
    let flag = { kind: 'ok', note: '' };
    let issue = null;
    if (here.dupRows.has(r.id)) { issue = here.dupRows.get(r.id); flag = { kind: 'warn', note: 'Duplicate', issue: 'dup' }; }
    else if (here.other.has(r.number)) { ({ issue } = here.other.get(r.number)); flag = { ...here.other.get(r.number).flag, issue: 'other' }; }
    else if (late.has(r.number)) flag = { kind: 'info', note: 'Late entry' };
    else if (before.other.has(r.number) && checkedKeys.has(before.other.get(r.number).issue.key)) flag = { kind: 'checked', note: 'Checked' };
    items.push({ id: `row:${r.id}`, type: 'row', number: r.number, time: r.commonTime, manual: r.manualTime === true, callId, row: r, edited: !!r.editId, flag, issue });
  }
  for (const i of here.wrong) {
    const callId = Number(i.key.split(':')[1]);
    items.push({ id: i.key, type: 'wrong', number: i.number, time: i.time, manual: !!i.time && toBlock(i.time) !== i.time, callId, issue: i, flag: { kind: 'bad', note: 'Not in race', issue: 'wrong' } });
  }
  // A wrong number base has fixed (renumbered or recorded as late) stays visible in history
  const resolvedAs = new Map(resolutions.map(r => [r.issueKey, r.resolution]));
  for (const i of before.wrong) {
    const res = resolvedAs.get(i.key);
    if (!res || !/^(renumbered|late entry)/.test(res)) continue;
    const to = /^renumbered (\d+)/.exec(res)?.[1];
    items.push({ id: `${i.key}:fixed`, type: 'history', number: i.number, time: i.time, manual: !!i.time && toBlock(i.time) !== i.time, callId: Number(i.key.split(':')[1]), flag: { kind: 'old', note: to ? `Was ${i.number} · now ${to}` : 'Recorded as late entry' } });
  }
  for (const i of here.missed) {
    items.push({ id: i.key, type: 'missed', number: i.number, time: null, manual: false, callId: null, issue: i, seenAt: i.seenAt?.short ?? null, flag: { kind: 'missed', note: `Missed · seen ${i.seenAt?.short ?? 'further on'}`, issue: 'missed' } });
  }
  return items;
}

/** History line for a superseded row: the note the edit stored, else the existing reason text. */
function historyNote(r) {
  if (r.supersededNote) return r.supersededNote;
  if (r.supersededReason === 'correction') return 'Corrected on a call';
  const why = String(r.supersededReason ?? 'replaced');
  return why.charAt(0).toUpperCase() + why.slice(1);
}

/** Issue counts for the sidebar and filter pills (duplicates count bibs, not rows). */
export function issueCounts(items) {
  const dup = new Set(items.filter(i => i.flag.issue === 'dup').map(i => i.number)).size;
  const missed = items.filter(i => i.flag.issue === 'missed').length;
  const wrong = items.filter(i => i.flag.issue === 'wrong').length;
  const other = items.filter(i => i.flag.issue === 'other').length;
  return { dup, missed, wrong, other, attn: dup + missed + wrong + other };
}

/** Items shown for a filter, number search ("starts with") and the history toggle. */
export function visibleItems(items, { filter = 'all', search = '', history = false }) {
  return items.filter(i => {
    if (i.type === 'history' && (!history || filter !== 'all')) return false;
    if (filter === 'attn' && !i.flag.issue) return false;
    if (['dup', 'missed', 'wrong', 'other'].includes(filter) && i.flag.issue !== filter) return false;
    if (search && !String(i.number).startsWith(search)) return false;
    return true;
  });
}

const byNumber = (a, b) => a.number - b.number || (a.time ?? '').localeCompare(b.time ?? '');
/** Groups sort by rank, then time (plain string order: ISO times compare correctly). */
const byRank = (a, b) => a.rank - b.rank || (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);

/** By block: one card per common time; exact times get their own card; missed last. */
export function groupByBlock(items) {
  const groups = new Map();
  for (const i of items) {
    const key = i.time == null ? 'missed' : i.manual ? `x${i.time}` : `b${toBlock(i.time)}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: i.time == null ? 'Missed — seen further on' : i.manual ? `Exact ${hhmm(i.time)}` : hhmm(toBlock(i.time)),
        rank: i.time == null ? 1 : 0,
        at: i.time ?? '',
        items: [],
      });
    }
    groups.get(key).items.push(i);
  }
  return [...groups.values()].sort(byRank).map(g => ({ ...g, items: g.items.sort(byNumber) }));
}

/** By call: one card per radio call, corrections and confirmed-missed grouped, base edits, missed last. */
export function groupByCall(items, radioCalls = [], cpShort = '') {
  const calls = new Map(radioCalls.map(c => [c.id, c]));
  const groups = new Map();
  for (const i of items) {
    const call = i.callId != null ? calls.get(i.callId) : null;
    let key; let title; let rank = 0; let at = '';
    if (i.time == null) { key = 'missed'; title = 'Missed — seen further on'; rank = 4; }
    else if (call?.kind === 'correction') { key = 'corr'; title = `Corrections from ${cpShort}`; rank = 2; }
    else if (call?.kind === 'missed') { key = 'miss'; title = `Missed — confirmed by ${cpShort}`; rank = 3; }
    else if (call) { key = `call:${call.id}`; title = `Call ${hhmm(call.receivedAt)}`; at = call.receivedAt; }
    else { key = 'base'; title = 'Entered at base'; rank = 1; }
    if (!groups.has(key)) groups.set(key, { key, title, rank, at, items: [] });
    groups.get(key).items.push(i);
  }
  return [...groups.values()].sort(byRank).map(g => ({ ...g, items: g.items.sort(byNumber) }));
}

/** "6 numbers · 3 blocks" for a call card; "2 to ask about" for missed. */
export function groupSub(g, view) {
  if (g.key === 'missed') return `${g.items.length} to ask about`;
  const active = g.items.filter(i => i.type === 'row');
  const blocks = new Set(active.map(i => toBlock(i.time))).size;
  return `${active.length} ${active.length === 1 ? 'number' : 'numbers'}${view === 'call' && blocks ? ` · ${blocks} ${blocks === 1 ? 'block' : 'blocks'}` : ''}`;
}

/** Action pills for one record (first one opens selected). */
export function actionsFor(item) {
  if (item.type === 'missed') return [{ id: 'have', label: 'They have it' }, { id: 'notseen', label: 'Not seen there' }];
  if (item.type === 'wrong') return [{ id: 'number', label: 'Change number' }, { id: 'late', label: 'Record as late entry' }];
  if (item.type !== 'row') return [];
  const a = [{ id: 'time', label: 'Time' }, { id: 'number', label: 'Number' }, { id: 'cp', label: 'Checkpoint' }, { id: 'remove', label: 'Remove' }];
  if (item.flag.issue === 'dup') a.unshift({ id: 'keep', label: 'Keep this one' });
  if (item.flag.issue === 'other') a.push({ id: 'checked', label: 'Mark checked' });
  return a;
}

/** Why a new number can't be saved here, or null. */
export function numberProblem(next, item, items, cpShort) {
  const n = Number(next);
  if (!next || !Number.isInteger(n) || n <= 0) return 'Type the right number first';
  if (n === item.number && item.type === 'row') return 'Same number — nothing to change';
  if (items.some(i => i.type === 'row' && i.number === n && i.id !== item.id)) return `${cpShort} already has ${n} — fix that one first`;
  return null;
}

/** Last "up to" block from active rows at a checkpoint (exact times and missed reports don't count). */
export function upToFromRows(rows, cp) {
  let max = null;
  for (const r of rows) {
    if (r.checkpointNumber !== cp || r.status === 'superseded' || r.missedReport) continue;
    const t = r.correction ? r.upToBlock : recordTime(r);
    if (!t || (!r.correction && r.manualTime === true)) continue;
    if (!max || t > max) max = t;
  }
  return max;
}

/** "175 changed 07:15 → 07:10", one line per edit kind (used for the status line and Undo label). */
export function editMessage(kind, { number, count, fromTime, toTime, toNumber, toShort, cpShort, late }) {
  const many = count > 1 ? `${count} numbers` : String(number);
  switch (kind) {
    case 'time': return count > 1 ? `${many} moved to ${hhmm(toTime)}` : `${number} changed ${hhmm(fromTime)} → ${hhmm(toTime)}`;
    case 'number': return `${number} renumbered to ${toNumber}${late ? ' · not in setup, added as late entry' : ''}`;
    case 'cp': return `${many} moved to ${toShort}`;
    case 'remove': return `${many} removed from ${cpShort}`;
    case 'keep': return `Kept ${number} at ${hhmm(fromTime)}`;
    default: return '';
  }
}

export { shortOf };

/** Why the editor's Save is locked, or null (reason first: it's the rule base most often misses). */
export function saveProblem({ action, reason, numberError = null, toCp = null }) {
  if (!action) return 'Pick what to change';
  if (NEEDS_REASON.has(action) && !reason) return 'Pick a reason';
  if (action === 'number' && numberError) return numberError;
  if (action === 'cp' && toCp == null) return 'Pick checkpoint';
  return null;
}
