import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useRaceMaintenanceStore from '../modules/race-maintenance/store/raceMaintenanceStore';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import { useRaceStore } from '../store/useRaceStore.js';
import RunnerOverview from '../components/Shared/RunnerOverview.jsx';
import RosterImport from '../modules/race-maintenance/components/RosterImport.jsx';
import DistributeRaceModal from '../modules/race-maintenance/components/DistributeRaceModal.jsx';
import { Card, CardHeader, CardBody, Button } from '../design-system/components';
import { formatLocaleDateTime } from '../utils/raceStatistics';
import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const RaceOverview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const raceId = searchParams.get('raceId');
  const [showDistribute, setShowDistribute] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  
  const {
    currentRace: raceConfig,
    checkpoints,
    loadRace,
    loadCurrentRace,
    loading
  } = useRaceMaintenanceStore();
  
  const { endOperation, startOperation } = useNavigationStore();

  // Load race data on mount — both raceMaintenanceStore (for checkpoints/config)
  // and useRaceStore (for runner list used by RunnerOverview).
  const { runners, getRunnerCounts, loadRace: loadRaceLegacy } = useRaceStore();

  useEffect(() => {
    const loadRaceData = async () => {
      try {
        if (raceId) {
          await loadRace(parseInt(raceId));
        } else if (!raceConfig) {
          await loadCurrentRace();
        }
      } catch (error) {
        console.error('Error loading race:', error);
      }
    };
    
    loadRaceData();
  }, [raceId, loadRace, loadCurrentRace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load runners into the legacy store whenever raceConfig is available.
  useEffect(() => {
    if (raceConfig?.id) {
      loadRaceLegacy(raceConfig.id).catch(() => {});
    }
  }, [raceConfig?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute runner counts from raceConfig fields (minRunner/maxRunner)
  // when runners are not yet loaded into the legacy store.
  const counts = (() => {
    const base = getRunnerCounts();
    if (base.total > 0) return base;
    // Fall back to computing from race config range fields
    if (raceConfig?.maxRunner != null && raceConfig?.minRunner != null) {
      return { ...base, total: raceConfig.maxRunner - raceConfig.minRunner + 1 };
    }
    return base;
  })();

  const handleGoToCheckpoint = (checkpointNumber) => {
    // Only release the lock here. Starting the checkpoint operation before the
    // route change left ProtectedRoute evaluating an intermediate state and
    // bounced the navigation; CheckpointView calls startOperation on mount.
    endOperation();
    navigate(`/checkpoint/${checkpointNumber}`);
  };

  const handleGoToBaseStation = () => {
    endOperation(); // End current operation
    startOperation(MODULE_TYPES.BASE_STATION);
    navigate('/base-station/operations');
  };

  const handleExitToHome = () => {
    endOperation(); // End the race maintenance operation
    navigate('/');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading race...</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!raceConfig) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                No Race Selected
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please create a race or select an existing one to continue.
              </p>
              <Button variant="primary" onClick={handleExitToHome}>
                Go to Homepage
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Success Message — dismissible; it is confirmation, not a permanent state */}
      {raceId && showSuccessBanner && (
        <Card variant="elevated" className="mb-6 border-l-4 border-green-500">
          <CardBody>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Race Created Successfully!
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Your race has been configured. Select an operation mode below to begin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessBanner(false)}
                aria-label="Dismiss"
                className="ml-4 flex-shrink-0 p-1 rounded text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/30"
              >
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Race Details Header */}
      <Card variant="elevated" className="mb-6">
        <CardHeader
          title={raceConfig.name}
          subtitle={formatLocaleDateTime(raceConfig.date, raceConfig.startTime)}
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Checkpoints</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {checkpoints?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Runner Ranges</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {raceConfig.runnerRanges?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Runners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {counts.total}
              </p>
            </div>
          </div>
          
          {raceConfig.runnerRanges && raceConfig.runnerRanges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Configured Runner Ranges:
              </p>
              <div className="flex flex-wrap gap-2">
                {raceConfig.runnerRanges.map((range, index) => {
                  // Summarise rather than expand — a 101-runner range printed as
                  // "100, 101, 102, ..." floods the card and tells the operator
                  // less than the range and its count do.
                  let displayText;
                  if (typeof range === 'string') {
                    displayText = range;
                  } else if (range && typeof range === 'object') {
                    if (range.isIndividual && range.individualNumbers?.length > 0) {
                      displayText = `${range.individualNumbers.length} individual numbers`;
                    } else if (range.min != null && range.max != null) {
                      const count = range.max - range.min + 1;
                      displayText = `${range.min}–${range.max} (${count} runners)`;
                    } else if (range.individualNumbers?.length > 0) {
                      displayText = `${range.individualNumbers.length} individual numbers`;
                    } else {
                      displayText = range.description || 'Range';
                    }
                  } else {
                    displayText = 'Unknown';
                  }

                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-navy-200"
                    >
                      {displayText}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Select Operation Mode
        </h1>
        <Button
          variant="outline"
          onClick={handleExitToHome}
          leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Exit to Homepage
        </Button>
      </div>

      {/* Checkpoints Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Checkpoint Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checkpoints && checkpoints.length > 0 ? (
            checkpoints.map((checkpoint) => (
              <Card key={checkpoint.number} variant="elevated" hoverable>
                <CardBody>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-navy-100 dark:bg-navy-900 rounded-full flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-navy-600 dark:text-navy-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {checkpoint.name || `Checkpoint ${checkpoint.number}`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Track runners at this checkpoint
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => handleGoToCheckpoint(checkpoint.number)}
                      className="w-full"
                    >
                      Go to Checkpoint
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardBody>
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No checkpoints configured for this race
                  </p>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Base Station Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Base Station Operations
        </h2>
        <Card variant="elevated" hoverable>
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold-100 dark:bg-gold-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-gold-600 dark:text-gold-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Call-In Finish Numbers
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage race completion, enter finish times, and track overall race status
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowDistribute(true)}
                  className="sm:w-auto w-full"
                >
                  Distribute Race Setup
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGoToBaseStation}
                  className="sm:w-auto w-full"
                >
                  Go to Base Station
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Runner Overview */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Runner Status Overview
        </h2>
        <RunnerOverview />
      </div>

      {/* CSV Roster Import */}
      {raceConfig?.id && (
        <div className="mb-6">
          <Card variant="elevated">
            <CardBody>
              <RosterImport
                raceId={raceConfig.id}
                onComplete={() => {
                  if (raceConfig?.id) initializeRunnersFromRace && initializeRunnersFromRace(raceConfig.id);
                }}
              />
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
