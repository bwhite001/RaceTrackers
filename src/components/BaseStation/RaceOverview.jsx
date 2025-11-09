import React, { memo, useState, useCallback, useMemo } from 'react';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import useDeviceDetection from '../../shared/hooks/useDeviceDetection';
import { RUNNER_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../../types';
import { formatRunnerNumber } from '../../utils/runnerNumberUtils';

/**
 * RaceOverview Component
 * Displays a grid of all runners with their current status and checkpoint times
 */
const RaceOverview = memo(() => {
  // Device detection
  const { isDesktop } = useDeviceDetection();

  // Store access
  const {
    runners,
    stats,
    sortOrder,
    setSortOrder,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery
  } = useBaseOperationsStore();

  // Local state
  const [selectedRunner, setSelectedRunner] = useState(null);

  // Filter options
  const filterOptions = useMemo(() => [
    { value: 'all', label: 'All Runners' },
    { value: 'active', label: 'Active' },
    { value: 'finished', label: 'Finished' },
    { value: 'dnf', label: 'DNF' },
    { value: 'dns', label: 'DNS' }
  ], []);

  // Sort options
  const sortOptions = useMemo(() => [
    { value: 'number', label: 'Runner Number' },
    { value: 'status', label: 'Status' },
    { value: 'time', label: 'Finish Time' }
  ], []);

  // Filter runners
  const filteredRunners = useMemo(() => {
    let result = [...runners];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(runner => 
        runner.number.toString().includes(query) ||
        (runner.notes && runner.notes.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(runner => runner.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'status':
          return (STATUS_LABELS[a.status] || '').localeCompare(STATUS_LABELS[b.status] || '');
        case 'time':
          const aTime = a.finishTime || '';
          const bTime = b.finishTime || '';
          return aTime.localeCompare(bTime);
        case 'number':
        default:
          return a.number - b.number;
      }
    });

    return result;
  }, [runners, searchQuery, filterStatus, sortOrder]);

  // Handle runner click
  const handleRunnerClick = useCallback((runner) => {
    setSelectedRunner(prev => prev?.number === runner.number ? null : runner);
  }, []);

  // Get status color class
  const getStatusColorClass = useCallback((status) => {
    const color = STATUS_COLORS[status] || 'gray';
    return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/20 dark:text-${color}-200`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runner numbers or notes..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                     focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                     focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                     focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                Sort by: {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div 
            key={key}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Runners Grid */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Runner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                {isDesktop && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notes
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRunners.map(runner => (
                <tr 
                  key={runner.number}
                  onClick={() => handleRunnerClick(runner)}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 
                    ${selectedRunner?.number === runner.number ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatRunnerNumber(runner.number)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(runner.status)}`}>
                      {STATUS_LABELS[runner.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {runner.finishTime || '-'}
                  </td>
                  {isDesktop && (
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {runner.notes || '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredRunners.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No runners found matching your criteria
          </p>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
RaceOverview.displayName = 'RaceOverview';

export default RaceOverview;
