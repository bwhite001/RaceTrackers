import React, { useState } from 'react';
import useRaceStore from '../../store/useRaceStore.js';
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
  CardBody,
  Badge
} from '../../design-system/components';
import { DocumentIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const RunnerRangesStep = ({ raceDetails = {}, initialRanges = [], onBack, onCreate, isLoading }) => {
  // Initialize with default range if no initial ranges provided
  const defaultRange = initialRanges.length === 0 ? [{
    min: 100,
    max: 200,
    description: 'Runners 100-200',
    count: 101,
    individualNumbers: Array.from({ length: 101 }, (_, i) => 100 + i)
  }] : [];
  
  const [ranges, setRanges] = useState(initialRanges.length > 0 ? initialRanges : defaultRange);
  const [newRange, setNewRange] = useState({ min: '201', max: '300', description: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [rangeInput, setRangeInput] = useState('');
  const [showNameFields, setShowNameFields] = useState(false);

  const runnerRoster = useRaceStore(s => s.runnerRoster);
  const updateRunnerPersonalData = useRaceStore(s => s.updateRunnerPersonalData);
  const raceId = raceDetails?.id || raceDetails?.raceId || null;

  // Add new state for tracking all individual runner numbers
  const [allRunnerNumbers, setAllRunnerNumbers] = useState(new Set(
    (initialRanges.length > 0 ? initialRanges : defaultRange).flatMap(range => 
      range.individualNumbers || 
      Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i)
    )
  ));

  const validateRange = (min, max, individualNumbers = null) => {
    const errors = {};
    
    if (!min || isNaN(min) || min < 1) {
      errors.min = 'Minimum must be a positive number';
    }
    
    if (!max || isNaN(max) || max < 1) {
      errors.max = 'Maximum must be a positive number';
    }
    
    if (!errors.min && !errors.max && parseInt(min) >= parseInt(max)) {
      errors.max = 'Maximum must be greater than minimum';
    }
    
    if (!errors.min && !errors.max && (parseInt(max) - parseInt(min)) > 10000) {
      errors.max = 'Range cannot exceed 10,000 runners';
    }

    // Check for overlaps with existing ranges
    const minNum = parseInt(min);
    const maxNum = parseInt(max);
    
    for (const existingRange of ranges) {
      if (
        (minNum >= existingRange.min && minNum <= existingRange.max) ||
        (maxNum >= existingRange.min && maxNum <= existingRange.max) ||
        (minNum <= existingRange.min && maxNum >= existingRange.max)
      ) {
        errors.overlap = `Range overlaps with existing range ${existingRange.min}-${existingRange.max}`;
        break;
      }
    }
    
    // Check for duplicate numbers
    const numbersToCheck = individualNumbers || 
      Array.from({ length: parseInt(max) - parseInt(min) + 1 }, (_, i) => parseInt(min) + i);
    
    const duplicates = numbersToCheck.filter(num => allRunnerNumbers.has(num));
    if (duplicates.length > 0) {
      errors.duplicates = `Numbers already in use: ${duplicates.join(', ')}`;
    }
    
    return errors;
  };

  const handleAddRange = () => {
    const errors = validateRange(newRange.min, newRange.max);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      const min = parseInt(newRange.min);
      const max = parseInt(newRange.max);
      const count = max - min + 1;
      const individualNumbers = Array.from({ length: count }, (_, i) => min + i);
      
      const range = {
        min,
        max,
        description: newRange.description || `Runners ${min}-${max}`,
        count,
        individualNumbers
      };
      
      setRanges([...ranges, range]);
      setNewRange({ min: (max + 1).toString(), max: (max + 100).toString(), description: '' });
      
      // Update all runner numbers
      const newNumbers = new Set([...allRunnerNumbers, ...individualNumbers]);
      setAllRunnerNumbers(newNumbers);
    }
  };

  const handleRemoveRange = (index) => {
    const removedRange = ranges[index];
    const updatedRanges = ranges.filter((_, i) => i !== index);
    setRanges(updatedRanges);
    
    // Update all runner numbers
    const newNumbers = new Set(allRunnerNumbers);
    removedRange.individualNumbers.forEach(num => newNumbers.delete(num));
    setAllRunnerNumbers(newNumbers);
  };

  const handleCreateRace = () => {
    if (ranges.length === 0) {
      setValidationErrors({ general: 'At least one runner range is required' });
      return;
    }
    onCreate(ranges);
  };

  const getTotalRunners = () => {
    return ranges.reduce((total, range) => total + range.count, 0);
  };

  const getRunnerNumbers = () => {
    return ranges.flatMap(range => range.individualNumbers);
  };

  return (
    <div className="space-y-6">
      {/* Add New Range */}
      <FormSection
        icon={DocumentIcon}
        title="Add Runner Range"
        description="Define number ranges for race participants"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormGroup>
            <FormLabel htmlFor="min" required>Start Number</FormLabel>
            <Input
              id="min"
              type="number"
              value={newRange.min}
              onChange={(e) => setNewRange({ ...newRange, min: e.target.value })}
              error={!!validationErrors.min}
              min={1}
            />
            {validationErrors.min && (
              <FormErrorMessage>{validationErrors.min}</FormErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="max" required>End Number</FormLabel>
            <Input
              id="max"
              type="number"
              value={newRange.max}
              onChange={(e) => setNewRange({ ...newRange, max: e.target.value })}
              error={!!validationErrors.max}
              min={1}
            />
            {validationErrors.max && (
              <FormErrorMessage>{validationErrors.max}</FormErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Input
              id="description"
              value={newRange.description}
              onChange={(e) => setNewRange({ ...newRange, description: e.target.value })}
              placeholder="Optional description"
            />
          </FormGroup>
        </div>

        {(validationErrors.overlap || validationErrors.duplicates) && (
          <div className="mt-2">
            <FormErrorMessage>
              {validationErrors.overlap || validationErrors.duplicates}
            </FormErrorMessage>
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={handleAddRange}
            leftIcon={<PlusIcon className="w-5 h-5" />}
          >
            Add Range
          </Button>
        </div>
      </FormSection>

      {/* Configured Ranges */}
      {ranges.length > 0 && (
        <FormSection
          icon={DocumentIcon}
          title="Configured Ranges"
          description="Review and manage runner number ranges"
        >
          <div className="space-y-3">
            {ranges.map((range, index) => (
              <Card key={index} variant="outline">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="primary" size="lg">
                        {range.min}-{range.max}
                      </Badge>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {range.description}
                      </div>
                      <Badge variant="secondary">
                        {range.count} runners
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveRange(index)}
                      leftIcon={<TrashIcon className="w-5 h-5" />}
                      aria-label="Remove range"
                    />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </FormSection>
      )}

      {/* Summary Card */}
      <Card variant="elevated" className="bg-blue-50 dark:bg-blue-900/20">
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <DocumentIcon className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Runner Configuration Summary
            </h4>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Total Runners:</span>
              <Badge variant="primary">{getTotalRunners()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Number Ranges:</span>
              <Badge variant="secondary">{ranges.length}</Badge>
            </div>
            {ranges.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Full Range:</span>
                <Badge variant="default">
                  {Math.min(...getRunnerNumbers())}-{Math.max(...getRunnerNumbers())}
                </Badge>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Optional Runner Names & Gender */}
      {ranges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowNameFields(!showNameFields)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>{showNameFields ? '▾' : '▸'}</span>
            Add runner names &amp; gender (optional)
          </button>
          {showNameFields && (
            <div className="mt-3 overflow-x-auto max-h-60 border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Bib #</th>
                    <th className="px-3 py-2 text-left">First Name</th>
                    <th className="px-3 py-2 text-left">Last Name</th>
                    <th className="px-3 py-2 text-left">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {getRunnerNumbers().map(runnerNumber => {
                    const existing = runnerRoster.find(r => r.number === runnerNumber) || {};
                    return (
                      <tr key={runnerNumber} className="border-t dark:border-gray-600" data-runner-row={runnerNumber}>
                        <td className="px-3 py-1 font-mono text-gray-500">{runnerNumber}</td>
                        <td className="px-3 py-1">
                          <input
                            type="text"
                            name="firstName"
                            defaultValue={existing.firstName || ''}
                            placeholder="Optional"
                            className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                            onBlur={(e) => {
                              if (raceId) updateRunnerPersonalData(raceId, runnerNumber, {
                                firstName: e.target.value || null,
                                lastName: existing.lastName || null,
                                gender: existing.gender || 'X'
                              });
                            }}
                          />
                        </td>
                        <td className="px-3 py-1">
                          <input
                            type="text"
                            name="lastName"
                            defaultValue={existing.lastName || ''}
                            placeholder="Optional"
                            className="w-full border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                            onBlur={(e) => {
                              if (raceId) updateRunnerPersonalData(raceId, runnerNumber, {
                                firstName: existing.firstName || null,
                                lastName: e.target.value || null,
                                gender: existing.gender || 'X'
                              });
                            }}
                          />
                        </td>
                        <td className="px-3 py-1">
                          <select
                            name="gender"
                            defaultValue={existing.gender || 'X'}
                            className="border-0 bg-transparent text-sm focus:outline-none"
                            onChange={(e) => {
                              if (raceId) updateRunnerPersonalData(raceId, runnerNumber, {
                                firstName: existing.firstName || null,
                                lastName: existing.lastName || null,
                                gender: e.target.value
                              });
                            }}
                          >
                            <option value="X">—</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={onBack}
        >
          Back: Race Details
        </Button>
        <ButtonGroup>
          <Button
            variant="primary"
            onClick={handleCreateRace}
            loading={isLoading}
            disabled={ranges.length === 0}
          >
            Create Race
          </Button>
        </ButtonGroup>
      </div>

      {validationErrors.general && (
        <FormErrorMessage>{validationErrors.general}</FormErrorMessage>
      )}
    </div>
  );
};

export default RunnerRangesStep;
