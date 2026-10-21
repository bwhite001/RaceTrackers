import React, { useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import useCheckpointStore from '../../modules/checkpoint-operations/store/checkpointStore';
import { computeStats, runnerTime } from '../../modules/checkpoint-operations/services/checkpointStats';
import TimeUtils from '../../services/timeUtils.js';
import { hhmm, clampTime, sameMinute, toBlock } from '../../services/blocks.js';
import { checkpointRunnerState, RUNNER_STATE, stateClasses, numberClasses } from '../../design-system/statusStyles';
import { StatTile, TimeStepper, UndoBar, useUndo } from '../../design-system/components/VK';
import useCheckpointContext from './useCheckpointContext';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'passed', label: 'Passed' },
  { id: 'none', label: 'To come' },
  { id: 'out', label: 'DNS / DNF' },
];

const CHIP = {
  [RUNNER_STATE.CALLED]: 'Called in',
  [RUNNER_STATE.PASSED]: 'Passed',
  [RUNNER_STATE.DNS]: 'DNS',
  [RUNNER_STATE.DNF]: 'DNF',
  [RUNNER_STATE.NONE]: 'To come',
  [RUNNER_STATE.RESTORABLE]: 'To come',
};

const matches = (filter, state) => {
  if (filter === 'passed') return state === RUNNER_STATE.PASSED || state === RUNNER_STATE.CALLED;
  if (filter === 'none') return state === RUNNER_STATE.NONE || state === RUNNER_STATE.RESTORABLE;
  if (filter === 'out') return state === RUNNER_STATE.DNS || state === RUNNER_STATE.DNF;
  return true;
};

const actionClass = {
  gold: 'bg-vk-gold text-vk-ink',
  blue: 'bg-transparent text-vk-blue border-2 border-vk-blue',
  red: 'bg-vk-red text-white',
  plain: 'bg-white text-vk-ink border border-vk-muted dark:bg-gray-800 dark:text-gray-100',
};

/** Stat tiles for the Overview body. Header progress lives in CheckpointView. */
export const OverviewStats = ({ stats }) => (
  <div className="grid grid-cols-4 gap-2">
    <StatTile value={stats.passed} label="Passed" valueClassName="text-vk-blue !text-xl" />
    <StatTile value={stats.toCome} label="To come" valueClassName="!text-xl" />
    <StatTile value={stats.dns} label="DNS" valueClassName="text-vk-muted !text-xl" />
    <StatTile value={stats.dnf} label="DNF" valueClassName="text-vk-red !text-xl" />
  </div>
);

/**
 * Checkpoint — Overview (spec §4.8). Tap a runner to expand it and fix
 * anything: time, call-in, reset, DNS / DNF. Every action has Undo.
 */
const CheckpointOverview = () => {
  const store = useCheckpointStore();
  const { runners = [], snapshot, restoreSnapshot } = store;
  const ctx = useCheckpointContext();
  const undo = useUndo();
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const [draft, setDraft] = useState(null); // stepper value for the open row; saved only on Save
  const toggle = (number) => { setOpen(open === number ? null : number); setDraft(null); };

  const stats = useMemo(() => computeStats(runners), [runners]);
  const rows = useMemo(
    () => [...runners].sort((a, b) => a.number - b.number)
      .map(r => ({ r, state: checkpointRunnerState(r) }))
      .filter(({ state }) => matches(filter, state)),
    [runners, filter],
  );

  const act = async (number, text, change) => {
    const snap = await snapshot([number]);
    await change();
    undo.offer(text, () => restoreSnapshot(snap));
  };

  const nowIso = () => TimeUtils.getCurrentTimestamp();

  return (
    <div className="px-4 pt-3.5 pb-28 flex flex-col gap-3">
      <OverviewStats stats={stats} />

      <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter runners">
        {FILTERS.map(f => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
            className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-[13px] font-bold ${filter === f.id
              ? 'bg-vk-navy text-white'
              : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card overflow-hidden">
        <div className="px-3.5 py-2 text-xs font-semibold text-vk-muted dark:text-gray-400 border-b border-vk-border dark:border-gray-700">Tap a runner to fix it</div>
        {rows.length === 0 && <div className="p-4 text-sm text-vk-muted">No runners in this list.</div>}
        {rows.map(({ r, state }) => {
          const isOpen = open === r.number;
          const t = runnerTime(r);
          const hasTime = state === RUNNER_STATE.PASSED || state === RUNNER_STATE.CALLED;
          const flag = state === RUNNER_STATE.PASSED ? (r.correction ? 'Correction' : 'Not called') : '';
          const now = nowIso();
          const pending = isOpen && draft && !sameMinute(draft, t) ? draft : null;
          const actions = [];
          let note = '';
          if (state === RUNNER_STATE.CALLED) {
            actions.push(['blue', 'Undo call-in', `${r.number} back on callout sheet`, () => store.setCalledIn([r.number], false)]);
            actions.push(['plain', 'Reset — not passed', `${r.number} reset — not passed`, () => store.unmarkRunner(r.number)]);
            actions.push(['red', 'Mark DNF', `${r.number} marked DNF`, () => store.setOut(r.number, 'dnf')]);
            note = pending && toBlock(pending) === toBlock(t)
              ? `Same common time (${hhmm(toBlock(t))}) — base doesn't need a correction.`
              : `Base already has ${hhmm(t)}. Changing the time sends a correction.`;
          } else if (state === RUNNER_STATE.PASSED) {
            actions.push(['blue', 'Mark called in', `${r.number} marked called in`, () => store.setCalledIn([r.number], true)]);
            actions.push(['plain', 'Reset — not passed', `${r.number} reset — not passed`, () => store.unmarkRunner(r.number)]);
            actions.push(['red', 'Mark DNF', `${r.number} marked DNF`, () => store.setOut(r.number, 'dnf')]);
          } else if (state === RUNNER_STATE.NONE || state === RUNNER_STATE.RESTORABLE) {
            actions.push(['gold', `Passed now (${hhmm(now)})`, `${r.number} marked at ${hhmm(now)}`, () => store.markPassed([r.number], nowIso())]);
            actions.push(['plain', 'Mark DNS', `${r.number} marked DNS`, () => store.setOut(r.number, 'non-starter')]);
            actions.push(['red', 'Mark DNF', `${r.number} marked DNF`, () => store.setOut(r.number, 'dnf')]);
          } else {
            const name = state === RUNNER_STATE.DNS ? 'DNS' : 'DNF';
            actions.push(['blue', `Clear ${name}`, `${r.number} ${name} cleared`, () => store.clearOut(r.number)]);
            actions.push(['plain', `Passed now (${hhmm(now)})`, `${r.number} marked at ${hhmm(now)}`, () => store.markPassed([r.number], nowIso())]);
            note = 'Base keeps race-wide DNF / DNS. Tell base if you clear a status they already have.';
          }

          return (
            <div key={r.number} className={`border-b border-vk-border dark:border-gray-700 last:border-b-0 ${isOpen ? 'bg-vk-band dark:bg-gray-700' : ''}`}>
              <button type="button" aria-expanded={isOpen} onClick={() => toggle(r.number)}
                className="w-full min-h-[52px] px-3.5 flex items-center gap-2.5 text-left">
                <span className={`w-11 font-display font-extrabold text-lg tabular-nums ${numberClasses(state)} ${state === RUNNER_STATE.DNS ? 'text-vk-muted' : state === RUNNER_STATE.DNF ? 'text-vk-red' : ''}`}>{r.number}</span>
                <span className={`rounded-chip px-2 py-0.5 text-xs font-bold ${stateClasses(state === RUNNER_STATE.RESTORABLE ? RUNNER_STATE.NONE : state)} !shadow-none ${state === RUNNER_STATE.DNF ? '!border' : ''}`}>{CHIP[state]}</span>
                {flag && <span className="text-xs font-semibold border border-vk-gold rounded-chip px-1.5 py-0.5">{flag}</span>}
                <span className="ml-auto text-[13px] text-vk-muted tabular-nums">{hasTime ? hhmm(t) : ''}</span>
                {isOpen
                  ? <ChevronUpIcon className="w-4 h-4 text-vk-muted" aria-hidden="true" />
                  : <ChevronDownIcon className="w-4 h-4 text-vk-muted" aria-hidden="true" />}
              </button>
              {isOpen && (
                <div className="px-3.5 pt-1 pb-3.5 flex flex-col gap-2.5">
                  {hasTime && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px] w-11">Time</span>
                      <TimeStepper
                        size="md"
                        className="flex-1"
                        value={pending ?? t}
                        min={ctx.earliest}
                        max={now}
                        onChange={setDraft}
                      />
                    </div>
                  )}
                  {pending && (
                    <button type="button"
                      onClick={async () => {
                        setDraft(null);
                        await act(r.number, `${r.number} time ${hhmm(t)} → ${hhmm(pending)}`,
                          () => store.editTime(r.number, clampTime(pending, ctx.earliest, nowIso())));
                      }}
                      className={`min-h-[44px] rounded-btn px-2 text-[13px] font-bold ${actionClass.gold}`}>
                      Save {hhmm(pending)}
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {actions.map(([kind, label, text, run]) => (
                      <button key={label} type="button" onClick={() => act(r.number, text, run)}
                        className={`min-h-[44px] rounded-btn px-2 text-[13px] font-bold ${actionClass[kind]}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {note && <div className="text-xs leading-normal text-vk-muted">{note}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <UndoBar {...undo.bar} className="fixed left-4 right-4 bottom-[84px] z-40 max-w-xl mx-auto" />
    </div>
  );
};

export default CheckpointOverview;
