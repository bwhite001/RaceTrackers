import { describe, test, expect, beforeEach } from 'vitest';
import useNavigationStore, { MODULE_TYPES, OPERATION_STATUS } from '../shared/store/navigationStore';

describe('Navigation Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useNavigationStore.getState();
    store.reset();
  });

  describe('Initial State', () => {
    test('starts with correct initial state', () => {
      const state = useNavigationStore.getState();
      expect(state).toEqual({
        currentModule: MODULE_TYPES.NONE,
        operationStatus: OPERATION_STATUS.IDLE,
        previousModule: null,
        canExitOperation: true,
        startOperation: expect.any(Function),
        endOperation: expect.any(Function),
        setModule: expect.any(Function),
        forceExitOperation: expect.any(Function),
        canNavigateTo: expect.any(Function),
        reset: expect.any(Function)
      });
    });
  });

  describe('Operation Management', () => {
    test('starts operation correctly', () => {
      const store = useNavigationStore.getState();
      store.startOperation(MODULE_TYPES.CHECKPOINT);

      const state = useNavigationStore.getState();
      expect(state.currentModule).toBe(MODULE_TYPES.CHECKPOINT);
      expect(state.operationStatus).toBe(OPERATION_STATUS.IN_PROGRESS);
      expect(state.canExitOperation).toBe(false);
    });

    test('ends operation correctly', () => {
      const store = useNavigationStore.getState();
      store.startOperation(MODULE_TYPES.CHECKPOINT);
      store.endOperation();

      const state = useNavigationStore.getState();
      expect(state.operationStatus).toBe(OPERATION_STATUS.IDLE);
      expect(state.canExitOperation).toBe(true);
    });

    test('tracks previous module when starting operation', () => {
      const store = useNavigationStore.getState();
      store.setModule(MODULE_TYPES.BASE_STATION);
      store.startOperation(MODULE_TYPES.CHECKPOINT);

      const state = useNavigationStore.getState();
      expect(state.previousModule).toBe(MODULE_TYPES.BASE_STATION);
    });

    test('force exits operation correctly', () => {
      const store = useNavigationStore.getState();
      store.startOperation(MODULE_TYPES.CHECKPOINT);
      store.forceExitOperation();

      const state = useNavigationStore.getState();
      expect(state.operationStatus).toBe(OPERATION_STATUS.IDLE);
      expect(state.canExitOperation).toBe(true);
      expect(state.currentModule).toBe(MODULE_TYPES.NONE);
    });
  });

  describe('Navigation Control', () => {
    test('allows navigation when no operation is in progress', () => {
      const store = useNavigationStore.getState();
      expect(store.canNavigateTo(MODULE_TYPES.CHECKPOINT)).toBe(true);
    });

    test('prevents navigation to different module during operation', () => {
      const store = useNavigationStore.getState();
      store.startOperation(MODULE_TYPES.CHECKPOINT);

      expect(store.canNavigateTo(MODULE_TYPES.BASE_STATION)).toBe(false);
    });

    test('allows navigation within same module during operation', () => {
      const store = useNavigationStore.getState();
      store.startOperation(MODULE_TYPES.CHECKPOINT);

      expect(store.canNavigateTo(MODULE_TYPES.CHECKPOINT)).toBe(true);
    });

    test('allows module change only when not in operation', () => {
      const store = useNavigationStore.getState();
      
      // Should work when idle
      store.setModule(MODULE_TYPES.CHECKPOINT);
      expect(store.currentModule).toBe(MODULE_TYPES.CHECKPOINT);

      // Start operation
      store.startOperation(MODULE_TYPES.CHECKPOINT);
      
      // Should not change module during operation
      store.setModule(MODULE_TYPES.BASE_STATION);
      expect(store.currentModule).toBe(MODULE_TYPES.CHECKPOINT);
    });
  });

  describe('Reset Functionality', () => {
    test('resets store to initial state', () => {
      const store = useNavigationStore.getState();
      
      // Make some changes
      store.startOperation(MODULE_TYPES.CHECKPOINT);
      store.reset();

      const state = useNavigationStore.getState();
      expect(state.currentModule).toBe(MODULE_TYPES.NONE);
      expect(state.operationStatus).toBe(OPERATION_STATUS.IDLE);
      expect(state.previousModule).toBe(null);
      expect(state.canExitOperation).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles multiple operation starts correctly', () => {
      const store = useNavigationStore.getState();
      
      store.startOperation(MODULE_TYPES.CHECKPOINT);
      store.startOperation(MODULE_TYPES.BASE_STATION);

      const state = useNavigationStore.getState();
      expect(state.currentModule).toBe(MODULE_TYPES.BASE_STATION);
      expect(state.previousModule).toBe(MODULE_TYPES.CHECKPOINT);
    });

    test('handles ending non-existent operation', () => {
      const store = useNavigationStore.getState();
      store.endOperation();

      const state = useNavigationStore.getState();
      expect(state.operationStatus).toBe(OPERATION_STATUS.IDLE);
      expect(state.canExitOperation).toBe(true);
    });

    test('maintains module state after force exit', () => {
      const store = useNavigationStore.getState();
      
      store.setModule(MODULE_TYPES.CHECKPOINT);
      store.startOperation(MODULE_TYPES.CHECKPOINT);
      store.forceExitOperation();

      const state = useNavigationStore.getState();
      expect(state.currentModule).toBe(MODULE_TYPES.NONE);
      expect(state.operationStatus).toBe(OPERATION_STATUS.IDLE);
    });
  });
});
