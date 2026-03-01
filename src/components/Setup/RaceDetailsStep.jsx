import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FormGroup,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  FormSection,
  Input,
  Button,
  ButtonGroup,
  Select
} from '../../design-system/components';
import {
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import TimeUtils from '../../services/timeUtils';

const RaceDetailsStep = ({ data = {}, onNext, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: data.name || '',
    date: data.date || TimeUtils.getTodayDateString(),
    startTime: data.startTime || '06:00',
    numCheckpoints: data.numCheckpoints || data.checkpoints?.length || 1,
    checkpoints: data.checkpoints || [{ number: 1, name: 'Checkpoint 1' }]
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    
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
    
    const updatedData = {
      ...formData,
      numCheckpoints,
      checkpoints
    };
    
    setFormData(updatedData);
    
    // Clear validation errors
    if (validationErrors.numCheckpoints) {
      setValidationErrors(prev => ({ ...prev, numCheckpoints: '' }));
    }
  };

  const handleCheckpointNameChange = (index, name) => {
    const checkpoints = [...formData.checkpoints];
    checkpoints[index] = { ...checkpoints[index], name };
    setFormData({ ...formData, checkpoints });
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
    }

    // Checkpoint validation
    if (formData.numCheckpoints < 1) {
      errors.numCheckpoints = 'At least one checkpoint is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Race Information */}
      <FormSection
        icon={DocumentTextIcon}
        title="Basic Race Information"
        description="Enter the core details about your race"
        required
      >
        <FormGroup>
          <FormLabel htmlFor="name" required>Race Name</FormLabel>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter race name (e.g., Annual Marathon 2025)"
            error={validationErrors.name}
            size="lg"
          />
          {validationErrors.name ? (
            <FormErrorMessage>{validationErrors.name}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Choose a descriptive name that includes the year
            </FormHelperText>
          )}
        </FormGroup>
      </FormSection>

      {/* Date and Time */}
      <FormSection
        icon={CalendarIcon}
        title="Date and Time"
        description="Set when the race will take place"
        required
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup>
            <FormLabel htmlFor="date" required>Race Date</FormLabel>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              error={validationErrors.date}
            />
            {validationErrors.date && (
              <FormErrorMessage>{validationErrors.date}</FormErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="startTime" required>Start Time</FormLabel>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleInputChange}
              error={validationErrors.startTime}
            />
            {validationErrors.startTime ? (
              <FormErrorMessage>{validationErrors.startTime}</FormErrorMessage>
            ) : (
              <FormHelperText>Default is 6:00 AM</FormHelperText>
            )}
          </FormGroup>
        </div>
      </FormSection>

      {/* Checkpoint Configuration */}
      <FormSection
        icon={MapPinIcon}
        title="Checkpoint Configuration"
        description="Set up race checkpoints"
        required
      >
        <FormGroup>
          <FormLabel htmlFor="numCheckpoints" required>Number of Checkpoints</FormLabel>
          <Select
            id="numCheckpoints"
            name="numCheckpoints"
            value={formData.numCheckpoints}
            onChange={handleCheckpointCountChange}
            error={validationErrors.numCheckpoints}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </Select>
          {validationErrors.numCheckpoints ? (
            <FormErrorMessage>{validationErrors.numCheckpoints}</FormErrorMessage>
          ) : (
            <FormHelperText>Select the number of checkpoints for this race</FormHelperText>
          )}
        </FormGroup>

        <div className="mt-4">
          <FormLabel>Checkpoint Names (Optional)</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {formData.checkpoints.map((checkpoint, index) => (
              <FormGroup key={checkpoint.number}>
                <FormLabel htmlFor={`checkpoint-${index}`} className="sr-only">
                  Checkpoint {checkpoint.number}
                </FormLabel>
                <Input
                  id={`checkpoint-${index}`}
                  value={checkpoint.name}
                  onChange={(e) => handleCheckpointNameChange(index, e.target.value)}
                  placeholder={`Checkpoint ${checkpoint.number}`}
                />
              </FormGroup>
            ))}
          </div>
          <FormHelperText>
            Give each checkpoint a descriptive name (e.g., "Summit", "River Crossing")
          </FormHelperText>
        </div>
      </FormSection>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onCancel}
          type="button"
        >
          Exit Setup
        </Button>
        <ButtonGroup>
          <Button
            variant="primary"
            type="submit"
            loading={isLoading}
          >
            Next: Runner Setup
          </Button>
        </ButtonGroup>
      </div>
    </form>
  );
};

RaceDetailsStep.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    startTime: PropTypes.string,
    numCheckpoints: PropTypes.number,
    checkpoints: PropTypes.arrayOf(PropTypes.shape({
      number: PropTypes.number,
      name: PropTypes.string
    }))
  }),
  onNext: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default RaceDetailsStep;
