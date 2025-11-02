import { useNavigate } from 'react-router-dom';
import useNavigationStore, { MODULE_TYPES, OPERATION_STATUS } from '../../shared/store/navigationStore';
import useSettingsStore from '../../shared/store/settingsStore';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';

const Homepage = () => {
  const navigate = useNavigate();
  const { currentModule, operationStatus, startOperation, canNavigateTo } = useNavigationStore();
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
      alert('Cannot switch modules during active operation');
      return;
    }

    // If operation is in progress, confirm before switching
    if (operationStatus === OPERATION_STATUS.IN_PROGRESS) {
      const confirmed = window.confirm(
        'Are you sure you want to exit the current operation? This may result in loss of unsaved data.'
      );
      if (!confirmed) return;
    }

    // Start operation for the selected module
    startOperation(moduleType);
    navigate(path);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-white">
        Race Tracking System
      </h1>

      {/* Module Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Race Maintenance */}
        <ModuleCard
          title="Race Maintenance"
          description="Set up and configure races"
          disabled={operationStatus === OPERATION_STATUS.IN_PROGRESS && currentModule !== MODULE_TYPES.RACE_MAINTENANCE}
          onClick={() => handleModuleSelect(MODULE_TYPES.RACE_MAINTENANCE, '/race-maintenance/setup')}
        />

        {/* Checkpoint Operations */}
        <ModuleCard
          title="Checkpoint Operations"
          description="Track runners at checkpoints"
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
          description="Monitor race progress"
          disabled={
            operationStatus === OPERATION_STATUS.IN_PROGRESS && 
            currentModule !== MODULE_TYPES.BASE_STATION
          }
          onClick={() => handleModuleSelect(MODULE_TYPES.BASE_STATION, '/base-station/operations')}
        />
      </div>

      {/* Current Operation Status */}
      {operationStatus === OPERATION_STATUS.IN_PROGRESS && (
        <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p className="text-center text-yellow-800 dark:text-yellow-200">
            Active operation in progress: {currentModule.replace('-', ' ')}
          </p>
        </div>
      )}

      {/* Current Race Info */}
      {currentRace && (
        <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">
            Current Race
          </h2>
          <p className="text-blue-700 dark:text-blue-300">
            {currentRace.name} - {currentRace.date}
          </p>
        </div>
      )}
    </div>
  );
};

// Module selection card component
const ModuleCard = ({ title, description, disabled, onClick }) => (
  <button
    className={`
      p-6 rounded-lg shadow-md text-left transition-all
      ${disabled 
        ? 'bg-gray-200 cursor-not-allowed dark:bg-gray-800' 
        : 'bg-white hover:shadow-lg dark:bg-gray-700 dark:hover:bg-gray-600'}
    `}
    onClick={onClick}
    disabled={disabled}
  >
    <h2 className="text-xl font-semibold mb-2 dark:text-white">{title}</h2>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </button>
);

export default Homepage;
