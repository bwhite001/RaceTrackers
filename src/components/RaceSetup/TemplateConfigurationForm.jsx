import React, { useState, useEffect } from 'react';
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
  Card,
  Badge
} from '../../design-system/components';
import {
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import TimeUtils from '../../services/timeUtils';
import { RaceTemplateService } from '../../services/RaceTemplateService';

/**
 * TemplateConfigurationForm Component
 * 
 * Form for configuring a race from a template.
 * Pre-populates all fields from the template and allows modifications.
 * 
 * Features:
 * - Pre-filled form from template
 * - Editable race name (with year auto-fill)
 * - Date and time pickers
 * - Runner range inputs
 * - Checkpoint list with edit capability
 * - Read-only metadata display
 * - Form validation
 * - Loading states
 * - Error handling
 * 
 * @component
 * @example
 * <TemplateConfigurationForm
 *   template={selectedTemplate}
 *   onSubmit={handleCreateRace}
 *   onCancel={handleCancel}
 *   isLoading={false}
 * />
 */
const TemplateConfigurationForm = ({
  template,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    raceName: `${template.name} ${currentYear}`,
    raceDate: TimeUtils.getTodayDateString(),
    startTime: template.defaultStartTime.substring(0, 5), // Convert HH:MM:SS to HH:MM
    runnerRangeStart: template.defaultRunnerRangeStart,
    runnerRangeEnd: template.defaultRunnerRangeEnd,
    checkpoints: template.checkpoints.map(cp => ({
      number: cp.number,
      name: cp.name,
      location: cp.location,
      orderSequence: cp.orderSequence,
      metadata: cp.metadata
    }))
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showMetadata, setShowMetadata] = useState(false);

  // Update form when template changes
  useEffect(() => {
    setFormData({
      raceName: `${template.name} ${currentYear}`,
      raceDate: TimeUtils.getTodayDateString(),
      startTime: template.defaultStartTime.substring(0, 5),
      runnerRangeStart: template.defaultRunnerRangeStart,
      runnerRangeEnd: template.defaultRunnerRangeEnd,
      checkpoints: template.checkpoints.map(cp => ({
        number: cp.number,
        name: cp.name,
        location: cp.location,
        orderSequence: cp.orderSequence,
        metadata: cp.metadata
      }))
    });
  }, [template, currentYear]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseInt(value, 10);
    setFormData(prev => ({ ...prev, [name]: numValue }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckpointChange = (index, field, value) => {
    const updatedCheckpoints = [...formData.checkpoints];
    updatedCheckpoints[index] = {
      ...updatedCheckpoints[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, checkpoints: updatedCheckpoints }));
  };

  const validateForm = () => {
    const errors = {};

    // Race name validation
    if (!formData.raceName.trim()) {
      errors.raceName = 'Race name is required';
    }

    // Date validation
    if (!formData.raceDate) {
      errors.raceDate = 'Race date is required';
    } else if (!TimeUtils.validateDateString(formData.raceDate)) {
      errors.raceDate = 'Invalid date format';
    }

    // Start time validation
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    // Runner range validation
    if (formData.runnerRangeStart === '' || formData.runnerRangeStart < 1) {
      errors.runnerRangeStart = 'Starting runner number must be at least 1';
    }
    if (formData.runnerRangeEnd === '' || formData.runnerRangeEnd < 1) {
      errors.runnerRangeEnd = 'Ending runner number must be at least 1';
    }
    if (formData.runnerRangeStart !== '' && formData.runnerRangeEnd !== '' && 
        formData.runnerRangeStart > formData.runnerRangeEnd) {
      errors.runnerRangeEnd = 'Ending number must be greater than or equal to starting number';
    }

    // Checkpoint validation
    formData.checkpoints.forEach((cp, index) => {
      if (!cp.name.trim()) {
        errors[`checkpoint_${index}`] = 'Checkpoint name is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare overrides for template service
    const overrides = {
      raceName: formData.raceName,
      raceDate: formData.raceDate,
      startTime: `${formData.startTime}:00`, // Convert HH:MM to HH:MM:SS
      runnerRangeStart: formData.runnerRangeStart,
      runnerRangeEnd: formData.runnerRangeEnd,
      checkpointModifications: formData.checkpoints.map((cp, index) => ({
        name: cp.name,
        location: cp.location,
        metadata: cp.metadata
      }))
    };

    try {
      await onSubmit(template, overrides);
    } catch (error) {
      console.error('Error creating race from template:', error);
      setValidationErrors({
        submit: error.message || 'Failed to create race. Please try again.'
      });
    }
  };

  const totalRunners = formData.runnerRangeEnd !== '' && formData.runnerRangeStart !== ''
    ? formData.runnerRangeEnd - formData.runnerRangeStart + 1
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Template Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Creating from Template: {template.name}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              All fields are pre-filled from the template. You can modify any values before creating the race.
            </p>
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-2"
            >
              {showMetadata ? 'Hide' : 'Show'} Template Details
            </button>
          </div>
        </div>
      </div>

      {/* Template Metadata (Collapsible) */}
      {showMetadata && (
        <Card className="bg-gray-50 dark:bg-gray-800">
          <div className="p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Template Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Event Type</p>
                <p className="text-gray-900 dark:text-white font-medium">{template.eventType}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Organizer</p>
                <p className="text-gray-900 dark:text-white font-medium">{template.metadata?.organizer}</p>
              </div>
              {template.metadata?.baseLocation && (
                <div className="col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Base Location</p>
                  <p className="text-gray-900 dark:text-white font-medium">{template.metadata.baseLocation}</p>
                </div>
              )}
              {template.metadata?.frequencies && (
                <div className="col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Radio Frequencies</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Primary: {template.metadata.frequencies.primary}
                    {template.metadata.frequencies.fallback && ` | Fallback: ${template.metadata.frequencies.fallback}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Basic Race Information */}
      <FormSection
        icon={DocumentTextIcon}
        title="Race Information"
        description="Customize the race details"
        required
      >
        <FormGroup>
          <FormLabel htmlFor="raceName" required>Race Name</FormLabel>
          <Input
            id="raceName"
            name="raceName"
            value={formData.raceName}
            onChange={handleInputChange}
            placeholder="Enter race name"
            error={validationErrors.raceName}
            size="lg"
          />
          {validationErrors.raceName ? (
            <FormErrorMessage>{validationErrors.raceName}</FormErrorMessage>
          ) : (
            <FormHelperText>
              Default includes template name and current year
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
            <FormLabel htmlFor="raceDate" required>Race Date</FormLabel>
            <Input
              id="raceDate"
              name="raceDate"
              type="date"
              value={formData.raceDate}
              onChange={handleInputChange}
              error={validationErrors.raceDate}
            />
            {validationErrors.raceDate && (
              <FormErrorMessage>{validationErrors.raceDate}</FormErrorMessage>
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
              <FormHelperText>From template: {template.defaultStartTime}</FormHelperText>
            )}
          </FormGroup>
        </div>
      </FormSection>

      {/* Runner Configuration */}
      <FormSection
        icon={UserGroupIcon}
        title="Runner Configuration"
        description="Set the runner number range"
        required
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup>
            <FormLabel htmlFor="runnerRangeStart" required>Starting Runner Number</FormLabel>
            <Input
              id="runnerRangeStart"
              name="runnerRangeStart"
              type="number"
              min="1"
              value={formData.runnerRangeStart}
              onChange={handleNumberInputChange}
              error={validationErrors.runnerRangeStart}
            />
            {validationErrors.runnerRangeStart && (
              <FormErrorMessage>{validationErrors.runnerRangeStart}</FormErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="runnerRangeEnd" required>Ending Runner Number</FormLabel>
            <Input
              id="runnerRangeEnd"
              name="runnerRangeEnd"
              type="number"
              min="1"
              value={formData.runnerRangeEnd}
              onChange={handleNumberInputChange}
              error={validationErrors.runnerRangeEnd}
            />
            {validationErrors.runnerRangeEnd && (
              <FormErrorMessage>{validationErrors.runnerRangeEnd}</FormErrorMessage>
            )}
          </FormGroup>
        </div>
        
        {totalRunners > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <span className="font-semibold">Total Runners:</span> {totalRunners}
            </p>
          </div>
        )}
      </FormSection>

      {/* Checkpoints */}
      <FormSection
        icon={MapPinIcon}
        title="Checkpoints"
        description={`${formData.checkpoints.length} checkpoints from template`}
      >
        <div className="space-y-4">
          {formData.checkpoints.map((checkpoint, index) => (
            <Card key={checkpoint.number} className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-900 flex items-center justify-center">
                    <span className="text-sm font-semibold text-navy-600 dark:text-navy-400">
                      {checkpoint.number}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <FormGroup>
                    <FormLabel htmlFor={`checkpoint-name-${index}`}>
                      Checkpoint Name
                    </FormLabel>
                    <Input
                      id={`checkpoint-name-${index}`}
                      value={checkpoint.name}
                      onChange={(e) => handleCheckpointChange(index, 'name', e.target.value)}
                      error={validationErrors[`checkpoint_${index}`]}
                    />
                    {validationErrors[`checkpoint_${index}`] && (
                      <FormErrorMessage>{validationErrors[`checkpoint_${index}`]}</FormErrorMessage>
                    )}
                  </FormGroup>

                  {checkpoint.location && (
                    <FormGroup>
                      <FormLabel htmlFor={`checkpoint-location-${index}`}>
                        GPS Coordinates
                      </FormLabel>
                      <Input
                        id={`checkpoint-location-${index}`}
                        value={checkpoint.location}
                        onChange={(e) => handleCheckpointChange(index, 'location', e.target.value)}
                        placeholder="Latitude, Longitude"
                      />
                      <FormHelperText>
                        GPS coordinates for this checkpoint
                      </FormHelperText>
                    </FormGroup>
                  )}

                  {checkpoint.metadata?.operators && checkpoint.metadata.operators.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Operators</p>
                      <div className="flex flex-wrap gap-1">
                        {checkpoint.metadata.operators.map((operator, opIndex) => (
                          <Badge
                            key={opIndex}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs"
                          >
                            {operator}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </FormSection>

      {/* Submit Error */}
      {validationErrors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            {validationErrors.submit}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onCancel}
          type="button"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <ButtonGroup>
          <Button
            variant="primary"
            type="submit"
            loading={isLoading}
          >
            Create Race
          </Button>
        </ButtonGroup>
      </div>
    </form>
  );
};

TemplateConfigurationForm.propTypes = {
  /** Template object to configure */
  template: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    eventType: PropTypes.string.isRequired,
    defaultStartTime: PropTypes.string.isRequired,
    defaultRunnerRangeStart: PropTypes.number.isRequired,
    defaultRunnerRangeEnd: PropTypes.number.isRequired,
    checkpoints: PropTypes.arrayOf(PropTypes.shape({
      number: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      location: PropTypes.string,
      orderSequence: PropTypes.number.isRequired,
      metadata: PropTypes.object
    })).isRequired,
    metadata: PropTypes.object
  }).isRequired,

  /** Callback when form is submitted */
  onSubmit: PropTypes.func.isRequired,

  /** Callback when form is cancelled */
  onCancel: PropTypes.func.isRequired,

  /** Whether the form is in loading state */
  isLoading: PropTypes.bool
};

export default TemplateConfigurationForm;
