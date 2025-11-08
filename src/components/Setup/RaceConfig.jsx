import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';
import useNavigationStore from '../../shared/store/navigationStore';
import { APP_MODES } from '../../types/index.js';
import TimeUtils from '../../services/timeUtils.js';
import RaceDetailsStep from './RaceDetailsStep.jsx';
import RunnerRangesStep from './RunnerRangesStep.jsx';
import ErrorMessage from '../Layout/ErrorMessage.jsx';

const RaceConfig = () => {
  const navigate = useNavigate();
  const { 
    createRace, 
    loading: isLoading, 
    error, 
    setError 
  } = useRaceMaintenanceStore();
  
  const { endOperation } = useNavigationStore();
  
  const clearError = () => setError(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [raceDetails, setRaceDetails] = useState({
    name: '',
    date: TimeUtils.getTodayDateString(),
    startTime: '06:00', // Default to 6am as requested
    numCheckpoints: 1,
    checkpoints: [{ number: 1, name: 'Checkpoint 1' }]
  });
  const [runnerRanges, setRunnerRanges] = useState([]);

  const handleRaceDetailsNext = (details) => {
    setRaceDetails(details);
    setCurrentStep(2);
  };

  const handleRunnerRangesBack = () => {
    setCurrentStep(1);
  };

  const handleCreateRace = async (ranges) => {
    clearError();
    
    try {
      // Calculate min and max runner numbers from all ranges
      const allNumbers = ranges.flatMap(range => {
        const numbers = [];
        for (let i = range.min; i <= range.max; i++) {
          numbers.push(i);
        }
        return numbers;
      });

      if (allNumbers.length === 0) {
        throw new Error('At least one runner range is required');
      }

      const minRunner = Math.min(...allNumbers);
      const maxRunner = Math.max(...allNumbers);

      const raceData = {
        ...raceDetails,
        minRunner,
        maxRunner,
        runnerRanges: ranges, // Store the ranges for reference
        startTime: TimeUtils.parseTimeInput(raceDetails.startTime)
      };

      await createRace(raceData);
      
      // End the operation and navigate to race overview
      endOperation();
      navigate('/race-maintenance/overview');
    } catch (err) {
      console.error('Failed to create race:', err);
    }
  };

  const handleCancel = () => {
    endOperation();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Race
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Step {currentStep} of 2: {currentStep === 1 ? 'Race Details' : 'Runner Configuration'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 1 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              currentStep >= 2 
                ? 'bg-primary-600' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= 2 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Race Details</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">Runner Configuration</span>
          </div>
        </div>

        {/* Error Message */}
        <ErrorMessage error={error} onDismiss={clearError} />

        {/* Step Content */}
        {currentStep === 1 && (
          <RaceDetailsStep
            initialData={raceDetails}
            onNext={handleRaceDetailsNext}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        )}

        {currentStep === 2 && (
          <RunnerRangesStep
            raceDetails={raceDetails}
            initialRanges={runnerRanges}
            onBack={handleRunnerRangesBack}
            onCreate={handleCreateRace}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default RaceConfig;
