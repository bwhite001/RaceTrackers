import React, { useEffect, useState } from 'react';
import { ExportService } from '../../../services/import-export/ExportService';
import { Button } from '../../../design-system/components';

const ExportCheckpointResultsModal = ({
  isOpen,
  raceId,
  checkpointNumber,
  checkpointName,
  raceName,
  onClose,
}) => {
  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !raceId || checkpointNumber == null) return;
    setPkg(null);
    setError(null);
    ExportService.exportCheckpointResults(raceId, checkpointNumber)
      .then(setPkg)
      .catch(err => setError(err.message));
  }, [isOpen, raceId, checkpointNumber]);

  if (!isOpen) return null;

  const runners = pkg?.data?.runners ?? [];
  const markedOff = runners.filter(r => r.markOffTime).length;
  const calledIn = runners.filter(r => r.callInTime).length;
  const notSeen = runners.filter(r => !r.markOffTime).length;

  const handleDownloadJSON = () => {
    ExportService.downloadExport(
      pkg,
      `checkpoint-${checkpointNumber}-results-${Date.now()}.json`
    );
  };

  const handleDownloadCSV = () => {
    const headers = ['Runner #', 'First Name', 'Last Name', 'Status', 'Mark-Off Time', 'Call-In Time', 'Notes'];
    const rows = runners.map(r => [
      r.number,
      r.firstName ?? '',
      r.lastName ?? '',
      r.status ?? '',
      r.markOffTime ? new Date(r.markOffTime).toLocaleTimeString() : '',
      r.callInTime ? new Date(r.callInTime).toLocaleTimeString() : '',
      r.notes ?? '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(c => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c)).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkpoint-${checkpointNumber}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${checkpointName} Results — ${raceName}`);
    const body = encodeURIComponent(
      `Checkpoint results attached. Import the JSON file at base station.\n\n${JSON.stringify(pkg, null, 2)}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {checkpointName} — End of Day Export
          </h2>
          <button
            aria-label="close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {!pkg && !error && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Preparing export…
            </div>
          )}

          {pkg && (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">{markedOff}</div>
                  <div className="text-xs text-green-600 dark:text-green-300">marked off</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{calledIn}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">called in</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{notSeen}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">not seen</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    For Base Station (JSON)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleDownloadJSON} className="flex-1">
                      Download JSON
                    </Button>
                    <Button variant="secondary" onClick={handleEmail} className="flex-1">
                      Email
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    For Race Officials (CSV)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleDownloadCSV} className="flex-1">
                      Download CSV
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()} className="flex-1">
                      Print
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportCheckpointResultsModal;
