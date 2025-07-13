import { describe, it, expect, beforeEach, vi } from 'vitest';
import StorageService from '../services/storage.js';
import { RUNNER_STATUSES } from '../types/index.js';

// Mock Dexie database
const mockDb = {
  races: {
    add: vi.fn(),
    get: vi.fn(),
    toArray: vi.fn(),
    delete: vi.fn(),
    put: vi.fn()
  },
  runners: {
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn()
      }))
    })),
    bulkPut: vi.fn()
  },
  calledSegments: {
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        toArray: vi.fn()
      }))
    })),
    add: vi.fn()
  },
  settings: {
    get: vi.fn(),
    put: vi.fn(),
    toArray: vi.fn()
  },
  delete: vi.fn()
};

vi.mock('../services/storage.js', async () => {
  const actual = await vi.importActual('../services/storage.js');
  return {
    ...actual,
    default: {
      ...actual.default,
      db: mockDb
    }
  };
});

describe('StorageService - Enhanced Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multiple Race Management', () => {
    it('should get all races', async () => {
      const mockRaces = [
        { id: '1', name: 'Test Marathon 2025', date: '2025-07-13' },
        { id: '2', name: 'Sprint Championship 2025', date: '2025-07-13' }
      ];
      
      mockDb.races.toArray.mockResolvedValue(mockRaces);
      
      const races = await StorageService.getAllRaces();
      
      expect(races).toEqual(mockRaces);
      expect(mockDb.races.toArray).toHaveBeenCalledTimes(1);
    });

    it('should switch to a different race', async () => {
      const mockRace = { 
        id: '2', 
        name: 'Sprint Championship 2025', 
        date: '2025-07-13',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 50
      };
      
      mockDb.races.get.mockResolvedValue(mockRace);
      mockDb.settings.put.mockResolvedValue();
      
      const race = await StorageService.switchToRace('2');
      
      expect(race).toEqual(mockRace);
      expect(mockDb.races.get).toHaveBeenCalledWith('2');
      expect(mockDb.settings.put).toHaveBeenCalledWith({
        key: 'currentRaceId',
        value: '2'
      });
    });

    it('should handle race switching errors', async () => {
      mockDb.races.get.mockResolvedValue(undefined);
      
      await expect(StorageService.switchToRace('invalid-id')).rejects.toThrow('Race not found');
    });
  });

  describe('CSV Export Functionality', () => {
    it('should export race results as CSV', async () => {
      const mockRace = {
        id: '1',
        name: 'Test Marathon 2025',
        date: '2025-07-13',
        startTime: '08:00',
        minRunner: 100,
        maxRunner: 150,
        createdAt: '2025-07-13T07:00:00Z'
      };
      
      const mockRunners = [
        { 
          number: 100, 
          status: RUNNER_STATUSES.PASSED, 
          recordedTime: '2025-07-13T08:15:30Z' 
        },
        { 
          number: 101, 
          status: RUNNER_STATUSES.NOT_STARTED, 
          recordedTime: null 
        },
        { 
          number: 102, 
          status: RUNNER_STATUSES.DNF, 
          recordedTime: null 
        }
      ];
      
      mockDb.races.get.mockResolvedValue(mockRace);
      mockDb.runners.where().equals().toArray.mockResolvedValue(mockRunners);
      
      const csvData = await StorageService.exportRaceResults('1');
      
      expect(csvData).toContain('Race Name,Test Marathon 2025');
      expect(csvData).toContain('Race Date,2025-07-13');
      expect(csvData).toContain('Start Time,08:00');
      expect(csvData).toContain('Total Runners,51');
      expect(csvData).toContain('Runner Number,Status,Recorded Time,Time from Start');
      expect(csvData).toContain('100,passed,2025-07-13T08:15:30Z,00:15:30');
      expect(csvData).toContain('101,not-started,,');
      expect(csvData).toContain('102,dnf,,');
      
      expect(mockDb.races.get).toHaveBeenCalledWith('1');
      expect(mockDb.runners.where).toHaveBeenCalledWith('raceId');
    });

    it('should calculate time from start correctly', async () => {
      const mockRace = {
        id: '1',
        name: 'Test Race',
        date: '2025-07-13',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 2,
        createdAt: '2025-07-13T07:00:00Z'
      };
      
      const mockRunners = [
        { 
          number: 1, 
          status: RUNNER_STATUSES.PASSED, 
          recordedTime: '2025-07-13T08:30:45Z' // 30 minutes 45 seconds after start
        }
      ];
      
      mockDb.races.get.mockResolvedValue(mockRace);
      mockDb.runners.where().equals().toArray.mockResolvedValue(mockRunners);
      
      const csvData = await StorageService.exportRaceResults('1');
      
      expect(csvData).toContain('1,passed,2025-07-13T08:30:45Z,00:30:45');
    });

    it('should handle export errors', async () => {
      mockDb.races.get.mockResolvedValue(null);
      
      await expect(StorageService.exportRaceResults('invalid-id')).rejects.toThrow('Race not found');
    });

    it('should generate CSV with proper escaping', async () => {
      const mockRace = {
        id: '1',
        name: 'Test "Special" Race, with commas',
        date: '2025-07-13',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 1,
        createdAt: '2025-07-13T07:00:00Z'
      };
      
      const mockRunners = [];
      
      mockDb.races.get.mockResolvedValue(mockRace);
      mockDb.runners.where().equals().toArray.mockResolvedValue(mockRunners);
      
      const csvData = await StorageService.exportRaceResults('1');
      
      expect(csvData).toContain('"Test ""Special"" Race, with commas"');
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
      mockDb.races.add.mockResolvedValue(newRaceId);
      mockDb.runners.bulkPut.mockResolvedValue();
      mockDb.settings.put.mockResolvedValue();
      
      const raceId = await StorageService.importRaceConfig(importData);
      
      expect(raceId).toBe(newRaceId);
      expect(mockDb.races.add).toHaveBeenCalledWith({
        ...importData.raceConfig,
        createdAt: expect.any(String)
      });
      expect(mockDb.settings.put).toHaveBeenCalledWith({
        key: 'currentRaceId',
        value: newRaceId
      });
    });

    it('should validate import data structure', async () => {
      const invalidData = { invalid: 'data' };
      
      await expect(StorageService.importRaceConfig(invalidData)).rejects.toThrow('Invalid import data format');
    });

    it('should validate race configuration fields', async () => {
      const invalidRaceConfig = {
        raceConfig: {
          name: '', // Invalid: empty name
          date: '2025-08-01',
          startTime: '09:00',
          minRunner: 1,
          maxRunner: 100
        }
      };
      
      await expect(StorageService.importRaceConfig(invalidRaceConfig)).rejects.toThrow('Invalid race configuration');
    });

    it('should create runners for imported race', async () => {
      const importData = {
        raceConfig: {
          name: 'Imported Race',
          date: '2025-08-01',
          startTime: '09:00',
          minRunner: 1,
          maxRunner: 3
        }
      };
      
      const newRaceId = 'imported-race-id';
      mockDb.races.add.mockResolvedValue(newRaceId);
      mockDb.runners.bulkPut.mockResolvedValue();
      mockDb.settings.put.mockResolvedValue();
      
      await StorageService.importRaceConfig(importData);
      
      expect(mockDb.runners.bulkPut).toHaveBeenCalledWith([
        { raceId: newRaceId, number: 1, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null },
        { raceId: newRaceId, number: 2, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null },
        { raceId: newRaceId, number: 3, status: RUNNER_STATUSES.NOT_STARTED, recordedTime: null }
      ]);
    });
  });

  describe('Race Deletion', () => {
    it('should delete race and associated data', async () => {
      const raceId = 'race-to-delete';
      
      mockDb.races.delete.mockResolvedValue();
      mockDb.runners.where().equals().toArray.mockResolvedValue([
        { id: 1, raceId, number: 1 },
        { id: 2, raceId, number: 2 }
      ]);
      mockDb.calledSegments.where().equals().toArray.mockResolvedValue([
        { id: 1, raceId, startTime: '08:00' }
      ]);
      
      await StorageService.deleteRace(raceId);
      
      expect(mockDb.races.delete).toHaveBeenCalledWith(raceId);
      expect(mockDb.runners.where).toHaveBeenCalledWith('raceId');
      expect(mockDb.calledSegments.where).toHaveBeenCalledWith('raceId');
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Database error');
      mockDb.races.delete.mockRejectedValue(error);
      
      await expect(StorageService.deleteRace('race-id')).rejects.toThrow('Database error');
    });
  });

  describe('CSV Generation Utilities', () => {
    it('should escape CSV values correctly', () => {
      const testCases = [
        ['simple text', 'simple text'],
        ['text with, comma', '"text with, comma"'],
        ['text with "quotes"', '"text with ""quotes"""'],
        ['text with\nnewline', '"text with\nnewline"'],
        ['', ''],
        [null, ''],
        [undefined, '']
      ];
      
      testCases.forEach(([input, expected]) => {
        const result = StorageService.escapeCSVValue(input);
        expect(result).toBe(expected);
      });
    });

    it('should format time duration correctly', () => {
      const testCases = [
        [0, '00:00:00'],
        [30, '00:00:30'],
        [90, '00:01:30'],
        [3661, '01:01:01'],
        [7200, '02:00:00']
      ];
      
      testCases.forEach(([seconds, expected]) => {
        const result = StorageService.formatDuration(seconds);
        expect(result).toBe(expected);
      });
    });

    it('should calculate time difference correctly', () => {
      const startTime = '2025-07-13T08:00:00Z';
      const endTime = '2025-07-13T08:15:30Z';
      
      const diff = StorageService.calculateTimeDifference(startTime, endTime);
      expect(diff).toBe(930); // 15 minutes 30 seconds = 930 seconds
    });
  });
});
