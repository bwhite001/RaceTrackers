import React, { lazy, Suspense, useMemo, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { boardCheckpoints, sightingsByCheckpoint, outStatusMap, reportedUpTo } from '../services/receive';
import { overdueRunners, currentLeaders, awaitingByCheckpoint, raceCounts, OVERDUE_GRACE_MINUTES } from '../services/reports';
import { runChecks, checkpointDistances, openIssueNumbers, PACE_LIMIT_KMH } from '../services/dataChecks';
import { outRecords } from '../services/statusValidation';
import { hhmm } from '../../../services/blocks.js';
import TimeUtils from '../../../services/timeUtils.js';
import { BASE_STATION_CP } from '../../../types/index.js';
import useNow from '../../../shared/hooks/useNow';
import HeadsUpGrid from './HeadsUpGrid';
import CheckpointImportPanel from './CheckpointImportPanel';
import { getRunnerTotal } from '../../../utils/raceStatistics';

const RaceCourseMap = lazy(() => import('./RaceCourseMap'));
const LEADERS_SHOWN = 5;

const Tile = ({ label, value, sub, className = '', testId }) => (
  <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card px-5 py-[18px] flex flex-col gap-1" data-testid={testId}>
    <div className="text-[13px] font-semibold text-vk-muted">{label}</div>
    <div className={`font-display font-extrabold text-[34px] tabular-nums ${className}`}>{value}</div>
    {sub && <div className="text-xs text-vk-muted">{sub}</div>}
  </div>
);

/**
 * Base — Overview (spec §4.10): overdue alert, stat tiles, checkpoint
 * progress, current leaders; then the course map, heads-up grid and imports.
 */
const BaseOverview = ({ raceRunners = [], mapCheckpoints = [], groupedRunners = [], onViewOverdue }) => {
  const {
    currentRace, checkpoints = [], runners = [], outList = [], raceRunnerNumbers = [], baseRows = [], resolutions = [], radioCalls = [],
  } = useBaseOperationsStore();
  const now = useNow(30000);
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [showNames, setShowNames] = useState(false);

  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5))
    : null;
  const order = useMemo(() => boardCheckpoints(checkpoints), [checkpoints]);
  const sightings = useMemo(() => sightingsByCheckpoint(runners), [runners]);
  const out = useMemo(() => outStatusMap(outList, runners), [outList, runners]);
  const meta = useMemo(() => new Map(raceRunners.map(r => [r.number, r])), [raceRunners]);
  const upTo = useMemo(() => reportedUpTo(runners), [runners]);
  const lateRows = useMemo(() => overdueRunners({
    sightings, order, out, now, upTo, graceMinutes: currentRace?.overdueGraceMinutes ?? OVERDUE_GRACE_MINUTES,
  }), [sightings, order, out, now, upTo, currentRace?.overdueGraceMinutes]);
  const overdue = lateRows.filter(r => r.status === 'overdue');
  const awaiting = awaitingByCheckpoint(lateRows);
  const leaders = useMemo(() => currentLeaders({ sightings, order, out, raceStart, meta }), [sightings, order, out, raceStart, meta]);
  // Same checks as Reports › Needs attention; a leader with an open one may be in the wrong place
  const flagged = useMemo(() => openIssueNumbers(runChecks({
    baseRows, order, sightings, outByNumber: new Map(outRecords(outList).map(r => [r.number, r])), radioCalls,
    distances: checkpointDistances(checkpoints, currentRace), limitKmh: currentRace?.paceLimitKmh ?? PACE_LIMIT_KMH,
  }, new Set(resolutions.map(r => r.issueKey)))), [baseRows, order, sightings, outList, radioCalls, checkpoints, currentRace, resolutions]);
  const field = raceRunnerNumbers.length || getRunnerTotal(currentRace);
  const activeField = Math.max(0, field - out.size);
  // One definition shared with Reports (D2): on course = in the race, not finished
  const tiles = useMemo(() => raceCounts({ sightings, out, raceNumbers: raceRunnerNumbers }), [sightings, out, raceRunnerNumbers]);
  const waves = [...new Set(raceRunners.map(r => r.batchNumber).filter(Boolean))].sort((a, b) => a - b);

  const filtered = leaders.filter(l => filter === 'all'
    || (filter === 'F' && l.gender === 'F') || (filter === 'M' && l.gender === 'M')
    || (filter.startsWith('w') && String(l.wave) === filter.slice(1)));
  const shown = showAll ? filtered : filtered.slice(0, LEADERS_SHOWN);

  const overdueAt = [...new Set(overdue.map(o => o.nextCp.short))];
  const filters = [['all', 'All'], ['F', 'Female'], ['M', 'Male'], ...(waves.length > 1 ? waves.map(w => [`w${w}`, `Wave ${w}`]) : [])];

  return (
    <div className="max-w-[1280px] w-full mx-auto p-3 sm:p-6 flex flex-col gap-6" data-screenshot-target>
      {overdue.length > 0 && (
        <section role="alert" className="bg-vk-red-tint border-2 border-vk-red rounded-card px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <ExclamationTriangleIcon className="w-7 h-7 text-vk-red" aria-hidden="true" />
          <div className="flex-1 min-w-[260px] flex flex-col gap-1">
            <div className="font-display font-bold text-[17px] text-vk-navy dark:text-white">
              {overdue.length} runner{overdue.length === 1 ? '' : 's'} overdue{overdueAt.length === 1 ? ` at ${overdueAt[0]}` : ''}
            </div>
            <div className="text-sm">
              Not reported although the checkpoint has reported past their expected time. {overdue.slice(0, 4).map(o => o.number).join(', ')}
              {overdue.length > 4 ? ` +${overdue.length - 4}` : ''}
            </div>
          </div>
          {onViewOverdue && (
            <button type="button" onClick={onViewOverdue}
              className="font-display font-extrabold text-sm tracking-[0.6px] uppercase bg-vk-red text-white rounded-btn px-[18px] min-h-[48px]">
              View runners
            </button>
          )}
        </section>
      )}

      {awaiting.length > 0 && (
        <section className="bg-vk-gold-tint border border-vk-gold rounded-card px-5 py-3 flex flex-col gap-1" data-testid="awaiting-report">
          {awaiting.map(g => (
            <div key={g.cp.number} className="text-sm">
              <strong>{g.cp.short} {g.upTo ? `hasn't reported past ${hhmm(g.upTo)}` : "hasn't reported yet"}</strong>
              {' · '}{g.numbers.length} expected
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]" data-testid="stats-grid">
        <Tile label="On course" value={tiles.onCourse} className="text-vk-blue" testId="tile-on-course"
          sub={tiles.notSeen ? `${tiles.notSeen} not seen yet` : null} />
        <Tile label="Finished" value={tiles.finished} className="text-vk-navy dark:text-white" />
        <Tile label="Non-starters (DNS)" value={tiles.dns} className="text-vk-muted" />
        <Tile label="Did not finish (DNF)" value={tiles.dnf} className="text-vk-red" />
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section aria-labelledby="cphd" className="flex-[1_1_360px] min-w-0 bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card px-6 py-[22px] flex flex-col gap-[18px]">
          <h2 id="cphd" className="font-display font-bold text-lg text-vk-navy dark:text-white">Checkpoint progress</h2>
          {order.map(cp => {
            const count = sightings.get(cp.number)?.size ?? 0;
            const pct = field ? Math.round((count / field) * 100) : 0;
            const finish = cp.number === BASE_STATION_CP;
            const closed = !finish && activeField > 0 && count >= activeField;
            return (
              <div key={cp.number} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{cp.short}</span>
                  <span><strong>{count}</strong> <span className="text-vk-muted">· {pct}%</span></span>
                </div>
                <div className="h-3 rounded-full bg-vk-band dark:bg-gray-700 overflow-hidden" role="img" aria-label={`${cp.short}: ${count} of ${field}`}>
                  <div className={`h-full ${finish ? 'bg-vk-gold' : closed ? 'bg-vk-navy' : 'bg-vk-blue'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="text-xs text-vk-muted">Navy: checkpoint closed out · Blue: runners still arriving · Gold: finish</div>
        </section>

        <section aria-labelledby="lbhd" className="flex-[999_1_560px] min-w-0 bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card flex flex-col overflow-hidden">
          <div className="px-6 pt-5 pb-3.5 flex flex-wrap items-center gap-3">
            <h2 id="lbhd" className="font-display font-bold text-lg text-vk-navy dark:text-white flex-1">Current leaders</h2>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Leader filter">
              {filters.map(([id, text]) => (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
                  className={`min-h-[36px] px-3 rounded-full text-[13px] font-bold ${filter === id ? 'bg-vk-navy text-white' : 'bg-white border border-vk-border text-vk-ink dark:bg-gray-800 dark:text-gray-100'}`}>
                  {text}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[560px]">
              <thead>
                <tr className="bg-vk-band dark:bg-gray-700 text-left">
                  {['Rank', 'Bib', 'Name', 'Wave', 'Elapsed', 'Last seen'].map((h, i) => (
                    <th key={h} scope="col" className={`py-2.5 text-xs font-bold text-vk-muted uppercase tracking-[0.8px] ${i === 0 ? 'px-6' : 'px-3'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(l => (
                  <tr key={l.number} className="border-b border-vk-border dark:border-gray-700">
                    <td className="px-6 py-3">
                      <span className={`inline-flex w-[30px] h-[30px] rounded-full items-center justify-center font-extrabold ${l.rank === 1 ? 'bg-vk-gold text-vk-ink' : 'bg-vk-band text-vk-ink'}`}>{l.rank}</span>
                    </td>
                    <td className="px-3 py-3 font-display font-extrabold text-base tabular-nums whitespace-nowrap">
                      {l.number}
                      {flagged.has(l.number) && (
                        <span role="img" aria-label="Open data issue" title="Open data issue — see Reports › Needs attention" className="inline-flex ml-1 align-[-2px]">
                          <ExclamationTriangleIcon className="w-4 h-4 text-vk-gold" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">{l.name || '—'}{l.gender && <span className="text-vk-muted"> · {l.gender}</span>}</td>
                    <td className="px-3 py-3">{l.wave ?? '—'}</td>
                    <td className="px-3 py-3 tabular-nums font-semibold">{l.elapsed || '—'}</td>
                    <td className="px-3 py-3"><span className="bg-vk-band dark:bg-gray-700 rounded-chip px-2 py-0.5 text-xs font-bold">{l.lastCp.short}</span></td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr><td colSpan={6} className="px-6 py-4 text-vk-muted">No runners recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3.5 border-t border-vk-border dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
            <span className="text-[13px] text-vk-muted">Elapsed from race start · updates as calls are logged</span>
            {filtered.length > LEADERS_SHOWN && (
              <button type="button" onClick={() => setShowAll(v => !v)} className="text-sm font-semibold text-vk-blue">
                {showAll ? 'Show top 5' : `Show all ${filtered.length} runners`}
              </button>
            )}
          </div>
        </section>
      </div>

      <Suspense fallback={null}>
        <RaceCourseMap courseGpx={currentRace?.courseGpx ?? null} checkpoints={mapCheckpoints} runners={runners} total={field} />
      </Suspense>
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowNames(v => !v)} aria-pressed={showNames}
          className={`text-xs px-3 min-h-[36px] rounded-btn border ${showNames ? 'bg-vk-navy text-white border-vk-navy' : 'bg-white text-vk-ink border-vk-border dark:bg-gray-800 dark:text-gray-100'}`}>
          {showNames ? 'Hide Names' : 'Show Names'}
        </button>
      </div>
      <HeadsUpGrid runners={groupedRunners} checkpoints={mapCheckpoints} showNames={showNames} />
      <CheckpointImportPanel />
    </div>
  );
};

export default BaseOverview;
