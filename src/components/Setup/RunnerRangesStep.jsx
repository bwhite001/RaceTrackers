import React, { useState, useMemo, useCallback } from 'react';

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
      errors.overlap = `Runner number(s) ${duplicates.join(', ')} already exists`;
    }
    
    return errors;
  };

  const parseRangeInput = (input) => {
    // Handle ranges like "100-200"
    const rangeMatch = input.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      if (min < max) {
        const numbers = Array.from(
          { length: max - min + 1 }, 
          (_, i) => min + i
        );
        return { 
          min: min.toString(), 
          max: max.toString(),
          individualNumbers: numbers
        };
      }
    }
    
    // Handle individual numbers like "33, 34"
    const individualMatch = input.match(/^[\d\s,]+$/);
    if (individualMatch) {
      const numbers = [...new Set(input.split(/[,\s]+/)
        .map(n => n.trim())
        .filter(n => n && !isNaN(n))
        .map(n => parseInt(n))
        .filter(n => n > 0)
        .sort((a, b) => a - b))];
      
      if (numbers.length > 0) {
        return { 
          min: Math.min(...numbers).toString(),
          max: Math.max(...numbers).toString(),
          individualNumbers: numbers
        };
      }
    }
    
    return null;
  };

  const handleRangeInputChange = (e) => {
    const value = e.target.value;
    setRangeInput(value);
    
    const parsed = parseRangeInput(value);
    if (parsed) {
      setNewRange(prev => ({
        ...prev,
        min: parsed.min,
        max: parsed.max,
        isIndividual: parsed.isIndividual || false,
        individualNumbers: parsed.individualNumbers || null
      }));
    }
  };

  const handleNewRangeChange = (field, value) => {
    setNewRange(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors
    if (validationErrors[field] || validationErrors.overlap) {
      setValidationErrors({});
    }
  };

  const handleAddRange = () => {
    const numbers = newRange.individualNumbers || 
      Array.from(
        { length: parseInt(newRange.max) - parseInt(newRange.min) + 1 }, 
        (_, i) => parseInt(newRange.min) + i
      );
    
    const errors = validateRange(newRange.min, newRange.max, numbers);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const range = {
      min: parseInt(newRange.min),
      max: parseInt(newRange.max),
      description: newRange.description.trim() || 
        `Runners ${newRange.min}-${newRange.max}`,
      count: numbers.length,
      individualNumbers: numbers
    };

    // Update all runner numbers
    setAllRunnerNumbers(prev => new Set([...prev, ...numbers]));
    
    setRanges(prev => [...prev, range]);
    
    // Calculate next range starting from the last max + 1
    const nextMin = parseInt(newRange.max) + 1;
    const nextMax = nextMin + 100;
    setNewRange({ min: nextMin.toString(), max: nextMax.toString(), description: '' });
    setRangeInput('');
    setValidationErrors({});
  };

  const handleRemoveRange = (index) => {
    const rangeToRemove = ranges[index];
    const numbersToRemove = new Set(rangeToRemove.individualNumbers);
    
    // Remove numbers from allRunnerNumbers
    setAllRunnerNumbers(prev => {
      const newSet = new Set(prev);
      numbersToRemove.forEach(num => newSet.delete(num));
      return newSet;
    });
    
    setRanges(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateRace = () => {
    if (ranges.length === 0) {
      setValidationErrors({ general: 'At least one runner range is required' });
      return;
    }

    // Pass the ranges with individual numbers
    onCreate(ranges);
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n')
          .map(row => row.trim())
          .filter(row => row) // Remove empty lines
          .map(row => {
            const [number, description = ''] = row.split(',').map(cell => cell.trim());
            return { number: parseInt(number), description };
          })
          .filter(row => !isNaN(row.number) && row.number > 0);

        // Group consecutive numbers into ranges
        const ranges = [];
        let currentRange = null;

        rows.sort((a, b) => a.number - b.number).forEach((row) => {
          if (!currentRange) {
            currentRange = {
              min: row.number,
              max: row.number,
              description: row.description,
              numbers: [row.number],
              notes: { [row.number]: row.description }
            };
          } else if (row.number === currentRange.max + 1) {
            currentRange.max = row.number;
            currentRange.numbers.push(row.number);
            currentRange.notes[row.number] = row.description;
          } else {
            // Finish current range
            ranges.push({
              ...currentRange,
              count: currentRange.numbers.length,
              individualNumbers: currentRange.numbers,
              isIndividual: true
            });
            // Start new range
            currentRange = {
              min: row.number,
              max: row.number,
              description: row.description,
              numbers: [row.number],
              notes: { [row.number]: row.description }
            };
          }
        });

        // Add last range
        if (currentRange) {
          ranges.push({
            ...currentRange,
            count: currentRange.numbers.length,
            individualNumbers: currentRange.numbers,
            isIndividual: true
          });
        }

        // Validate for duplicates with existing ranges
        const duplicates = ranges
          .flatMap(range => range.individualNumbers)
          .filter(num => allRunnerNumbers.has(num));

        if (duplicates.length > 0) {
          alert(`Duplicate runner numbers found: ${duplicates.join(', ')}`);
          return;
        }

        // Add new ranges
        ranges.forEach(range => {
          setAllRunnerNumbers(prev => new Set([...prev, ...range.individualNumbers]));
        });
        setRanges(prev => [...prev, ...ranges]);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please ensure it\'s properly formatted.');
      }
    };
    reader.readAsText(file);
  };

  const getTotalRunners = () => {
    return ranges.reduce((total, range) => total + range.count, 0);
  };

  const getRunnerNumbers = () => {
    const numbers = [];
    ranges.forEach(range => {
      if (range.isIndividual && range.individualNumbers) {
        // Add individual numbers
        numbers.push(...range.individualNumbers);
      } else {
        // Add range numbers
        for (let i = range.min; i <= range.max; i++) {
          numbers.push(i);
        }
      }
    });
    return numbers.sort((a, b) => a - b);
  };

  return (
    <div className="space-y-6">
      {/* Race Details Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Race Details
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <p><strong>Name:</strong> {raceDetails?.name || 'N/A'}</p>
          <p><strong>Date & Time:</strong> {raceDetails?.date || 'N/A'} at {raceDetails?.startTime || 'N/A'}</p>
          <p><strong>Checkpoints:</strong> {raceDetails?.numCheckpoints || 0} ({raceDetails?.checkpoints?.map(cp => cp.name).join(', ') || 'N/A'})</p>
        </div>
      </div>

      {/* Add Runner Range */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Add Runner Ranges
        </h3>
        
        {/* Quick Range Input */}
        <div>
          <label htmlFor="rangeInput" className="form-label">
            Quick Range Input
          </label>
          <input
            type="text"
            id="rangeInput"
            value={rangeInput}
            onChange={handleRangeInputChange}
            className="form-input"
            placeholder="e.g., 100-200, 300-450, or 33, 34, 35"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter a range like "100-200" or individual numbers like "33, 34, 35" to quickly fill the fields below
          </p>
        </div>

        {/* Individual Range Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="minRunner" className="form-label">
              From Runner Number *
            </label>
            <input
              type="number"
              id="minRunner"
              value={newRange.min}
              onChange={(e) => handleNewRangeChange('min', e.target.value)}
              className={`form-input ${validationErrors.min ? 'border-red-500' : ''}`}
              placeholder="100"
              min="1"
            />
            {validationErrors.min && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.min}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="maxRunner" className="form-label">
              To Runner Number *
            </label>
            <input
              type="number"
              id="maxRunner"
              value={newRange.max}
              onChange={(e) => handleNewRangeChange('max', e.target.value)}
              className={`form-input ${validationErrors.max ? 'border-red-500' : ''}`}
              placeholder="200"
              min="1"
            />
            {validationErrors.max && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.max}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <input
              type="text"
              id="description"
              value={newRange.description}
              onChange={(e) => handleNewRangeChange('description', e.target.value)}
              className="form-input"
              placeholder="e.g., Elite runners"
            />
          </div>
        </div>

        {/* Overlap Error */}
        {validationErrors.overlap && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {validationErrors.overlap}
          </p>
        )}

        {/* Range Preview */}
        {newRange.min && newRange.max && !validationErrors.min && !validationErrors.max && !validationErrors.overlap && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {newRange.isIndividual ? (
                <>Individual runners: {newRange.individualNumbers.join(', ')} ({newRange.individualNumbers.length} runners)</>
              ) : (
                <>Range: {newRange.min}-{newRange.max} ({parseInt(newRange.max) - parseInt(newRange.min) + 1} runners)</>
              )}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddRange}
          disabled={!newRange.min || !newRange.max || Object.keys(validationErrors).length > 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Range
        </button>
      </div>

      {/* CSV Import */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Import Runners from CSV
        </h3>
        <div>
          <label htmlFor="csvUpload" className="form-label">
            Upload CSV File
          </label>
          <input
            type="file"
            id="csvUpload"
            accept=".csv"
            onChange={handleCsvUpload}
            className="form-input"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload a CSV file with runner numbers and descriptions (optional).<br />
            Format: number,description<br />
            Example: 100,Elite Runner
          </p>
        </div>
      </div>

      {/* Current Ranges */}
      {ranges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Configured Runner Ranges
          </h3>
          
          <div className="space-y-3">
            {ranges.map((range, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {range.description}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Runners {range.min}-{range.max} ({range.count} runners)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRange(index)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove range"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Race Configuration Summary
            </h4>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p><strong>Total Runners:</strong> {getTotalRunners()}</p>
              <p><strong>Runner Ranges:</strong> {ranges.length}</p>
              <p><strong>Number Range:</strong> {Math.min(...getRunnerNumbers())}-{Math.max(...getRunnerNumbers())}</p>
            </div>
          </div>
        </div>
      )}

      {/* General Error */}
      {validationErrors.general && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {validationErrors.general}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
        >
          Back: Race Details
        </button>
        <button
          type="button"
          onClick={handleCreateRace}
          disabled={isLoading || ranges.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Race...' : 'Create Race'}
        </button>
      </div>
    </div>
  );
};

export default RunnerRangesStep;
