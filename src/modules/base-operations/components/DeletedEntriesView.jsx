import React, { useState, useEffect } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';
import ConfirmModal from '../../../shared/components/ui/ConfirmModal';

/**
 * DeletedEntriesView - View and manage deleted entries with audit trail
 * 
 * Features:
 * - View all deleted entries with deletion metadata
 * - Restore deleted entries
 * - Filter by checkpoint, time range, or deletion reason
 * - Sort by various criteria
 * - Audit trail details
 */

const SORT_OPTIONS = {
  'deletion-time': {
    label: 'Deletion Time',
    sortFn: (a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)
  },
  'original-time': {
    label: 'Original Time',
    sortFn: (a, b) => new Date(b.originalEntry.timestamp) - new Date(a.originalEntry.timestamp)
  },
  'runner-number': {
    label: 'Runner Number',
    sortFn: (a, b) => a.originalEntry.number - b.originalEntry.number
  },
  checkpoint: {
    label: 'Checkpoint',
    sortFn: (a, b) => a.originalEntry.checkpoint - b.originalEntry.checkpoint
  }
};

const DeletedEntriesView = () => {
  const [sortOrder, setSortOrder] = useState('deletion-time');
  const [filterCheckpoint, setFilterCheckpoint] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showDetails, setShowDetails] = useState(new Set());
  const [restoreConfirm, setRestoreConfirm] = useState({ isOpen: false, entryId: null });

  const {
    deletedEntries,
    loadDeletedEntries,
    restoreEntry,
    loading
  } = useBaseOperationsStore();

  // Load deleted entries on mount
  useEffect(() => {
    loadDeletedEntries();
  }, [loadDeletedEntries]);

  const handleRefresh = () => {
    loadDeletedEntries();
  };

  const handleRestore = async (entryId) => {
    setRestoreConfirm({ isOpen: true, entryId });
  };

  const toggleDetails = (entryId) => {
    setShowDetails(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  // Filter entries
  const filteredEntries = deletedEntries.filter(entry => {
    // Filter by checkpoint
    if (filterCheckpoint !== 'all' && entry.originalEntry.checkpoint !== parseInt(filterCheckpoint)) {
      return false;
    }

    // Filter by time range
    if (selectedTimeRange !== 'all') {
      const deletedAt = new Date(entry.deletedAt);
      const now = new Date();
      switch (selectedTimeRange) {
        case '1h':
          if (now - deletedAt > 3600000) return false;
          break;
        case '24h':
          if (now - deletedAt > 86400000) return false;
          break;
        case '7d':
          if (now - deletedAt > 604800000) return false;
          break;
        default:
          break;
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        entry.originalEntry.number.toString().includes(term) ||
        entry.deletionReason?.toLowerCase().includes(term) ||
        entry.deletedBy?.toLowerCase().includes(term) ||
        entry.originalEntry.notes?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Sort entries
  const sortedEntries = [...filteredEntries].sort(SORT_OPTIONS[sortOrder].sortFn);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deleted Entries
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and manage deleted race entries
          </p>
        </div>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by number, reason, or user..."
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
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="form-input"
        >
          <option value="all">All Time</option>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
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

      {/* Entries List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No Deleted Entries
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm || filterCheckpoint !== 'all' || selectedTimeRange !== 'all'
                ? 'Try adjusting your filters'
                : 'No entries have been deleted yet'}
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
                    Original Entry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deletion Details
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedEntries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{entry.originalEntry.number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          Checkpoint {entry.originalEntry.checkpoint}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {TimeUtils.formatTime(entry.originalEntry.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          Deleted {TimeUtils.formatRelative(entry.deletedAt)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          by {entry.deletedBy}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleRestore(entry.id)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => toggleDetails(entry.id)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {showDetails.has(entry.id) ? 'Hide Details' : 'Show Details'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showDetails.has(entry.id) && (
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="space-y-3">
                            {/* Deletion Reason */}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                Deletion Reason
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {entry.deletionReason || 'No reason provided'}
                              </div>
                            </div>

                            {/* Original Notes */}
                            {entry.originalEntry.notes && (
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Original Notes
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {entry.originalEntry.notes}
                                </div>
                              </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Original Entry Time
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {TimeUtils.formatTime(entry.originalEntry.timestamp)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Deletion Time
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {TimeUtils.formatTime(entry.deletedAt)}
                                </div>
                              </div>
                            </div>

                            {/* Audit Info */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Entry ID: {entry.id} • Original Entry ID: {entry.originalEntry.id}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {sortedEntries.length} of {deletedEntries.length} deleted entries
      </p>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About Deleted Entries
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Deleted entries are preserved for audit purposes</li>
          <li>• Entries can be restored if deleted by mistake</li>
          <li>• All deletions are tracked with user and timestamp</li>
          <li>• Use filters to find specific deleted entries</li>
          <li>• Detailed view shows complete entry history</li>
        </ul>
      </div>

      <ConfirmModal
        isOpen={restoreConfirm.isOpen}
        onClose={() => setRestoreConfirm({ isOpen: false, entryId: null })}
        onConfirm={async () => {
          try {
            await restoreEntry(restoreConfirm.entryId);
          } catch (error) {
            console.error('Failed to restore entry:', error);
          }
          setRestoreConfirm({ isOpen: false, entryId: null });
        }}
        title="Restore Entry"
        message="Are you sure you want to restore this entry?"
        confirmLabel="Restore"
        confirmVariant="primary"
      />
    </div>
  );
};

export default DeletedEntriesView;
