import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useRaceMaintenanceStore from '../modules/race-maintenance/store/raceMaintenanceStore';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import { useRaceStore } from '../store/useRaceStore.js';
import { useToast } from '../shared/components/ui/Toast';
import RosterImport from '../modules/race-maintenance/components/RosterImport.jsx';
import DistributeRaceModal from '../modules/race-maintenance/components/DistributeRaceModal.jsx';
import { Card, CardHeader, CardBody, CardFooter, Button, Badge } from '../design-system/components';

const RaceOverview = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawId = searchParams.get('raceId');
  const raceId = rawId ? parseInt(rawId, 10) : null;
  const isPostCreation = searchParams.get('fromWizard') === 'true';

  const [showSuccessBanner, setShowSuccessBanner] = useState(isPostCreation);
  const [showDistribute, setShowDistribute] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const {
    currentRace: raceConfig,
    checkpoints,
    loadRace,
    loadCurrentRace,
    loading,
    deleteRace,
  } = useRaceMaintenanceStore();

  const { endOperation, startOperation } = useNavigationStore();
  const { getRunnerCounts, loadRace: loadRaceLegacy } = useRaceStore();
  const { addToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        if (raceId) {
          await loadRace(raceId);
        } else if (!raceConfig) {
          await loadCurrentRace();
        }
      } catch (err) {
        console.error('Error loading race:', err);
      }
    };
    load();
  }, [raceId, loadRace, loadCurrentRace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remove ?fromWizard from the URL so a hard refresh doesn't re-show the banner
  useEffect(() => {
    if (isPostCreation) {
      const next = new URLSearchParams(searchParams);
      next.delete('fromWizard');
      setSearchParams(next, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (raceConfig?.id) {
      loadRaceLegacy(raceConfig.id).catch(() => {});
    }
  }, [raceConfig?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = (() => {
    const base = getRunnerCounts();
    if (base.total > 0) return base;
    if (raceConfig?.maxRunner != null && raceConfig?.minRunner != null) {
      return { ...base, total: raceConfig.maxRunner - raceConfig.minRunner + 1 };
    }
    return base;
  })();

  const handleGoToCheckpoint = (checkpointNumber) => {
    startOperation(MODULE_TYPES.CHECKPOINT);
    navigate(`/checkpoint/${checkpointNumber}`);
  };

  const handleGoToBaseStation = () => {
    startOperation(MODULE_TYPES.BASE_STATION);
    navigate('/base-station/operations');
  };

  const handleExitToHome = () => {
    endOperation();
    navigate('/');
  };

  const handleEditRace = () => {
    navigate(`/race-maintenance/edit?raceId=${raceConfig.id}`);
  };

  const handleDeleteRace = async () => {
    try {
      await deleteRace(raceConfig.id);
      addToast({ variant: 'success', message: 'Race deleted.' });
      endOperation();
      navigate('/');
    } catch {
      addToast({ variant: 'error', message: 'Failed to delete race. Please try again.' });
    }
    setShowDeleteConfirm(false);
  };

  const firstCheckpoint = checkpoints?.[0];

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading && !raceConfig) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card><CardBody>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading race...</p>
          </div>
        </CardBody></Card>
      </div>
    );
  }

  if (!raceConfig) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card><CardBody>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">No Race Selected</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please create a race or select an existing one to continue.
            </p>
            <Button variant="primary" onClick={handleExitToHome}>Go to Homepage</Button>
          </div>
        </CardBody></Card>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* ── 1. Success banner (post-creation only) ── */}
      {showSuccessBanner && (
        <Card variant="elevated" className="border-l-4 border-green-500">
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Race Created Successfully!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                    Review your race configuration and choose how to operate.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {firstCheckpoint && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleGoToCheckpoint(firstCheckpoint.number)}
                  >
                    Start Checkpoint Operations
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={handleGoToBaseStation}>
                  Go to Base Station
                </Button>
                <button
                  onClick={() => setShowSuccessBanner(false)}
                  className="text-green-500 hover:text-green-700 dark:hover:text-green-300 ml-1"
                  aria-label="Dismiss"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── 2. Race summary card ── */}
      <Card variant="elevated">
        <CardHeader title="Race Configuration" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  Race Name
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{raceConfig.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  Date
                </p>
                <p className="text-gray-900 dark:text-white">
                  {new Date(raceConfig.date).toLocaleDateString('en-AU')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  Start Time
                </p>
                <p className="text-gray-900 dark:text-white">{raceConfig.startTime || '—'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  Checkpoints
                </p>
                <p className="text-gray-900 dark:text-white">
                  {checkpoints?.length || 0} checkpoint{checkpoints?.length !== 1 ? 's' : ''}
                  {' '}
                  <button
                    onClick={handleEditRace}
                    className="text-navy-600 dark:text-navy-400 text-sm hover:underline"
                  >
                    View / edit
                  </button>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  Runners
                </p>
                <p className="text-gray-900 dark:text-white">
                  {counts.total} runner{counts.total !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Runner ranges are locked after creation.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                  Status
                </p>
                <Badge variant="default">Configured — Not started</Badge>
              </div>
            </div>
          </div>
        </CardBody>
        <CardFooter>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleEditRace}>Edit race details</Button>
            <Button variant="ghost" onClick={() => setShowDistribute(true)}>Export configuration</Button>
          </div>
        </CardFooter>
      </Card>

      {/* ── 3. Operations ── */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Checkpoint card */}
          <Card variant="elevated">
            <CardBody>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-navy-100 dark:bg-navy-900 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-navy-600 dark:text-navy-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Checkpoint Operations
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Use at each checkpoint to mark runners as they pass.
                  </p>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                    <li>• Tap-to-mark runner grid</li>
                    <li>• 5-minute callout sheets</li>
                  </ul>
                </div>
                {checkpoints && checkpoints.length > 1 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {checkpoints.map(cp => (
                      <Button
                        key={cp.number}
                        variant="primary"
                        size="sm"
                        onClick={() => handleGoToCheckpoint(cp.number)}
                      >
                        {cp.name || `CP ${cp.number}`}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => handleGoToCheckpoint(firstCheckpoint?.number ?? 1)}
                    className="w-full"
                  >
                    Go to Checkpoint Mode
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Base station card */}
          <Card variant="elevated">
            <CardBody>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Base Station Operations
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Use at race HQ to record finish times and manage statuses.
                  </p>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                    <li>• Batch time entry</li>
                    <li>• Final results overview</li>
                  </ul>
                </div>
                <Button variant="primary" onClick={handleGoToBaseStation} className="w-full">
                  Go to Base Station
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── 4. Race management ── */}
      <Card variant="elevated">
        <CardHeader title="Race Management" />
        <CardBody>
          <div className="space-y-3">
            <button
              onClick={handleEditRace}
              className="flex items-center gap-1 text-navy-600 dark:text-navy-400 hover:underline text-sm"
            >
              Edit race settings →
            </button>
            <button
              onClick={handleExitToHome}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:underline text-sm"
            >
              Exit to Homepage →
            </button>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline text-sm"
              >
                Delete race…
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── 5. Advanced tools (collapsible) ── */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setAdvancedOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span>Advanced tools &amp; help</span>
          <svg
            className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {advancedOpen && (
          <div className="px-4 pb-4 pt-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
            {raceConfig?.id && (
              <RosterImport raceId={raceConfig.id} onComplete={() => {}} />
            )}
            <div>
              <Button variant="ghost" size="sm" onClick={() => setShowDistribute(true)}>
                Export config as JSON / QR code
              </Button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Where do I see runner status?
              </p>
              <p>
                Runner status and detailed tracking are available in the Checkpoint and Base Station
                screens, not on this configuration page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirmation dialog ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardBody>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Race?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                This will permanently delete <strong>{raceConfig.name}</strong> and all associated
                checkpoint and base station data. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteRace}>
                  Delete Race
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <DistributeRaceModal
        isOpen={showDistribute}
        raceId={raceConfig?.id}
        raceName={raceConfig?.name ?? ''}
        onClose={() => setShowDistribute(false)}
      />
    </div>
  );
};

export default RaceOverview;
