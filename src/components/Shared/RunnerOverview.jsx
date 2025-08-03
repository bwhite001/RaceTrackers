import React, { useState, useMemo } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import { RUNNER_STATUSES, APP_MODES } from '../../types/index.js';
import TimeUtils from '../../services/timeUtils.js';

const RunnerOverview = () => {
  const { 
    runners, 
    markRunnerStatus, 
    getRunnerCounts,
    isSegmentCalled,
    mode,
    raceConfig,
    isLoading 
  } = useRaceStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('number');
  const [sortOrder, setSortOrder] = useState('asc');

  const counts = getRunnerCounts();

  // Filter and sort runners
  const filteredAndSortedRunners = useMemo(() => {
    let filtered = runners;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(runner => 
        runner.number.toString().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(runner => runner.status === statusFilter);
    }

    // Sort runners
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'number':
          aValue = a.number;
          bValue = b.number;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'time':
          aValue = a.recordedTime ? new Date(a.recordedTime).getTime() : 0;
          bValue = b.recordedTime ? new Date(b.recordedTime).getTime() : 0;
          break;
        default:
          aValue = a.number;
          bValue = b.number;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [runners, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleStatusChange = async (runnerNumber, newStatus) => {
    try {
      await markRunnerStatus(runnerNumber, newStatus);
    } catch (error) {
      console.error('Failed to update runner status:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'status-indicator';
    switch (status) {
      case RUNNER_STATUSES.PASSED:
        return `${baseClass} status-passed`;
      case RUNNER_STATUSES.NON_STARTER:
        return `${baseClass} status-non-starter`;
      case RUNNER_STATUSES.DNF:
        return `${baseClass} status-dnf`;
      default:
        return `${baseClass} status-not-started`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case RUNNER_STATUSES.PASSED:
        return 'Passed';
      case RUNNER_STATUSES.NON_STARTER:
        return 'Non-Starter';
      case RUNNER_STATUSES.DNF:
        return 'DNF';
      default:
        return 'Not Started';
    }
  };

  const getRaceElapsedTime = (timestamp) => {
    if (!raceConfig || !timestamp) return '';
    
    const raceStart = TimeUtils.createRaceTimestamp(raceConfig.date, raceConfig.startTime);
    return TimeUtils.formatDuration(raceStart, timestamp);
  };

  const canChangeStatus = (runner) => {
    // In checkpoint mode, can only change to non-starter or DNF
    // In base station mode, can change to any status
    return mode === APP_MODES.BASE_STATION || 
           (mode === APP_MODES.CHECKPOINT && runner.status !== RUNNER_STATUSES.PASSED);
  };

  const getAvailableStatuses = (currentStatus) => {
    if (mode === APP_MODES.BASE_STATION) {
      return [
        RUNNER_STATUSES.NOT_STARTED,
        RUNNER_STATUSES.PASSED,
        RUNNER_STATUSES.NON_STARTER,
        RUNNER_STATUSES.DNF
      ];
    } else {
      // Checkpoint mode - can only mark as non-starter or DNF
      return [
        RUNNER_STATUSES.NON_STARTER,
        RUNNER_STATUSES.DNF
      ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {counts.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total Runners
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {counts.passed}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Passed
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">
            {counts.notStarted}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Not Started
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-500 dark:text-red-400">
            {counts.nonStarter + counts.dnf}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            NS + DNF
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search runner number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pr-10"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input py-1 text-sm"
              >
                <option value="all">All</option>
                <option value={RUNNER_STATUSES.NOT_STARTED}>Not Started</option>
                <option value={RUNNER_STATUSES.PASSED}>Passed</option>
                <option value={RUNNER_STATUSES.NON_STARTER}>Non-Starter</option>
                <option value={RUNNER_STATUSES.DNF}>DNF</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input py-1 text-sm"
              >
                <option value="number">Number</option>
                <option value="status">Status</option>
                <option value="time">Time</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Showing {filteredAndSortedRunners.length} of {runners.length} runners
        </div>
      </div>

      {/* Runners Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Runner #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                {mode === APP_MODES.CHECKPOINT && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Called
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Elapsed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedRunners.map((runner) => (
                <tr key={runner.number} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {runner.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadgeClass(runner.status)}>
                      {getStatusLabel(runner.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {runner.recordedTime ? TimeUtils.formatTime(runner.recordedTime) : '--:--:--'}
                  </td>
                  {mode === APP_MODES.CHECKPOINT && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {runner.recordedTime ? (
                        isSegmentCalled(runner.recordedTime) ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {getRaceElapsedTime(runner.recordedTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canChangeStatus(runner) && (
                      <div className="flex items-center justify-end space-x-2">
                        {getAvailableStatuses(runner.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(runner.number, status)}
                            disabled={isLoading || runner.status === status}
                            className={`px-2 py-1 text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              status === RUNNER_STATUSES.NON_STARTER
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                                : status === RUNNER_STATUSES.DNF
                                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {status === RUNNER_STATUSES.NON_STARTER ? 'NS' : 
                             status === RUNNER_STATUSES.DNF ? 'DNF' :
                             status === RUNNER_STATUSES.PASSED ? 'Pass' : 'Reset'}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedRunners.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No runners found matching the current filters
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Overview Instructions
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• View all runners and their current status</li>
          <li>• Use filters to find specific runners or status groups</li>
          <li>• Sort by runner number, status, or recorded time</li>
          {mode === APP_MODES.CHECKPOINT && (
            <>
              <li>• "Called" column shows if the runner's time segment has been reported</li>
              <li>• Mark runners as Non-Starter (NS) or Did Not Finish (DNF) as needed</li>
            </>
          )}
          {mode === APP_MODES.BASE_STATION && (
            <li>• Update runner status using the action buttons</li>
          )}
          <li>• Elapsed time shows duration since race start</li>
        </ul>
      </div>
    </div>
  );
};

export default RunnerOverview;
