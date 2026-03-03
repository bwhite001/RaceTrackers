import React, { useEffect, useState } from 'react';
import StorageService from '../../../services/storage';
import { Button } from '../../../design-system/components';

/**
 * DistributeRaceModal
 *
 * Exports the full race setup package (config + runner roster + checkpoints)
 * so the organiser can distribute it to checkpoint and base station devices
 * via file download, clipboard copy, or email.
 */
const DistributeRaceModal = ({ isOpen, raceId, raceName, onClose }) => {
  const [pkg, setPkg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !raceId) return;
    setPkg(null);
    setError(null);
    StorageService.exportRaceConfig(raceId)
      .then(setPkg)
      .catch(err => setError(err.message));
  }, [isOpen, raceId]);

  if (!isOpen) return null;

  const jsonStr = pkg ? JSON.stringify(pkg, null, 2) : '';

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `race-setup-${(raceName || 'race').replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Race Setup: ${raceName}`);
    const body = encodeURIComponent(
      `Please import the attached race setup file in RaceTracker Pro to get started.\n\n${jsonStr}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Distribute Race Setup
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

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">{raceName}</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Send this file to each checkpoint operator and your base station operator.
              They import it in RaceTracker Pro to get started.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {!pkg && !error && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Preparing race package…
            </div>
          )}

          {pkg && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="primary" onClick={handleDownload} className="w-full">
                  Download
                </Button>
                <Button variant="secondary" onClick={handleCopy} className="w-full">
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="secondary" onClick={handleEmail} className="w-full">
                  Email
                </Button>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Includes race details, all checkpoints, and the full runner roster.
                No result times are included.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributeRaceModal;
