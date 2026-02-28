import React, { useRef, useState } from 'react';
import { ImportService } from '../../services/import-export/ImportService';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';

/**
 * CheckpointImportPanel
 * Allows the Base Station operator to import a checkpoint results JSON file
 * produced by a Checkpoint device's "Export Results" button.
 *
 * Displays a list of already-imported checkpoints with their import timestamps.
 */
const CheckpointImportPanel = () => {
  const { currentRaceId } = useBaseOperationsStore();
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [importing, setImporting] = useState(false);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatus(null);

    try {
      const text = await file.text();
      const pkg = JSON.parse(text);
      const result = await ImportService.importCheckpointResults(pkg, currentRaceId);

      if (result.success) {
        setStatus({
          type: 'success',
          message: `Checkpoint ${result.checkpointNumber} imported — ${result.totalRunners} runners`,
        });
      } else {
        setStatus({ type: 'error', message: result.error || 'Import failed' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Could not read file: ${err.message}` });
    } finally {
      setImporting(false);
      // Reset input so same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
        Import Checkpoint Results
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Import a JSON file exported from a Checkpoint device. Re-importing the same
        checkpoint replaces any previous import.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelected}
        className="hidden"
        aria-label="Select checkpoint results file"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing || !currentRaceId}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm rounded
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {importing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Importing…</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V4" />
            </svg>
            <span>Select Checkpoint File</span>
          </>
        )}
      </button>

      {status && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-3 text-sm font-medium ${
            status.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
};

export default CheckpointImportPanel;
