import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { withOperationExit } from '../../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../../shared/store/navigationStore';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';
import {
  Container,
  Section,
  Button,
  Badge,
  Card,
  CardBody
} from '../../design-system/components';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import RaceDetailsStep from './RaceDetailsStep';
import RunnerRangesStep from './RunnerRangesStep';
import LoadingSpinner from '../Layout/LoadingSpinner';
import ErrorMessage from '../Layout/ErrorMessage';
import StepIndicator from './StepIndicator';

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
    return (
      <Container maxWidth="xl" padding="normal">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" padding="normal">
        <div className="flex items-center justify-center min-h-[400px]">
          <ErrorMessage message={error} />
        </div>
      </Container>
    );
  }

  const steps = [
    {
      number: 1,
      label: 'Race Details',
      description: 'Configure race information and checkpoints'
    },
    {
      number: 2,
      label: 'Runner Setup',
      description: 'Set up runner number ranges'
    }
  ];

  return (
    <Container maxWidth="xl" padding="normal">
      {/* Header Section */}
      <Section spacing="tight" border="bottom">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onExitAttempt}
              leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
            >
              Exit Setup
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
                Race Setup
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStep === 0 ? 'Configure race details' : 'Set up runner numbers'}
              </p>
            </div>
          </div>
          <Badge variant="primary" size="lg">
            Step {currentStep + 1} of 2
          </Badge>
        </div>
      </Section>

      {/* Step Indicator */}
      <Section spacing="normal">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </Section>

      {/* Main Content */}
      <Section spacing="normal">
        <Card>
          <CardBody>
            {currentStep === 0 && (
              <RaceDetailsStep
                data={formData}
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
          </CardBody>
        </Card>
      </Section>
    </Container>
  );
};

export default withOperationExit(RaceSetup);
