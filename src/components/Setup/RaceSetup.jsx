import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { withOperationExit } from '../../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../../shared/store/navigationStore';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';
import {
  Container,
  Section,
  Card,
  CardBody,
  Button,
  Badge
} from '../../design-system/components';
import StepIndicator from './StepIndicator';

import RaceDetailsStep from './RaceDetailsStep';
import RunnerRangesStep from './RunnerRangesStep';
import LoadingSpinner from '../Layout/LoadingSpinner';
import ErrorMessage from '../Layout/ErrorMessage';

const steps = [
  { number: 1, label: 'Race Details', description: 'Configure race information and checkpoints' },
  { number: 2, label: 'Runner Setup', description: 'Set up runner number ranges' }
];

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
  
  const { startOperation } = useNavigationStore();
  const { createRace, loading, error } = useRaceMaintenanceStore();

  useEffect(() => {
    startOperation(MODULE_TYPES.RACE_MAINTENANCE);
  }, [startOperation]);

  useEffect(() => {
    const hasChanges = formData.name || formData.date || formData.startTime || 
                      formData.checkpoints.length > 0 || formData.runnerRanges.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [formData, setHasUnsavedChanges]);

  const handleNext = (stepData) => {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <Container maxWidth="xl">
          <Section spacing="tight">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
                  {steps[currentStep].label}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {steps[currentStep].description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="primary">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
                <Button
                  variant="ghost"
                  onClick={onExitAttempt}
                >
                  Exit Setup
                </Button>
              </div>
            </div>
          </Section>
        </Container>
      </div>

      {/* Main Content */}
      <Container maxWidth="xl" className="py-8">
        {/* Step Indicators */}
        <Section spacing="normal" className="mb-8">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </Section>

        {/* Form Content */}
        <Section spacing="normal">
          <Card variant="elevated" className="overflow-visible">
            <CardBody className="p-8">
              {currentStep === 0 && (
                <RaceDetailsStep
                  data={formData}
                  onUpdate={setFormData}
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
    </div>
  );
};

export default withOperationExit(RaceSetup);
