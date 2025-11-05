import React, { useState, useEffect } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';

/**
 * LogOperationsPanel - Entry log management with CRUD operations
 * 
 * Features:
 * - View/update/delete log entries
 * - View deleted entries
 * - View duplicates
 * - Sort by checkpoint/time, number, or default order
 * - Filter and search functionality
 * - Audit trail
 */

const SORT_OPTIONS = {
  default: {
    label: 'Default Order',
    sortFn: (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  },
  'cp-time': {
    label: 'Checkpoint & Time',
    sortFn: (a, b) => {
      const cpDiff = a.checkpoint - b.checkpoint;
      return cpDiff !== 0 ? cpDiff : new Date(a.timestamp) - new Date(b.timestamp);
    }
  },
  number: {
    label: 'Runner Number',
    sortFn: (a, b) => a.number - b.number
  }
};

const LogOperationsPanel = () => {
  const [sortOrder, setSortOrder] = useState('default');
  const [filterCheckpoint, setFilterCheckpoint] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    logEntries,
    deletedEntries,
    duplicateEntries,
    loadLogEntries,
    loadDeletedEntries,
    loadDuplicateEntries,
    updateLogEntry,
    deleteLogEntry,
    restoreLogEntry,
    resolveDuplicate,
    loading
  } = useBaseOperationsStore();

  // Load entries on mount and when view changes
  useEffect(() => {
    if (showDeleted) {
      loadDeletedEntries();
    } else if (showDuplicates) {
      loadDuplicateEntries();
    } else {
      loadLogEntries();
    }
  }, [showDeleted, showDuplicates, loadLogEntries, loadDeletedEntries, loadDuplicateEntries]);

  const handleRefresh = () => {
    if (showDeleted) {
      loadDeletedEntries();
    } else if (showDuplicates) {
      loadDuplicateEntries();
    } else {
      loadLogEntries();
    }
  };

  // Filter and sort entries
  const filteredEntries = React.useMemo(() => {
    let entries = showDeleted ? deletedEntries : 
                 showDuplicates ? duplicateEntries : 
                 logEntries;

    // Apply checkpoint filter
    if (filterCheckpoint !== 'all') {
      entries = entries.filter(e => e.checkpoint === parseInt(filterCheckpoint));
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(e => 
        e.number.toString().includes(term) ||
        e.notes?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    return [...entries].sort(SORT_OPTIONS[sortOrder].sortFn);
  }, [
    logEntries,
    deletedEntries,
    duplicateEntries,
    showDeleted,
    showDuplicates,
    filterCheckpoint,
    searchTerm,
    sortOrder
  ]);

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    setShowEditModal(true);
  };

  const handleDelete = async (entry) => {
    if (window.confirm(`Are you sure you want to delete entry for runner ${entry.number}?`)) {
      try {
        await deleteLogEntry(entry.id);
      } catch (error) {
        console.error('Failed to delete entry:', error);
      }
    }
  };

  const handleRestore = async (entry) => {
    try {
      await restoreLogEntry(entry.id);
    } catch (error) {
      console.error('Failed to restore entry:', error);
    }
  };

  const handleResolveDuplicate = async (entry, action) => {
    try {
      await resolveDuplicate(entry.id, action);
    } catch (error) {
      console.error('Failed to resolve duplicate:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Log Operations
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {showDeleted ? 'Deleted Entries' : 
             showDuplicates ? 'Duplicate Entries' : 
             'Entry Log Management'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary"
            title="Refresh list"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => {
            setShowDeleted(false);
            setShowDuplicates(false);
          }}
          className={`px-4 py-2 rounded-lg font-medium ${
            !showDeleted && !showDuplicates
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Active Entries
        </button>
        <button
          onClick={() => {
            setShowDeleted(true);
            setShowDuplicates(false);
          }}
          className={`px-4 py-2 rounded-lg font-medium ${
            showDeleted
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Deleted Entries
        </button>
        <button
          onClick={() => {
            setShowDeleted(false);
            setShowDuplicates(true);
          }}
          className={`px-4 py-2 rounded-lg font-medium ${
            showDuplicates
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Duplicates
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by number or notes..."
            className="form-input w-full"
          />
        </div>
        <select
          value={filterCheckpoint}
          onChange={(e) => setFilterCheckpoint(e.target.value)}
          className="form-input"
        >
          <option value="all">All Checkpoints</option>
          {[1, 2, 3, 4, 5].map(cp => (
            <option key={cp} value={cp}>
              Checkpoint {cp}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="form-input"
        >
          {Object.entries(SORT_OPTIONS).map(([value, { label }]) => (
            <option key={value} value={value}>
              Sort by {label}
            </option>
          ))}
        </select>
      </div>

      {/* Entries Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No Entries Found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm || filterCheckpoint !== 'all'
                ? 'Try adjusting your filters'
                : showDeleted
                ? 'No deleted entries'
                : showDuplicates
                ? 'No duplicate entries'
                : 'No log entries yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Runner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Checkpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        #{entry.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        Checkpoint {entry.checkpoint}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {TimeUtils.formatTime(entry.timestamp)}
                      {entry.deletedAt && (
                        <div className="text-xs text-red-500 dark:text-red-400">
                          Deleted: {TimeUtils.formatTime(entry.deletedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {entry.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {showDuplicates ? (
                          <>
                            <button
                              onClick={() => handleResolveDuplicate(entry, 'keep')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Keep
                            </button>
                            <button
                              onClick={() => handleResolveDuplicate(entry, 'merge')}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Merge
                            </button>
                            <button
                              onClick={() => handleResolveDuplicate(entry, 'delete')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </>
                        ) : showDeleted ? (
                          <button
                            onClick={() => handleRestore(entry)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredEntries.length} of {
          showDeleted ? deletedEntries.length :
          showDuplicates ? duplicateEntries.length :
          logEntries.length
        } entries
      </p>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About Log Operations
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• View and manage all race log entries</li>
          <li>• Edit entries to correct mistakes</li>
          <li>• Delete entries with full audit trail</li>
          <li>• Restore accidentally deleted entries</li>
          <li>• Resolve duplicate entries through merge or deletion</li>
          <li>• Sort and filter for easy data management</li>
        </ul>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedEntry && (
        <EditEntryModal
          entry={selectedEntry}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEntry(null);
          }}
          onUpdate={updateLogEntry}
        />
      )}
    </div>
  );
};

// Edit Entry Modal Component
const EditEntryModal = ({ entry, onClose, onUpdate }) => {
  const [checkpoint, setCheckpoint] = useState(entry.checkpoint);
  const [timestamp, setTimestamp] = useState(entry.timestamp);
  const [notes, setNotes] = useState(entry.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!timestamp) {
      newErrors.timestamp = 'Time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdate(entry.id, {
        checkpoint,
        timestamp,
        notes: notes.trim() || null
      });
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to update entry'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Runner Number (Display Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Runner Number
            </label>
            <input
              type="text"
              value={entry.number}
              disabled
              className="form-input w-full bg-gray-100 dark:bg-gray-700"
            />
          </div>

          {/* Checkpoint */}
          <div>
            <label htmlFor="checkpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Checkpoint
            </label>
            <select
              id="checkpoint"
              value={checkpoint}
              onChange={(e) => setCheckpoint(parseInt(e.target.value))}
              className="form-input w-full"
            >
              {[1, 2, 3, 4, 5].map(cp => (
                <option key={cp} value={cp}>
                  Checkpoint {cp}
                </option>
              ))}
            </select>
          </div>

          {/* Timestamp */}
          <div>
            <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time
            </label>
            <input
              type="datetime-local"
              id="timestamp"
              value={TimeUtils.formatDateTimeLocal(timestamp)}
              onChange={(e) => setTimestamp(e.target.value)}
              className={`form-input w-full ${errors.timestamp ? 'border-red-500' : ''}`}
            />
            {errors.timestamp && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.timestamp}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="form-input w-full"
              placeholder="Add any notes about this entry..."
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogOperationsPanel;
