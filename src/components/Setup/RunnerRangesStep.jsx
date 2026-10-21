import React, { useState } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import {
  FormGroup,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  FormSection,
  Input,
  Button,
  Card,
  CardBody,
  Badge
} from '../../design-system/components';
import { DocumentIcon, PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Ensures every range object has numeric min/max, count, and individualNumbers.
 * Template-provided ranges only carry {min, max} — this fills the gaps so
 * summary maths and handleRemoveRange never crash or produce NaN.
 */
function normalizeRange(r) {
  const min = Number(r.min);
  const max = Number(r.max);
  const individualNumbers = r.individualNumbers ||
    Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return {
    ...r,
    min,
    max,
    count: r.count ?? individualNumbers.length,
    individualNumbers,
    description: r.description || `Runners ${min}–${max}`,
  };
}

const RunnerRangesStep = ({ raceDetails = {}, initialRanges = [], onBack, onCreate, isLoading, onImportFile }) => {

  // Initialize with default range if no initial ranges provided
  const defaultRange = [];
  
  const [ranges, setRanges] = useState(
    initialRanges.length > 0 ? initialRanges.map(normalizeRange) : defaultRange
  );
  const [newRange, setNewRange] = useState({ min: '201', max: '300', description: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [rangeInput, setRangeInput] = useState('');
  const [showNameFields, setShowNameFields] = useState(false);

  const runnerRoster = useRaceStore(s => s.runnerRoster);
  const updateRunnerPersonalData = useRaceStore(s => s.updateRunnerPersonalData);
  const raceId = raceDetails?.id || raceDetails?.raceId || null;

  // Add new state for tracking all individual runner numbers
  const [allRunnerNumbers, setAllRunnerNumbers] = useState(new Set(
    (initialRanges.length > 0 ? initialRanges.map(normalizeRange) : defaultRange).flatMap(range =>
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
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display font-bold text-xl text-vk-navy dark:text-white">Which bib numbers are racing?</h2>
        <p className="text-sm text-vk-muted dark:text-gray-400 leading-relaxed">
          Add one or more ranges. Ranges are only used here, to create the field — every bib is handled on its own after this.
        </p>
      </div>

      {/* Add New Range */}
      <FormSection
        icon={DocumentIcon}
        title="Add Runner Range"
        description="Start and end bib numbers, inclusive"
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
            variant="blue"
            size="action"
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

      {/* Live count + first / last preview */}
      <RunnerCountPreview numbers={getRunnerNumbers()} />

      <div className="bg-vk-band dark:bg-gray-800 rounded-card px-4 py-3.5 flex gap-3 items-start">
        <InformationCircleIcon className="w-5 h-5 text-vk-blue shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-[13px] leading-relaxed">
          Have a start list?{' '}
          {onImportFile
            ? <button type="button" onClick={onImportFile} className="text-vk-blue font-semibold underline">Import a CSV or WebScorer file</button>
            : 'Import a CSV or WebScorer file from Race setup'}
          {' '}to bring in names, gender and wave too.
        </div>
      </div>

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
      <div className="flex gap-3 pt-6 border-t border-vk-border dark:border-gray-700">
        <Button variant="blueOutline" size="primary" onClick={onBack} className="flex-1">
          Back: Race Details
        </Button>
        <Button
          variant="gold"
          size="primary"
          onClick={handleCreateRace}
          loading={isLoading}
          disabled={ranges.length === 0}
          className="flex-[2]"
        >
          Next: Waves →
        </Button>
      </div>

      {validationErrors.general && (
        <FormErrorMessage>{validationErrors.general}</FormErrorMessage>
      )}
    </div>
  );
};

/** "250 runners will be created" + first five … last five bib chips. */
const RunnerCountPreview = ({ numbers }) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  const head = sorted.slice(0, 5);
  const tail = sorted.length > 10 ? sorted.slice(-5) : sorted.slice(5);
  const chip = (n, key, muted = false) => (
    <div key={key} className={`bg-vk-band dark:bg-gray-700 rounded-chip py-2 text-center font-bold text-[13px] tabular-nums ${muted ? 'text-vk-muted' : ''}`}>{n}</div>
  );
  return (
    <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-4 flex flex-col gap-3" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <div className="font-display font-extrabold text-[32px] text-vk-navy dark:text-white tabular-nums">{sorted.length}</div>
        <div className="text-[13px] font-semibold text-vk-blue">runner{sorted.length === 1 ? '' : 's'} will be created</div>
      </div>
      {sorted.length > 0 && (
        <div className="grid grid-cols-6 gap-1.5">
          {head.map(n => chip(n, `h${n}`))}
          {sorted.length > 10 && chip('…', 'gap', true)}
          {tail.map(n => chip(n, `t${n}`))}
        </div>
      )}
    </div>
  );
};

export default RunnerRangesStep;
