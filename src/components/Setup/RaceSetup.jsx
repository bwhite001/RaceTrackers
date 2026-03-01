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

import TemplateSelectionStep from './TemplateSelectionStep';
import RaceDetailsStep from './RaceDetailsStep';
import RunnerRangesStep from './RunnerRangesStep';
import BatchConfigStep from './BatchConfigStep';
import LoadingSpinner from '../Layout/LoadingSpinner';
import ErrorMessage from '../Layout/ErrorMessage';
import StepIndicator from './StepIndicator';

// Step indices
const STEP_TEMPLATE = 0;
const STEP_DETAILS = 1;
const STEP_RUNNERS = 2;
const STEP_BATCHES = 3;

const RaceSetup = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEP_TEMPLATE);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    checkpoints: [],
    runnerRanges: [],
    batches: []
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

  const handleTemplateSelect = (template) => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        checkpoints: template.checkpoints || [],
        runnerRanges: template.runnerRanges || [],
        // Store template default batches — start times filled in step 3
        _templateBatches: template.defaultBatches || []
      }));
    }
    setCurrentStep(STEP_DETAILS);
  };

  const handleNext = (stepData) => {
    if (stepData) {
      setFormData(prev => ({ ...prev, ...stepData }));
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleRunnersNext = (runnerRanges) => {
    setFormData(prev => ({ ...prev, runnerRanges }));
    // Build initial batches for step 3 from template or default single batch
    const templateBatches = formData._templateBatches || [];
    const raceDate = formData.date || new Date().toISOString().slice(0, 10);
    const raceTime = formData.startTime || '00:00:00';
    const raceStart = `${raceDate}T${raceTime.length === 5 ? raceTime + ':00' : raceTime}`;

    let initialBatches;
    if (templateBatches.length > 0) {
      initialBatches = templateBatches.map(b => {
        const [hh, mm] = raceStart.slice(11, 16).split(':').map(Number);
        const offsetMin = b.defaultStartOffsetMinutes || 0;
        const totalMin = hh * 60 + mm + offsetMin;
        const startH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
        const startM = String(totalMin % 60).padStart(2, '0');
        return {
          batchNumber: b.batchNumber,
          batchName: b.batchName,
          startTime: `${raceDate}T${startH}:${startM}:00`
        };
      });
    } else {
      initialBatches = [{ batchNumber: 1, batchName: 'All Runners', startTime: raceStart }];
    }

    setFormData(prev => ({ ...prev, runnerRanges, batches: initialBatches }));
    setCurrentStep(STEP_BATCHES);
  };

  const handleSubmit = async () => {
    try {
      const ranges = formData.runnerRanges || [];
      // Compute minRunner/maxRunner for SharedRunnerGrid grouping
      const allNumbers = ranges.flatMap(r =>
        r.isIndividual && r.individualNumbers
          ? r.individualNumbers
          : Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i)
      );
      const completeFormData = {
        ...formData,
        runnerRanges: ranges,
        ...(allNumbers.length > 0 && {
          minRunner: Math.min(...allNumbers),
          maxRunner: Math.max(...allNumbers),
        }),
      };
      const raceId = await createRace(completeFormData);
      setHasUnsavedChanges(false);
      navigate(`/race-maintenance/overview?raceId=${raceId}`);
    } catch (err) {
      console.error('Error creating race:', err);
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
    { number: 1, label: 'Template', description: 'Choose a starting template' },
    { number: 2, label: 'Race Details', description: 'Configure race information' },
    { number: 3, label: 'Runner Setup', description: 'Set up runner number ranges' },
    { number: 4, label: 'Waves', description: 'Configure starting waves' }
  ];

  const stepLabels = ['Template', 'Race Details', 'Runner Setup', 'Waves'];

  return (
    <Container maxWidth="xl" padding="normal">
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
                {stepLabels[currentStep]}
              </p>
            </div>
          </div>
          <Badge variant="primary" size="lg">
            Step {currentStep + 1} of 4
          </Badge>
        </div>
      </Section>

      <Section spacing="normal">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </Section>

      <Section spacing="normal">
        <Card>
          <CardBody>
            {currentStep === STEP_TEMPLATE && (
              <TemplateSelectionStep onSelect={handleTemplateSelect} />
            )}
            {currentStep === STEP_DETAILS && (
              <RaceDetailsStep
                data={formData}
                onNext={handleNext}
                onBack={handleBack}
                onCancel={onExitAttempt}
                isLoading={loading}
              />
            )}
            {currentStep === STEP_RUNNERS && (
              <RunnerRangesStep
                raceDetails={formData}
                initialRanges={formData.runnerRanges || []}
                onBack={handleBack}
                onCreate={handleRunnersNext}
                isLoading={loading}
              />
            )}
            {currentStep === STEP_BATCHES && (
              <div className="space-y-6">
                <BatchConfigStep
                  batches={formData.batches || []}
                  onChange={batches => setFormData(prev => ({ ...prev, batches }))}
                  raceStartTime={formData.startTime ? `${formData.date}T${formData.startTime}` : null}
                />
                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Creating Race…' : 'Create Race'}
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </Section>
    </Container>
  );
};

export default withOperationExit(RaceSetup);
