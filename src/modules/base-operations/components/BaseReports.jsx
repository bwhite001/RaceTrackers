import React, { useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { boardCheckpoints, sightingsByCheckpoint, outStatusMap, buildBoard, reportedUpTo } from '../services/receive';
import { overdueRunners, stillOnCourse, timesMatrix, callLog, awaitingByCheckpoint, raceCounts, OVERDUE_GRACE_MINUTES } from '../services/reports';
import { outRecords } from '../services/statusValidation';
import { runChecks, checkpointDistances, CHECKS, PACE_LIMIT_KMH } from '../services/dataChecks';
import TimeUtils from '../../../services/timeUtils.js';
import { hhmm } from '../../../services/blocks.js';
import useNow from '../../../shared/hooks/useNow';
import ReportsPanel from './ReportsPanel';

const REPORTS = [
  { id: 'missing', title: 'Overdue runners', desc: 'Passed a checkpoint but not reached the next one in the expected time.' },
  { id: 'oncourse', title: 'Still on course', desc: 'Everyone not finished and not out — for sweep and stand-down.' },
  { id: 'results', title: 'Times by checkpoint', desc: 'Every runner’s common time at each checkpoint.' },
  { id: 'calls', title: 'Call log', desc: 'Scores Checkpoint calls received from each station.' },
  { id: 'exports', title: 'Exports', desc: 'Finisher list, race results, split times and officials’ report as files.' },
];

const toCsv = (rows) => rows.map(r => r.map(c => {
  const v = String(c ?? '');
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}).join(',')).join('\n');

const Th = ({ children, first, right }) => (
  <th scope="col" className={`py-2 text-[11px] text-vk-muted uppercase tracking-[0.8px] ${first ? 'pl-3.5 pr-2' : 'px-2'} ${right ? 'text-right pr-3.5' : ''}`}>{children}</th>
);

/**
 * Base — Reports & data checks (spec §4.12). Reports with CSV / Print; the
 * "Needs attention" checks resolve in place, each with Undo.
 */
const BaseReports = ({ initialReport = 'missing' }) => {
  const store = useBaseOperationsStore();
  const {
    currentRace, checkpoints = [], runners = [], radioCalls = [], outList = [], raceRunnerNumbers = [],
    baseRows = [], resolutions = [], downloadReport,
  } = store;
  const now = useNow(30000);
  const [sel, setSel] = useState(initialReport || 'missing');
  const [flash, setFlash] = useState('');
  const [undo, setUndo] = useState(null);
  const [busy, setBusy] = useState(false);
  // Undo belongs to the list it was done in — switching lists drops it
  const pick = (id) => { setSel(id); setFlash(''); setUndo(null); };

  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5))
    : null;
  const order = useMemo(() => boardCheckpoints(checkpoints), [checkpoints]);
  const sightings = useMemo(() => sightingsByCheckpoint(runners), [runners]);
  const out = useMemo(() => outStatusMap(outList, runners), [outList, runners]);
  const outByNumber = useMemo(() => new Map(outRecords(outList).map(r => [r.number, r])), [outList]);
  const outForMatrix = useMemo(() => new Map([...out].map(([n, s]) => [n, {
    status: s, checkpoint: outByNumber.get(n)?.checkpoint ?? null, time: outByNumber.get(n)?.time ?? null,
  }])), [out, outByNumber]);
  const raceNumbers = raceRunnerNumbers;
  const distances = useMemo(() => checkpointDistances(checkpoints, currentRace), [checkpoints, currentRace]);
  const resolvedKeys = useMemo(() => new Set(resolutions.map(r => r.issueKey)), [resolutions]);

  const upTo = useMemo(() => reportedUpTo(runners), [runners]);
  const lateRows = useMemo(() => overdueRunners({
    sightings, order, out, now, upTo, graceMinutes: currentRace?.overdueGraceMinutes ?? OVERDUE_GRACE_MINUTES,
  }), [sightings, order, out, now, upTo, currentRace?.overdueGraceMinutes]);
  const overdue = lateRows.filter(r => r.status === 'overdue');
  const awaiting = awaitingByCheckpoint(lateRows);
  const counts = useMemo(() => raceCounts({ sightings, out, raceNumbers: raceRunnerNumbers }), [sightings, out, raceRunnerNumbers]);
  const onCourse = useMemo(() => stillOnCourse({ sightings, order, out, raceNumbers }), [sightings, order, out, raceNumbers]);
  const matrix = useMemo(() => timesMatrix({ sightings, order, out: outForMatrix, raceNumbers }), [sightings, order, outForMatrix, raceNumbers]);
  const board = useMemo(() => buildBoard({ checkpoints, records: runners, radioCalls, now, raceStart, fieldSize: raceNumbers.length, outCount: out.size }),
    [checkpoints, runners, radioCalls, now, raceStart, raceNumbers.length, out.size]);
  const calls = useMemo(() => callLog({ radioCalls, board }), [radioCalls, board]);
  const issues = useMemo(() => runChecks({
    baseRows, order, sightings, outByNumber, radioCalls, distances, limitKmh: currentRace?.paceLimitKmh ?? PACE_LIMIT_KMH,
  }, resolvedKeys), [baseRows, order, sightings, outByNumber, radioCalls, distances, currentRace?.paceLimitKmh, resolvedKeys]);

  const issueTotal = Object.values(issues).reduce((n, list) => n + list.length, 0);
  const commonCounts = {
    missing: overdue.length,
    oncourse: counts.onCourse,
    results: raceNumbers.length,
    calls: calls.reduce((n, c) => n + c.calls, 0),
    exports: '',
  };
  const report = REPORTS.find(r => r.id === sel);
  const check = CHECKS.find(c => c.id === sel);

  // ── actions on issues ─────────────────────────────────────────────────────
  const ack = (issue, resolution) => async () => {
    const id = await store.addResolution(issue.key, resolution);
    return () => store.removeResolution(id);
  };
  const supersede = (rows, reason) => async () => {
    const before = await store.supersedeBaseRows(rows.map(r => r.id), reason);
    return () => store.restoreBaseRows(before);
  };
  const clearOut = (record) => async () => {
    await store.clearOutStatus(record);
    return () => store.restoreOutStatus(record);
  };

  const actionsFor = (issue) => {
    switch (issue.check) {
      case 'dup':
        return issue.same
          ? [{ label: 'Merge', primary: true, run: supersede(issue.rows.slice(1), 'duplicate merged') }]
          : issue.rows.map((r, i) => ({
            label: `Keep ${hhmm(r.commonTime)}`, primary: i === 0,
            run: supersede(issue.rows.filter(x => x.id !== r.id), `duplicate — kept ${hhmm(r.commonTime)}`),
          }));
      case 'after': {
        const acts = [];
        if (issue.out.clearable) acts.push({ label: `Clear ${issue.out.status}`, primary: true, run: clearOut(issue.out) });
        acts.push(issue.baseRows.length
          ? { label: `Remove ${issue.cp.short} time`, primary: !acts.length, run: supersede(issue.baseRows, `seen after ${issue.out.status}`) }
          : { label: 'Mark checked', primary: !acts.length, run: ack(issue, 'checked') });
        return acts;
      }
      case 'unknown':
        return [
          { label: 'Remove', primary: true, run: ack(issue, 'removed') },
          { label: 'Keep for review', run: ack(issue, 'kept') },
        ];
      default:
        return [
          { label: `Ask ${issue.askCp.short}`, primary: true, run: ack(issue, `ask ${issue.askCp.short}`) },
          { label: 'Mark checked', run: ack(issue, 'checked') },
        ];
    }
  };

  const runAction = async (issue, action) => {
    if (busy) return;
    setBusy(true);
    try {
      const reverse = await action.run();
      setFlash(`${issue.number}: ${action.label}`);
      setUndo({ run: reverse, label: `${issue.number}: ${action.label}` });
    } catch (err) {
      setFlash(`Could not do that: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  // ── CSV / print ─────────────────────────────────────────────────────────
  const csvRows = () => {
    const cps = order.map(c => c.short);
    switch (sel) {
      case 'missing': return [['Bib', 'Status', 'Last seen', 'Last time', 'Expected at', 'Expected time', 'Late (min)', 'Next CP reported up to'],
        ...lateRows.map(o => [o.number, o.status === 'overdue' ? 'Overdue' : 'Awaiting report', o.lastCp.short, hhmm(o.lastTime), o.nextCp.short, hhmm(o.expectedAt), o.overdueMinutes, hhmm(o.upTo)])];
      case 'oncourse': return [['Group', 'Count', 'Bibs'], ...onCourse.map(g => [g.label, g.numbers.length, g.numbers.join(' ')])];
      case 'results': return [['Bib', 'Status', ...cps], ...matrix.map(r => [r.number, r.status, ...r.cells.map(c => c.text)])];
      case 'calls': return [['Checkpoint', 'Calls', 'Numbers', 'Last call', 'Up to'], ...calls.map(c => [c.short, c.calls, c.numbers, hhmm(c.lastCall), hhmm(c.upTo)])];
      default: return [];
    }
  };
  const downloadCsv = () => {
    const name = (currentRace?.name || 'race').replace(/\s+/g, '-');
    downloadReport?.({ content: toCsv(csvRows()), filename: `${name}-${report.title.replace(/\s+/g, '-').toLowerCase()}.csv`, mimeType: 'text/csv' });
  };

  const navBtn = (on) => `w-full min-h-[44px] px-3 flex items-center gap-2 text-sm text-left ${on
    ? 'bg-vk-band text-vk-navy font-bold shadow-[inset_3px_0_0_#D4AF37] dark:bg-gray-700 dark:text-white'
    : 'bg-white text-vk-ink font-semibold dark:bg-gray-800 dark:text-gray-100'}`;

  return (
    <div className="max-w-[1280px] w-full mx-auto p-3 flex flex-wrap gap-3 items-start" data-screenshot-target>
      <nav aria-label="Reports" className="flex-[1_1_250px] min-w-0 bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card overflow-hidden no-print">
        <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-bold tracking-[1px] uppercase text-vk-blue">Reports</div>
        {REPORTS.map(r => (
          <button key={r.id} type="button" onClick={() => pick(r.id)} aria-current={sel === r.id ? 'page' : undefined} className={navBtn(sel === r.id)}>
            <span className="flex-1">{r.title}</span>
            <span className="text-xs font-bold text-vk-muted">{commonCounts[r.id]}</span>
          </button>
        ))}
        <div className="px-3 pt-3 pb-1.5 flex items-center gap-2 border-t border-vk-border dark:border-gray-700">
          <span className="flex-1 text-[11px] font-bold tracking-[1px] uppercase text-vk-red">Needs attention</span>
          <span className="text-xs font-extrabold bg-vk-gold text-vk-ink rounded-full px-2 py-px" data-testid="issue-total">{issueTotal}</span>
        </div>
        {CHECKS.map(c => {
          const n = issues[c.id].length;
          return (
            <button key={c.id} type="button" onClick={() => pick(c.id)} aria-current={sel === c.id ? 'page' : undefined} className={navBtn(sel === c.id)}>
              <span className="flex-1">{c.title}</span>
              <span data-testid={`check-count-${c.id}`}
                className={`min-w-[22px] text-center text-xs font-extrabold rounded-full px-[7px] py-px ${n ? 'bg-vk-red-tint text-vk-red border border-vk-red' : 'bg-vk-band text-vk-navy'}`}>
                {n || '✓'}
              </span>
            </button>
          );
        })}
      </nav>

      <section aria-labelledby="rephd" className="flex-[999_1_520px] min-w-0 bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card overflow-hidden flex flex-col">
        <div className="px-3.5 py-3 border-b border-vk-border dark:border-gray-700 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex-1 min-w-[200px] flex flex-col gap-0.5">
            <h1 id="rephd" className="font-display font-bold text-lg text-vk-navy dark:text-white">{(report ?? check).title}</h1>
            <div className="text-[13px] text-vk-muted">{(report ?? check).desc}</div>
          </div>
          {report && report.id !== 'exports' && (
            <div className="flex gap-1.5 no-print">
              <button type="button" onClick={downloadCsv}
                className="min-h-[40px] px-3 rounded-btn border-2 border-vk-blue text-vk-blue font-display font-extrabold text-xs tracking-[0.6px] uppercase">CSV</button>
              <button type="button" onClick={() => window.print()}
                className="min-h-[40px] px-3 rounded-btn bg-vk-blue text-white font-display font-extrabold text-xs tracking-[0.6px] uppercase">Print</button>
            </div>
          )}
        </div>

        {sel === 'missing' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[480px]">
              <thead><tr className="bg-vk-band dark:bg-gray-700 text-left"><Th first>Bib</Th><Th>Last seen</Th><Th>Expected at</Th><Th right>Overdue</Th></tr></thead>
              <tbody>
                {overdue.map(o => (
                  <tr key={o.number} className="border-b border-vk-border dark:border-gray-700">
                    <td className="pl-3.5 pr-2 py-2.5 font-display font-extrabold text-base tabular-nums">{o.number}</td>
                    <td className="px-2 py-2.5">{o.lastCp.short} {hhmm(o.lastTime)}</td>
                    <td className="px-2 py-2.5">{o.nextCp.short} · {hhmm(o.expectedAt)}</td>
                    <td className="pr-3.5 pl-2 py-2.5 text-right">
                      <span className={`font-extrabold rounded-chip px-2 py-0.5 ${o.overdueMinutes >= 60 ? 'bg-vk-red text-white' : 'bg-vk-gold-tint border border-vk-gold text-vk-ink'}`}>{o.overdueMinutes} min</span>
                    </td>
                  </tr>
                ))}
                {!overdue.length && <tr><td colSpan={4} className="px-3.5 py-4 text-vk-muted">No runners overdue.</td></tr>}
              </tbody>
            </table>
            {awaiting.length > 0 && (
              <div className="px-3.5 py-3 border-t border-vk-border dark:border-gray-700 flex flex-col gap-2" data-testid="awaiting-group">
                <h2 className="font-display font-bold text-[15px] text-vk-navy dark:text-white">Awaiting report</h2>
                <p className="text-[13px] text-vk-muted">Past their expected time, but the next checkpoint hasn't reported that far yet — not overdue.</p>
                {awaiting.map(g => (
                  <div key={g.cp.number} className="bg-vk-gold-tint border border-vk-gold rounded-btn px-3 py-2 text-sm">
                    <strong>{g.cp.short}</strong> · {g.upTo ? `reported up to ${hhmm(g.upTo)}` : 'no calls yet'} · {g.numbers.length} expected: {g.numbers.join(', ')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sel === 'oncourse' && (
          <div className="p-3.5 flex flex-col gap-3">
            <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
              {onCourse.map(g => (
                <div key={g.label} className="bg-vk-paper dark:bg-gray-900 border border-vk-border dark:border-gray-700 rounded-btn px-3 py-2.5 flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-vk-muted">{g.label}</span>
                  <span className="font-display font-extrabold text-[26px] text-vk-navy dark:text-white tabular-nums">{g.numbers.length}</span>
                  {g.numbers.length > 0 && g.numbers.length <= 40 && <span className="text-[11px] text-vk-muted break-words">{g.numbers.join(', ')}</span>}
                </div>
              ))}
            </div>
            <div className="text-[13px] leading-relaxed text-vk-muted">Not finished and not marked DNF or DNS, grouped by the last checkpoint they passed. Use before standing a checkpoint down after the sweep has passed.</div>
          </div>
        )}

        {sel === 'results' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[560px] tabular-nums">
              <thead><tr className="bg-vk-band dark:bg-gray-700 text-left"><Th first>Bib</Th><Th>Status</Th>{order.map(c => <Th key={c.number}>{c.short}</Th>)}</tr></thead>
              <tbody>
                {matrix.map(r => (
                  <tr key={r.number} className="border-b border-vk-border dark:border-gray-700">
                    <td className="pl-3.5 pr-2 py-2 font-display font-extrabold text-base">{r.number}</td>
                    <td className={`px-2 py-2 font-bold ${r.status.startsWith('DNF') ? 'text-vk-red' : 'text-vk-muted'}`}>{r.status}</td>
                    {r.cells.map((c, i) => (
                      <td key={i} className={`px-2 py-2 ${i === r.cells.length - 1 ? 'font-bold' : ''} ${c.text === 'DNF' ? 'text-vk-red font-bold' : ''}`}>
                        {c.flag
                          ? <span className="border-2 border-vk-gold rounded-chip px-1" title="Recorded after DNS/DNF">{c.text}</span>
                          : c.text}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sel === 'calls' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[520px]">
              <thead><tr className="bg-vk-band dark:bg-gray-700 text-left"><Th first>Checkpoint</Th><Th>Calls</Th><Th>Numbers</Th><Th>Last call</Th><Th>Up to</Th></tr></thead>
              <tbody>
                {calls.map(c => (
                  <tr key={c.number} className="border-b border-vk-border dark:border-gray-700">
                    <td className="pl-3.5 pr-2 py-2.5 font-bold">{c.short}</td>
                    <td className="px-2 py-2.5">{c.calls}</td>
                    <td className="px-2 py-2.5">{c.numbers}</td>
                    <td className="px-2 py-2.5">{hhmm(c.lastCall) || '—'}</td>
                    <td className="px-2 py-2.5">{hhmm(c.upTo) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sel === 'exports' && (
          <div className="p-3.5">
            <ReportsPanel />
          </div>
        )}

        {check && (
          <div className="flex flex-col">
            {issues[check.id].map(issue => (
              <div key={issue.key} className="px-3.5 py-3 border-b border-vk-border dark:border-gray-700 flex flex-wrap items-center gap-x-3.5 gap-y-2" data-testid="issue-row">
                <span className="w-[52px] font-display font-extrabold text-xl text-vk-navy dark:text-white tabular-nums">{issue.number}</span>
                <div className="flex-1 min-w-[200px] flex flex-col gap-0.5">
                  <span className="font-bold text-sm">{issue.head}</span>
                  <span className="text-[13px] text-vk-muted">{issue.detail}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {actionsFor(issue).map(a => (
                    <button key={a.label} type="button" disabled={busy} onClick={() => runAction(issue, a)}
                      className={`min-h-[40px] px-3 rounded-btn font-bold text-[13px] ${a.primary ? 'bg-vk-blue text-white' : 'bg-white text-vk-ink border border-vk-muted dark:bg-gray-800 dark:text-gray-100'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!issues[check.id].length && (
              <div className="px-3.5 py-7 flex flex-col items-center gap-2 text-center">
                <span className="w-11 h-11 rounded-full bg-vk-navy flex items-center justify-center">
                  <CheckIcon className="w-[22px] h-[22px] text-vk-gold stroke-[3]" aria-hidden="true" />
                </span>
                <span className="font-bold">All sorted</span>
                <span className="text-[13px] text-vk-muted">Nothing left in this check.</span>
              </div>
            )}
          </div>
        )}

        <div className="px-3.5 py-2 flex items-center gap-2 min-h-[36px] bg-vk-paper dark:bg-gray-900 no-print">
          <span className="flex-1 text-xs font-semibold text-vk-blue" aria-live="polite" data-testid="reports-flash">{flash}</span>
          {undo && (
            <button type="button" onClick={async () => { const u = undo; setUndo(null); await u.run(); setFlash('Undone'); }}
              className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">Undo {undo.label}</button>
          )}
        </div>
      </section>
    </div>
  );
};

export default BaseReports;
