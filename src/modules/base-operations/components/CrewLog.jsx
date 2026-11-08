import React, { useMemo, useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import {
  activeVehicles, vehicleState, crewCheckpoints, cardPill, crewSummary, summaryText, timesText, peopleText,
  normaliseRego, vehicleProblem, vehicleRecord, stepTime, knownPeople, crewReportRows,
} from '../services/crews';
import { toCsv } from '../services/reports';
import TimeUtils from '../../../services/timeUtils.js';
import { hhmm } from '../../../services/blocks.js';
import { LOCKED } from '../../../design-system/statusStyles';
import { BottomSheet } from '../../../design-system/components/VK';
import useNow from '../../../shared/hooks/useNow';

const btn = 'min-h-[48px] rounded-btn font-display font-extrabold text-xs tracking-[0.6px] uppercase';
const pillBtn = (on) => `min-h-[44px] px-3 rounded-full font-bold text-[13px] ${on
  ? 'bg-vk-navy text-white border-2 border-vk-navy'
  : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`;
const PILL = {
  none: 'bg-white text-vk-muted border border-dashed border-vk-muted',
  way: 'bg-vk-gold text-vk-ink border border-vk-gold',
  site: 'bg-vk-navy text-white border border-vk-navy',
  notleft: 'bg-vk-band text-vk-navy border border-vk-border',
};

const newDraft = (checkpointNumber) => ({
  id: null, checkpointNumber, rego: '', driver: '', occupants: [], extra: '',
  leftHomeAt: null, arrivedAt: null, leftSiteAt: null, homeSafeAt: null, notes: '', showReturn: false,
});
const editDraft = (v) => ({ ...v, occupants: [...(v.occupants ?? [])], extra: '', showReturn: !!(v.leftSiteAt || v.homeSafeAt) });

/** Save / arrive / remove with one Undo for the last change, shared by the tab and the Receive sheet. */
function useCrewActions() {
  const { saveVehicle, removeVehicle, undoCrewChange } = useBaseOperationsStore();
  const [flash, setFlash] = useState('');
  const [undo, setUndo] = useState(null); // { change, label }
  const [busy, setBusy] = useState(false);
  const run = async (fn, label) => {
    if (busy) return false;
    setBusy(true);
    try {
      const change = await fn();
      setUndo({ change, label });
      setFlash(label);
      return true;
    } catch (err) {
      setFlash(`Could not save: ${err.message}`);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return {
    flash, undo, busy,
    save: (draft, cpShort) => run(() => saveVehicle(vehicleRecord(draft), draft.id), `${draft.rego.trim()} ${draft.id ? 'updated' : `added to ${cpShort}`}`),
    arrive: (v, cpShort, now) => run(() => saveVehicle(vehicleRecord({ ...v, arrivedAt: now }), v.id), `${v.rego} arrived at ${cpShort} ${hhmm(now)}`),
    remove: (v) => run(() => removeVehicle(v.id), `${v.rego} removed`),
    doUndo: async () => {
      const u = undo;
      if (!u) return;
      setUndo(null);
      await undoCrewChange(u.change);
      setFlash(`Undone: ${u.label}`);
    },
  };
}

const StatusLine = ({ actions }) => (
  <div className="flex items-center gap-2 min-h-[32px]">
    <span className="flex-1 text-[13px] font-semibold text-vk-blue" aria-live="polite" data-testid="crew-flash">{actions.flash}</span>
    {actions.undo && (
      <button type="button" onClick={actions.doUndo} className="min-h-[32px] px-3 rounded-lg bg-vk-ink text-white font-bold text-xs">
        Undo {actions.undo.label}
      </button>
    )}
  </div>
);

/** One checkpoint: a row per vehicle, Arrived now on the ones on the way, + Vehicle. */
const CrewCard = ({ cp, vehicles, editing, selectedId, onOpen, onArrive, onAdd }) => {
  const pill = cardPill(vehicles);
  return (
    <div data-testid={`crew-card-${cp.short}`}
      className={`bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-2.5 flex flex-col gap-2 ${editing ? 'shadow-[inset_0_0_0_2px_#D4AF37]' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="font-display font-extrabold text-[17px] text-vk-navy dark:text-white">{cp.short}</span>
        <span className="flex-1 min-w-0 text-xs text-vk-muted truncate">{cp.name}</span>
        <span className={`text-[11px] font-extrabold rounded-full px-2 py-0.5 whitespace-nowrap ${PILL[pill.kind]}`} data-testid="crew-pill">{pill.text}</span>
      </div>
      {vehicles.map(v => {
        const onWay = vehicleState(v) === 'on-the-way';
        const times = timesText(v);
        return (
          <div key={v.id} data-testid="crew-vehicle"
            className={`flex items-center gap-1.5 rounded-btn pr-1.5 ${onWay ? 'border-2 border-vk-gold bg-vk-gold-tint' : 'border border-vk-border bg-vk-paper dark:bg-gray-900 dark:border-gray-700'} ${selectedId === v.id ? 'outline outline-[3px] outline-offset-1 outline-vk-navy' : ''}`}>
            <button type="button" onClick={() => onOpen(v)} aria-label={`Edit ${v.rego}, ${times}`}
              className="flex-1 min-w-0 min-h-[52px] flex flex-col items-start gap-0.5 px-2 py-1.5 text-left">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-display font-extrabold text-base tracking-[0.5px]">{v.rego}</span>
                <span className="text-xs font-semibold text-vk-muted truncate">{peopleText(v)}</span>
              </span>
              <span className={`text-xs font-semibold ${onWay ? 'text-vk-ink dark:text-white' : 'text-vk-muted'}`}>{times}</span>
            </button>
            {onWay && (
              <button type="button" onClick={() => onArrive(v)} aria-label={`${v.rego} arrived now`}
                className="shrink-0 min-h-[44px] px-2.5 rounded-btn bg-vk-blue text-white font-display font-extrabold text-[11px] tracking-[0.6px] uppercase">
                Arrived now
              </button>
            )}
          </div>
        );
      })}
      <button type="button" onClick={onAdd}
        className="self-start min-h-[44px] px-3 rounded-btn border border-dashed border-vk-blue bg-white text-vk-blue font-bold text-[13px] dark:bg-gray-800">
        + Vehicle to {cp.short}
      </button>
    </div>
  );
};

const TimeField = ({ label, value, onChange, now }) => {
  const step = (m) => onChange(stepTime(value, m, now));
  const small = 'min-h-[44px] rounded-btn border border-vk-border bg-vk-paper font-display font-extrabold text-sm text-vk-ink dark:bg-gray-900 dark:text-white dark:border-gray-700';
  return (
    <div className="flex flex-col gap-1.5 border-t border-vk-border dark:border-gray-700 pt-2.5">
      <div className="flex items-baseline gap-2">
        <span className="flex-1 text-xs font-bold text-vk-muted">{label}</span>
        <span data-testid={`time-${label}`} className={value ? 'font-display font-extrabold text-[22px] text-vk-navy dark:text-white tabular-nums' : 'text-sm font-semibold text-vk-muted'}>
          {value ? hhmm(value) : 'Not set'}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        <button type="button" onClick={() => onChange(now)} aria-label={`${label} now`} className="min-h-[44px] rounded-btn bg-vk-blue text-white font-display font-extrabold text-xs uppercase">Now</button>
        <button type="button" onClick={() => step(-5)} aria-label={`${label} five minutes earlier`} className={small}>−5</button>
        <button type="button" onClick={() => step(-1)} aria-label={`${label} one minute earlier`} className={small}>−1</button>
        <button type="button" onClick={() => step(1)} aria-label={`${label} one minute later`} className={small}>+1</button>
        <button type="button" onClick={() => step(5)} aria-label={`${label} five minutes later`} className={small}>+5</button>
        <button type="button" onClick={() => onChange(null)} aria-label={`Clear ${label}`} className="min-h-[44px] rounded-btn border border-vk-muted bg-white text-xs font-bold text-vk-ink dark:bg-gray-800 dark:text-gray-100">Clear</button>
      </div>
    </div>
  );
};

/** Add / edit one vehicle. Save is the only gold button while it is open. */
const VehicleEditor = ({ draft, setDraft, cps, people, raceDate, now, busy, onSave, onCancel, onRemove }) => {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const set = (patch) => setDraft(d => ({ ...d, ...patch }));
  const problem = vehicleProblem(draft, now);
  const cp = cps.find(c => c.number === draft.checkpointNumber);
  // The app doesn't keep operator callsigns (dropped 3 Nov): offer anyone already in this race's crew log
  const names = [...new Set([...people, ...draft.occupants, ...(draft.driver ? [draft.driver] : [])])];
  const addPerson = () => {
    const x = draft.extra.trim().slice(0, 30);
    if (!x) return;
    if (!draft.driver) set({ driver: x, extra: '' });
    else set({ occupants: draft.occupants.includes(x) || x === draft.driver ? draft.occupants : [...draft.occupants, x], extra: '' });
  };
  const toggleOcc = (p) => set({ occupants: draft.occupants.includes(p) ? draft.occupants.filter(o => o !== p) : [...draft.occupants, p] });
  const dateText = raceDate ? TimeUtils.formatDate(TimeUtils.createRaceTimestamp(raceDate, '12:00'), 'EEE d MMM yyyy') : '';

  return (
    <div className="flex flex-col gap-3" data-testid="vehicle-editor">
      <h2 id="vehicle-hd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">
        {draft.id ? `Edit ${draft.rego || 'vehicle'}` : `New vehicle · ${cp?.short ?? ''}`}
      </h2>
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-bold text-vk-muted">Going to</div>
        <div className="flex flex-wrap gap-1.5">
          {cps.map(c => (
            <button key={c.number} type="button" aria-pressed={draft.checkpointNumber === c.number} onClick={() => set({ checkpointNumber: c.number })} className={pillBtn(draft.checkpointNumber === c.number)}>{c.short}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="crew-rego" className="text-xs font-bold text-vk-muted">Car rego</label>
        <input id="crew-rego" type="text" value={draft.rego} onChange={e => set({ rego: normaliseRego(e.target.value) })}
          placeholder="e.g. 123 ABC" autoCapitalize="characters" autoComplete="off"
          className="min-h-[52px] border-2 border-vk-blue rounded-btn px-3 font-display font-extrabold text-[22px] tracking-[1px] uppercase text-vk-ink bg-white dark:bg-gray-900 dark:text-white" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-bold text-vk-muted">Driver</div>
        <div className="flex flex-wrap gap-1.5">
          {names.map(p => (
            <button key={p} type="button" aria-pressed={draft.driver === p} onClick={() => set({ driver: p, occupants: draft.occupants.filter(o => o !== p) })} className={pillBtn(draft.driver === p)}>{p}</button>
          ))}
          {!names.length && <span className="text-[13px] text-vk-muted">Add the driver below.</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-bold text-vk-muted">Also in the car</div>
        <div className="flex flex-wrap gap-1.5">
          {names.filter(p => p !== draft.driver).map(p => (
            <button key={p} type="button" aria-pressed={draft.occupants.includes(p)} onClick={() => toggleOcc(p)} className={pillBtn(draft.occupants.includes(p))}>{p}</button>
          ))}
        </div>
        <form className="flex gap-1.5" onSubmit={e => { e.preventDefault(); addPerson(); }}>
          <label htmlFor="crew-person" className="sr-only">Add a person</label>
          <input id="crew-person" type="text" value={draft.extra} onChange={e => set({ extra: e.target.value.slice(0, 30) })} placeholder="Callsign or name" autoComplete="off"
            className="flex-1 min-w-0 min-h-[44px] border border-vk-muted rounded-btn px-2.5 text-sm text-vk-ink bg-white dark:bg-gray-900 dark:text-white" />
          <button type="submit" className="min-h-[44px] px-3 rounded-btn bg-vk-blue text-white font-display font-extrabold text-xs tracking-[0.6px] uppercase">Add</button>
        </form>
      </div>
      <TimeField label="Left home" value={draft.leftHomeAt} onChange={t => set({ leftHomeAt: t })} now={now} />
      <TimeField label="Arrived" value={draft.arrivedAt} onChange={t => set({ arrivedAt: t })} now={now} />
      <button type="button" onClick={() => set({ showReturn: !draft.showReturn })} aria-expanded={draft.showReturn}
        className="min-h-[44px] rounded-btn border border-vk-border bg-vk-paper px-3 text-left text-[13px] font-bold text-vk-navy dark:bg-gray-900 dark:text-white dark:border-gray-700">
        {draft.showReturn ? 'Hide return trip' : 'Return trip (left site, home safe) — optional'}
      </button>
      {draft.showReturn && (
        <>
          <TimeField label="Left site" value={draft.leftSiteAt} onChange={t => set({ leftSiteAt: t })} now={now} />
          <TimeField label="Home safe" value={draft.homeSafeAt} onChange={t => set({ homeSafeAt: t })} now={now} />
        </>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="crew-notes" className="text-xs font-bold text-vk-muted">Notes</label>
        <textarea id="crew-notes" rows={2} value={draft.notes} onChange={e => set({ notes: e.target.value })} placeholder="Optional"
          className="border border-vk-muted rounded-btn px-2.5 py-2 text-sm text-vk-ink bg-white dark:bg-gray-900 dark:text-white" />
      </div>
      <div className="text-xs text-vk-muted">{dateText && `Date: ${dateText} · `}times are exact, may be before the race start, never in the future.</div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className={`${btn} border border-vk-muted bg-white text-vk-ink dark:bg-gray-800 dark:text-gray-100`}>Cancel</button>
        <button type="button" onClick={onSave} disabled={!!problem || busy}
          className={`${btn} ${problem || busy ? LOCKED : 'bg-vk-gold text-vk-ink shadow-btn'}`}>{problem ?? 'Save vehicle'}</button>
      </div>
      {draft.id && (
        <button type="button" onClick={() => (confirmRemove ? onRemove() : setConfirmRemove(true))}
          className={`${btn} ${confirmRemove ? 'bg-vk-red text-white' : 'bg-white text-vk-red border-2 border-vk-red dark:bg-gray-800'}`}>
          {confirmRemove ? 'Tap again to remove vehicle' : 'Remove vehicle'}
        </button>
      )}
    </div>
  );
};

/** Shared state for a crew view: vehicles by checkpoint, the open draft, actions. */
function useCrewView() {
  const { currentRace, checkpoints = [], crewVehicles = [] } = useBaseOperationsStore();
  const now = useNow(15000);
  const cps = useMemo(() => crewCheckpoints(checkpoints), [checkpoints]);
  const active = useMemo(() => activeVehicles(crewVehicles), [crewVehicles]);
  const people = useMemo(() => knownPeople(crewVehicles), [crewVehicles]);
  const [draft, setDraft] = useState(null);
  const actions = useCrewActions();
  const short = (n) => cps.find(c => c.number === n)?.short ?? '';
  const save = async () => { if (await actions.save(draft, short(draft.checkpointNumber))) setDraft(null); };
  const remove = async () => { if (await actions.remove(draft)) setDraft(null); };
  const arrive = (v) => { setDraft(null); actions.arrive(v, short(v.checkpointNumber), TimeUtils.getCurrentTimestamp()); };
  const editor = draft && (
    <VehicleEditor draft={draft} setDraft={setDraft} cps={cps} people={people} raceDate={currentRace?.date} now={now}
      busy={actions.busy} onSave={save} onCancel={() => setDraft(null)} onRemove={remove} />
  );
  return { currentRace, cps, active, now, draft, setDraft, actions, arrive, editor };
}

/**
 * Base — Crews tab: who went to each checkpoint in which car, when they left
 * home and arrived (for insurance). Kept on this device only.
 */
const CrewLog = () => {
  const { downloadReport, checkpoints = [], crewVehicles = [] } = useBaseOperationsStore();
  const { currentRace, cps, active, now, draft, setDraft, actions, arrive, editor } = useCrewView();
  const s = crewSummary(active);
  const onWay = active.filter(v => vehicleState(v) === 'on-the-way');
  const exportCsv = () => {
    const name = (currentRace?.name || 'race').replace(/\s+/g, '-');
    downloadReport?.({ content: toCsv(crewReportRows(crewVehicles, checkpoints)), filename: `${name}-crew-vehicle-log.csv`, mimeType: 'text/csv' });
  };
  const stat = 'min-w-[64px] min-h-[48px] rounded-btn px-2 py-1 flex flex-col justify-center';

  return (
    <div className="max-w-[1280px] w-full mx-auto p-3 flex flex-wrap gap-3 items-start" data-screenshot-target>
      <section aria-labelledby="crewhd" className="flex-[999_1_520px] min-w-0 flex flex-col gap-2.5">
        <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex-1 min-w-[220px] flex flex-col gap-0.5">
            <h1 id="crewhd" className="font-display font-extrabold text-xl text-vk-navy dark:text-white">Crew &amp; vehicle log</h1>
            <div className="text-[13px] text-vk-muted" data-testid="crew-summary">{summaryText(s)}</div>
          </div>
          <div className="flex gap-1.5">
            <div className={`${stat} bg-vk-navy text-white`}><span className="font-display font-extrabold text-xl leading-none">{s.arrived}</span><span className="text-[11px] font-semibold">Arrived</span></div>
            <div className={`${stat} bg-vk-gold-tint text-vk-ink border-2 border-vk-gold`}><span className="font-display font-extrabold text-xl leading-none">{s.onWay}</span><span className="text-[11px] font-semibold">On the way</span></div>
            <div className={`${stat} bg-vk-band text-vk-navy`}><span className="font-display font-extrabold text-xl leading-none">{s.vehicles}</span><span className="text-[11px] font-semibold">Vehicles</span></div>
          </div>
          <button type="button" onClick={() => setDraft(newDraft(cps[1]?.number ?? 0))}
            className={`${btn} px-4 ${draft ? 'bg-transparent text-vk-blue border-2 border-vk-blue' : 'bg-vk-gold text-vk-ink shadow-btn'}`}>Add vehicle</button>
        </div>
        <StatusLine actions={actions} />
        <div className="max-h-[610px] overflow-y-auto grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(330px,1fr))] content-start">
          {cps.map(cp => (
            <CrewCard key={cp.number} cp={cp} vehicles={active.filter(v => v.checkpointNumber === cp.number)}
              editing={draft?.checkpointNumber === cp.number} selectedId={draft?.id}
              onOpen={(v) => setDraft(editDraft(v))} onArrive={arrive} onAdd={() => setDraft(newDraft(cp.number))} />
          ))}
        </div>
      </section>

      <aside aria-label="Vehicle details" className="flex-[1_1_320px] min-w-0 max-h-[720px] overflow-y-auto bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-3 flex flex-col gap-3">
        {editor || (
          <div className="flex flex-col gap-2.5">
            <h2 className="font-display font-bold text-base text-vk-navy dark:text-white">On the way</h2>
            {onWay.map(v => (
              <button key={v.id} type="button" onClick={() => setDraft(editDraft(v))}
                className="min-h-[52px] flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn border-2 border-vk-gold bg-vk-gold-tint text-left">
                <span className="w-[52px] font-display font-extrabold text-[15px] text-vk-navy">{cps.find(c => c.number === v.checkpointNumber)?.short}</span>
                <span className="flex-1 flex flex-col">
                  <span className="font-bold text-sm">{v.rego} · {v.driver}</span>
                  <span className="text-xs text-vk-muted">Left home {hhmm(v.leftHomeAt)} · {Math.max(0, TimeUtils.minutesBetween(v.leftHomeAt, now))} min ago</span>
                </span>
              </button>
            ))}
            {!onWay.length && <div className="text-sm font-semibold text-vk-navy dark:text-white">{active.length ? 'Every logged vehicle has arrived.' : 'No vehicles logged yet.'}</div>}
            <h2 className="mt-2 font-display font-bold text-base text-vk-navy dark:text-white">Insurance report</h2>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={exportCsv} className={`${btn} border-2 border-vk-blue text-vk-blue`}>CSV</button>
              <button type="button" onClick={() => window.print()} className={`${btn} border-2 border-vk-blue text-vk-blue`}>Print</button>
            </div>
            <p className="text-[13px] leading-relaxed text-vk-muted">Kept on this device only. Never included in the race setup or any shared file. Tap a vehicle to edit it.</p>
          </div>
        )}
      </aside>
    </div>
  );
};

/** Quick crew log from Receive: one checkpoint's vehicles and the same editor, in a sheet. */
export const CrewSheet = ({ cpNumber, onClose }) => {
  const { cps, active, draft, setDraft, actions, arrive, editor } = useCrewView();
  const cp = cps.find(c => c.number === cpNumber);
  if (!cp) return null;
  return (
    <BottomSheet open onClose={onClose} labelledBy={draft ? 'vehicle-hd' : 'crewsheet-hd'}>
      {editor || (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <h2 id="crewsheet-hd" className="flex-1 font-display font-extrabold text-xl text-vk-navy dark:text-white">Crew · {cp.short}</h2>
            <button type="button" onClick={onClose} className="min-h-[44px] px-3 rounded-btn border border-vk-muted bg-white text-vk-ink font-bold text-xs dark:bg-gray-800 dark:text-gray-100">Close</button>
          </div>
          <CrewCard cp={cp} vehicles={active.filter(v => v.checkpointNumber === cp.number)} editing={false}
            onOpen={(v) => setDraft(editDraft(v))} onArrive={arrive} onAdd={() => setDraft(newDraft(cp.number))} />
        </div>
      )}
      <StatusLine actions={actions} />
    </BottomSheet>
  );
};

export default CrewLog;
