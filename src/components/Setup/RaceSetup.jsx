import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { withOperationExit } from '../../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../../shared/store/navigationStore';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';

import RaceDetailsStep from './RaceDetailsStep';
import RunnerRangesStep from './RunnerRangesStep';
import LoadingSpinner from '../Layout/LoadingSpinner';
import ErrorMessage from '../Layout/ErrorMessage';

const RaceSetup = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    checkpoints: [],
    runnerRanges: []
  });
  
  // Store hooks
  const { startOperation } = useNavigationStore();
  const { createRace, loading, error } = useRaceMaintenanceStore();

  // Initialize race maintenance operation
  useEffect(() => {
    startOperation(MODULE_TYPES.RACE_MAINTENANCE);
  }, [startOperation]);

  // Track form changes
  useEffect(() => {
    const hasChanges = formData.name || formData.date || formData.startTime || 
                      formData.checkpoints.length > 0 || formData.runnerRanges.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [formData, setHasUnsavedChanges]);

  const handleNext = (stepData) => {
    // Update form data with step data if provided
    if (stepData) {
      setFormData(prev => ({
        ...prev,
        ...stepData
      }));
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (runnerRanges) => {
    try {
      const completeFormData = {
        ...formData,
        runnerRanges: runnerRanges || formData.runnerRanges || []
      };
      const raceId = await createRace(completeFormData);
      setHasUnsavedChanges(false);
      navigate(`/race-maintenance/overview?raceId=${raceId}`);
    } catch (error) {
      console.error('Error creating race:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Setup Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">
          Race Setup
        </h1>
        <div className="space-x-4">
          <button
            onClick={onExitAttempt}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Exit Setup
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <StepIndicator
            number={1}
            title="Race Details"
            active={currentStep === 0}
            completed={currentStep > 0}
          />
          <StepConnector />
          <StepIndicator
            number={2}
            title="Runner Setup"
            active={currentStep === 1}
            completed={currentStep > 1}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {currentStep === 0 && (
          <RaceDetailsStep
            initialData={formData}
            onNext={handleNext}
            onCancel={onExitAttempt}
            isLoading={loading}
          />
        )}
        {currentStep === 1 && (
          <RunnerRangesStep
            raceDetails={formData}
            initialRanges={formData.runnerRanges || []}
            onBack={handleBack}
            onCreate={handleSubmit}
            isLoading={loading}
          />
        )}
      </div>
    </div>
  );
};

// Step Indicator Component
const StepIndicator = ({ number, title, active, completed }) => (
  <div className="flex items-center">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center ${
        completed
          ? 'bg-green-500 text-white'
          : active
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {completed ? '✓' : number}
    </div>
    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      {title}
    </span>
  </div>
);

// Step Connector Component
const StepConnector = () => (
  <div className="w-16 h-px bg-gray-300 dark:bg-gray-600 mx-4" />
);

// Wrap with operation exit handling
export default withOperationExit(RaceSetup);
