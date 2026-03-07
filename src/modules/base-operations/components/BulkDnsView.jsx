import React, { useEffect, useState, useMemo, useCallback } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import db from '../../../shared/services/database/schema.js';

/**
 * BulkDnsModal — modal for bulk-marking not-yet-started runners as DNS.
 */
const BulkDnsModal = ({ isOpen, onClose }) => {
  const { currentRaceId, runners, markAsDNS, loading } = useBaseOperationsStore();
  const [allRunners, setAllRunners] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const loadRunners = useCallback(() => {
    if (!currentRaceId) return;
    db.runners.where('raceId').equals(currentRaceId).sortBy('number').then(setAllRunners);
  }, [currentRaceId]);

  useEffect(() => {
    if (isOpen) {
      loadRunners();
      setSelected(new Set());
      setSearch('');
    }
  }, [isOpen, loadRunners]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const processedNumbers = useMemo(() => {
    const s = new Set();
    for (const r of runners) s.add(r.number);
    return s;
  }, [runners]);

  const notStarted = useMemo(
    () => allRunners.filter(r => !processedNumbers.has(r.number)),
    [allRunners, processedNumbers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notStarted;
    return notStarted.filter(r =>
      String(r.number).includes(q) ||
      (r.firstName || '').toLowerCase().includes(q) ||
      (r.lastName || '').toLowerCase().includes(q)
    );
  }, [notStarted, search]);

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.number));

  const toggle = (num) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach(r => next.delete(r.number));
      } else {
        filtered.forEach(r => next.add(r.number));
      }
      return next;
    });
  };

  const handleMarkDns = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await markAsDNS([...selected]);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Mark DNS</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {notStarted.length} runner{notStarted.length !== 1 ? 's' : ''} not yet started
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

        {/* Search */}
        <div className="px-5 pt-4">
          <input
            type="search"
            placeholder="Search bib or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        {/* Runner list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              {notStarted.length === 0 ? 'All runners have been processed.' : 'No runners match your search.'}
            </p>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  Select all ({filtered.length})
                </span>
              </label>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(runner => (
                  <label
                    key={runner.number}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(runner.number)}
                      onChange={() => toggle(runner.number)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white w-14 flex-shrink-0">
                      #{runner.number}
                    </span>
                    {(runner.firstName || runner.lastName) && (
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {[runner.firstName, runner.lastName].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMarkDns}
            disabled={selected.size === 0 || submitting || loading}
            className="btn-primary bg-amber-500 hover:bg-amber-400 disabled:opacity-40"
          >
            {submitting ? 'Marking…' : `Mark DNS (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
};

BulkDnsModal.displayName = 'BulkDnsModal';
export default BulkDnsModal;
