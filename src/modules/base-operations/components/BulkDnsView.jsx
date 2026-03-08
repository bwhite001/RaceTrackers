import React, { useEffect, useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { parseBibs } from '../../../shared/utils/parseBibs.js';
import db from '../../../shared/services/database/schema.js';

/**
 * BulkDnsModal — bulk-mark runners as DNS by typing bib numbers/ranges.
 * Accepts input like: 101, 105-110, 120
 */
const BulkDnsModal = ({ isOpen, onClose }) => {
  const { currentRaceId, markAsDNS, loading } = useBaseOperationsStore();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { updated, notFound }

  useEffect(() => {
    if (isOpen) { setInput(''); setResult(null); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleMarkDns = async () => {
    const bibs = parseBibs(input);
    if (bibs.length === 0) return;
    setSubmitting(true);
    try {
      // Determine which bibs actually exist in the race
      const existing = await db.runners
        .where('raceId').equals(currentRaceId)
        .and(r => bibs.includes(r.number))
        .primaryKeys();
      const existingBibs = bibs.filter(b =>
        existing.length === 0
          ? false
          : true // will filter properly below
      );

      // Get actual runner numbers that exist
      const raceRunners = await db.runners
        .where('raceId').equals(currentRaceId)
        .toArray();
      const raceNumbers = new Set(raceRunners.map(r => r.number));
      const validBibs = bibs.filter(b => raceNumbers.has(b));
      const notFoundBibs = bibs.filter(b => !raceNumbers.has(b));

      await markAsDNS(validBibs);
      setResult({ updated: validBibs.length, notFound: notFoundBibs.length });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Mark DNS</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enter bib numbers or ranges, e.g. 101, 105-110, 120
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <textarea
            aria-label="Bib numbers"
            rows={4}
            value={input}
            onChange={e => { setInput(e.target.value); setResult(null); }}
            placeholder="101, 105-110, 120"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 font-mono resize-none"
          />

          {result && (
            <div className={`text-sm rounded-lg p-3 ${result.notFound > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'}`}>
              {result.updated} runner{result.updated !== 1 ? 's' : ''} marked as DNS.
              {result.notFound > 0 && ` ${result.notFound} bib${result.notFound !== 1 ? 's' : ''} not found.`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          <button type="button" onClick={onClose} className="btn-secondary">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleMarkDns}
              disabled={!input.trim() || submitting || loading}
              className="btn-primary bg-amber-500 hover:bg-amber-400 disabled:opacity-40"
            >
              {submitting ? 'Marking…' : 'Mark DNS'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

BulkDnsModal.displayName = 'BulkDnsModal';
export default BulkDnsModal;

