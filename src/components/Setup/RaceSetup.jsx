import React, { useState } from 'react';
import useRaceStore from '../../store/useRaceStore.js';
import TimeUtils from '../../services/timeUtils.js';
import { APP_MODES } from '../../types/index.js';
import ErrorMessage from '../Layout/ErrorMessage.jsx';
import LoadingSpinner from '../Layout/LoadingSpinner.jsx';

const RaceSetup = () => {
  const { createRace, setMode, isLoading, error, clearError } = useRaceStore();
  
  const [formData, setFormData] = useState({
    name: '',
    date: TimeUtils.getTodayDateString(),
    startTime: '08:00',
    minRunner: '',
    maxRunner: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Race name is required';
    }

    // Date validation
    if (!formData.date) {
      errors.date = 'Race date is required';
    } else if (!TimeUtils.validateDateString(formData.date)) {
      errors.date = 'Invalid date format';
    }

    // Start time validation
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    } else if (!TimeUtils.parseTimeInput(formData.startTime)) {
      errors.startTime = 'Invalid time format (use HH:MM)';
    }

    // Runner number validation
    const minRunner = parseInt(formData.minRunner);
    const maxRunner = parseInt(formData.maxRunner);

    if (!formData.minRunner || isNaN(minRunner) || minRunner < 1) {
      errors.minRunner = 'Minimum runner number must be a positive integer';
    }

    if (!formData.maxRunner || isNaN(maxRunner) || maxRunner < 1) {
      errors.maxRunner = 'Maximum runner number must be a positive integer';
    }

    if (!errors.minRunner && !errors.maxRunner && minRunner >= maxRunner) {
      errors.maxRunner = 'Maximum runner number must be greater than minimum';
    }

    if (!errors.minRunner && !errors.maxRunner && (maxRunner - minRunner) > 10000) {
      errors.maxRunner = 'Runner range cannot exceed 10,000 runners';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      const raceData = {
        name: formData.name.trim(),
        date: formData.date,
        startTime: TimeUtils.parseTimeInput(formData.startTime),
        minRunner: parseInt(formData.minRunner),
        maxRunner: parseInt(formData.maxRunner)
      };

      await createRace(raceData);
      // Race created successfully, stay in setup mode to choose operation mode
    } catch (err) {
      console.error('Failed to create race:', err);
    }
  };

  const handleModeSelect = (mode) => {
    setMode(mode);
  };

  const parseRunnerRange = (rangeString) => {
    if (!rangeString.trim()) return;

    // Handle ranges like "100-200", "1200-1400"
    const rangeMatch = rangeString.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      if (min < max) {
        setFormData(prev => ({
          ...prev,
          minRunner: min.toString(),
          maxRunner: max.toString()
        }));
      }
    }
  };

  const [rangeInput, setRangeInput] = useState('');

  const handleRangeInputChange = (e) => {
    const value = e.target.value;
    setRangeInput(value);
    parseRunnerRange(value);
  };

  if (isLoading) {
    return <LoadingSpinner message="Setting up race..." />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Race Setup
        </h2>

        <ErrorMessage error={error} onDismiss={clearError} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Race Name */}
          <div>
            <label htmlFor="name" className="form-label">
              Race Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.name ? 'border-red-500' : ''}`}
              placeholder="Enter race name"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Race Date */}
          <div>
            <label htmlFor="date" className="form-label">
              Race Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.date ? 'border-red-500' : ''}`}
            />
            {validationErrors.date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.date}
              </p>
            )}
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="startTime" className="form-label">
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.startTime ? 'border-red-500' : ''}`}
            />
            {validationErrors.startTime && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.startTime}
              </p>
            )}
          </div>

          {/* Runner Range - Quick Input */}
          <div>
            <label htmlFor="rangeInput" className="form-label">
              Runner Range (Quick Input)
            </label>
            <input
              type="text"
              id="rangeInput"
              value={rangeInput}
              onChange={handleRangeInputChange}
              className="form-input"
              placeholder="e.g., 100-200, 1200-1400"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter a range like "100-200" or set individual numbers below
            </p>
          </div>

          {/* Runner Numbers - Individual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="minRunner" className="form-label">
                Minimum Runner Number
              </label>
              <input
                type="number"
                id="minRunner"
                name="minRunner"
                value={formData.minRunner}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.minRunner ? 'border-red-500' : ''}`}
                placeholder="1"
                min="1"
              />
              {validationErrors.minRunner && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.minRunner}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="maxRunner" className="form-label">
                Maximum Runner Number
              </label>
              <input
                type="number"
                id="maxRunner"
                name="maxRunner"
                value={formData.maxRunner}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.maxRunner ? 'border-red-500' : ''}`}
                placeholder="100"
                min="1"
              />
              {validationErrors.maxRunner && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.maxRunner}
                </p>
              )}
            </div>
          </div>

          {/* Runner Count Preview */}
          {formData.minRunner && formData.maxRunner && 
           !validationErrors.minRunner && !validationErrors.maxRunner && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Total runners: {parseInt(formData.maxRunner) - parseInt(formData.minRunner) + 1}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Race...' : 'Create Race'}
          </button>
        </form>

        {/* Mode Selection - Show after race is created */}
        {useRaceStore.getState().raceConfig && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Operation Mode
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleModeSelect(APP_MODES.CHECKPOINT)}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors text-left"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Checkpoint Mode
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Track runners passing through checkpoints, manage callouts, and monitor progress
                </p>
              </button>

              <button
                onClick={() => handleModeSelect(APP_MODES.BASE_STATION)}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors text-left"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Base Station Mode
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enter finish times, manage race completion data, and track final results
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceSetup;
