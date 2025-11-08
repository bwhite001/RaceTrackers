import React, { useState } from 'react';
import {
  FormGroup,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Select,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Badge
} from '../../design-system/components';
import { DocumentIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import TimeUtils from '../../services/timeUtils.js';

const RaceDetailsStep = ({ data, onUpdate, onNext, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: TimeUtils.getTodayDateString(),
    startTime: '06:00',
    numCheckpoints: 1,
    checkpoints: [{ number: 1, name: 'Checkpoint 1' }],
    ...data
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value?.trim()) {
          error = 'Race name is required';
        } else if (value.trim().length < 5) {
          error = 'Race name must be at least 5 characters';
        }
        break;
      case 'date':
        if (!value) {
          error = 'Race date is required';
        } else if (!TimeUtils.validateDateString(value)) {
          error = 'Invalid date format';
        } else {
          const raceDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (raceDate < today) {
            error = 'Race date cannot be in the past';
          }
        }
        break;
      case 'startTime':
        if (!value) {
          error = 'Start time is required';
        }
        break;
      case 'numCheckpoints':
        const numCheckpoints = parseInt(value);
        if (!numCheckpoints || numCheckpoints < 1) {
          error = 'At least one checkpoint is required';
        } else if (numCheckpoints > 10) {
          error = 'Maximum 10 checkpoints allowed';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    
    if (onUpdate) {
      onUpdate(updatedData);
    }
    
    if (submitted) {
      const error = validateField(name, value);
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleCheckpointCountChange = (e) => {
    const numCheckpoints = parseInt(e.target.value) || 1;
    
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
    
    if (onUpdate) {
      onUpdate(updatedData);
    }
    
    if (submitted) {
      const error = validateField('numCheckpoints', numCheckpoints);
      setValidationErrors(prev => ({ ...prev, numCheckpoints: error }));
    }
  };

  const handleCheckpointNameChange = (index, name) => {
    const checkpoints = [...formData.checkpoints];
    checkpoints[index] = { ...checkpoints[index], name };
    const updatedData = { ...formData, checkpoints };
    setFormData(updatedData);
    
    if (onUpdate) {
      onUpdate(updatedData);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const errors = {};
    const fields = ['name', 'date', 'startTime', 'numCheckpoints'];
    fields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      onNext(formData);
      return;
    }

    const firstErrorField = Object.keys(errors)[0];
    const element = document.getElementById(firstErrorField);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {/* Basic Race Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DocumentIcon className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
            Basic Race Information
          </h3>
          <Badge variant="danger" size="sm">Required</Badge>
        </div>

        <FormGroup>
          <FormLabel htmlFor="name" required>Race Name</FormLabel>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter race name (e.g., Annual Marathon 2025)"
            error={!!validationErrors.name}
            size="lg"
            leftIcon={<DocumentIcon className="w-5 h-5" />}
          />
          {validationErrors.name && (
            <FormErrorMessage>{validationErrors.name}</FormErrorMessage>
          )}
          <FormHelperText>
            Choose a descriptive name that includes the year
          </FormHelperText>
        </FormGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup>
            <FormLabel htmlFor="date" required>Race Date</FormLabel>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              error={!!validationErrors.date}
              leftIcon={<CalendarIcon className="w-5 h-5" />}
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
              error={!!validationErrors.startTime}
              leftIcon={<ClockIcon className="w-5 h-5" />}
            />
            {validationErrors.startTime && (
              <FormErrorMessage>{validationErrors.startTime}</FormErrorMessage>
            )}
            <FormHelperText>Default is 6:00 AM</FormHelperText>
          </FormGroup>
        </div>
      </div>

      {/* Checkpoint Configuration */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
          <MapPinIcon className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
            Checkpoint Configuration
          </h3>
          <Badge variant="danger" size="sm">Required</Badge>
        </div>

        <FormGroup>
          <FormLabel htmlFor="numCheckpoints" required>Number of Checkpoints</FormLabel>
          <Select
            id="numCheckpoints"
            name="numCheckpoints"
            value={formData.numCheckpoints}
            onChange={handleCheckpointCountChange}
            error={!!validationErrors.numCheckpoints}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </Select>
          {validationErrors.numCheckpoints && (
            <FormErrorMessage>{validationErrors.numCheckpoints}</FormErrorMessage>
          )}
          <FormHelperText>
            Select the number of checkpoints for this race
          </FormHelperText>
        </FormGroup>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Checkpoint Names (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.checkpoints.map((checkpoint, index) => (
              <FormGroup key={checkpoint.number}>
                <FormLabel htmlFor={`checkpoint-${index}`}>
                  Checkpoint {checkpoint.number}
                </FormLabel>
                <Input
                  id={`checkpoint-${index}`}
                  value={checkpoint.name}
                  onChange={(e) => handleCheckpointNameChange(index, e.target.value)}
                  placeholder={`Checkpoint ${checkpoint.number}`}
                  leftIcon={<MapPinIcon className="w-5 h-5" />}
                />
              </FormGroup>
            ))}
          </div>
        </div>
      </div>

      {/* Race Summary */}
      <Card variant="elevated" className="bg-blue-50 dark:bg-blue-900/20">
        <CardBody>
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Race Summary
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
            <p><strong>Date & Time:</strong> {formData.date} at {formData.startTime}</p>
            <p><strong>Checkpoints:</strong> {formData.numCheckpoints} ({formData.checkpoints.map(cp => cp.name).join(', ')})</p>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onCancel}
          type="button"
        >
          Cancel
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

export default RaceDetailsStep;
