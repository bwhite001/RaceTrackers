import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { withOperationExit } from '../../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../../shared/store/navigationStore';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';
import {
  Container,
  Section,
  Button,
  Card,
  CardBody
} from '../../design-system/components';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

import TemplateSelectionStep from './TemplateSelectionStep';
import RaceDetailsStep from './RaceDetailsStep';
import RunnerRangesStep from './RunnerRangesStep';
import BatchConfigStep from './BatchConfigStep';
import LinkCheckpointsStep from './LinkCheckpointsStep';
import LoadingSpinner from '../Layout/LoadingSpinner';
import ErrorMessage from '../Layout/ErrorMessage';
import WebScorerImportWizard from '../../modules/race-maintenance/components/WebScorerImportWizard';

import CourseMapStep from './CourseMapStep';

// Step indices
const STEP_TEMPLATE = 0;
const STEP_DETAILS = 1;
const STEP_RUNNERS = 2;
const STEP_BATCHES = 3;
const STEP_COURSE = 4;
const STEP_LINK_CHECKPOINTS = 5;

const RaceSetup = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEP_TEMPLATE);
  const [showWebScorerWizard, setShowWebScorerWizard] = useState(false);
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
        name: template.name || '',
        startTime: template.defaultStartTime?.slice(0, 5) || '',
        checkpoints: template.checkpoints || [],
        runnerRanges: template.runnerRanges || [],
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

  const handleBatchesNext = () => {
    setCurrentStep(STEP_COURSE);
  };

  const handleCourseNext = (courseData) => {
    // Apply course data to formData
    if (courseData) {
      setFormData(prev => ({
        ...prev,
        courseGpx: courseData.courseGpx,
        courseBounds: courseData.courseBounds,
        checkpoints: (prev.checkpoints || []).map(cp => {
          const coord = courseData.checkpointCoordinates?.find(c => c.number === cp.number);
          return coord ? { ...cp, latitude: coord.latitude, longitude: coord.longitude } : cp;
        }),
      }));
    }
    // Show link step if ≥2 checkpoints
    if ((formData.checkpoints?.length ?? 0) >= 2) {
      setCurrentStep(STEP_LINK_CHECKPOINTS);
    } else {
      handleFinalSubmit(courseData ? {
        courseGpx: courseData.courseGpx,
        courseBounds: courseData.courseBounds,
      } : {});
    }
  };

  const handleLinkCheckpointsNext = (updatedCheckpoints) => {
    handleFinalSubmit({ checkpoints: updatedCheckpoints });
  };

  const handleFinalSubmit = async (overrides = {}) => {
    try {
      const merged = { ...formData, ...overrides };
      const ranges = merged.runnerRanges || [];
      // Compute minRunner/maxRunner for SharedRunnerGrid grouping
      const allNumbers = ranges.flatMap(r =>
        r.isIndividual && r.individualNumbers
          ? r.individualNumbers
          : Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i)
      );
      const completeFormData = {
        ...merged,
        runnerRanges: ranges,
        ...(allNumbers.length > 0 && {
          minRunner: Math.min(...allNumbers),
          maxRunner: Math.max(...allNumbers),
        }),
      };
      const raceId = await createRace(completeFormData);
      setHasUnsavedChanges(false);
      navigate(`/race-maintenance/overview?raceId=${raceId}&fromWizard=true`);
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

  const stepLabels = ['Template', 'Race Details', 'Runner Setup', 'Waves', 'Course Map', 'Link Checkpoints'];
  const totalSteps = (formData.checkpoints?.length ?? 0) >= 2 ? 6 : 5;

  return (
    <>
    <header className="bg-vk-navy text-white px-3 pt-4 pb-[18px]">
      <div className="max-w-3xl mx-auto flex flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExitAttempt}
            aria-label="Exit setup"
            className="w-11 h-11 flex items-center justify-center rounded-btn hover:bg-white/10"
          >
            <ChevronLeftIcon className="w-[22px] h-[22px]" aria-hidden="true" />
          </button>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display font-bold text-lg">New race</h1>
            <div className="text-xs text-vk-on-navy">
              Step {currentStep + 1} of {totalSteps} · {stepLabels[currentStep]}
            </div>
          </div>
        </div>
        <div
          className="grid gap-1.5 px-2"
          style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={currentStep + 1}
        >
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1 rounded-full ${i <= currentStep ? 'bg-vk-gold' : 'bg-white/25'}`} />
          ))}
        </div>
      </div>
    </header>

    <Container maxWidth="xl" padding="normal">
      <Section spacing="normal">
        <Card data-screenshot-target>
          <CardBody>
            {currentStep === STEP_TEMPLATE && (
              <TemplateSelectionStep
                onSelect={handleTemplateSelect}
                onImportFromWebScorer={() => setShowWebScorerWizard(true)}
              />
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
                onImportFile={() => setShowWebScorerWizard(true)}
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
                  <Button variant="blueOutline" size="primary" onClick={handleBack} className="flex-1 mr-3">
                    Back
                  </Button>
                  <Button variant="gold" size="primary" onClick={handleBatchesNext} disabled={loading} className="flex-[2]">
                    Next: Course Map
                  </Button>
                </div>
              </div>
            )}
            {currentStep === STEP_COURSE && (
              <CourseMapStep
                checkpoints={formData.checkpoints || []}
                initialData={formData}
                onComplete={handleCourseNext}
                onSkip={() => handleCourseNext(null)}
              />
            )}
            {currentStep === STEP_LINK_CHECKPOINTS && (
              <LinkCheckpointsStep
                checkpoints={formData.checkpoints}
                onNext={handleLinkCheckpointsNext}
                onBack={handleBack}
              />
            )}
          </CardBody>
        </Card>
      </Section>
    </Container>

    {/* WebScorer import wizard — rendered as a full-screen modal overlay */}
    {showWebScorerWizard && (
      <WebScorerImportWizard
        onClose={() => setShowWebScorerWizard(false)}
      />
    )}
  </>
  );
};

export default withOperationExit(RaceSetup);
