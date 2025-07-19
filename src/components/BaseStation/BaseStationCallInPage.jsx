import React, { useState, useMemo } from 'react';
import useRaceStore from '../../store/useRaceStore.js';
import TimeUtils from '../../services/timeUtils.js';
import { SEGMENT_DURATION_MINUTES } from '../../types/index.js';

const BaseStationCallInPage = () => {
  const {
    baseStationRunners,
    markBaseStationRunner,
    bulkMarkBaseStationRunners,
    loadBaseStationRunners,
    raceConfig
  } = useRaceStore();

  const [selectedRunners, setSelectedRunners] = useState(new Set());
  const [commonCallInTime, setCommonCallInTime] = useState('');
  const [commonMarkOffTime, setCommonMarkOffTime] = useState('');
  const [individualMode, setIndividualMode] = useState(false);

  // Load base station runners when component mounts
  React.useEffect(() => {
    loadBaseStationRunners();
  }, [loadBaseStationRunners]);

  // Group runners by status
  const groupedRunners = useMemo(() => {
    const notStarted = baseStationRunners.filter(r => r.status === 'not-started');
    const passed = baseStationRunners.filter(r => r.status === 'passed');
    const dnf = baseStationRunners.filter(r => r.status === 'dnf');
    const nonStarter = baseStationRunners.filter(r => r.status === 'non-starter');
    
    return { notStarted, passed, dnf, nonStarter };
  }, [baseStationRunners]);

  // Group runners by time segments for call-in
  const timeSegments = useMemo(() => {
    const passedRunners = baseStationRunners.filter(r => r.status === 'passed' && r.markOffTime);
    return TimeUtils.groupRunnersBySegments(passedRunners, 'markOffTime');
  }, [baseStationRunners]);

  const handleRunnerSelection = (runnerNumber) => {
    const newSelected = new Set(selectedRunners);
    if (newSelected.has(runnerNumber)) {
      newSelected.delete(runnerNumber);
    } else {
      newSelected.add(runnerNumber);
    }
    setSelectedRunners(newSelected);
  };

  const handleBulkMark = async () => {
    if (selectedRunners.size === 0) return;

    const callInTime = commonCallInTime || new Date().toISOString();
    const markOffTime = commonMarkOffTime || callInTime;

    try {
      await bulkMarkBaseStationRunners(
        Array.from(selectedRunners),
        callInTime,
        markOffTime,
        'passed'
      );
      setSelectedRunners(new Set());
      setCommonCallInTime('');
      setCommonMarkOffTime('');
    } catch (error) {
      console.error('Failed to mark runners:', error);
    }
  };

  const handleIndividualMark = async (runnerNumber, callInTime, markOffTime) => {
    try {
      await markBaseStationRunner(
        runnerNumber,
        callInTime || new Date().toISOString(),
        markOffTime || callInTime,
        'passed'
      );
    } catch (error) {
      console.error('Failed to mark runner:', error);
    }
  };

  const getRaceElapsedTime = (timestamp) => {
    if (!raceConfig) return '';
    
    const raceStart = TimeUtils.createRaceTimestamp(raceConfig.date, raceConfig.startTime);
    return TimeUtils.formatDuration(raceStart, timestamp);
  };

  const formatRunnerList = (runners) => {
    const numbers = runners.map(r => r.number).sort((a, b) => a - b);
    
    // Group consecutive numbers for compact display
    const groups = [];
    let start = numbers[0];
    let end = numbers[0];
    
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === end + 1) {
        end = numbers[i];
      } else {
        if (start === end) {
          groups.push(start.toString());
        } else if (end === start + 1) {
          groups.push(`${start}, ${end}`);
        } else {
          groups.push(`${start}-${end}`);
        }
        start = end = numbers[i];
      }
    }
    
    if (numbers.length > 0) {
      if (start === end) {
        groups.push(start.toString());
      } else if (end === start + 1) {
        groups.push(`${start}, ${end}`);
      } else {
        groups.push(`${start}-${end}`);
      }
    }
    
    return groups.join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Base Station Call-In
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIndividualMode(!individualMode)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              individualMode
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {individualMode ? 'Individual Mode' : 'Bulk Mode'}
          </button>
        </div>
      </div>

      {/* Bulk Mode Controls */}
      {!individualMode && (
        <div className="card p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Bulk Mark Runners</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Common Call-In Time
              </label>
              <input
                type="datetime-local"
                value={commonCallInTime ? commonCallInTime.slice(0, 16) : ''}
                onChange={(e) => setCommonCallInTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Common Mark-Off Time
              </label>
              <input
                type="datetime-local"
                value={commonMarkOffTime ? commonMarkOffTime.slice(0, 16) : ''}
                onChange={(e) => setCommonMarkOffTime(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="form-input"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleBulkMark}
                disabled={selectedRunners.size === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark {selectedRunners.size} Runner{selectedRunners.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Selected: {formatRunnerList(
              baseStationRunners.filter(r => selectedRunners.has(r.number))
            )}
          </div>
        </div>
      )}

      {/* Runners List */}
      <div className="space-y-4">
        {/* Not Started Runners */}
        {groupedRunners.notStarted.length > 0 && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Not Started ({groupedRunners.notStarted.length})
              </h4>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {groupedRunners.notStarted.map(runner => (
                  <div
                    key={runner.number}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      !individualMode && selectedRunners.has(runner.number)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {!individualMode && (
                        <input
                          type="checkbox"
                          checked={selectedRunners.has(runner.number)}
                          onChange={() => handleRunnerSelection(runner.number)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        Runner {runner.number}
                      </span>
                    </div>
                    
                    {individualMode && (
                      <button
                        onClick={() => handleIndividualMark(runner.number)}
                        className="btn-primary text-sm"
                      >
                        Mark Passed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Passed Runners */}
        {groupedRunners.passed.length > 0 && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Passed ({groupedRunners.passed.length})
              </h4>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {groupedRunners.passed.map(runner => (
                  <div
                    key={runner.number}
                    className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Runner {runner.number}
                      </span>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {runner.markOffTime && (
                          <>
                            <span>Marked at: {new Date(runner.markOffTime).toLocaleTimeString()}</span>
                            {raceConfig && (
                              <span className="ml-2">
                                (+{getRaceElapsedTime(runner.markOffTime)})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Time Segments for Call-In */}
        {timeSegments.length > 0 && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Time Segments ({timeSegments.length})
              </h4>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {timeSegments.map(segment => (
                  <div key={`${segment.startTime}-${segment.endTime}`} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(segment.startTime).toLocaleTimeString()} - {new Date(segment.endTime).toLocaleTimeString()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {segment.runners.length} runner{segment.runners.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatRunnerList(segment.runners)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Base Station Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-800 dark:text-blue-200">Total:</span>
            <span className="ml-2 font-medium">{baseStationRunners.length}</span>
          </div>
          <div>
            <span className="text-blue-800 dark:text-blue-200">Not Started:</span>
            <span className="ml-2 font-medium">{groupedRunners.notStarted.length}</span>
          </div>
          <div>
            <span className="text-blue-800 dark:text-blue-200">Passed:</span>
            <span className="ml-2 font-medium">{groupedRunners.passed.length}</span>
          </div>
          <div>
            <span className="text-blue-800 dark:text-blue-200">Other:</span>
            <span className="ml-2 font-medium">{groupedRunners.dnf.length + groupedRunners.nonStarter.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseStationCallInPage;
