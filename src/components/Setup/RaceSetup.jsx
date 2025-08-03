import React, { useState, useEffect } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import TimeUtils from '../../services/timeUtils.js';
import { APP_MODES } from '../../types/index.js';
import ErrorMessage from '../Layout/ErrorMessage.jsx';
import LoadingSpinner from '../Layout/LoadingSpinner.jsx';

const RaceSetup = () => {
  const { 
    createRace, 
    setMode, 
    isLoading, 
    error, 
    clearError, 
    getAllRaces, 
    switchToRace, 
    deleteRace,
    raceConfig 
  } = useRaceStore();
  
  const [formData, setFormData] = useState({
    name: '',
    date: TimeUtils.getTodayDateString(),
    startTime: '08:00',
    minRunner: '',
    maxRunner: '',
    numCheckpoints: 1,
    checkpoints: [{ number: 1, name: 'Checkpoint 1' }]
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [existingRaces, setExistingRaces] = useState([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [checkpointCount, setCheckpointCount] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckpointCountChange = (e) => {
    const numCheckpoints = parseInt(e.target.value) || 1;
    setCheckpointCount(numCheckpoints);
    
    // Update form data immediately
    const checkpoints = [];
    for (let i = 1; i <= numCheckpoints; i++) {
      checkpoints.push({
        number: i,
        name: `Checkpoint ${i}`
      });
    }
    
    setFormData(prev => ({
      ...prev,
      numCheckpoints,
      checkpoints
    }));
    
    // Clear validation errors
    if (validationErrors.numCheckpoints) {
      setValidationErrors(prev => ({ ...prev, numCheckpoints: '' }));
    }
  };

  // Sync checkpoint count with form data
  useEffect(() => {
    const checkpoints = [];
    for (let i = 1; i <= checkpointCount; i++) {
      checkpoints.push({
        number: i,
        name: `Checkpoint ${i}`
      });
    }
    
    setFormData(prev => ({
      ...prev,
      numCheckpoints: checkpointCount,
      checkpoints
    }));
  }, [checkpointCount]);

  const handleCheckpointNameChange = (index, name) => {
    const checkpoints = [...formData.checkpoints];
    checkpoints[index] = { ...checkpoints[index], name };
    setFormData(prev => ({ ...prev, checkpoints }));
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
        maxRunner: parseInt(formData.maxRunner),
        checkpoints: formData.checkpoints
      };

      await createRace(raceData);
      setShowCreateForm(false);
      await loadExistingRaces(); // Refresh the list
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

  // Load existing races on component mount
  useEffect(() => {
    loadExistingRaces();
  }, []);

  const loadExistingRaces = async () => {
    try {
      setLoadingRaces(true);
      const races = await getAllRaces();
      setExistingRaces(races);
    } catch (error) {
      console.error('Failed to load races:', error);
    } finally {
      setLoadingRaces(false);
    }
  };

  const handleSelectRace = async (raceId) => {
    try {
      await switchToRace(raceId);
    } catch (error) {
      console.error('Failed to switch to race:', error);
    }
  };

  const handleDeleteRace = async (raceId, raceName) => {
    if (window.confirm(`Are you sure you want to delete the race "${raceName}"? This action cannot be undone.`)) {
      try {
        await deleteRace(raceId);
        await loadExistingRaces(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete race:', error);
      }
    }
  };

  const handleCreateNewRace = () => {
    setShowCreateForm(true);
    setCheckpointCount(1);
    setFormData({
      name: '',
      date: TimeUtils.getTodayDateString(),
      startTime: '08:00',
      minRunner: '',
      maxRunner: '',
      numCheckpoints: 1,
      checkpoints: [{ number: 1, name: 'Checkpoint 1' }]
    });
    setValidationErrors({});
    setRangeInput('');
  };

  if (isLoading || loadingRaces) {
    return <LoadingSpinner message="Loading races..." />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Race Management
        </h2>

        <ErrorMessage error={error} onDismiss={clearError} />

        {/* Existing Races Section */}
        {!showCreateForm && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Existing Races
              </h3>
              <button
                onClick={handleCreateNewRace}
                className="btn-primary"
              >
                Create New Race
              </button>
            </div>

            {existingRaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No races found. Create your first race to get started.
                </p>
                <button
                  onClick={handleCreateNewRace}
                  className="btn-primary"
                >
                  Create First Race
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {existingRaces.map((race) => (
                  <div
                    key={race.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      raceConfig?.id === race.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {race.name}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          <span>{race.date}</span>
                          <span className="mx-2">•</span>
                          <span>{race.startTime}</span>
                          <span className="mx-2">•</span>
                          <span>Runners: {race.minRunner}-{race.maxRunner}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Created: {new Date(race.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {raceConfig?.id !== race.id && (
                          <button
                            onClick={() => handleSelectRace(race.id)}
                            className="btn-secondary text-sm"
                          >
                            Select
                          </button>
                        )}
                        {raceConfig?.id === race.id && (
                          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                            Current
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteRace(race.id, race.name)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Race Form */}
        {showCreateForm && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Race
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>

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

          {/* Checkpoint Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Checkpoint Configuration
            </h4>
            
            <div>
              <label htmlFor="numCheckpoints" className="form-label">
                Number of Checkpoints
              </label>
              <select
                id="numCheckpoints"
                value={formData.numCheckpoints}
                onChange={handleCheckpointCountChange}
                className="form-input"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select the number of checkpoints for this race
              </p>
            </div>

            {/* Checkpoint Names */}
            {formData.checkpoints.map((checkpoint, index) => (
              <div key={checkpoint.number}>
                <label htmlFor={`checkpoint-${index}`} className="form-label">
                  Checkpoint {checkpoint.number} Name (Optional)
                </label>
                <input
                  type="text"
                  id={`checkpoint-${index}`}
                  value={checkpoint.name}
                  onChange={(e) => handleCheckpointNameChange(index, e.target.value)}
                  className="form-input"
                  placeholder={`Checkpoint ${checkpoint.number}`}
                />
              </div>
            ))}
          </div>

          {/* Runner Count Preview */}
          {formData.minRunner && formData.maxRunner && 
           !validationErrors.minRunner && !validationErrors.maxRunner && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Total runners: {parseInt(formData.maxRunner) - parseInt(formData.minRunner) + 1}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Checkpoints: {formData.numCheckpoints} ({formData.checkpoints.map(cp => cp.name).join(', ')})
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
          </div>
        )}

        {/* Mode Selection - Show when a race is selected */}
        {raceConfig && !showCreateForm && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Operation Mode for "{raceConfig.name}"
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
