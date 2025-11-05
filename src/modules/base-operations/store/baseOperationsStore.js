import { create } from 'zustand';
import BaseOperationsRepository from '../services/BaseOperationsRepository';
import SettingsRepository from '../../../shared/services/database/SettingsRepository';
import { RUNNER_STATUS } from '../../../shared/types/store.types';

const useBaseOperationsStore = create((set, get) => ({
  // State
  currentRaceId: null,
  checkpointNumber: 1, // Base station typically monitors checkpoint 1
  runners: [],
  loading: false,
  error: null,
  lastSync: null,
  exportFormat: 'csv',
  
  // New state for enhanced features
  deletedEntries: [],
  duplicateEntries: [],
  strapperCalls: [],
  missingRunners: [],
  outList: [],
  sortOrder: 'default', // 'default', 'cp-time', 'number'

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setExportFormat: (format) => set({ exportFormat: format }),
  setSortOrder: (order) => set({ sortOrder: order }),

  // Initialize base station
  initializeBaseStation: async (raceId, checkpointNumber = 1) => {
    try {
      set({ loading: true, error: null });
      
      // Initialize base station runners if not already initialized
      const existingRunners = await BaseOperationsRepository.getBaseStationRunners(raceId, checkpointNumber);
      if (existingRunners.length === 0) {
        await BaseOperationsRepository.initializeBaseStation(raceId, checkpointNumber);
      }

      const runners = await BaseOperationsRepository.getBaseStationRunners(raceId, checkpointNumber);
      
      set({
        currentRaceId: raceId,
        checkpointNumber,
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });

      // Save current base station settings
      await SettingsRepository.saveSetting('currentBaseStationCheckpoint', checkpointNumber);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Load base station data
  loadBaseStationData: async (raceId, checkpointNumber = 1) => {
    try {
      set({ loading: true, error: null });
      const runners = await BaseOperationsRepository.getBaseStationRunners(raceId, checkpointNumber);
      
      set({
        currentRaceId: raceId,
        checkpointNumber,
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Runner management
  updateRunner: async (runnerNumber, updates) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.updateRunner(currentRaceId, checkpointNumber, runnerNumber, updates);
      
      // Refresh runners
      const runners = await BaseOperationsRepository.getBaseStationRunners(currentRaceId, checkpointNumber);
      set({ 
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  markRunner: async (runnerNumber, commonTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.markRunner(
        currentRaceId,
        checkpointNumber,
        runnerNumber,
        commonTime,
        status
      );
      
      // Refresh runners
      const runners = await BaseOperationsRepository.getBaseStationRunners(currentRaceId, checkpointNumber);
      set({ 
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  bulkMarkRunners: async (runnerNumbers, commonTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.bulkMarkRunners(
        currentRaceId,
        checkpointNumber,
        runnerNumbers,
        commonTime,
        status
      );
      
      // Refresh runners
      const runners = await BaseOperationsRepository.getBaseStationRunners(currentRaceId, checkpointNumber);
      set({ 
        runners,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Export functions
  exportBaseStationData: async () => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const exportData = await BaseOperationsRepository.exportBaseStationData(currentRaceId, checkpointNumber);
      set({ loading: false });
      return exportData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateRaceResults: async () => {
    try {
      const { currentRaceId, exportFormat } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const results = await BaseOperationsRepository.generateRaceResults(currentRaceId, exportFormat);
      set({ loading: false });
      return results;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // WITHDRAWAL & VET-OUT OPERATIONS
  // ============================================================================

  withdrawRunner: async (runnerNumber, reason, comments, checkpoint = null, withdrawalTime = null) => {
    try {
      const { currentRaceId, checkpointNumber: defaultCheckpoint } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const cp = checkpoint || defaultCheckpoint;
      
      await BaseOperationsRepository.withdrawRunner(
        currentRaceId,
        runnerNumber,
        cp,
        reason,
        comments,
        withdrawalTime
      );
      
      // Refresh data
      await get().loadBaseStationData(currentRaceId, defaultCheckpoint);
      await get().loadOutList();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  reverseWithdrawal: async (runnerNumber) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.reverseWithdrawal(currentRaceId, runnerNumber);
      
      // Refresh data
      await get().loadBaseStationData(currentRaceId, checkpointNumber);
      await get().loadOutList();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  vetOutRunner: async (runnerNumber, reason, medicalNotes, checkpoint = null, vetOutTime = null) => {
    try {
      const { currentRaceId, checkpointNumber: defaultCheckpoint } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const cp = checkpoint || defaultCheckpoint;
      
      await BaseOperationsRepository.vetOutRunner(
        currentRaceId,
        runnerNumber,
        cp,
        reason,
        medicalNotes,
        vetOutTime
      );
      
      // Refresh data
      await get().loadBaseStationData(currentRaceId, defaultCheckpoint);
      await get().loadOutList();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // STRAPPER CALLS MANAGEMENT
  // ============================================================================

  addStrapperCall: async (checkpoint, priority, description) => {
    try {
      const { currentRaceId } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.addStrapperCall(
        currentRaceId,
        checkpoint,
        priority,
        description
      );
      
      // Refresh strapper calls
      await get().loadStrapperCalls();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadStrapperCalls: async (checkpoint = null, status = null) => {
    try {
      const { currentRaceId } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const calls = await BaseOperationsRepository.getStrapperCalls(
        currentRaceId,
        checkpoint,
        status
      );
      
      set({ 
        strapperCalls: calls,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStrapperCall: async (callId, updates) => {
    try {
      set({ loading: true, error: null });
      await BaseOperationsRepository.updateStrapperCall(callId, updates);
      
      // Refresh strapper calls
      await get().loadStrapperCalls();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  completeStrapperCall: async (callId, notes = null) => {
    try {
      set({ loading: true, error: null });
      await BaseOperationsRepository.completeStrapperCall(callId, 'system', notes);
      
      // Refresh strapper calls
      await get().loadStrapperCalls();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteStrapperCall: async (callId) => {
    try {
      set({ loading: true, error: null });
      await BaseOperationsRepository.deleteStrapperCall(callId);
      
      // Refresh strapper calls
      await get().loadStrapperCalls();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // DELETED ENTRIES & AUDIT TRAIL
  // ============================================================================

  deleteEntry: async (entryId, entryType, deletionReason) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      
      // Get the entry before deleting
      const runners = get().runners;
      const entry = runners.find(r => r.id === entryId);
      
      if (!entry) {
        throw new Error('Entry not found');
      }

      // Save to deleted entries
      await BaseOperationsRepository.saveDeletedEntry(
        currentRaceId,
        entryType,
        entry,
        deletionReason
      );
      
      // Delete from main table
      await BaseOperationsRepository.delete(entryId);
      
      // Refresh data
      await get().loadBaseStationData(currentRaceId, checkpointNumber);
      await get().loadDeletedEntries();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadDeletedEntries: async () => {
    try {
      const { currentRaceId } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const entries = await BaseOperationsRepository.getDeletedEntries(currentRaceId);
      
      set({ 
        deletedEntries: entries,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  restoreEntry: async (entryId) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      await BaseOperationsRepository.restoreDeletedEntry(entryId);
      
      // Refresh data
      await get().loadBaseStationData(currentRaceId, checkpointNumber);
      await get().loadDeletedEntries();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getAuditLog: async () => {
    try {
      const { currentRaceId } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const logs = await BaseOperationsRepository.getAuditLog(currentRaceId);
      set({ loading: false });
      return logs;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================

  loadDuplicateEntries: async () => {
    try {
      const { currentRaceId } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const duplicates = await BaseOperationsRepository.findDuplicateEntries(currentRaceId);
      
      set({ 
        duplicateEntries: duplicates,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  resolveDuplicate: async (duplicateGroup, action, keepEntryId = null) => {
    try {
      const { currentRaceId, checkpointNumber } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      
      // Handle different resolution actions
      switch (action) {
        case 'keep-both':
          // Do nothing, just mark as reviewed
          break;
          
        case 'keep-first':
          // Delete all except first entry
          for (let i = 1; i < duplicateGroup.entries.length; i++) {
            await BaseOperationsRepository.saveDeletedEntry(
              currentRaceId,
              'base_station',
              duplicateGroup.entries[i],
              'Duplicate - kept first entry'
            );
            await BaseOperationsRepository.delete(duplicateGroup.entries[i].id);
          }
          break;
          
        case 'keep-last':
          // Delete all except last entry
          for (let i = 0; i < duplicateGroup.entries.length - 1; i++) {
            await BaseOperationsRepository.saveDeletedEntry(
              currentRaceId,
              'base_station',
              duplicateGroup.entries[i],
              'Duplicate - kept last entry'
            );
            await BaseOperationsRepository.delete(duplicateGroup.entries[i].id);
          }
          break;
          
        case 'keep-specific':
          // Delete all except specified entry
          if (!keepEntryId) {
            throw new Error('Must specify entry to keep');
          }
          for (const entry of duplicateGroup.entries) {
            if (entry.id !== keepEntryId) {
              await BaseOperationsRepository.saveDeletedEntry(
                currentRaceId,
                'base_station',
                entry,
                'Duplicate - kept specific entry'
              );
              await BaseOperationsRepository.delete(entry.id);
            }
          }
          break;
          
        case 'merge':
          // Keep latest time, delete others
          const sortedEntries = [...duplicateGroup.entries].sort((a, b) => 
            new Date(b.commonTime || 0) - new Date(a.commonTime || 0)
          );
          for (let i = 1; i < sortedEntries.length; i++) {
            await BaseOperationsRepository.saveDeletedEntry(
              currentRaceId,
              'base_station',
              sortedEntries[i],
              'Duplicate - merged to latest time'
            );
            await BaseOperationsRepository.delete(sortedEntries[i].id);
          }
          break;
          
        default:
          throw new Error('Invalid resolution action');
      }
      
      // Refresh data
      await get().loadBaseStationData(currentRaceId, checkpointNumber);
      await get().loadDuplicateEntries();
      await get().loadDeletedEntries();
      
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // MISSING NUMBERS & OUT LIST
  // ============================================================================

  loadMissingRunners: async (checkpoint = null) => {
    try {
      const { currentRaceId, checkpointNumber: defaultCheckpoint } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const cp = checkpoint || defaultCheckpoint;
      const missing = await BaseOperationsRepository.getMissingRunners(currentRaceId, cp);
      
      set({ 
        missingRunners: missing,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadOutList: async () => {
    try {
      const { currentRaceId } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const outList = await BaseOperationsRepository.getOutList(currentRaceId);
      
      set({ 
        outList,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // REPORTS GENERATION
  // ============================================================================

  generateMissingNumbersReport: async (checkpoint = null) => {
    try {
      const { currentRaceId, checkpointNumber: defaultCheckpoint } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const cp = checkpoint || defaultCheckpoint;
      const report = await BaseOperationsRepository.generateMissingNumbersReport(currentRaceId, cp);
      set({ loading: false });
      return report;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateOutListReport: async () => {
    try {
      const { currentRaceId } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const report = await BaseOperationsRepository.generateOutListReport(currentRaceId);
      set({ loading: false });
      return report;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateCheckpointLogReport: async (checkpoint = null) => {
    try {
      const { currentRaceId, checkpointNumber: defaultCheckpoint } = get();
      if (!currentRaceId) {
        throw new Error('No active base station session');
      }

      set({ loading: true, error: null });
      const cp = checkpoint || defaultCheckpoint;
      const report = await BaseOperationsRepository.generateCheckpointLogReport(currentRaceId, cp);
      set({ loading: false });
      return report;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  downloadReport: (report) => {
    try {
      const blob = new Blob([report.content], { type: report.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Reset state
  reset: () => {
    set({
      currentRaceId: null,
      checkpointNumber: 1,
      runners: [],
      loading: false,
      error: null,
      lastSync: null,
      exportFormat: 'csv',
      deletedEntries: [],
      duplicateEntries: [],
      strapperCalls: [],
      missingRunners: [],
      outList: [],
      sortOrder: 'default'
    });
  }
}));

export default useBaseOperationsStore;
