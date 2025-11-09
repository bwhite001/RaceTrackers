import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import { parseRunnerNumbers, formatRunnerNumber } from '../../utils/runnerNumberUtils';
import { HOTKEYS } from '../../types';
import useDeviceDetection from '../../shared/hooks/useDeviceDetection';

/**
 * DataEntry Component
 * Handles batch entry of runner numbers with time tracking
 */
const DataEntry = ({ onUnsavedChanges }) => {
  // Device detection
  const { isDesktop } = useDeviceDetection();

  // Store access
  const {
    currentRaceId,
    checkpointNumber,
    bulkMarkRunners,
    stats,
    error,
    loading
  } = useBaseOperationsStore();

  // Local state
  const [runnerInput, setRunnerInput] = useState('');
  const [commonTime, setCommonTime] = useState('');
  const [parsedNumbers, setParsedNumbers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const textareaRef = useRef(null);

  // Update unsaved changes status
  useEffect(() => {
    const hasUnsavedInput = runnerInput.trim() !== '' || parsedNumbers.length > 0;
    onUnsavedChanges?.(hasUnsavedInput);
  }, [runnerInput, parsedNumbers, onUnsavedChanges]);

  // Handle time input
  const handleTimeChange = useCallback((e) => {
    setCommonTime(e.target.value);
    setValidationErrors(prev => ({ ...prev, time: '' }));
  }, []);

  // Set current time
  const handleNowClick = useCallback(() => {
    const now = new Date();
    setCommonTime(format(now, 'HH:mm:ss'));
    setValidationErrors(prev => ({ ...prev, time: '' }));
  }, []);

  // Handle runner number input
  const handleRunnerInputChange = useCallback((e) => {
    const input = e.target.value;
    setRunnerInput(input);

    // Parse numbers as user types
    const numbers = parseRunnerNumbers(input);
    setParsedNumbers(numbers);
    setValidationErrors(prev => ({ ...prev, runners: '' }));
  }, []);

  // Clear inputs
  const handleClear = useCallback(() => {
    setRunnerInput('');
    setParsedNumbers([]);
    setValidationErrors({});
    textareaRef.current?.focus();
  }, []);

  // Validate inputs
  const validateInputs = useCallback(() => {
    const errors = {};

    if (!commonTime) {
      errors.time = 'Time is required';
    }

    if (parsedNumbers.length === 0) {
      errors.runners = 'At least one valid runner number is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [commonTime, parsedNumbers]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();

    if (!validateInputs()) {
      return;
    }

    try {
      await bulkMarkRunners(parsedNumbers, commonTime);
      handleClear();
    } catch (error) {
      setValidationErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    }
  }, [validateInputs, bulkMarkRunners, parsedNumbers, commonTime, handleClear]);

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Time Input */}
        <div>
          <label 
            htmlFor="commonTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Common Time
            {isDesktop && (
              <span className="ml-1 text-xs text-gray-500">
                (Press {HOTKEYS.NOW} for current time)
              </span>
            )}
          </label>
          <div className="mt-1 flex space-x-2">
            <input
              id="commonTime"
              type="time"
              step="1"
              value={commonTime}
              onChange={handleTimeChange}
              className={`block w-full rounded-md shadow-sm 
                ${validationErrors.time 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } 
                dark:bg-gray-800 dark:border-gray-600`}
            />
            <button
              type="button"
              onClick={handleNowClick}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 
                       dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 
                       rounded-md text-sm font-medium transition-colors"
            >
              Now
            </button>
          </div>
          {validationErrors.time && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.time}
            </p>
          )}
        </div>

        {/* Runner Numbers Input */}
        <div>
          <label 
            htmlFor="runnerInput"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Runner Numbers
            <span className="ml-1 text-xs text-gray-500">
              (Enter numbers, ranges, or paste a list)
            </span>
          </label>
          <div className="mt-1">
            <textarea
              ref={textareaRef}
              id="runnerInput"
              value={runnerInput}
              onChange={handleRunnerInputChange}
              rows={4}
              className={`block w-full rounded-md shadow-sm 
                ${validationErrors.runners 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } 
                dark:bg-gray-800 dark:border-gray-600`}
              placeholder="Example: 1, 2, 3-5, 10"
            />
          </div>
          {validationErrors.runners && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.runners}
            </p>
          )}
        </div>

        {/* Preview */}
        {parsedNumbers.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview ({parsedNumbers.length} runners)
            </h3>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {parsedNumbers.map(num => formatRunnerNumber(num)).join(', ')}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 
                     dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 
                     rounded-md text-sm font-medium transition-colors"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                     rounded-md text-sm font-medium transition-colors 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
            {isDesktop && !loading && (
              <span className="ml-1 text-xs">({HOTKEYS.SAVE})</span>
            )}
          </button>
        </div>

        {/* Submit Error */}
        {validationErrors.submit && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {validationErrors.submit}
          </p>
        )}
      </form>

      {/* Stats */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Current Status
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {stats.total}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Finished:</span>
            <span className="ml-2 font-medium text-green-600 dark:text-green-400">
              {stats.finished}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Active:</span>
            <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
              {stats.active}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">DNF/DNS:</span>
            <span className="ml-2 font-medium text-red-600 dark:text-red-400">
              {stats.dnf + stats.dns}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

DataEntry.propTypes = {
  onUnsavedChanges: PropTypes.func
};

export default DataEntry;
