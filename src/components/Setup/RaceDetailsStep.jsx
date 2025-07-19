import React, { useState, useEffect } from 'react';
import TimeUtils from '../../services/timeUtils.js';

const RaceDetailsStep = ({ initialData, onNext, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: TimeUtils.getTodayDateString(),
    startTime: '06:00',
    numCheckpoints: 1,
    checkpoints: [{ number: 1, name: 'Checkpoint 1' }],
    ...initialData
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

  const handleCheckpointCountChange = (e) => {
    const numCheckpoints = parseInt(e.target.value) || 1;
    
    // Update checkpoints array
    const checkpoints = [];
    for (let i = 1; i <= numCheckpoints; i++) {
      const existingCheckpoint = formData.checkpoints.find(cp => cp.number === i);
      checkpoints.push({
        number: i,
        name: existingCheckpoint ? existingCheckpoint.name : `Checkpoint ${i}`
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

    // Checkpoint validation
    if (formData.numCheckpoints < 1 || formData.numCheckpoints > 10) {
      errors.numCheckpoints = 'Number of checkpoints must be between 1 and 10';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Race Name */}
      <div>
        <label htmlFor="name" className="form-label">
          Race Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`form-input ${validationErrors.name ? 'border-red-500' : ''}`}
          placeholder="Enter race name (e.g., Annual Marathon 2025)"
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {validationErrors.name}
          </p>
        )}
      </div>

      {/* Race Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="form-label">
            Race Date *
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

        <div>
          <label htmlFor="startTime" className="form-label">
            Start Time *
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
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Default is 6:00 AM
          </p>
        </div>
      </div>

      {/* Checkpoint Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Checkpoint Configuration
        </h3>
        
        <div>
          <label htmlFor="numCheckpoints" className="form-label">
            Number of Checkpoints *
          </label>
          <select
            id="numCheckpoints"
            value={formData.numCheckpoints}
            onChange={handleCheckpointCountChange}
            className={`form-input ${validationErrors.numCheckpoints ? 'border-red-500' : ''}`}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          {validationErrors.numCheckpoints && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.numCheckpoints}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select the number of checkpoints for this race
          </p>
        </div>

        {/* Checkpoint Names */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Checkpoint Names (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formData.checkpoints.map((checkpoint, index) => (
              <div key={checkpoint.number}>
                <label htmlFor={`checkpoint-${index}`} className="form-label text-sm">
                  Checkpoint {checkpoint.number}
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
        </div>
      </div>

      {/* Race Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Race Summary
        </h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
          <p><strong>Date & Time:</strong> {formData.date} at {formData.startTime}</p>
          <p><strong>Checkpoints:</strong> {formData.numCheckpoints} ({formData.checkpoints.map(cp => cp.name).join(', ')})</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Configure Runners
        </button>
      </div>
    </form>
  );
};

export default RaceDetailsStep;
