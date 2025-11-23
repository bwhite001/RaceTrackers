import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';

/**
 * WithdrawalDialog - Dialog for withdrawing runners from the race
 * 
 * Features:
 * - Withdraw runner with reason and comments
 * - Reverse withdrawal by entering number + *
 * - Checkpoint selection
 * - Time selection (defaults to current time)
 * - Validation and error handling
 */

const WITHDRAWAL_REASONS = [
  'Personal Emergency',
  'Injury',
  'Illness',
  'Equipment Failure',
  'Weather Conditions',
  'Time Cutoff',
  'Voluntary Withdrawal',
  'Other'
];

const WithdrawalDialog = ({ isOpen, onClose, runnerNumber: initialRunnerNumber = '' }) => {
  const [runnerNumber, setRunnerNumber] = useState(initialRunnerNumber);
  const [checkpoint, setCheckpoint] = useState(1);
  const [withdrawalTime, setWithdrawalTime] = useState('');
  const [reason, setReason] = useState(WITHDRAWAL_REASONS[0]);
  const [comments, setComments] = useState('');
  const [isReversal, setIsReversal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { withdrawRunner, reverseWithdrawal, loading } = useBaseOperationsStore();

  // Initialize with current time
  useEffect(() => {
    if (isOpen && !withdrawalTime) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localTime = new Date(now.getTime() - offset);
      setWithdrawalTime(localTime.toISOString().slice(0, 16));
    }
  }, [isOpen, withdrawalTime]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRunnerNumber(initialRunnerNumber);
      setCheckpoint(1);
      setReason(WITHDRAWAL_REASONS[0]);
      setComments('');
      setErrors({});
      setIsReversal(false);
    }
  }, [isOpen, initialRunnerNumber]);

  // Check for reversal indicator (*)
  useEffect(() => {
    if (runnerNumber.includes('*')) {
      setIsReversal(true);
      setRunnerNumber(runnerNumber.replace('*', '').trim());
    } else {
      setIsReversal(false);
    }
  }, [runnerNumber]);

  const validateForm = () => {
    const newErrors = {};

    // Validate runner number
    if (!runnerNumber.trim()) {
      newErrors.runnerNumber = 'Runner number is required';
    } else {
      const num = parseInt(runnerNumber);
      if (isNaN(num) || num <= 0) {
        newErrors.runnerNumber = 'Invalid runner number';
      }
    }

    // Validate time (only for withdrawal, not reversal)
    if (!isReversal && !withdrawalTime) {
      newErrors.withdrawalTime = 'Withdrawal time is required';
    }

    // Validate reason (only for withdrawal, not reversal)
    if (!isReversal && !reason) {
      newErrors.reason = 'Reason is required';
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
      const num = parseInt(runnerNumber);

      if (isReversal) {
        // Reverse withdrawal
        await reverseWithdrawal(num);
      } else {
        // Withdraw runner
        const timestamp = TimeUtils.datetimeLocalToISO(withdrawalTime);
        await withdrawRunner(num, reason, comments, checkpoint, timestamp);
      }

      // Close dialog on success
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to process withdrawal'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const setCurrentTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offset);
    setWithdrawalTime(localTime.toISOString().slice(0, 16));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isReversal ? 'Reverse Withdrawal' : 'Withdraw Runner'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-lg p-2 touch-target"
            aria-label="Close"
            title="Close (Esc)"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Runner Number */}
          <div>
            <label htmlFor="runnerNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Runner Number {isReversal && <span className="text-green-600">(Reversal Mode)</span>}
            </label>
            <input
              type="text"
              id="runnerNumber"
              value={runnerNumber}
              onChange={(e) => setRunnerNumber(e.target.value)}
              className={`form-input w-full ${errors.runnerNumber ? 'border-red-500' : ''}`}
              placeholder="Enter runner number (add * to reverse)"
              autoFocus
            />
            {errors.runnerNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.runnerNumber}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tip: Add * after number to reverse withdrawal (e.g., "105*")
            </p>
          </div>

          {!isReversal && (
            <>
              {/* Checkpoint */}
              <div>
                <label htmlFor="checkpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Checkpoint
                </label>
                <input
                  type="number"
                  id="checkpoint"
                  value={checkpoint}
                  onChange={(e) => setCheckpoint(parseInt(e.target.value))}
                  className="form-input w-full"
                  min="1"
                />
              </div>

              {/* Withdrawal Time */}
              <div>
                <label htmlFor="withdrawalTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Withdrawal Time
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="datetime-local"
                    id="withdrawalTime"
                    value={withdrawalTime}
                    onChange={(e) => setWithdrawalTime(e.target.value)}
                    className={`form-input flex-1 ${errors.withdrawalTime ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={setCurrentTime}
                    className="btn-secondary whitespace-nowrap"
                  >
                    Now
                  </button>
                </div>
                {errors.withdrawalTime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.withdrawalTime}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`form-input w-full ${errors.reason ? 'border-red-500' : ''}`}
                >
                  {WITHDRAWAL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.reason}
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="form-input w-full"
                  placeholder="Additional details..."
                />
              </div>
            </>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {isReversal ? (
                <>
                  <strong>Reversing withdrawal for runner {runnerNumber}</strong>
                  <br />
                  This will restore the runner to their previous status.
                </>
              ) : (
                <>
                  <strong>Withdrawing runner {runnerNumber}</strong>
                  <br />
                  This will mark the runner as withdrawn from the race. You can reverse this action later by entering the runner number followed by *.
                </>
              )}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
            disabled={isSubmitting || loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : isReversal ? (
              'Reverse Withdrawal'
            ) : (
              'Withdraw Runner'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

WithdrawalDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  runnerNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default WithdrawalDialog;
