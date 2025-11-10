import React from 'react';
import { useNavigate } from 'react-router-dom';
import useNavigationStore, { MODULE_TYPES, OPERATION_STATUS } from '../../shared/store/navigationStore';
import useSettingsStore from '../../shared/store/settingsStore';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';
import { Card, CardHeader, CardBody, Button } from '../../design-system/components';

const Homepage = () => {
  const navigate = useNavigate();
  const { currentModule, operationStatus, startOperation, endOperation, canNavigateTo } = useNavigationStore();
  const { settings } = useSettingsStore();
  const { currentRace, loadCurrentRace } = useRaceMaintenanceStore();

  // Load current race if not loaded
  React.useEffect(() => {
    if (!currentRace) {
      loadCurrentRace();
    }
  }, [currentRace, loadCurrentRace]);

  const handleModuleSelect = async (moduleType, path) => {
    // Check if navigation is allowed
    if (!canNavigateTo(moduleType)) {
      const confirmed = window.confirm(
        'You are currently in an active operation. Do you want to exit and switch modules? Any unsaved changes may be lost.'
      );
      if (!confirmed) return;
      
      // Force exit the current operation
      endOperation();
    }

    // If operation is in progress, confirm before switching
    if (operationStatus === OPERATION_STATUS.IN_PROGRESS) {
      const confirmed = window.confirm(
        'Are you sure you want to exit the current operation? This may result in loss of unsaved data.'
      );
      if (!confirmed) return;
      endOperation();
    }

    // Start operation for the selected module
    startOperation(moduleType);
    navigate(path);
  };

  const handleExitOperation = () => {
    const confirmed = window.confirm(
      'Are you sure you want to exit the current operation? Any unsaved changes may be lost.'
    );
    if (confirmed) {
      endOperation();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-navy-900 to-navy-700 rounded-2xl overflow-hidden mb-12 shadow-elevated">
        {/* Diagonal Accent Stripe */}
        <div className="absolute top-0 right-0 w-64 h-full bg-accent-600 transform skew-x-12 translate-x-32 opacity-20"></div>
        
        <div className="relative px-8 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Race Tracking System
            </h1>
            <p className="text-xl text-navy-100 mb-6">
              Professional offline race management for checkpoints and base stations
            </p>
            {currentRace && (
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{currentRace.name}</span>
                <span className="mx-2">•</span>
                <span>{currentRace.date}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Operation Status */}
      {operationStatus === OPERATION_STATUS.IN_PROGRESS && (
        <Card variant="elevated" className="mb-8 border-l-4 border-gold-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Active Operation in Progress
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentModule.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={handleExitOperation}
              className="ml-4"
            >
              Exit Operation
            </Button>
          </div>
        </Card>
      )}

      {/* Module Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Select Operation Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Race Maintenance */}
          <ModuleCard
            title="Race Maintenance"
            description="Set up and configure races, manage runner ranges, and export configurations"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            }
            disabled={operationStatus === OPERATION_STATUS.IN_PROGRESS && currentModule !== MODULE_TYPES.RACE_MAINTENANCE}
            onClick={() => handleModuleSelect(MODULE_TYPES.RACE_MAINTENANCE, '/race-maintenance/setup')}
          />

          {/* Checkpoint Operations */}
          <ModuleCard
            title="Checkpoint Operations"
            description="Track runners at checkpoints, mark off numbers, and manage callout sheets"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
            disabled={
              operationStatus === OPERATION_STATUS.IN_PROGRESS && 
              currentModule !== MODULE_TYPES.CHECKPOINT
            }
            onClick={() => {
              const checkpointNumber = settings.currentCheckpoint || 1;
              handleModuleSelect(MODULE_TYPES.CHECKPOINT, `/checkpoint/${checkpointNumber}`);
            }}
          />

          {/* Base Station Operations */}
          <ModuleCard
            title="Base Station Operations"
            description="Monitor race progress, enter data, and manage overall race status"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
            }
            disabled={
              operationStatus === OPERATION_STATUS.IN_PROGRESS && 
              currentModule !== MODULE_TYPES.BASE_STATION
            }
            onClick={() => handleModuleSelect(MODULE_TYPES.BASE_STATION, '/base-station/operations')}
          />
        </div>
      </div>

      {/* Quick Info Cards */}
      {!currentRace && (
        <Card variant="elevated" className="border-l-4 border-navy-600">
          <CardHeader
            title="Get Started"
            subtitle="Create your first race to begin tracking"
          />
          <CardBody>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Set up a new race with custom runner ranges, configure checkpoints, and start tracking immediately.
            </p>
            <Button
              variant="primary"
              onClick={() => handleModuleSelect(MODULE_TYPES.RACE_MAINTENANCE, '/race-maintenance/setup')}
            >
              Create New Race
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

// Module selection card component
const ModuleCard = ({ title, description, icon, disabled, onClick }) => (
  <Card
    variant="elevated"
    hoverable={!disabled}
    clickable={!disabled}
    onClick={disabled ? undefined : onClick}
    className={`
      transition-all duration-200
      ${disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'cursor-pointer hover:scale-105'}
    `}
  >
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <div className={`
          p-3 rounded-lg
          ${disabled 
            ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500' 
            : 'bg-navy-100 text-navy-900 dark:bg-navy-900 dark:text-navy-100'}
        `}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 flex-grow">
        {description}
      </p>
      {!disabled && (
        <div className="mt-4 flex items-center text-navy-600 dark:text-navy-400 font-medium">
          <span>Get Started</span>
          <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </Card>
);

export default Homepage;
