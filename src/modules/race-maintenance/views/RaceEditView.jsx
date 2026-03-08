import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useRaceMaintenanceStore from '../store/raceMaintenanceStore';
import { useToast } from '../../../shared/components/ui/Toast';
import RosterImport from '../components/RosterImport.jsx';
import { useRaceStore } from '../../../store/useRaceStore.js';
import {
  Card, CardBody, CardFooter,
  Button,
  FormGroup, FormLabel, FormHelperText, FormErrorMessage,
  Input, Textarea,
} from '../../../design-system/components';

const RaceEditView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawId = searchParams.get('raceId');
  const raceId = rawId ? parseInt(rawId, 10) : null;
  const { addToast } = useToast();
  const { runners } = useRaceStore();

  const STEPS = ['Core Details', 'Checkpoints', 'Runner Info'];
  const [currentStep, setCurrentStep] = useState(0);

  // ── Stepper navigation ───────────────────────────────────────────────────
  const handleNext = async () => {
    if (currentStep === 0) {
      const errors = validateCore();
      if (Object.keys(errors).length > 0) { setCoreErrors(errors); return; }
      setCoreSaving(true);
      try {
        await updateRace(raceId, coreForm);
      } catch {
        addToast({ variant: 'error', message: 'Failed to save race details. Please try again.' });
        setCoreSaving(false);
        return;
      }
      setCoreSaving(false);
    }
    setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep(s => Math.max(s - 1, 0));

  const {
    currentRace,
    checkpoints,
    loading,
    loadRace,
    updateRace,
    updateCheckpoint,
    addCheckpoint,
  } = useRaceMaintenanceStore();

  // ── Core Details form state ──────────────────────────────────────────────
  const [coreForm, setCoreForm] = useState({ name: '', date: '', startTime: '', description: '' });
  const [coreErrors, setCoreErrors] = useState({});
  const [coreSaving, setCoreSaving] = useState(false);

  // ── Checkpoints editing state ────────────────────────────────────────────
  const [cpEdits, setCpEdits] = useState({}); // { [cp.id]: newName }
  const [cpSaving, setCpSaving] = useState({});
  const [newCpName, setNewCpName] = useState('');
  const [addingCp, setAddingCp] = useState(false);
  const [hasRunnerData, setHasRunnerData] = useState(false);

  // Load race on mount
  useEffect(() => {
    if (raceId) loadRace(raceId);
  }, [raceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for existing checkpoint runner data (informational warning)
  useEffect(() => {
    if (!raceId) return;
    import('../../../shared/services/database/schema.js').then(({ default: db }) => {
      db.checkpoint_runners.where('raceId').equals(raceId).count().then(n => {
        setHasRunnerData(n > 0);
      });
    });
  }, [raceId]);

  // Populate core form from store
  useEffect(() => {
    if (currentRace) {
      setCoreForm({
        name: currentRace.name || '',
        date: currentRace.date || '',
        startTime: currentRace.startTime || '',
        description: currentRace.description || '',
      });
    }
  }, [currentRace]);

  // Populate checkpoint edits map
  useEffect(() => {
    if (checkpoints) {
      setCpEdits(Object.fromEntries(checkpoints.map(cp => [cp.id, cp.name])));
    }
  }, [checkpoints]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCoreChange = (e) => {
    const { name, value } = e.target;
    setCoreForm(prev => ({ ...prev, [name]: value }));
    if (coreErrors[name]) setCoreErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateCore = () => {
    const errors = {};
    if (!coreForm.name.trim()) errors.name = 'Race name is required';
    if (!coreForm.date) errors.date = 'Race date is required';
    return errors;
  };


  const handleSaveCheckpointName = async (cp) => {
    const newName = cpEdits[cp.id]?.trim();
    if (!newName || newName === cp.name) return;
    setCpSaving(prev => ({ ...prev, [cp.id]: true }));
    try {
      await updateCheckpoint(cp.id, { name: newName });
      addToast({ variant: 'success', message: `Checkpoint ${cp.number} renamed.` });
    } catch {
      addToast({ variant: 'error', message: 'Failed to rename checkpoint.' });
    } finally {
      setCpSaving(prev => ({ ...prev, [cp.id]: false }));
    }
  };

  const handleAddCheckpoint = async () => {
    setAddingCp(true);
    try {
      await addCheckpoint(raceId, { name: newCpName.trim() || undefined });
      setNewCpName('');
      addToast({ variant: 'success', message: 'Checkpoint added.' });
    } catch {
      addToast({ variant: 'error', message: 'Failed to add checkpoint.' });
    } finally {
      setAddingCp(false);
    }
  };

  const nextCpNumber = checkpoints?.length > 0
    ? Math.max(...checkpoints.map(c => c.number)) + 1
    : 1;

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading && !currentRace) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card><CardBody>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading race...</p>
          </div>
        </CardBody></Card>
      </div>
    );
  }

  if (!raceId || (!loading && !currentRace)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card><CardBody>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Race Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The requested race could not be found.
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>Go to Homepage</Button>
          </div>
        </CardBody></Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back navigation */}
      <div className="mb-4">
        <button
          onClick={() => navigate(`/race-maintenance/overview?raceId=${raceId}`)}
          className="flex items-center gap-1 text-sm text-navy-600 dark:text-navy-400 hover:underline"
        >
          ← Back to Race Overview
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Race</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{currentRace.name}</p>
      </div>

      {/* Step indicator */}
      <nav aria-label="Progress" className="mb-6">
        <ol className="flex items-center gap-2">
          {STEPS.map((label, idx) => (
            <React.Fragment key={label}>
              <li className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold
                    ${idx === currentStep
                      ? 'bg-navy-600 text-white'
                      : idx < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                >
                  {idx < currentStep ? '✓' : idx + 1}
                </span>
                <span className={`text-sm ${idx === currentStep ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {label}
                </span>
              </li>
              {idx < STEPS.length - 1 && (
                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-1" />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {/* ── Core Details (step 0) ── */}
      {currentStep === 0 && (
        <Card variant="elevated">
          <CardBody>
            <div className="space-y-4">
              <FormGroup>
                <FormLabel htmlFor="name" required>Race Name</FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={coreForm.name}
                  onChange={handleCoreChange}
                  error={!!coreErrors.name}
                />
                {coreErrors.name && <FormErrorMessage>{coreErrors.name}</FormErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="date" required>Race Date</FormLabel>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={coreForm.date}
                  onChange={handleCoreChange}
                  error={!!coreErrors.date}
                />
                {coreErrors.date && <FormErrorMessage>{coreErrors.date}</FormErrorMessage>}
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="startTime">Start Time</FormLabel>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={coreForm.startTime}
                  onChange={handleCoreChange}
                />
                <FormHelperText>
                  ⚠ Changing start time will update elapsed times shown at checkpoints and base station.
                </FormHelperText>
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Textarea
                  id="description"
                  name="description"
                  value={coreForm.description}
                  onChange={handleCoreChange}
                  rows={3}
                />
              </FormGroup>
            </div>
          </CardBody>
          <CardFooter>
            <div className="flex justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate(`/race-maintenance/overview?raceId=${raceId}`)}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleNext} disabled={coreSaving}>
                {coreSaving ? 'Saving…' : 'Next →'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* ── Checkpoints (step 1) ── */}
      {currentStep === 1 && (
        <Card variant="elevated">
          <CardBody>
            {hasRunnerData && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                Checkpoint data has already been recorded. Renaming checkpoints won&apos;t affect recorded times.
              </div>
            )}

            <div className="space-y-3">
              {checkpoints.map(cp => (
                <div key={cp.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8 flex-shrink-0">
                    #{cp.number}
                  </span>
                  <Input
                    value={cpEdits[cp.id] ?? cp.name}
                    onChange={(e) =>
                      setCpEdits(prev => ({ ...prev, [cp.id]: e.target.value }))
                    }
                    className="flex-1"
                    aria-label={`Checkpoint ${cp.number} name`}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSaveCheckpointName(cp)}
                    disabled={cpSaving[cp.id] || cpEdits[cp.id] === cp.name}
                  >
                    {cpSaving[cp.id] ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Add Checkpoint
              </h3>
              <div className="flex items-center gap-3">
                <Input
                  placeholder={`Checkpoint ${nextCpNumber}`}
                  value={newCpName}
                  onChange={(e) => setNewCpName(e.target.value)}
                  className="flex-1"
                  aria-label="New checkpoint name"
                />
                <Button variant="primary" onClick={handleAddCheckpoint} disabled={addingCp}>
                  {addingCp ? 'Adding…' : 'Add'}
                </Button>
              </div>
            </div>
          </CardBody>
          <CardFooter>
            <div className="flex justify-between gap-3">
              <Button variant="secondary" onClick={handleBack}>← Back</Button>
              <Button variant="primary" onClick={handleNext}>Next →</Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* ── Runner Info (step 2) ── */}
      {currentStep === 2 && (
        <>
          <Card variant="elevated">
            <CardBody>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Runner Ranges
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Runner ranges are locked after creation and cannot be edited here.
              </p>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {currentRace.runnerRanges?.length
                  ? currentRace.runnerRanges.map((range) => {
                      if (typeof range === 'string') return range;
                      if (range?.isIndividual) return range.individualNumbers?.join(', ');
                      if (range?.min != null) return `${range.min}–${range.max}`;
                      return 'Range';
                    }).join(', ')
                  : '—'
                }
              </div>
            </CardBody>
          </Card>

          <Card variant="elevated" className="mt-4">
            <CardBody>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Runner Roster
              </h3>
              {runners.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No runners loaded.</p>
              ) : (
                <div className="overflow-x-auto max-h-96 rounded border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                      <tr>
                        {['#', 'First Name', 'Last Name', 'Gender', 'Batch'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {runners.map((runner) => (
                        <tr key={runner.number} className="bg-white dark:bg-gray-900">
                          <td className="px-3 py-1.5 font-mono">{runner.number}</td>
                          <td className="px-3 py-1.5">{runner.firstName || '—'}</td>
                          <td className="px-3 py-1.5">{runner.lastName || '—'}</td>
                          <td className="px-3 py-1.5">{runner.gender || '—'}</td>
                          <td className="px-3 py-1.5">{runner.batchNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {raceId && (
            <Card variant="elevated" className="mt-4">
              <CardBody>
                <RosterImport raceId={raceId} onComplete={() => loadRace(raceId)} />
              </CardBody>
            </Card>
          )}

          <Card variant="elevated" className="mt-4">
            <CardFooter>
              <div className="flex justify-between gap-3">
                <Button variant="secondary" onClick={handleBack}>← Back</Button>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/race-maintenance/overview?raceId=${raceId}`)}
                >
                  Done
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default RaceEditView;
