import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';
import useNavigationStore from '../../shared/store/navigationStore';
import { APP_MODES } from '../../types/index.js';
import TimeUtils from '../../services/timeUtils.js';
import RaceDetailsStep from './RaceDetailsStep.jsx';
import RunnerRangesStep from './RunnerRangesStep.jsx';
import TemplateSelectionModal from '../RaceSetup/TemplateSelectionModal.jsx';
import TemplateConfigurationForm from '../RaceSetup/TemplateConfigurationForm.jsx';
import ErrorMessage from '../Layout/ErrorMessage.jsx';
import { RaceTemplateService } from '../../services/RaceTemplateService.js';

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

  const [currentStep, setCurrentStep] = useState(0); // 0 = template selection, 1 = details, 2 = runners
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(true);
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

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setUseTemplate(true);
    setShowTemplateModal(false);
    setCurrentStep(0); // Show template configuration form
  };

  const handleCreateFromScratch = () => {
    setUseTemplate(false);
    setSelectedTemplate(null);
    setShowTemplateModal(false);
    setCurrentStep(1); // Show manual race details step
  };

  const handleTemplateSubmit = async (template, overrides) => {
    clearError();
    
    try {
      // Create race from template using RaceTemplateService
      const raceId = await RaceTemplateService.createRaceFromTemplate(template, overrides);
      
      // End the operation and navigate to race overview
      endOperation();
      navigate('/race-maintenance/overview');
    } catch (err) {
      console.error('Failed to create race from template:', err);
      setError(err.message || 'Failed to create race from template');
    }
  };

  const handleCancel = () => {
    endOperation();
    navigate('/');
  };

  const handleBackToTemplateSelection = () => {
    setShowTemplateModal(true);
    setSelectedTemplate(null);
    setUseTemplate(false);
    setCurrentStep(0);
  };

  return (
    <>
      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={handleCancel}
        onSelectTemplate={handleTemplateSelect}
        onCreateFromScratch={handleCreateFromScratch}
      />

      {/* Main Content */}
      {!showTemplateModal && (
        <div className="max-w-4xl mx-auto p-6">
          <div className="card p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {useTemplate ? 'Configure Race from Template' : 'Create New Race'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {useTemplate 
                    ? 'Review and customize template settings'
                    : `Step ${currentStep} of 2: ${currentStep === 1 ? 'Race Details' : 'Runner Configuration'}`
                  }
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>

            {/* Progress Indicator (only for manual creation) */}
            {!useTemplate && (
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
            )}

            {/* Error Message */}
            <ErrorMessage error={error} onDismiss={clearError} />

            {/* Template Configuration Form */}
            {useTemplate && selectedTemplate && currentStep === 0 && (
              <TemplateConfigurationForm
                template={selectedTemplate}
                onSubmit={handleTemplateSubmit}
                onCancel={handleBackToTemplateSelection}
                isLoading={isLoading}
              />
            )}

            {/* Manual Creation Steps */}
            {!useTemplate && currentStep === 1 && (
              <RaceDetailsStep
                initialData={raceDetails}
                onNext={handleRaceDetailsNext}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            )}

            {!useTemplate && currentStep === 2 && (
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
      )}
    </>
  );
};

export default RaceConfig;
