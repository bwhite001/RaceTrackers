import React, { useState, useMemo } from 'react';
import {
  FormGroup,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Badge
} from '../../design-system/components';
import { 
  UsersIcon, 
  ArrowUpTrayIcon, 
  TrashIcon, 
  PlusIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

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
  const [csvFile, setCsvFile] = useState(null);

  // Track all individual runner numbers
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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRange = () => {
    if (validateRange(newRange.min, newRange.max)) {
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
      setAllRunnerNumbers(new Set([...allRunnerNumbers, ...individualNumbers]));
      setNewRange({ min: (max + 1).toString(), max: (max + 100).toString(), description: '' });
      setValidationErrors({});
    }
  };

  const handleRemoveRange = (index) => {
    const removedRange = ranges[index];
    const updatedRanges = ranges.filter((_, i) => i !== index);
    setRanges(updatedRanges);
    
    // Remove numbers from tracking set
    const newNumbers = new Set(allRunnerNumbers);
    removedRange.individualNumbers.forEach(num => newNumbers.delete(num));
    setAllRunnerNumbers(newNumbers);
  };

  const handleRangeInputChange = (e) => {
    setRangeInput(e.target.value);
    setValidationErrors({});
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      setValidationErrors({});
    }
  };

  const handleCreateRace = () => {
    if (ranges.length === 0) {
      setValidationErrors({ general: 'At least one runner range is required' });
      return;
    }
    onCreate(ranges);
  };

  const getTotalRunners = () => ranges.reduce((total, range) => total + range.count, 0);

  const getRunnerNumbers = () => ranges.flatMap(range => range.individualNumbers);

  return (
    <div className="space-y-8">
      {/* Quick Range Input */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
            Add Runner Numbers
          </h3>
          <Badge variant="danger" size="sm">Required</Badge>
        </div>

        <Card>
          <CardHeader>
            <h4 className="text-sm font-medium">Quick Range Input</h4>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormGroup>
                <FormLabel htmlFor="min">Minimum Number</FormLabel>
                <Input
                  id="min"
                  type="number"
                  value={newRange.min}
                  onChange={(e) => setNewRange({ ...newRange, min: e.target.value })}
                  error={validationErrors.min}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="max">Maximum Number</FormLabel>
                <Input
                  id="max"
                  type="number"
                  value={newRange.max}
                  onChange={(e) => setNewRange({ ...newRange, max: e.target.value })}
                  error={validationErrors.max}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="description">Description (Optional)</FormLabel>
                <Input
                  id="description"
                  type="text"
                  value={newRange.description}
                  onChange={(e) => setNewRange({ ...newRange, description: e.target.value })}
                  placeholder="e.g., Elite Runners"
                />
              </FormGroup>
            </div>

            {(validationErrors.min || validationErrors.max || validationErrors.overlap || validationErrors.duplicates) && (
              <FormErrorMessage>
                {validationErrors.min || validationErrors.max || validationErrors.overlap || validationErrors.duplicates}
              </FormErrorMessage>
            )}

            <Button
              variant="primary"
              onClick={handleAddRange}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Add Range
            </Button>
          </CardBody>
        </Card>

        {/* CSV Import */}
        <Card>
          <CardHeader>
            <h4 className="text-sm font-medium">Import from CSV</h4>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                leftIcon={<ArrowUpTrayIcon className="w-5 h-5" />}
                onClick={() => document.getElementById('csvInput').click()}
              >
                Upload CSV
              </Button>
              <input
                id="csvInput"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {csvFile && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {csvFile.name}
                </span>
              )}
            </div>
            <FormHelperText>
              Upload a CSV file with runner numbers in the first column
            </FormHelperText>
          </CardBody>
        </Card>
      </div>

      {/* Runner Ranges List */}
      {ranges.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <DocumentTextIcon className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              Configured Ranges
            </h3>
            <Badge variant="success" size="sm">
              {getTotalRunners()} Runners
            </Badge>
          </div>

          <Card>
            <CardBody>
              <div className="space-y-4">
                {ranges.map((range, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">
                          {range.min}-{range.max}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({range.count} runners)
                        </span>
                      </div>
                      {range.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {range.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveRange(index)}
                      leftIcon={<TrashIcon className="w-5 h-5" />}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Summary Card */}
      <Card variant="elevated" className="bg-green-50 dark:bg-green-900/20">
        <CardBody>
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Runner Configuration Summary
          </h4>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <p><strong>Total Runners:</strong> {getTotalRunners()}</p>
            <p><strong>Number Ranges:</strong> {ranges.length}</p>
            {ranges.length > 0 && (
              <p>
                <strong>Number Range:</strong> {Math.min(...getRunnerNumbers())}-{Math.max(...getRunnerNumbers())}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Error Message */}
      {validationErrors.general && (
        <FormErrorMessage>{validationErrors.general}</FormErrorMessage>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          type="button"
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
    </div>
  );
};

export default RunnerRangesStep;
