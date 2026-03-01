import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TimeUtils from '../../../services/timeUtils';

/**
 * DuplicateEntriesDialog - Dialog for resolving duplicate runner entries
 * 
 * Features:
 * - Compare duplicate entries side by side
 * - Choose resolution strategy (keep, merge, delete)
 * - Visual diff of timestamps and checkpoints
 * - Audit trail for resolution actions
 */

const DuplicateEntriesDialog = ({ isOpen, onClose, duplicates, onResolve }) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen || !duplicates || duplicates.length === 0) return null;

  const handleResolve = async () => {
    if (!selectedAction) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      await onResolve(duplicates, selectedAction);
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to resolve duplicates'
      });
      setIsSubmitting(false);
    }
  };

  // Group duplicates by runner number
  const groupedDuplicates = duplicates.reduce((acc, entry) => {
    if (!acc[entry.number]) {
      acc[entry.number] = [];
    }
    acc[entry.number].push(entry);
    return acc;
  }, {});

  // Sort entries within each group by timestamp
  Object.values(groupedDuplicates).forEach(group => {
    group.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  const getTimeDifference = (entry1, entry2) => {
    const time1 = new Date(entry1.timestamp);
    const time2 = new Date(entry2.timestamp);
    const diffMs = Math.abs(time2 - time1);
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Resolve Duplicate Entries
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {Object.keys(groupedDuplicates).length} runner{Object.keys(groupedDuplicates).length !== 1 ? 's' : ''} with duplicate entries
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-lg p-2 touch-target"
            aria-label="Close"
            title="Close (Esc)"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Resolution Strategy */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resolution Strategy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedAction('keep-first')}
                className={`p-4 rounded-lg border-2 text-left ${
                  selectedAction === 'keep-first'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">Keep First Entry</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Keep the earliest entry and delete others
                </div>
              </button>
              <button
                onClick={() => setSelectedAction('keep-last')}
                className={`p-4 rounded-lg border-2 text-left ${
                  selectedAction === 'keep-last'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">Keep Last Entry</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Keep the latest entry and delete others
                </div>
              </button>
              <button
                onClick={() => setSelectedAction('merge')}
                className={`p-4 rounded-lg border-2 text-left ${
                  selectedAction === 'merge'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">Merge Entries</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Combine information from all entries
                </div>
              </button>
            </div>
          </div>

          {/* Duplicate Groups */}
          <div className="space-y-6">
            {Object.entries(groupedDuplicates).map(([number, entries]) => (
              <div key={number} className="card">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Runner #{number}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entries.length} duplicate entries
                  </p>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-lg ${
                          selectedAction === 'keep-first' && index === 0
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : selectedAction === 'keep-last' && index === entries.length - 1
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          Entry {index + 1}
                          {index === 0 && ' (Earliest)'}
                          {index === entries.length - 1 && index !== 0 && ' (Latest)'}
                        </span>
                        <div className="flex items-start justify-between mt-1">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              <span>Checkpoint {entry.checkpoint}</span>
                              {' • '}
                              <span>{TimeUtils.formatTime(entry.timestamp)}</span>
                            </div>
                            {entry.notes && (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {entry.notes}
                              </div>
                            )}
                          </div>
                          {index > 0 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              +<span>{getTimeDifference(entries[0], entry)}</span> from first
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedAction === 'keep-first' && 'Will keep earliest entry for each runner'}
            {selectedAction === 'keep-last' && 'Will keep latest entry for each runner'}
            {selectedAction === 'merge' && 'Will combine information from all entries'}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResolve}
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Resolve Duplicates'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DuplicateEntriesDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  duplicates: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    number: PropTypes.number.isRequired,
    checkpoint: PropTypes.number.isRequired,
    timestamp: PropTypes.string.isRequired,
    notes: PropTypes.string
  })),
  onResolve: PropTypes.func.isRequired
};

export default DuplicateEntriesDialog;
