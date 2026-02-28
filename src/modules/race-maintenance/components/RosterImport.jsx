import React, { useRef, useState } from 'react';
import { importCSVFile } from '../../../utils/csvImport';
import RaceMaintenanceRepository from '../services/RaceMaintenanceRepository';

/**
 * CSV Roster Import component for the Race Maintenance overview page.
 * Accepts a .csv file, previews the mapped columns, and upserts runner details
 * (firstName, lastName, gender, batchNumber) by bib number.
 * Never deletes runners — import is purely additive.
 */
function RosterImport({ raceId, onComplete }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null); // { valid, errors, headers }
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null); // { updated, created, errors }
  const [fileError, setFileError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError(null);
    setResult(null);
    try {
      const data = await importCSVFile(file);
      setPreview(data);
    } catch (err) {
      setFileError(err.message);
      setPreview(null);
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!preview?.valid?.length || !raceId) return;
    setImporting(true);
    try {
      const res = await RaceMaintenanceRepository.bulkUpsertRunnerDetails(raceId, preview.valid);
      setResult(res);
      setPreview(null);
      if (onComplete) onComplete(res);
    } catch (err) {
      setFileError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setResult(null);
    setFileError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Import Runner Roster
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a CSV with columns: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">number</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">firstName</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">lastName</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">gender</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">batchNumber</code>
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary text-sm"
          disabled={importing}
        >
          Choose CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {fileError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {fileError}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Preview: {preview.valid.length} valid runner{preview.valid.length !== 1 ? 's' : ''}
              {preview.errors.length > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  ({preview.errors.length} error{preview.errors.length !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>

          {preview.errors.length > 0 && (
            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-24 overflow-y-auto">
              {preview.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}

          {/* Sample rows table */}
          <div className="overflow-x-auto max-h-48 rounded border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                <tr>
                  {['#', 'First Name', 'Last Name', 'Gender', 'Wave'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {preview.valid.slice(0, 10).map((row, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-900">
                    <td className="px-3 py-1.5 font-mono">{row.number}</td>
                    <td className="px-3 py-1.5">{row.firstName || '—'}</td>
                    <td className="px-3 py-1.5">{row.lastName || '—'}</td>
                    <td className="px-3 py-1.5">{row.gender}</td>
                    <td className="px-3 py-1.5">{row.batchNumber}</td>
                  </tr>
                ))}
                {preview.valid.length > 10 && (
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={5} className="px-3 py-1.5 text-center text-gray-500 dark:text-gray-400">
                      …and {preview.valid.length - 10} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleImport}
              disabled={importing || preview.valid.length === 0}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {importing ? 'Importing…' : `Import ${preview.valid.length} Runners`}
            </button>
            <button
              onClick={handleCancel}
              className="btn-outline text-sm"
              disabled={importing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
          ✓ Import complete — {result.updated} updated, {result.created} new
          {result.errors > 0 && `, ${result.errors} error${result.errors !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}

export default RosterImport;
