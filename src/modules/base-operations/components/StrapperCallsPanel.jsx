import React, { useState, useEffect } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';

/**
 * StrapperCallsPanel - Resource request management for checkpoints
 * 
 * Features:
 * - Add/update/complete/delete strapper calls
 * - Priority levels (low, medium, high, urgent)
 * - Status tracking (pending, in-progress, completed)
 * - Real-time updates
 * - Checkpoint filtering
 * - Auto-refresh capability
 */

const PRIORITIES = {
  urgent: {
    label: 'Urgent',
    color: 'red',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  },
  high: {
    label: 'High',
    color: 'orange',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    )
  },
  medium: {
    label: 'Medium',
    color: 'yellow',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    )
  },
  low: {
    label: 'Low',
    color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
      </svg>
    )
  }
};

const STATUSES = {
  pending: {
    label: 'Pending',
    color: 'yellow'
  },
  'in-progress': {
    label: 'In Progress',
    color: 'blue'
  },
  completed: {
    label: 'Completed',
    color: 'green'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray'
  }
};

const StrapperCallsPanel = () => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const {
    strapperCalls,
    loadStrapperCalls,
    addStrapperCall,
    updateStrapperCall,
    completeStrapperCall,
    deleteStrapperCall,
    loading
  } = useBaseOperationsStore();

  // Load strapper calls on mount
  useEffect(() => {
    loadStrapperCalls();
  }, [loadStrapperCalls]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadStrapperCalls();
      }, 30000); // Refresh every 30 seconds

      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, loadStrapperCalls]);

  const handleRefresh = () => {
    loadStrapperCalls();
  };

  // Filter calls by checkpoint and status
  const filteredCalls = strapperCalls.filter(call => {
    if (selectedCheckpoint !== 'all' && call.checkpoint !== parseInt(selectedCheckpoint)) {
      return false;
    }
    if (selectedStatus !== 'all' && call.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Sort calls by priority and creation time
  const sortedCalls = [...filteredCalls].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Count by status
  const statusCounts = {
    pending: strapperCalls.filter(c => c.status === 'pending').length,
    'in-progress': strapperCalls.filter(c => c.status === 'in-progress').length,
    completed: strapperCalls.filter(c => c.status === 'completed').length,
    cancelled: strapperCalls.filter(c => c.status === 'cancelled').length
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Strapper Calls
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resource requests from checkpoints
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
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Call
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.pending}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusCounts['in-progress']}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.completed}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Cancelled</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{statusCounts.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedCheckpoint}
          onChange={(e) => setSelectedCheckpoint(e.target.value)}
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
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="form-input"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUSES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Calls List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedCalls.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No Strapper Calls
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedCheckpoint !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'No resource requests at this time'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Checkpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedCalls.map((call) => {
                  const priority = PRIORITIES[call.priority];
                  const status = STATUSES[call.status];

                  return (
                    <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-${priority.color}-600 dark:text-${priority.color}-400`}>
                          {priority.icon}
                          <span className="ml-2 text-sm font-medium">
                            {priority.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          Checkpoint {call.checkpoint}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {call.description}
                          {call.notes && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                              {call.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800 dark:bg-${status.color}-900/30 dark:text-${status.color}-200`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {TimeUtils.formatTime(call.createdAt)}
                        {call.completedAt && (
                          <div className="text-xs">
                            Completed: {TimeUtils.formatTime(call.completedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {call.status === 'pending' && (
                            <button
                              onClick={() => updateStrapperCall(call.id, { status: 'in-progress' })}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Start
                            </button>
                          )}
                          {call.status === 'in-progress' && (
                            <button
                              onClick={() => completeStrapperCall(call.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Complete
                            </button>
                          )}
                          {(call.status === 'pending' || call.status === 'in-progress') && (
                            <button
                              onClick={() => updateStrapperCall(call.id, { status: 'cancelled' })}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => deleteStrapperCall(call.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-refresh Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="autoRefresh"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="autoRefresh" className="text-sm text-gray-700 dark:text-gray-300">
          Auto-refresh every 30 seconds
        </label>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About Strapper Calls
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Urgent:</strong> Immediate attention required (medical, safety)</li>
          <li>• <strong>High:</strong> Time-sensitive resource needs</li>
          <li>• <strong>Medium:</strong> Standard resource requests</li>
          <li>• <strong>Low:</strong> Non-urgent support needs</li>
          <li>• Use this panel to coordinate resource allocation between checkpoints</li>
        </ul>
      </div>

      {/* Add Call Modal */}
      {showAddModal && (
        <AddStrapperCallModal
          onClose={() => setShowAddModal(false)}
          onAdd={addStrapperCall}
        />
      )}
    </div>
  );
};

// Add Call Modal Component
const AddStrapperCallModal = ({ onClose, onAdd }) => {
  const [checkpoint, setCheckpoint] = useState(1);
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
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
      await onAdd(checkpoint, priority, description.trim());
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to create strapper call'
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
            New Strapper Call
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

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="form-input w-full"
            >
              {Object.entries(PRIORITIES).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`form-input w-full ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe the resource need..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
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
                <span>Creating...</span>
              </div>
            ) : (
              'Create Call'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrapperCallsPanel;
