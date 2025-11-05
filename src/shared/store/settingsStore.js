import { create } from 'zustand';
import SettingsRepository from '../services/database/SettingsRepository';

const useSettingsStore = create((set, get) => ({
  // State
  settings: {
    darkMode: false,
    autoRefresh: true,
    refreshInterval: 30, // seconds
    defaultCheckpoint: 1,
    currentRaceId: null,
    currentCheckpoint: null,
    currentBaseStationCheckpoint: 1
  },
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Initialize settings
  initializeSettings: async () => {
    try {
      set({ loading: true, error: null });
      const savedSettings = await SettingsRepository.getAllSettings();
      
      set({
        settings: {
          ...get().settings,
          ...savedSettings
        },
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update single setting
  updateSetting: async (key, value) => {
    try {
      set({ loading: true, error: null });
      await SettingsRepository.saveSetting(key, value);
      
      set(state => ({
        settings: {
          ...state.settings,
          [key]: value
        },
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update multiple settings
  updateSettings: async (newSettings) => {
    try {
      set({ loading: true, error: null });
      
      // Save each setting
      const savePromises = Object.entries(newSettings).map(([key, value]) => 
        SettingsRepository.saveSetting(key, value)
      );
      await Promise.all(savePromises);
      
      set(state => ({
        settings: {
          ...state.settings,
          ...newSettings
        },
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset settings to defaults
  resetSettings: async () => {
    const defaultSettings = {
      darkMode: false,
      autoRefresh: true,
      refreshInterval: 30,
      defaultCheckpoint: 1,
      currentRaceId: null,
      currentCheckpoint: null,
      currentBaseStationCheckpoint: 1
    };

    try {
      set({ loading: true, error: null });
      await SettingsRepository.clearSettings();
      
      // Save default settings
      const savePromises = Object.entries(defaultSettings).map(([key, value]) => 
        SettingsRepository.saveSetting(key, value)
      );
      await Promise.all(savePromises);
      
      set({
        settings: defaultSettings,
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get setting with default value
  getSetting: (key, defaultValue = null) => {
    const { settings } = get();
    return settings[key] ?? defaultValue;
  },

  // Reset state
  reset: () => {
    set({
      settings: {
        darkMode: false,
        autoRefresh: true,
        refreshInterval: 30,
        defaultCheckpoint: 1,
        currentRaceId: null,
        currentCheckpoint: null,
        currentBaseStationCheckpoint: 1
      },
      loading: false,
      error: null
    });
  }
}));

export default useSettingsStore;

