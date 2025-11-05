import { create } from 'zustand';

export const MODULE_TYPES = {
  NONE: 'none',
  RACE_MAINTENANCE: 'race-maintenance',
  CHECKPOINT: 'checkpoint',
  BASE_STATION: 'base-station'
};

export const OPERATION_STATUS = {
  IDLE: 'idle',
  IN_PROGRESS: 'in-progress'
};

const useNavigationStore = create((set, get) => ({
  // State
  currentModule: MODULE_TYPES.NONE,
  operationStatus: OPERATION_STATUS.IDLE,
  previousModule: null,
  canExitOperation: true,

  // Actions
  startOperation: (moduleType) => {
    const { currentModule } = get();
    set({
      currentModule: moduleType,
      previousModule: currentModule,
      operationStatus: OPERATION_STATUS.IN_PROGRESS,
      canExitOperation: false
    });
  },

  endOperation: () => {
    set({
      operationStatus: OPERATION_STATUS.IDLE,
      canExitOperation: true
    });
  },

  setModule: (moduleType) => {
    const { operationStatus } = get();
    // Only allow module change if not in operation
    if (operationStatus === OPERATION_STATUS.IDLE) {
      set({
        currentModule: moduleType,
        previousModule: get().currentModule
      });
    }
  },

  // Allow force exit in emergency situations
  forceExitOperation: () => {
    set({
      operationStatus: OPERATION_STATUS.IDLE,
      canExitOperation: true,
      currentModule: MODULE_TYPES.NONE
    });
  },

  // Check if navigation to a specific module is allowed
  canNavigateTo: (moduleType) => {
    const { operationStatus, currentModule } = get();
    
    // If no operation is in progress, navigation is allowed
    if (operationStatus === OPERATION_STATUS.IDLE) {
      return true;
    }

    // During operation, only allow navigation within the same module
    return moduleType === currentModule;
  },

  // Reset state
  reset: () => {
    set({
      currentModule: MODULE_TYPES.NONE,
      operationStatus: OPERATION_STATUS.IDLE,
      previousModule: null,
      canExitOperation: true
    });
  }
}));

export default useNavigationStore;
