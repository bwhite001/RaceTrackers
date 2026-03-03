import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImportService } from '../../../services/import-export/ImportService';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore';
import db from '../../../shared/services/database/schema';

/**
 * CheckpointImportPanel
 * Shows per-checkpoint import status and lets the operator import a JSON file
 * exported from a Checkpoint device.
 */
const CheckpointImportPanel = () => {
  const { currentRaceId } = useBaseOperationsStore();
  const { checkpoints } = useRaceStore();
  const fileInputRef = useRef(null);
  const [targetCheckpoint, setTargetCheckpoint] = useState(null);
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [importedMap, setImportedMap] = useState({}); // { [checkpointNumber]: { importedAt, totalRunners } }

  const loadImportedMap = useCallback(async () => {
    if (!currentRaceId) return;
    const records = await db.imported_checkpoint_results
      .where('raceId').equals(currentRaceId)
      .toArray();
    const map = {};
    for (const r of records) {
      map[r.checkpointNumber] = {
        importedAt: r.importedAt,
        totalRunners: Array.isArray(r.runners) ? r.runners.length : 0,
      };
    }
    setImportedMap(map);
  }, [currentRaceId]);

  useEffect(() => { loadImportedMap(); }, [loadImportedMap]);

  const handleSelectFile = (checkpointNum) => {
    setTargetCheckpoint(checkpointNum);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatusMsg(null);

    try {
      const text = await file.text();
      const pkg = JSON.parse(text);
      const result = await ImportService.importCheckpointResults(pkg, currentRaceId);

      if (result.success) {
        setStatusMsg({ type: 'success', message: `Checkpoint ${result.checkpointNumber} imported — ${result.totalRunners} runners` });
        await loadImportedMap();
      } else {
        setStatusMsg({ type: 'error', message: result.error || 'Import failed' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', message: `Could not read file: ${err.message}` });
    } finally {
      setImporting(false);
      setTargetCheckpoint(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sortedCheckpoints = [...(checkpoints ?? [])].sort((a, b) => a.number - b.number);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Import Checkpoint Results
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {Object.keys(importedMap).length} / {sortedCheckpoints.length} imported
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Import a JSON file exported from each Checkpoint device. Re-importing replaces the previous data.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedCheckpoints.map(cp => {
          const rec = importedMap[cp.number];
          const isImported = Boolean(rec);
          const isLoading = importing && targetCheckpoint === cp.number;

          return (
            <div
              key={cp.number}
              className={`rounded-lg border-2 p-4 flex items-center justify-between gap-3 ${
                isImported
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {cp.name || `Checkpoint ${cp.number}`}
                </p>
                {isImported ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    ✓ Imported — {rec.totalRunners} runners
                    <br />
                    <span className="text-gray-400 dark:text-gray-500">
                      {new Date(rec.importedAt).toLocaleString()}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Not imported
                  </p>
                )}
              </div>
              <button
                aria-label={isImported ? `Re-import ${cp.name || `Checkpoint ${cp.number}`}` : `Import ${cp.name || `Checkpoint ${cp.number}`}`}
                onClick={() => handleSelectFile(cp.number)}
                disabled={isLoading || !currentRaceId}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded
                           bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V4" />
                  </svg>
                )}
                {isImported ? 'Re-import' : 'Import'}
              </button>
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelected}
        className="hidden"
        aria-label="Select checkpoint results file"
      />

      {statusMsg && (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm font-medium ${
            statusMsg.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {statusMsg.message}
        </p>
      )}
    </div>
  );
};

export default CheckpointImportPanel;

