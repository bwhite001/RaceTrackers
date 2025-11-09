import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import { parseRunnerNumbers } from '../../utils/runnerNumberUtils';
import { RUNNER_STATUSES } from '../../types';

/**
 * WithdrawalDialog Component
 * Handles marking runners as DNF/DNS with reason tracking
 */
const WithdrawalDialog = ({ isOpen, onClose, type = 'dnf' }) => {
  // Store access
  const { bulkMarkRunners, loading, error } = useBaseOperationsStore();

  // Local state
  const [runnerInput, setRunnerInput] = useState('');
  const [reason, setReason] = useState('');
  const [parsedNumbers, setParsedNumbers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Refs
  const textareaRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  // Handle runner number input
  const handleRunnerInputChange = useCallback((e) => {
    const input = e.target.value;
    setRunnerInput(input);

    // Parse numbers as user types
    const numbers = parseRunnerNumbers(input);
    setParsedNumbers(numbers);
    setValidationErrors(prev => ({ ...prev, runners: '' }));
  }, []);

  // Handle reason input
  const handleReasonChange = useCallback((e) => {
    setReason(e.target.value);
    setValidationErrors(prev => ({ ...prev, reason: '' }));
  }, []);

  // Clear form
  const handleClear = useCallback(() => {
    setRunnerInput('');
    setReason('');
    setParsedNumbers([]);
    setValidationErrors({});
    textareaRef.current?.focus();
  }, []);

  // Validate inputs
  const validateInputs = useCallback(() => {
    const errors = {};

    if (parsedNumbers.length === 0) {
      errors.runners = 'At least one valid runner number is required';
    }

    if (!reason.trim()) {
      errors.reason = `${type.toUpperCase()} reason is required`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [parsedNumbers, reason, type]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();

    if (!validateInputs()) {
      return;
    }

    try {
      await bulkMarkRunners(parsedNumbers, {
        status: type === 'dnf' ? RUNNER_STATUSES.DNF : RUNNER_STATUSES.DNS,
        reason,
        timestamp: new Date().toISOString()
      });

      handleClear();
      onClose();
    } catch (error) {
      setValidationErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    }
  }, [validateInputs, bulkMarkRunners, parsedNumbers, reason, type, onClose]);

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="withdrawal-dialog-title"
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Dialog */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          {/* Header */}
          <div className="mb-6">
            <h2
              id="withdrawal-dialog-title"
              className="text-lg font-medium text-gray-900 dark:text-white"
            >
              Mark Runners as {type.toUpperCase()}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter runner numbers and provide a reason for withdrawal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Runner Numbers */}
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
                  rows={3}
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

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Reason
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="reason"
                  value={reason}
                  onChange={handleReasonChange}
                  className={`block w-full rounded-md shadow-sm 
                    ${validationErrors.reason 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } 
                    dark:bg-gray-800 dark:border-gray-600`}
                  placeholder={`Enter ${type.toUpperCase()} reason`}
                />
              </div>
              {validationErrors.reason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.reason}
                </p>
              )}
            </div>

            {/* Preview */}
            {parsedNumbers.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview ({parsedNumbers.length} runners)
                </h3>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {parsedNumbers.join(', ')}
                </div>
              </div>
            )}

            {/* Error Message */}
            {(error || validationErrors.submit) && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error || validationErrors.submit}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white 
                       rounded-md text-sm font-medium transition-colors 
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : `Mark as ${type.toUpperCase()}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

WithdrawalDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['dnf', 'dns'])
};

export default WithdrawalDialog;
