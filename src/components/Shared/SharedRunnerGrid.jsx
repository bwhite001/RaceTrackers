import React, { useState, useMemo, useEffect } from 'react';
import { RUNNER_STATUSES, GROUP_SIZES } from '../../types/index.js';
import TimeUtils from '../../services/timeUtils.js';

/**
 * Shared runner grid for checkpoint, base station, or global runners.
 * Props:
 * - runners: array of runner objects
 * - onMarkRunner: function to mark a runner as passed (legacy)
 * - onCallInRunner: function to call in a runner (new workflow)
 * - onMarkOffRunner: function to mark off a runner (new workflow)
 * - isLoading: boolean
 * - raceConfig: race configuration object
 * - settings: user settings object
 * - contextLabel: string (e.g. "Checkpoint 1", "Base Station")
 * - workflowMode: 'legacy' | 'checkpoint' | 'basestation' - determines available actions
 * - showMultipleTimes: boolean - whether to show both call-in and mark-off times
 */
const SharedRunnerGrid = ({
  runners,
  onMarkRunner,
  onCallInRunner,
  onMarkOffRunner,
  isLoading,
  raceConfig,
  settings,
  contextLabel = '',
  workflowMode = 'legacy',
  showMultipleTimes = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(settings?.runnerViewMode || 'grid');
  const [groupSize, setGroupSize] = useState(settings?.groupSize || 50);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Filter runners based on search term
  const filteredRunners = useMemo(() => {
    if (!searchTerm) return runners;
    const term = searchTerm.toLowerCase();
    return runners.filter(runner =>
      runner.number.toString().includes(term)
    );
  }, [runners, searchTerm]);

  // Group runners for large ranges
  const groupedRunners = useMemo(() => {
    if (!raceConfig || (raceConfig.maxRunner - raceConfig.minRunner) < groupSize) {
      return [{ start: raceConfig?.minRunner || 1, runners: filteredRunners }];
    }
    const groups = [];
    const totalRunners = raceConfig.maxRunner - raceConfig.minRunner + 1;
    for (let i = 0; i < totalRunners; i += groupSize) {
      const start = raceConfig.minRunner + i;
      const end = Math.min(start + groupSize - 1, raceConfig.maxRunner);
      const groupRunners = filteredRunners.filter(runner =>
        runner.number >= start && runner.number <= end
      );
      if (groupRunners.length > 0 || !searchTerm) {
        groups.push({
          start,
          end,
          runners: groupRunners,
          label: `${start}-${end}`
        });
      }
    }
    return groups;
  }, [filteredRunners, raceConfig, groupSize, searchTerm]);

  const handleRunnerClick = async (runner, action = 'primary') => {
    try {
      if (workflowMode === 'checkpoint') {
        if (action === 'callin' && onCallInRunner) {
          await onCallInRunner(runner.number);
        } else if (action === 'markoff' && onMarkOffRunner) {
          await onMarkOffRunner(runner.number);
        }
      } else if (workflowMode === 'basestation') {
        // Base station can perform both actions
        if (action === 'callin' && onCallInRunner) {
          await onCallInRunner(runner.number);
        } else if (action === 'markoff' && onMarkOffRunner) {
          await onMarkOffRunner(runner.number);
        }
      } else {
        // Legacy mode - single click to mark as passed
        if (runner.status === RUNNER_STATUSES.PASSED) return;
        if (onMarkRunner) {
          await onMarkRunner(runner.number);
        }
      }
    } catch (error) {
      console.error('Failed to update runner:', error);
    }
  };

  const getRunnerButtonClass = (runner) => {
    const baseClass = 'runner-button flex items-center justify-center text-sm font-medium rounded-lg border-2 focus-visible:focus';
    switch (runner.status) {
      case RUNNER_STATUSES.CALLED_IN:
        return `${baseClass} status-called-in cursor-pointer hover:opacity-80`;
      case RUNNER_STATUSES.MARKED_OFF:
        return `${baseClass} status-marked-off cursor-pointer hover:opacity-80`;
      case RUNNER_STATUSES.PASSED:
        return `${baseClass} status-passed cursor-default`;
      case RUNNER_STATUSES.NON_STARTER:
        return `${baseClass} status-non-starter cursor-default`;
      case RUNNER_STATUSES.DNF:
        return `${baseClass} status-dnf cursor-default`;
      case RUNNER_STATUSES.PENDING:
        return `${baseClass} status-pending cursor-pointer hover:opacity-80`;
      default:
        return `${baseClass} status-not-started cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600`;
    }
  };

  const getRunnerContent = (runner) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case RUNNER_STATUSES.CALLED_IN: return '📞';
        case RUNNER_STATUSES.MARKED_OFF: return '✓';
        case RUNNER_STATUSES.PASSED: return '✅';
        case RUNNER_STATUSES.NON_STARTER: return 'NS';
        case RUNNER_STATUSES.DNF: return 'DNF';
        case RUNNER_STATUSES.PENDING: return '⏳';
        default: return '';
      }
    };

    const content = (
      <>
        <span className="font-bold">{runner.number}</span>
        {showMultipleTimes && (
          <div className="text-xs mt-1 opacity-90 space-y-0.5">
            {runner.callInTime && (
              <div>📞 {TimeUtils.formatTime(runner.callInTime, 'HH:mm')}</div>
            )}
            {runner.markOffTime && (
              <div>✓ {TimeUtils.formatTime(runner.markOffTime, 'HH:mm')}</div>
            )}
          </div>
        )}
        {!showMultipleTimes && (runner.markOffTime || runner.recordedTime || runner.callInTime) && (
          <span className="text-xs mt-1 opacity-90">
            {TimeUtils.formatTime(runner.markOffTime || runner.recordedTime || runner.callInTime, 'HH:mm')}
          </span>
        )}
      </>
    );

    if (viewMode === 'list') {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">{content}</div>
          <div className="text-xs opacity-75">
            {getStatusIcon(runner.status)}
          </div>
        </div>
      );
    }
    return <div className="flex flex-col items-center">{content}</div>;
  };

  const toggleGroup = (groupStart) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupStart)) {
      newExpanded.delete(groupStart);
    } else {
      newExpanded.add(groupStart);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupStats = (groupRunners) => {
    const passed = groupRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).length;
    const total = groupRunners.length;
    return { passed, total, remaining: total - passed };
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search runner number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        {/* View Controls */}
        <div className="flex items-center space-x-4">
          {/* Group Size */}
          {raceConfig && (raceConfig.maxRunner - raceConfig.minRunner) >= 50 && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Group:</label>
              <select
                value={groupSize}
                onChange={(e) => setGroupSize(parseInt(e.target.value))}
                className="form-input py-1 text-sm"
              >
                {GROUP_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Results Count */}
      {searchTerm && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Found {filteredRunners.length} runner{filteredRunners.length !== 1 ? 's' : ''}
        </div>
      )}
      {/* Runner Groups */}
      <div className="space-y-4">
        {groupedRunners.map((group) => {
          const isExpanded = expandedGroups.has(group.start) || groupedRunners.length === 1;
          const stats = getGroupStats(group.runners);
          return (
            <div key={group.start} className="card">
              {/* Group Header (only show for multiple groups) */}
              {groupedRunners.length > 1 && (
                <div
                  className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => toggleGroup(group.start)}
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {contextLabel ? `${contextLabel}: ` : ''}Runners {group.label}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-status-passed mr-1"></div>
                        {stats.passed}
                      </span>
                      <span>/</span>
                      <span>{stats.total}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
              {/* Runner Grid/List */}
              {isExpanded && (
                <div className="p-4">
                  {group.runners.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No runners found in this range
                    </div>
                  ) : (
                    <div className={
                      viewMode === 'grid'
                        ? 'runner-grid'
                        : 'space-y-2'
                    }>
                      {group.runners.map((runner, index) => {
                        if (workflowMode === 'checkpoint' || workflowMode === 'basestation') {
                          // Enhanced workflow with multiple actions
                          return (
                            <div key={`${group.start}-${runner.number}-${index}`} className={`
                              ${viewMode === 'grid' ? 'h-16 w-full' : 'h-12 w-full'}
                              relative
                            `}>
                              <div className={`
                                ${getRunnerButtonClass(runner)}
                                h-full w-full
                                ${runner.status === RUNNER_STATUSES.PASSED ? 'cursor-default' : 'cursor-pointer'}
                              `}>
                                {getRunnerContent(runner)}
                                
                                {/* Action buttons for non-passed runners */}
                                {runner.status !== RUNNER_STATUSES.PASSED && runner.status !== RUNNER_STATUSES.NON_STARTER && runner.status !== RUNNER_STATUSES.DNF && (
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                                    <div className="flex space-x-1">
                                      {(runner.status === RUNNER_STATUSES.NOT_STARTED || runner.status === RUNNER_STATUSES.PENDING) && onCallInRunner && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRunnerClick(runner, 'callin');
                                          }}
                                          disabled={isLoading}
                                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                          title="Call In"
                                        >
                                          📞
                                        </button>
                                      )}
                                      {(runner.status === RUNNER_STATUSES.CALLED_IN || runner.status === RUNNER_STATUSES.MARKED_OFF) && onMarkOffRunner && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRunnerClick(runner, 'markoff');
                                          }}
                                          disabled={isLoading}
                                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                          title="Mark Off"
                                        >
                                          ✓
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          // Legacy single-click workflow
                          return (
                            <button
                              key={`${group.start}-${runner.number}-${index}`}
                              onClick={() => handleRunnerClick(runner)}
                              disabled={isLoading || runner.status === RUNNER_STATUSES.PASSED}
                              className={`
                                ${getRunnerButtonClass(runner)}
                                ${viewMode === 'grid' ? 'h-16 w-full' : 'h-12 w-full px-4'}
                                disabled:opacity-50
                              `}
                              title={`Runner ${runner.number} - ${runner.status.replace('-', ' ')}`}
                            >
                              {getRunnerContent(runner)}
                            </button>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Instructions
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          {workflowMode === 'checkpoint' && (
            <>
              <li>• Hover over runner numbers to see action buttons</li>
              <li>• Click 📞 to call in a runner (records call-in time)</li>
              <li>• Click ✓ to mark off a runner (records mark-off time)</li>
              <li>• Use the search bar to quickly find specific runners</li>
            </>
          )}
          {workflowMode === 'basestation' && (
            <>
              <li>• View all runners across all checkpoints</li>
              <li>• Hover over runner numbers to see action buttons</li>
              <li>• Click 📞 to call in or ✓ to mark off runners</li>
              <li>• Use the search bar to quickly find specific runners</li>
            </>
          )}
          {workflowMode === 'legacy' && (
            <>
              <li>• Click on a runner number to mark them as passed</li>
              <li>• Use the search bar to quickly find specific runners</li>
            </>
          )}
          <li>• Switch between grid and list view using the toggle buttons</li>
          <li>• For large ranges, runners are grouped for easier navigation</li>
        </ul>
      </div>
    </div>
  );
};

export default SharedRunnerGrid;
