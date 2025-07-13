import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useRaceStore from '../store/useRaceStore.js';
import StorageService from '../services/storage.js';
import { APP_MODES, RUNNER_STATUSES } from '../types/index.js';

// Mock the storage service
vi.mock('../services/storage.js');

describe('useRaceStore - New Functionality', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useRaceStore.setState({
      raceConfig: null,
      mode: APP_MODES.SETUP,
      runners: [],
      calledSegments: [],
      currentRaceId: null,
      isLoading: false,
      error: null
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Multiple Race Management', () => {
    it('should get all races', async () => {
      const mockRaces = [
        { id: '1', name: 'Test Marathon 2025', date: '2025-07-13', startTime: '08:00', minRunner: 100, maxRunner: 150 },
        { id: '2', name: 'Sprint Championship 2025', date: '2025-07-13', startTime: '08:00', minRunner: 1, maxRunner: 50 }
      ];
      
      StorageService.getAllRaces.mockResolvedValue(mockRaces);
      
      const { result } = renderHook(() => useRaceStore());
      
      await act(async () => {
        const races = await result.current.getAllRaces();
        expect(races).toEqual(mockRaces);
      });
      
      expect(StorageService.getAllRaces).toHaveBeenCalledTimes(1);
    });

    it('should switch to a different race', async () => {
      const mockRace = { id: '2', name: 'Sprint Championship 2025', date: '2025-07-13', startTime: '08:00', minRunner: 1, maxRunner: 50 };
      const mockRunners = [
        { number: 1, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null },
        { number: 2, status: RUNNER_STATUSES.PASSED, recordedTime: '2025-07-13T08:15:00Z' }
      ];
      const mockSegments = [];
      
      StorageService.getRace.mockResolvedValue(mockRace);
      StorageService.getRunners.mockResolvedValue(mockRunners);
      StorageService.getCalledSegments.mockResolvedValue(mockSegments);
      
      const { result } = renderHook(() => useRaceStore());
      
      await act(async () => {
        await result.current.switchToRace('2');
      });
      
      expect(result.current.raceConfig).toEqual(mockRace);
      expect(result.current.currentRaceId).toBe('2');
      expect(result.current.runners).toEqual(mockRunners);
      expect(StorageService.getRace).toHaveBeenCalledWith('2');
      expect(StorageService.getRunners).toHaveBeenCalledWith('2');
      expect(StorageService.getCalledSegments).toHaveBeenCalledWith('2');
    });

    it('should handle race switching errors', async () => {
      const error = new Error('Race not found');
      StorageService.getRace.mockRejectedValue(error);
      
      const { result } = renderHook(() => useRaceStore());
      
      await act(async () => {
        try {
          await result.current.switchToRace('invalid-id');
        } catch (e) {
          expect(e).toBe(error);
        }
      });
      
      expect(result.current.error).toBe('Race not found');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('CSV Export Functionality', () => {
    it('should export race results as CSV', async () => {
      const mockRaceConfig = { 
        id: '1', 
        name: 'Test Marathon 2025', 
        date: '2025-07-13', 
        startTime: '08:00',
        minRunner: 100,
        maxRunner: 150
      };
      
      const mockRunners = [
        { number: 100, status: RUNNER_STATUSES.PASSED, recordedTime: '2025-07-13T08:15:30Z' },
        { number: 101, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null },
        { number: 102, status: RUNNER_STATUSES.DNF, recordedTime: null }
      ];
      
      const expectedCSV = `Race Name,Test Marathon 2025
Race Date,2025-07-13
Start Time,08:00
Total Runners,51
Export Date,${new Date().toISOString().split('T')[0]}

Runner Number,Status,Recorded Time,Time from Start
100,passed,2025-07-13T08:15:30Z,00:15:30
101,not-started,,
102,dnf,,`;
      
      StorageService.exportRaceResults.mockResolvedValue(expectedCSV);
      
      const { result } = renderHook(() => useRaceStore());
      
      // Set up the store state
      act(() => {
        useRaceStore.setState({
          raceConfig: mockRaceConfig,
          currentRaceId: '1',
          runners: mockRunners
        });
      });
      
      await act(async () => {
        const csvData = await result.current.exportRaceResults();
        expect(csvData).toBe(expectedCSV);
      });
      
      expect(StorageService.exportRaceResults).toHaveBeenCalledWith('1', expect.any(Object), expect.any(Array), 'csv');
    });

    it('should handle CSV export errors', async () => {
      const { result } = renderHook(() => useRaceStore());
      
      // No current race
      await act(async () => {
        try {
          await result.current.exportRaceResults();
        } catch (error) {
          expect(error.message).toBe('No race to export');
        }
      });
    });
  });

  describe('Race Deletion', () => {
    it('should delete a race and reset state if current race', async () => {
      StorageService.deleteRace.mockResolvedValue();
      
      const { result } = renderHook(() => useRaceStore());
      
      // Set up current race
      act(() => {
        useRaceStore.setState({
          raceConfig: { id: '1', name: 'Test Race' },
          currentRaceId: '1',
          runners: [{ number: 1, status: RUNNER_STATUSES.NOT_STARTED }],
          calledSegments: ['segment1']
        });
      });
      
      await act(async () => {
        await result.current.deleteRace('1');
      });
      
      expect(StorageService.deleteRace).toHaveBeenCalledWith('1');
      expect(result.current.raceConfig).toBeNull();
      expect(result.current.currentRaceId).toBeNull();
      expect(result.current.runners).toEqual([]);
      expect(result.current.calledSegments).toEqual([]);
      expect(result.current.mode).toBe(APP_MODES.SETUP);
    });

    it('should delete a race without resetting state if not current race', async () => {
      StorageService.deleteRace.mockResolvedValue();
      
      const { result } = renderHook(() => useRaceStore());
      
      // Set up current race
      act(() => {
        useRaceStore.setState({
          raceConfig: { id: '1', name: 'Current Race' },
          currentRaceId: '1',
          runners: [{ number: 1, status: RUNNER_STATUSES.NOT_STARTED }]
        });
      });
      
      await act(async () => {
        await result.current.deleteRace('2'); // Delete different race
      });
      
      expect(StorageService.deleteRace).toHaveBeenCalledWith('2');
      expect(result.current.raceConfig.id).toBe('1'); // Should remain unchanged
      expect(result.current.currentRaceId).toBe('1');
    });
  });

  describe('Enhanced Import Functionality', () => {
    it('should import race configuration from JSON', async () => {
      const importData = {
        raceConfig: {
          name: 'Imported Race',
          date: '2025-08-01',
          startTime: '09:00',
          minRunner: 1,
          maxRunner: 100
        },
        exportedAt: '2025-07-13T10:00:00Z',
        version: '1.0.0'
      };
      
      const newRaceId = 'imported-race-id';
      StorageService.importRaceConfig.mockResolvedValue(newRaceId);
      StorageService.getRace.mockResolvedValue({ ...importData.raceConfig, id: newRaceId });
      StorageService.getRunners.mockResolvedValue([]);
      StorageService.getCalledSegments.mockResolvedValue([]);
      
      const { result } = renderHook(() => useRaceStore());
      
      await act(async () => {
        const raceId = await result.current.importRaceConfig(importData);
        expect(raceId).toBe(newRaceId);
      });
      
      expect(StorageService.importRaceConfig).toHaveBeenCalledWith(importData);
      expect(result.current.currentRaceId).toBe(newRaceId);
      expect(result.current.raceConfig.name).toBe('Imported Race');
    });

    it('should handle import errors', async () => {
      const error = new Error('Invalid import data');
      StorageService.importRaceConfig.mockRejectedValue(error);
      
      const { result } = renderHook(() => useRaceStore());
      
      await act(async () => {
        try {
          await result.current.importRaceConfig({});
        } catch (e) {
          expect(e).toBe(error);
        }
      });
      
      expect(result.current.error).toBe('Invalid import data');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Back Navigation Support', () => {
    it('should preserve race data when switching modes', () => {
      const { result } = renderHook(() => useRaceStore());
      
      const mockRaceConfig = { id: '1', name: 'Test Race' };
      const mockRunners = [{ number: 1, status: RUNNER_STATUSES.PASSED }];
      
      // Set up race data
      act(() => {
        useRaceStore.setState({
          raceConfig: mockRaceConfig,
          runners: mockRunners,
          mode: APP_MODES.CHECKPOINT
        });
      });
      
      // Switch back to setup
      act(() => {
        result.current.setMode(APP_MODES.SETUP);
      });
      
      expect(result.current.mode).toBe(APP_MODES.SETUP);
      expect(result.current.raceConfig).toEqual(mockRaceConfig); // Should be preserved
      expect(result.current.runners).toEqual(mockRunners); // Should be preserved
    });

    it('should allow switching between checkpoint and base station modes', () => {
      const { result } = renderHook(() => useRaceStore());
      
      act(() => {
        result.current.setMode(APP_MODES.CHECKPOINT);
      });
      expect(result.current.mode).toBe(APP_MODES.CHECKPOINT);
      
      act(() => {
        result.current.setMode(APP_MODES.BASE_STATION);
      });
      expect(result.current.mode).toBe(APP_MODES.BASE_STATION);
      
      act(() => {
        result.current.setMode(APP_MODES.SETUP);
      });
      expect(result.current.mode).toBe(APP_MODES.SETUP);
    });
  });
});
