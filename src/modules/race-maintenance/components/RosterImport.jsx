import React, { useRef, useState } from 'react';
import { importCSVFile } from '../../../utils/csvImport';
import {
  parseXlsxFile,
  detectColumnMappings,
  applyMappingsToRows,
  FIELD_OPTIONS,
} from '../../../utils/xlsxImport';
import RaceMaintenanceRepository from '../services/RaceMaintenanceRepository';

// ---------------------------------------------------------------------------
// Dev-only pre-loaded file list (served from public/import/)
// ---------------------------------------------------------------------------
const DEV_IMPORTS = [
  { label: 'Pinnacles Classic 2026', path: '/import/PinnaclesClassic2026.xlsx' },
  { label: 'Pinnacles Classic 2026 (WebScorer)', path: '/import/PinnaclesClassic2026WebScorer.xlsx' },
];

// Steps: 'idle' | 'map' | 'preview' | 'importing' | 'done'
const INITIAL_STATE = {
  step: 'idle',
  // xlsx mapping step
  xlsxHeaders: [],       // all column names from the xlsx
  xlsxRows: [],          // raw rows from SheetJS
  mappings: {},          // { xlsxCol: appField | 'ignore' }
  autoDetected: new Set(),
  // shared preview/result
  preview: null,         // { valid, errors }
  result: null,          // { updated, created, errors }
  fileError: null,
  isXlsx: false,
};

/**
 * CSV + xlsx Roster Import component for the Race Maintenance overview page.
 * CSV: 2-step flow (Preview → Confirm).
 * xlsx: 3-step wizard (Map → Preview → Confirm).
 */
function RosterImport({ raceId, onComplete }) {
  const fileInputRef = useRef(null);
  const [state, setState] = useState(INITIAL_STATE);

  const reset = () => setState(INITIAL_STATE);
  const setError = (msg) => setState(s => ({ ...s, fileError: msg, step: 'idle' }));

  // ---------------------------------------------------------------------------
  // File handling — CSV
  // ---------------------------------------------------------------------------
  const handleCsvFile = async (file) => {
    try {
      const data = await importCSVFile(file);
      setState(s => ({ ...s, step: 'preview', preview: data, isXlsx: false, fileError: null }));
    } catch (err) {
      setError(err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // File handling — xlsx (from File upload or dev picker fetch)
  // ---------------------------------------------------------------------------
  const handleXlsxSource = async (source) => {
    try {
      const { headers, rows } = await parseXlsxFile(source);
      const { mappings, autoDetected } = detectColumnMappings(headers);
      setState(s => ({
        ...s,
        step: 'map',
        xlsxHeaders: headers,
        xlsxRows: rows,
        mappings,
        autoDetected,
        isXlsx: true,
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
    if (file.name.toLowerCase().endsWith('.xlsx')) {
      await handleXlsxSource(file);
    } else {
      await handleCsvFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // Dev picker
  // ---------------------------------------------------------------------------
  const handleDevPick = async (e) => {
    const path = e.target.value;
    if (!path) return;
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
      const buffer = await resp.arrayBuffer();
      await handleXlsxSource(buffer);
    } catch (err) {
      setError(`Could not load dev fixture: ${err.message}`);
    }
    e.target.value = '';
  };

  // ---------------------------------------------------------------------------
  // Column mapping step handlers
  // ---------------------------------------------------------------------------
  const handleMappingChange = (col, field) => {
    setState(s => ({ ...s, mappings: { ...s.mappings, [col]: field } }));
  };

  const handleMappingNext = () => {
    const { valid, errors } = applyMappingsToRows(state.xlsxRows, state.mappings);
    setState(s => ({ ...s, step: 'preview', preview: { valid, errors } }));
  };

  const numberMapped = Object.values(state.mappings).includes('number');

  // ---------------------------------------------------------------------------
  // Import
  // ---------------------------------------------------------------------------
  const handleImport = async () => {
    if (!state.preview?.valid?.length || !raceId) return;
    setState(s => ({ ...s, step: 'importing' }));
    try {
      const res = await RaceMaintenanceRepository.bulkUpsertRunnerDetails(raceId, state.preview.valid);
      setState(s => ({ ...s, step: 'done', result: res }));
      if (onComplete) onComplete(res);
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const sampleValues = (col) =>
    state.xlsxRows.slice(0, 2).map(r => r[col]).filter(Boolean).join(', ');

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Import Runner Roster
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.csv</code> or{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.xlsx</code> file — columns are mapped automatically.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary text-sm"
          disabled={state.step === 'importing'}
        >
          Choose File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Dev file picker */}
      <div className="flex items-center gap-2 p-2 rounded border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">Dev only</span>
        <select
          className="text-sm flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1"
          defaultValue=""
          onChange={handleDevPick}
          disabled={state.step === 'importing'}
        >
          <option value="" disabled>— quick load xlsx —</option>
          {DEV_IMPORTS.map(f => (
            <option key={f.path} value={f.path}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {state.fileError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {state.fileError}
        </div>
      )}

      {/* ── Step 1: Map columns (xlsx only) ── */}
      {state.step === 'map' && (
        <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Step 1 of 2 — Map columns
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
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400 italic">{sampleValues(col) || '—'}</td>
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
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleMappingNext}
              disabled={!numberMapped}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Next: Preview →
            </button>
            <button onClick={reset} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {state.step === 'preview' && state.preview && (
        <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {state.isXlsx ? 'Step 2 of 2 — ' : ''}
              Preview: {state.preview.valid.length} valid runner{state.preview.valid.length !== 1 ? 's' : ''}
              {state.preview.errors.length > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  ({state.preview.errors.length} error{state.preview.errors.length !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>

          {state.preview.errors.length > 0 && (
            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-24 overflow-y-auto">
              {state.preview.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}

          <div className="overflow-x-auto max-h-48 rounded border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                <tr>
                  {['#', 'First Name', 'Last Name', 'Gender', 'Wave'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {state.preview.valid.slice(0, 10).map((row, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-900">
                    <td className="px-3 py-1.5 font-mono">{row.number}</td>
                    <td className="px-3 py-1.5">{row.firstName || '—'}</td>
                    <td className="px-3 py-1.5">{row.lastName || '—'}</td>
                    <td className="px-3 py-1.5">{row.gender}</td>
                    <td className="px-3 py-1.5">{row.batchNumber}</td>
                  </tr>
                ))}
                {state.preview.valid.length > 10 && (
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={5} className="px-3 py-1.5 text-center text-gray-500 dark:text-gray-400">
                      …and {state.preview.valid.length - 10} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleImport}
              disabled={state.preview.valid.length === 0}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Import {state.preview.valid.length} Runners
            </button>
            {state.isXlsx && (
              <button
                onClick={() => setState(s => ({ ...s, step: 'map' }))}
                className="btn-outline text-sm"
              >
                ← Back to mapping
              </button>
            )}
            <button onClick={reset} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Importing spinner ── */}
      {state.step === 'importing' && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
          Importing…
        </div>
      )}

      {/* ── Done ── */}
      {state.step === 'done' && state.result && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
          ✓ Import complete — {state.result.updated} updated, {state.result.created} new
          {state.result.errors > 0 && `, ${state.result.errors} error${state.result.errors !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}

export default RosterImport;
