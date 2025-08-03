import React, { useState, useEffect } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import SharedRunnerGrid from '../Shared/SharedRunnerGrid.jsx';
import TimeUtils from '../../services/timeUtils.js';
import { RUNNER_STATUSES } from '../../types/index.js';

const DataEntry = () => {
  const { 
    baseStationRunners,
    loadBaseStationRunners,
    markBaseStationRunner,
    bulkMarkBaseStationRunners,
    bulkMarkRunners,
    bulkMarkRunnersAtCheckpoint,
    importCheckpointResults,
    raceConfig, 
    runners,
    checkpoints,
    isLoading 
  } = useRaceStore();

  const [activeTab, setActiveTab] = useState('master-view');
  const [commonTime, setCommonTime] = useState('');
  const [runnerInput, setRunnerInput] = useState('');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(1);
  const [importData, setImportData] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);

  // Load base station runners when component mounts
  useEffect(() => {
    loadBaseStationRunners();
  }, [loadBaseStationRunners]);

  const handleTimeChange = (e) => {
    setCommonTime(e.target.value);
    if (validationErrors.commonTime) {
      setValidationErrors(prev => ({ ...prev, commonTime: '' }));
    }
  };

  const handleRunnerInputChange = (e) => {
    setRunnerInput(e.target.value);
    if (validationErrors.runners) {
      setValidationErrors(prev => ({ ...prev, runners: '' }));
    }
  };

  const parseRunnerNumbers = (input) => {
    if (!input.trim()) return [];

    const numbers = [];
    const parts = input.split(/[,\n\s]+/).filter(part => part.trim());

    for (const part of parts) {
      const trimmed = part.trim();
      
      // Handle ranges like "100-105"
      const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        
        if (start <= end && end - start <= 100) { // Limit range size
          for (let i = start; i <= end; i++) {
            numbers.push(i);
          }
        }
      } else {
        // Handle individual numbers
        const num = parseInt(trimmed);
        if (!isNaN(num) && num > 0) {
          numbers.push(num);
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(numbers)].sort((a, b) => a - b);
  };

  const validateForm = () => {
    const errors = {};

    // Validate common time
    if (!commonTime) {
      errors.commonTime = 'Common time is required';
    } else {
      const timestamp = TimeUtils.datetimeLocalToISO(commonTime);
      if (!timestamp) {
        errors.commonTime = 'Invalid date/time format';
      }
    }

    // Validate runner numbers
    if (!runnerInput.trim()) {
      errors.runners = 'At least one runner number is required';
    } else {
      const numbers = parseRunnerNumbers(runnerInput);
      
      if (numbers.length === 0) {
        errors.runners = 'No valid runner numbers found';
      } else {
        // Check if numbers are within race range
        const invalidNumbers = numbers.filter(num => 
          !raceConfig || num < raceConfig.minRunner || num > raceConfig.maxRunner
        );
        
        if (invalidNumbers.length > 0) {
          errors.runners = `Invalid runner numbers (outside range ${raceConfig?.minRunner}-${raceConfig?.maxRunner}): ${invalidNumbers.join(', ')}`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const numbers = parseRunnerNumbers(runnerInput);
      const timestamp = TimeUtils.datetimeLocalToISO(commonTime);
      
      // Use checkpoint-specific marking if checkpoints are available
      if (checkpoints && checkpoints.length > 0) {
        await bulkMarkRunnersAtCheckpoint(numbers, selectedCheckpoint, null, timestamp, RUNNER_STATUSES.PASSED);
      } else {
        await bulkMarkRunners(numbers, RUNNER_STATUSES.PASSED, timestamp);
      }
      
      // Clear form on success
      setRunnerInput('');
      // Keep the time for potential next entry
      
    } catch (error) {
      console.error('Failed to assign times:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportCheckpointData = async () => {
    if (!importData.trim()) return;

    setIsProcessing(true);
    try {
      const data = JSON.parse(importData.trim());
      await importCheckpointResults(data);
      setImportData('');
      setShowImportSection(false);
    } catch (error) {
      console.error('Failed to import checkpoint data:', error);
      setValidationErrors(prev => ({ ...prev, import: 'Invalid checkpoint data format' }));
    } finally {
      setIsProcessing(false);
    }
  };

  const getPreviewNumbers = () => {
    if (!runnerInput.trim()) return [];
    return parseRunnerNumbers(runnerInput);
  };

  const previewNumbers = getPreviewNumbers();

  // Get current time as default
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    // Adjust for timezone offset to get local time
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
  };

  const setCurrentTime = () => {
    setCommonTime(getCurrentDateTimeLocal());
  };

  const setRaceStartTime = () => {
    if (raceConfig) {
      const raceDateTime = TimeUtils.createRaceTimestamp(raceConfig.date, raceConfig.startTime);
      setCommonTime(TimeUtils.isoToDatetimeLocal(raceDateTime));
    }
  };

  const handleCallInRunner = async (runnerNumber) => {
    try {
      await markBaseStationRunner(
        runnerNumber,
        new Date().toISOString(), // callInTime
        null, // markOffTime
        RUNNER_STATUSES.CALLED_IN
      );
    } catch (error) {
      console.error('Failed to call in runner:', error);
      throw error;
    }
  };

  const handleMarkOffRunner = async (runnerNumber) => {
    try {
      const runner = baseStationRunners.find(r => r.number === runnerNumber);
      const callInTime = runner?.callInTime || new Date().toISOString();
      
      await markBaseStationRunner(
        runnerNumber,
        callInTime, // preserve existing callInTime or use current time
        new Date().toISOString(), // markOffTime
        RUNNER_STATUSES.PASSED
      );
    } catch (error) {
      console.error('Failed to mark off runner:', error);
      throw error;
    }
  };

  const tabs = [
    { id: 'master-view', label: 'Master View', icon: '👁️' },
    { id: 'bulk-entry', label: 'Bulk Data Entry', icon: '📝' }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'master-view' && (
        <div className="space-y-4">
          {/* Base Station Status */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
              Base Station - Master View
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600 dark:text-gray-300">
                  {baseStationRunners.filter(r => r.status === RUNNER_STATUSES.NOT_STARTED).length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Not Started</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {baseStationRunners.filter(r => r.status === RUNNER_STATUSES.CALLED_IN).length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Called In</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {baseStationRunners.filter(r => r.status === RUNNER_STATUSES.PASSED).length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Finished</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {baseStationRunners.filter(r => r.status === RUNNER_STATUSES.DNF).length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">DNF</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {baseStationRunners.length}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
          </div>

          {/* Master Runner Grid */}
          <SharedRunnerGrid
            runners={baseStationRunners}
            onCallInRunner={handleCallInRunner}
            onMarkOffRunner={handleMarkOffRunner}
            isLoading={isLoading}
            raceConfig={raceConfig}
            settings={{ runnerViewMode: 'grid', groupSize: 50 }}
            contextLabel="Base Station"
            workflowMode="basestation"
            showMultipleTimes={true}
          />
        </div>
      )}

      {activeTab === 'bulk-entry' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Bulk Data Entry
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Checkpoint Selection */}
          {checkpoints && checkpoints.length > 1 && (
            <div>
              <label htmlFor="selectedCheckpoint" className="form-label">
                Checkpoint
              </label>
              <select
                id="selectedCheckpoint"
                value={selectedCheckpoint}
                onChange={(e) => setSelectedCheckpoint(parseInt(e.target.value))}
                className="form-input"
              >
                {checkpoints.map(checkpoint => (
                  <option key={checkpoint.number} value={checkpoint.number}>
                    {checkpoint.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select which checkpoint these times apply to
              </p>
            </div>
          )}

          {/* Common Time Input */}
          <div>
            <label htmlFor="commonTime" className="form-label">
              Common Time
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="datetime-local"
                id="commonTime"
                value={commonTime}
                onChange={handleTimeChange}
                className={`form-input flex-1 ${validationErrors.commonTime ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={setCurrentTime}
                className="btn-secondary whitespace-nowrap"
              >
                Now
              </button>
              {raceConfig && (
                <button
                  type="button"
                  onClick={setRaceStartTime}
                  className="btn-secondary whitespace-nowrap"
                >
                  Race Start
                </button>
              )}
            </div>
            {validationErrors.commonTime && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.commonTime}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This time will be assigned to all entered runners
            </p>
          </div>

          {/* Runner Numbers Input */}
          <div>
            <label htmlFor="runnerInput" className="form-label">
              Runner Numbers
            </label>
            <textarea
              id="runnerInput"
              value={runnerInput}
              onChange={handleRunnerInputChange}
              rows={6}
              className={`form-input ${validationErrors.runners ? 'border-red-500' : ''}`}
              placeholder="Enter runner numbers separated by commas, spaces, or new lines.&#10;Examples:&#10;101, 102, 103&#10;150-155&#10;200&#10;210-215"
            />
            {validationErrors.runners && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.runners}
              </p>
            )}
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              <p>Supported formats:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Individual numbers: 101, 102, 103</li>
                <li>Ranges: 150-155 (expands to 150, 151, 152, 153, 154, 155)</li>
                <li>Mixed: 101, 105-107, 110</li>
                <li>One per line or comma/space separated</li>
              </ul>
            </div>
          </div>

          {/* Preview */}
          {previewNumbers.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Preview ({previewNumbers.length} runners)
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {previewNumbers.length <= 20 ? (
                  <div className="flex flex-wrap gap-1">
                    {previewNumbers.map(num => (
                      <span key={num} className="inline-block bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                        {num}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {previewNumbers.slice(0, 20).map(num => (
                        <span key={num} className="inline-block bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                          {num}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs">
                      ... and {previewNumbers.length - 20} more runners
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isProcessing || previewNumbers.length === 0}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 spinner"></div>
                <span>Assigning Times...</span>
              </div>
            ) : (
              `Assign Time to ${previewNumbers.length} Runner${previewNumbers.length !== 1 ? 's' : ''}`
            )}
          </button>
          </form>

          {/* Import Checkpoint Data Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import Checkpoint Data
              </h3>
              <button
                type="button"
                onClick={() => setShowImportSection(!showImportSection)}
                className="btn-secondary"
              >
                {showImportSection ? 'Hide' : 'Show'} Import
              </button>
            </div>

            {showImportSection && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="importData" className="form-label">
                    Checkpoint Export Data
                  </label>
                  <textarea
                    id="importData"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    rows={8}
                    className={`form-input font-mono text-sm ${validationErrors.import ? 'border-red-500' : ''}`}
                    placeholder="Paste checkpoint export JSON data here..."
                  />
                  {validationErrors.import && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.import}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Import checkpoint results from other devices
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleImportCheckpointData}
                    disabled={isProcessing || !importData.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Importing...' : 'Import Checkpoint Data'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setImportData('')}
                    className="btn-secondary"
                  >
                    Clear
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Import Instructions
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Get checkpoint export data from checkpoint operators</li>
                    <li>• Paste the JSON data into the text area above</li>
                    <li>• Click "Import Checkpoint Data" to merge the results</li>
                    <li>• This will add checkpoint-specific times and call-in data</li>
                    <li>• Duplicate entries will be updated with new data</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Quick Actions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRunnerInput(prev => prev ? `${prev}, ` : '')}
                className="btn-secondary text-left"
              >
                <div>
                  <div className="font-medium">Continue Entry</div>
                  <div className="text-xs opacity-75">Add more runners to current input</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setRunnerInput('');
                  setValidationErrors({});
                }}
                className="btn-secondary text-left"
              >
                <div>
                  <div className="font-medium">Clear Runners</div>
                  <div className="text-xs opacity-75">Start fresh with new runners</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Entries */}
          {runners.filter(r => r.status === RUNNER_STATUSES.PASSED).length > 0 && (
            <div className="card p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Recent Entries
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {runners
                  .filter(r => r.status === RUNNER_STATUSES.PASSED && r.recordedTime)
                  .sort((a, b) => new Date(b.recordedTime).getTime() - new Date(a.recordedTime).getTime())
                  .slice(0, 10)
                  .map(runner => (
                    <div key={runner.number} className="flex items-center justify-between text-sm">
                      <span className="font-medium">Runner {runner.number}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {TimeUtils.formatTime(runner.recordedTime)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Data Entry Instructions
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Set the common time first (when the group finished)</li>
              <li>• Enter runner numbers in any format - individual, ranges, or mixed</li>
              <li>• Use "Now" button for current time or "Race Start" for race beginning</li>
              <li>• Preview shows exactly which runners will be updated</li>
              <li>• All entered runners will be marked as "Passed" with the common time</li>
              <li>• You can process multiple groups with different times</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEntry;
