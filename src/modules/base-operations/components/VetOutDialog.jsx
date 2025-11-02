import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';

/**
 * VetOutDialog - Dialog for vetting out runners (failed vet check)
 * 
 * Features:
 * - Vet out runner with reason and medical notes
 * - Checkpoint selection
 * - Time selection (defaults to current time)
 * - Medical-specific reasons
 * - Validation and error handling
 */

const VET_OUT_REASONS = [
  'Failed Vet Check',
  'Lameness',
  'Metabolic Issues',
  'Dehydration',
  'Heart Rate Too High',
  'Respiratory Issues',
  'Injury',
  'Exhaustion',
  'Other Medical'
];

const VetOutDialog = ({ isOpen, onClose, runnerNumber: initialRunnerNumber = '' }) => {
  const [runnerNumber, setRunnerNumber] = useState(initialRunnerNumber);
  const [checkpoint, setCheckpoint] = useState(1);
  const [vetOutTime, setVetOutTime] = useState('');
  const [reason, setReason] = useState(VET_OUT_REASONS[0]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [vetName, setVetName] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { vetOutRunner, loading } = useBaseOperationsStore();

  // Initialize with current time
  useEffect(() => {
    if (isOpen && !vetOutTime) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localTime = new Date(now.getTime() - offset);
      setVetOutTime(localTime.toISOString().slice(0, 16));
    }
  }, [isOpen, vetOutTime]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRunnerNumber(initialRunnerNumber);
      setCheckpoint(1);
      setReason(VET_OUT_REASONS[0]);
      setMedicalNotes('');
      setVetName('');
      setErrors({});
    }
  }, [isOpen, initialRunnerNumber]);

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

    // Validate time
    if (!vetOutTime) {
      newErrors.vetOutTime = 'Vet-out time is required';
    }

    // Validate reason
    if (!reason) {
      newErrors.reason = 'Reason is required';
    }

    // Validate medical notes (recommended but not required)
    if (!medicalNotes.trim()) {
      newErrors.medicalNotes = 'Medical notes are recommended for vet-outs';
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
      const timestamp = TimeUtils.datetimeLocalToISO(vetOutTime);
      
      // Combine medical notes with vet name if provided
      const fullNotes = vetName 
        ? `Vet: ${vetName}\n${medicalNotes}`
        : medicalNotes;

      await vetOutRunner(num, reason, fullNotes, checkpoint, timestamp);

      // Close dialog on success
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to vet out runner'
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
    setVetOutTime(localTime.toISOString().slice(0, 16));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Vet Out Runner
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Failed veterinary check
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Runner Number */}
          <div>
            <label htmlFor="runnerNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Runner Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="runnerNumber"
              value={runnerNumber}
              onChange={(e) => setRunnerNumber(e.target.value)}
              className={`form-input w-full ${errors.runnerNumber ? 'border-red-500' : ''}`}
              placeholder="Enter runner number"
              autoFocus
            />
            {errors.runnerNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.runnerNumber}
              </p>
            )}
          </div>

          {/* Checkpoint */}
          <div>
            <label htmlFor="checkpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Checkpoint <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="checkpoint"
              value={checkpoint}
              onChange={(e) => setCheckpoint(parseInt(e.target.value))}
              className="form-input w-full"
              min="1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Checkpoint where vet check was performed
            </p>
          </div>

          {/* Vet-Out Time */}
          <div>
            <label htmlFor="vetOutTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vet-Out Time <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="datetime-local"
                id="vetOutTime"
                value={vetOutTime}
                onChange={(e) => setVetOutTime(e.target.value)}
                className={`form-input flex-1 ${errors.vetOutTime ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={setCurrentTime}
                className="btn-secondary whitespace-nowrap"
              >
                Now
              </button>
            </div>
            {errors.vetOutTime && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.vetOutTime}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`form-input w-full ${errors.reason ? 'border-red-500' : ''}`}
            >
              {VET_OUT_REASONS.map((r) => (
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

          {/* Vet Name */}
          <div>
            <label htmlFor="vetName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Veterinarian Name (Optional)
            </label>
            <input
              type="text"
              id="vetName"
              value={vetName}
              onChange={(e) => setVetName(e.target.value)}
              className="form-input w-full"
              placeholder="Dr. Smith"
            />
          </div>

          {/* Medical Notes */}
          <div>
            <label htmlFor="medicalNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Medical Notes <span className="text-orange-500">*</span>
            </label>
            <textarea
              id="medicalNotes"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              rows={4}
              className={`form-input w-full ${errors.medicalNotes ? 'border-orange-500' : ''}`}
              placeholder="Detailed medical observations and findings..."
            />
            {errors.medicalNotes && (
              <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
                {errors.medicalNotes}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Include vital signs, symptoms, and veterinarian's assessment
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Warning Box */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Important: Vet-Out Action
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This will permanently mark runner {runnerNumber} as vetted out. This action is typically not reversible and indicates the runner failed a veterinary check for safety reasons.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
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
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Vet Out Runner'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

VetOutDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  runnerNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default VetOutDialog;
