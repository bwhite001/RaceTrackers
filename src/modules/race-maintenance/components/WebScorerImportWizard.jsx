import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  parseXlsxFile,
  detectColumnMappings,
  applyMappingsToRows,
  FIELD_OPTIONS,
} from '../../../utils/xlsxImport';
import RaceMaintenanceRepository from '../services/RaceMaintenanceRepository';
import useRaceMaintenanceStore from '../store/raceMaintenanceStore';

// ---------------------------------------------------------------------------
// Dev-only pre-loaded file list (served from public/import/)
// ---------------------------------------------------------------------------
const DEV_IMPORTS = [
  { label: 'BTM2026 (WebScorer)', path: '/import/BTM2026WebScorer.xlsx' },
  { label: 'Pinnacles Classic 2026 (WebScorer)', path: '/import/PinnaclesClassic2026WebScorer.xlsx' },
];

const INITIAL_STATE = {
  step: 1,              // 1 = upload+map, 2 = race details, 3 = confirm
  xlsxHeaders: [],
  xlsxRows: [],
  mappings: {},
  autoDetected: new Set(),
  preview: null,        // { valid, errors, batchLabels }
  fileError: null,
  // race details form
  raceName: '',
  raceDate: '',
  startTime: '06:00',
  checkpointNames: ['Checkpoint 1'],
};

function buildCheckpointSummary(batchLabels) {
  if (!batchLabels || Object.keys(batchLabels).length === 0) return null;
  return Object.entries(batchLabels).map(([num, name]) => ({ num: Number(num), name }));
}

function buildBatchCountMap(rows) {
  const map = {};
  for (const r of rows) {
    const b = r.batchNumber ?? 1;
    map[b] = (map[b] || 0) + 1;
  }
  return map;
}

/**
 * WebScorer Import Wizard
 * Full-screen modal that creates a new race from a WebScorer .xlsx file.
 *
 * Props:
 *   onClose()       — called when user cancels
 */
export default function WebScorerImportWizard({ onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [state, setState] = useState(INITIAL_STATE);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const { loadRaces } = useRaceMaintenanceStore();

  // -------------------------------------------------------------------------
  // File parsing helpers
  // -------------------------------------------------------------------------
  const setError = (msg) => setState(s => ({ ...s, fileError: msg }));

  const handleXlsxSource = async (source) => {
    try {
      const { headers, rows } = await parseXlsxFile(source);
      const { mappings, autoDetected } = detectColumnMappings(headers);
      setState(s => ({
        ...s,
        xlsxHeaders: headers,
        xlsxRows: rows,
        mappings,
        autoDetected,
        fileError: null,
        preview: null,
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleXlsxSource(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDevPick = async (e) => {
    const path = e.target.value;
    if (!path) return;
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      await handleXlsxSource(await resp.arrayBuffer());
    } catch (err) {
      setError(`Could not load fixture: ${err.message}`);
    }
    e.target.value = '';
  };

  const handleMappingChange = (col, field) =>
    setState(s => ({ ...s, mappings: { ...s.mappings, [col]: field } }));

  const numberMapped = Object.values(state.mappings).includes('number');

  // -------------------------------------------------------------------------
  // Step navigation
  // -------------------------------------------------------------------------
  const goToStep2 = () => {
    const { valid, errors, batchLabels } = applyMappingsToRows(state.xlsxRows, state.mappings);
    setState(s => ({ ...s, step: 2, preview: { valid, errors, batchLabels }, fileError: null }));
  };

  const goToStep3 = () => {
    if (!state.raceName.trim() || !state.raceDate) return;
    setState(s => ({ ...s, step: 3 }));
  };

  const goBack = () => setState(s => ({ ...s, step: s.step - 1 }));

  // -------------------------------------------------------------------------
  // Checkpoint management
  // -------------------------------------------------------------------------
  const addCheckpoint = () =>
    setState(s => ({
      ...s,
      checkpointNames: [...s.checkpointNames, `Checkpoint ${s.checkpointNames.length + 1}`],
    }));

  const removeCheckpoint = (i) =>
    setState(s => ({ ...s, checkpointNames: s.checkpointNames.filter((_, idx) => idx !== i) }));

  const updateCheckpointName = (i, name) =>
    setState(s => {
      const next = [...s.checkpointNames];
      next[i] = name;
      return { ...s, checkpointNames: next };
    });

  // -------------------------------------------------------------------------
  // Create race
  // -------------------------------------------------------------------------
  const handleCreate = async () => {
    if (!state.preview?.valid?.length) return;
    setIsCreating(true);
    setCreateError('');
    try {
      const { valid, batchLabels } = state.preview;

      // Build runner ranges per batch
      const batchMap = {};
      for (const r of valid) {
        const b = r.batchNumber ?? 1;
        if (!batchMap[b]) batchMap[b] = { min: r.number, max: r.number };
        else {
          batchMap[b].min = Math.min(batchMap[b].min, r.number);
          batchMap[b].max = Math.max(batchMap[b].max, r.number);
        }
      }
      const runnerRanges = Object.values(batchMap).sort((a, b) => a.min - b.min);
      const allBibs = valid.map(r => r.number);
      const minRunner = Math.min(...allBibs);
      const maxRunner = Math.max(...allBibs);

      // Build batches
      const batches = Object.entries(batchMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([num]) => ({
          batchNumber: Number(num),
          batchName: batchLabels?.[num] ?? `Batch ${num}`,
          startTime: `${state.raceDate}T${state.startTime}:00`,
        }));

      // Build checkpoints
      const checkpoints = state.checkpointNames.map((name, i) => ({
        number: i + 1,
        name: name.trim() || `Checkpoint ${i + 1}`,
      }));

      const raceConfig = {
        name: state.raceName.trim(),
        date: state.raceDate,
        startTime: state.startTime,
        minRunner,
        maxRunner,
        runnerRanges,
        checkpoints,
        batches,
      };

      const raceId = await RaceMaintenanceRepository.createRace(raceConfig);

      // Overlay runner details (names, gender, age) onto the freshly created runners
      await RaceMaintenanceRepository.bulkUpsertRunnerDetails(raceId, valid);

      // Upsert batch names (in case batchLabels has them)
      if (batchLabels && Object.keys(batchLabels).length > 0) {
        await RaceMaintenanceRepository.upsertBatchNames(raceId, batchLabels);
      }

      // Refresh race list in store and navigate
      await loadRaces();
      navigate(`/race-maintenance/overview?raceId=${raceId}`);
      onClose();
    } catch (err) {
      console.error('WebScorer import failed', err);
      setCreateError(err.message || 'Failed to create race');
    } finally {
      setIsCreating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Derived data for step 2/3
  // -------------------------------------------------------------------------
  const batchCounts = state.preview ? buildBatchCountMap(state.preview.valid) : {};
  const batchEntries = state.preview?.batchLabels
    ? Object.entries(state.preview.batchLabels).sort(([a], [b]) => Number(a) - Number(b))
    : [];
  const sampleValues = (col) =>
    state.xlsxRows.slice(0, 2).map(r => r[col]).filter(Boolean).join(', ');

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Import from WebScorer
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Step {state.step} of 3 —{' '}
              {state.step === 1 ? 'Upload & Map Columns' : state.step === 2 ? 'Race Details' : 'Confirm & Create'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-0 px-6 pt-4">
          {[1, 2, 3].map(n => (
            <div key={n} className={`flex-1 h-1 rounded-full mx-0.5 transition-colors ${n <= state.step ? 'bg-navy-600 dark:bg-navy-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── STEP 1: Upload + Map ── */}
          {state.step === 1 && (
            <div className="space-y-4">
              {/* File upload controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary text-sm"
                >
                  Choose .xlsx File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {state.xlsxRows.length > 0
                    ? `${state.xlsxRows.length} rows loaded`
                    : 'No file selected'}
                </span>
              </div>

              {/* Dev fixture picker */}
              {import.meta.env.DEV && (
                <div className="flex items-center gap-2 p-2 rounded border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">Dev only</span>
                  <select
                    className="text-sm flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1"
                    defaultValue=""
                    onChange={handleDevPick}
                  >
                    <option value="" disabled>— quick load xlsx —</option>
                    {DEV_IMPORTS.map(f => (
                      <option key={f.path} value={f.path}>{f.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {state.fileError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                  {state.fileError}
                </div>
              )}

              {/* Column mapping table */}
              {state.xlsxHeaders.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Map columns — auto-detected fields are marked ✓
                  </p>
                  <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          {['xlsx column', 'sample values', 'maps to'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {state.xlsxHeaders.map(col => (
                          <tr key={col} className="bg-white dark:bg-gray-900">
                            <td className="px-3 py-1.5 font-mono text-gray-800 dark:text-gray-200">
                              {col}
                              {state.autoDetected.has(col) && (
                                <span className="ml-1 text-green-600 dark:text-green-400 text-[10px]">✓</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400 italic">
                              {sampleValues(col) || '—'}
                            </td>
                            <td className="px-3 py-1.5">
                              <select
                                value={state.mappings[col] ?? 'ignore'}
                                onChange={e => handleMappingChange(col, e.target.value)}
                                className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-1 py-0.5"
                              >
                                {FIELD_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!numberMapped && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Map at least one column to "Bib # (required)" to continue.
                    </p>
                  )}
                </div>
              )}

              {/* Nav */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={goToStep2}
                  disabled={!numberMapped || state.xlsxRows.length === 0}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  Next: Race Details →
                </button>
                <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Race Details ── */}
          {state.step === 2 && (
            <div className="space-y-5">
              {/* Detected categories summary */}
              {batchEntries.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 space-y-1">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Detected categories from file
                  </p>
                  {batchEntries.map(([num, name]) => (
                    <div key={num} className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400">
                      <span>{name}</span>
                      <span className="font-mono">{batchCounts[num] ?? 0} runners</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-200 dark:border-blue-700 pt-1 mt-1 flex justify-between text-xs font-medium text-blue-800 dark:text-blue-300">
                    <span>Total</span>
                    <span className="font-mono">{state.preview?.valid?.length ?? 0} runners</span>
                  </div>
                </div>
              )}

              {/* Race metadata form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Race Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={state.raceName}
                    onChange={e => setState(s => ({ ...s, raceName: e.target.value }))}
                    placeholder="e.g. BTM2026 — Bunya Trail Marathon"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Race Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={state.raceDate}
                      onChange={e => setState(s => ({ ...s, raceDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={state.startTime}
                      onChange={e => setState(s => ({ ...s, startTime: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-navy-500"
                    />
                  </div>
                </div>
              </div>

              {/* Checkpoint configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Checkpoints
                  </label>
                  <button
                    onClick={addCheckpoint}
                    className="text-xs text-navy-600 dark:text-navy-400 hover:underline"
                  >
                    + Add checkpoint
                  </button>
                </div>
                <div className="space-y-2">
                  {state.checkpointNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-5 text-right">{i + 1}.</span>
                      <input
                        type="text"
                        value={name}
                        onChange={e => updateCheckpointName(i, e.target.value)}
                        className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 text-sm focus:ring-1 focus:ring-navy-500"
                      />
                      {state.checkpointNames.length > 1 && (
                        <button
                          onClick={() => removeCheckpoint(i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                          aria-label="Remove checkpoint"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Errors from mapping step */}
              {state.preview?.errors?.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs space-y-0.5">
                  <p className="font-medium">{state.preview.errors.length} row{state.preview.errors.length !== 1 ? 's' : ''} skipped:</p>
                  {state.preview.errors.slice(0, 5).map((e, i) => <p key={i}>• {e}</p>)}
                  {state.preview.errors.length > 5 && <p>…and {state.preview.errors.length - 5} more</p>}
                </div>
              )}

              {/* Nav */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={goToStep3}
                  disabled={!state.raceName.trim() || !state.raceDate}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  Next: Confirm →
                </button>
                <button onClick={goBack} className="btn-outline text-sm">← Back</button>
                <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {state.step === 3 && (
            <div className="space-y-5">
              {/* Summary card */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {state.raceName}
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>📅 Date</span><span className="text-gray-900 dark:text-white">{state.raceDate}</span>
                  <span>🕕 Start</span><span className="text-gray-900 dark:text-white">{state.startTime}</span>
                  <span>🏁 Checkpoints</span><span className="text-gray-900 dark:text-white">{state.checkpointNames.length}</span>
                  <span>👟 Runners</span><span className="text-gray-900 dark:text-white">{state.preview?.valid?.length ?? 0}</span>
                  <span>📦 Categories</span><span className="text-gray-900 dark:text-white">{batchEntries.length || 1}</span>
                </div>
                {batchEntries.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
                    {batchEntries.map(([num, name]) => (
                      <div key={num} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{name}</span>
                        <span className="font-mono">{batchCounts[num] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Runner preview table */}
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First 10 runners
                </p>
                <div className="overflow-x-auto max-h-40 rounded border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                      <tr>
                        {['#', 'First', 'Last', 'Gender', 'Age', 'Category'].map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-700 dark:text-gray-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(state.preview?.valid ?? []).slice(0, 10).map((r, i) => (
                        <tr key={i} className="bg-white dark:bg-gray-900">
                          <td className="px-2 py-1.5 font-mono">{r.number}</td>
                          <td className="px-2 py-1.5">{r.firstName || '—'}</td>
                          <td className="px-2 py-1.5">{r.lastName || '—'}</td>
                          <td className="px-2 py-1.5">{r.gender}</td>
                          <td className="px-2 py-1.5">{r.age ?? '—'}</td>
                          <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400">
                            {state.preview?.batchLabels?.[r.batchNumber] ?? `Batch ${r.batchNumber}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {createError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                  {createError}
                </div>
              )}

              {/* Nav */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {isCreating ? 'Creating Race…' : `Create Race (${state.preview?.valid?.length ?? 0} runners)`}
                </button>
                <button onClick={goBack} disabled={isCreating} className="btn-outline text-sm">← Back</button>
                <button onClick={onClose} disabled={isCreating} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
