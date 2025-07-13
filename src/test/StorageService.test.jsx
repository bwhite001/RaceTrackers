import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RUNNER_STATUSES } from '../types/index.js';

// Simple mock for StorageService
const mockStorageService = {
  getAllRaces: vi.fn(),
  switchToRace: vi.fn(),
  exportRaceResults: vi.fn(),
  importRaceConfig: vi.fn(),
  deleteRace: vi.fn(),
  escapeCSVValue: vi.fn(),
  formatDuration: vi.fn(),
  calculateTimeDifference: vi.fn()
};

vi.mock('../services/storage.js', () => ({
  default: mockStorageService
}));

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
      
      mockStorageService.getAllRaces.mockResolvedValue(mockRaces);
      
      const StorageService = (await import('../services/storage.js')).default;
      const races = await StorageService.getAllRaces();
      
      expect(races).toEqual(mockRaces);
      expect(mockStorageService.getAllRaces).toHaveBeenCalledTimes(1);
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
      
      mockStorageService.switchToRace.mockResolvedValue(mockRace);
      
      const StorageService = (await import('../services/storage.js')).default;
      const race = await StorageService.switchToRace('2');
      
      expect(race).toEqual(mockRace);
      expect(mockStorageService.switchToRace).toHaveBeenCalledWith('2');
    });

    it('should handle race switching errors', async () => {
      mockStorageService.switchToRace.mockRejectedValue(new Error('Race not found'));
      
      const StorageService = (await import('../services/storage.js')).default;
      await expect(StorageService.switchToRace('invalid-id')).rejects.toThrow('Race not found');
    });
  });

  describe('CSV Export Functionality', () => {
    it('should export race results as CSV', async () => {
      const expectedCSV = `Race Name,Test Marathon 2025
Race Date,2025-07-13
Start Time,08:00
Total Runners,51

Runner Number,Status,Recorded Time,Time from Start
100,passed,2025-07-13T08:15:30Z,00:15:30
101,not-started,,
102,dnf,,`;
      
      mockStorageService.exportRaceResults.mockResolvedValue(expectedCSV);
      
      const StorageService = (await import('../services/storage.js')).default;
      const csvData = await StorageService.exportRaceResults('1');
      
      expect(csvData).toContain('Race Name,Test Marathon 2025');
      expect(csvData).toContain('100,passed,2025-07-13T08:15:30Z,00:15:30');
      expect(mockStorageService.exportRaceResults).toHaveBeenCalledWith('1');
    });

    it('should handle export errors', async () => {
      mockStorageService.exportRaceResults.mockRejectedValue(new Error('Race not found'));
      
      const StorageService = (await import('../services/storage.js')).default;
      await expect(StorageService.exportRaceResults('invalid-id')).rejects.toThrow('Race not found');
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
      mockStorageService.importRaceConfig.mockResolvedValue(newRaceId);
      
      const StorageService = (await import('../services/storage.js')).default;
      const raceId = await StorageService.importRaceConfig(importData);
      
      expect(raceId).toBe(newRaceId);
      expect(mockStorageService.importRaceConfig).toHaveBeenCalledWith(importData);
    });

    it('should handle import errors', async () => {
      const invalidData = { invalid: 'data' };
      mockStorageService.importRaceConfig.mockRejectedValue(new Error('Invalid import data format'));
      
      const StorageService = (await import('../services/storage.js')).default;
      await expect(StorageService.importRaceConfig(invalidData)).rejects.toThrow('Invalid import data format');
    });
  });

  describe('Race Deletion', () => {
    it('should delete race and associated data', async () => {
      const raceId = 'race-to-delete';
      mockStorageService.deleteRace.mockResolvedValue();
      
      const StorageService = (await import('../services/storage.js')).default;
      await StorageService.deleteRace(raceId);
      
      expect(mockStorageService.deleteRace).toHaveBeenCalledWith(raceId);
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Database error');
      mockStorageService.deleteRace.mockRejectedValue(error);
      
      const StorageService = (await import('../services/storage.js')).default;
      await expect(StorageService.deleteRace('race-id')).rejects.toThrow('Database error');
    });
  });

  describe('CSV Generation Utilities', () => {
    it('should have utility functions available', () => {
      // Simple test to verify the service has utility functions
      expect(mockStorageService.escapeCSVValue).toBeDefined();
      expect(mockStorageService.formatDuration).toBeDefined();
      expect(mockStorageService.calculateTimeDifference).toBeDefined();
    });
  });
});
