import { create } from 'zustand';
import RaceMaintenanceRepository from '../services/RaceMaintenanceRepository';
import SettingsRepository from '../../../shared/services/database/SettingsRepository';
import { RUNNER_STATUS } from '../../../shared/types/store.types';

const useRaceMaintenanceStore = create((set, get) => ({
  // State
  currentRace: null,
  races: [],
  checkpoints: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Race Management
  createRace: async (raceConfig) => {
    try {
      set({ loading: true, error: null });
      const raceId = await RaceMaintenanceRepository.createRace(raceConfig);
      const race = await RaceMaintenanceRepository.getById(raceId);
      const checkpoints = await RaceMaintenanceRepository.getCheckpoints(raceId);
      
      set({
        currentRace: race,
        checkpoints,
        loading: false
      });

      // Save as current race in settings
      await SettingsRepository.saveSetting('currentRaceId', raceId);
      
      return raceId;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadRace: async (raceId) => {
    try {
      set({ loading: true, error: null });
      const race = await RaceMaintenanceRepository.getById(raceId);
      const checkpoints = await RaceMaintenanceRepository.getCheckpoints(raceId);
      
      if (!race) {
        throw new Error('Race not found');
      }

      set({
        currentRace: race,
        checkpoints,
        loading: false
      });

      // Save as current race in settings
      await SettingsRepository.saveSetting('currentRaceId', raceId);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadCurrentRace: async () => {
    try {
      set({ loading: true, error: null });
      
      // Try to get current race ID from settings
      const currentRaceId = await SettingsRepository.getSetting('currentRaceId');
      if (currentRaceId) {
        const race = await RaceMaintenanceRepository.getById(currentRaceId);
        if (race) {
          const checkpoints = await RaceMaintenanceRepository.getCheckpoints(currentRaceId);
          set({
            currentRace: race,
            checkpoints,
            loading: false
          });
          return;
        }
      }

      // If no current race in settings or not found, get most recent
      const race = await RaceMaintenanceRepository.getCurrentRace();
      if (race) {
        const checkpoints = await RaceMaintenanceRepository.getCheckpoints(race.id);
        set({
          currentRace: race,
          checkpoints,
          loading: false
        });
        await SettingsRepository.saveSetting('currentRaceId', race.id);
      } else {
        set({ currentRace: null, checkpoints: [], loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadAllRaces: async () => {
    try {
      set({ loading: true, error: null });
      const races = await RaceMaintenanceRepository.getAll();
      set({ races, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteRace: async (raceId) => {
    try {
      set({ loading: true, error: null });
      await RaceMaintenanceRepository.deleteRace(raceId);
      
      // Update races list
      const races = await RaceMaintenanceRepository.getAll();
      set({ races, loading: false });

      // If deleted race was current, clear current race
      const { currentRace } = get();
      if (currentRace && currentRace.id === raceId) {
        set({ currentRace: null, checkpoints: [] });
        await SettingsRepository.saveSetting('currentRaceId', null);
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Checkpoint Management
  updateCheckpoint: async (checkpointId, updates) => {
    try {
      set({ loading: true, error: null });
      await RaceMaintenanceRepository.updateCheckpoint(checkpointId, updates);
      
      // Refresh checkpoints
      const { currentRace } = get();
      if (currentRace) {
        const checkpoints = await RaceMaintenanceRepository.getCheckpoints(currentRace.id);
        set({ checkpoints, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset state
  reset: () => {
    set({
      currentRace: null,
      races: [],
      checkpoints: [],
      loading: false,
      error: null
    });
  }
}));

export default useRaceMaintenanceStore;
