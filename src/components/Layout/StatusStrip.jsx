import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * StatusStrip Component
 * Displays live statistics and status information at the bottom of the base station view
 */
const StatusStrip = memo(({ stats, lastSync }) => {
  const {
    total,
    finished,
    active,
    dnf,
    dns
  } = stats;

  // Calculate remaining runners
  const remaining = total - finished - dnf - dns;

  // Format last sync time
  const lastSyncFormatted = lastSync 
    ? formatDistanceToNow(new Date(lastSync), { addSuffix: true })
    : 'Never';

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          {/* Runner Statistics */}
          <div className="flex space-x-4">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">Total:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{total}</span>
            </div>

            <div className="flex items-center">
              <span className="font-medium text-green-600 dark:text-green-400">Finished:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{finished}</span>
            </div>

            <div className="flex items-center">
              <span className="font-medium text-blue-600 dark:text-blue-400">Active:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{active}</span>
            </div>

            <div className="flex items-center">
              <span className="font-medium text-red-600 dark:text-red-400">DNF:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{dnf}</span>
            </div>

            <div className="flex items-center">
              <span className="font-medium text-yellow-600 dark:text-yellow-400">DNS:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{dns}</span>
            </div>

            <div className="flex items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">Remaining:</span>
              <span className="ml-1 text-gray-900 dark:text-white">{remaining}</span>
            </div>
          </div>

          {/* Last Sync Status */}
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            <span>Last update: {lastSyncFormatted}</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

StatusStrip.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    finished: PropTypes.number.isRequired,
    active: PropTypes.number.isRequired,
    dnf: PropTypes.number.isRequired,
    dns: PropTypes.number.isRequired
  }).isRequired,
  lastSync: PropTypes.string
};

StatusStrip.defaultProps = {
  lastSync: null
};

// Add display name for debugging
StatusStrip.displayName = 'StatusStrip';

export default StatusStrip;
