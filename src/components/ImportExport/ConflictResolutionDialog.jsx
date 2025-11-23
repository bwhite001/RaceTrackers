import React, { useState } from 'react';

/**
 * Conflict Resolution Dialog
 * Allows users to manually resolve import conflicts between existing and incoming data
 * 
 * @param {Object} props
 * @param {Array} props.conflicts - Array of conflict objects
 * @param {Function} props.onResolve - Callback with resolution decisions
 * @param {Function} props.onCancel - Callback when user cancels
 */
export const ConflictResolutionDialog = ({ conflicts, onResolve, onCancel }) => {
  // State: Track resolution decisions { conflictId: 'existing' | 'incoming' }
  const [resolutions, setResolutions] = useState({});

  /**
   * Handle resolution selection for a specific conflict
   */
  const handleResolution = (conflictId, choice) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: choice,
    }));
  };

  /**
   * Submit resolutions when all conflicts resolved
   */
  const handleSubmit = () => {
    onResolve(resolutions);
  };

  /**
   * Check if all conflicts have been resolved
   */
  const allResolved = conflicts.every(c => resolutions[c.id]);
  const resolvedCount = Object.keys(resolutions).length;

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Resolve Import Conflicts
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected. 
              Choose which version to keep for each item.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conflict List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
            >
              {/* Conflict Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {conflict.type}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">{conflict.id}</code>
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                  Conflict
                </span>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Existing Version */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    resolutions[conflict.id] === 'existing'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                  }`}
                  onClick={() => handleResolution(conflict.id, 'existing')}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleResolution(conflict.id, 'existing');
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      Keep Existing
                    </span>
                    <input
                      type="radio"
                      checked={resolutions[conflict.id] === 'existing'}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600"
                      aria-label="Select existing version"
                    />
                  </div>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Name:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {conflict.existing.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatTimestamp(conflict.existingValue)}
                      </p>
                    </div>
                    {conflict.existing.status && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {conflict.existing.status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Incoming Version */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    resolutions[conflict.id] === 'incoming'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                  }`}
                  onClick={() => handleResolution(conflict.id, 'incoming')}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleResolution(conflict.id, 'incoming');
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      Use Incoming
                    </span>
                    <input
                      type="radio"
                      checked={resolutions[conflict.id] === 'incoming'}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600"
                      aria-label="Select incoming version"
                    />
                  </div>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Name:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {conflict.incoming.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatTimestamp(conflict.incomingValue)}
                      </p>
                    </div>
                    {conflict.incoming.status && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {conflict.incoming.status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Helper Text */}
              {resolutions[conflict.id] && (
                <p className="mt-3 text-xs text-green-600 dark:text-green-400">
                  ✓ Resolved: Will keep <strong>{resolutions[conflict.id]}</strong> version
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {resolvedCount} of {conflicts.length}
            </span>{' '}
            conflicts resolved
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allResolved}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                allResolved
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Import ({resolvedCount}/{conflicts.length} resolved)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionDialog;
