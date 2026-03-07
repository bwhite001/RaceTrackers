import { create } from 'zustand';
import CheckpointRepository from '../services/CheckpointRepository';
import { RUNNER_STATUS } from '../../../shared/types/store.types';

/**
 * Zustand store for operating two linked checkpoints simultaneously.
 * Each checkpoint (primary / secondary) has its own runner list.
 * `activeTab` determines which checkpoint receives mark/bulk operations.
 */
const useDualCheckpointStore = create((set, get) => ({
  // ── Identity ────────────────────────────────────────────────────────────────
  currentRaceId: null,
  primaryCpNumber: null,
  secondaryCpNumber: null,
  /** 'primary' | 'secondary' */
  activeTab: 'primary',

  // ── Runner data ──────────────────────────────────────────────────────────────
  primaryRunners: [],
  secondaryRunners: [],

  // ── Status ───────────────────────────────────────────────────────────────────
  loading: false,
  error: null,
  lastSync: null,

  // ── Internal helpers ─────────────────────────────────────────────────────────
  _setLoading: (loading) => set({ loading }),
  _setError: (error) => set({ error }),

  _activeCpNumber: () => {
    const { activeTab, primaryCpNumber, secondaryCpNumber } = get();
    return activeTab === 'primary' ? primaryCpNumber : secondaryCpNumber;
  },

  _refreshActive: async () => {
    const { currentRaceId, activeTab, primaryCpNumber, secondaryCpNumber } = get();
    if (activeTab === 'primary') {
      const primaryRunners = await CheckpointRepository.getCheckpointRunners(currentRaceId, primaryCpNumber);
      set({ primaryRunners, loading: false, lastSync: new Date().toISOString() });
    } else {
      const secondaryRunners = await CheckpointRepository.getCheckpointRunners(currentRaceId, secondaryCpNumber);
      set({ secondaryRunners, loading: false, lastSync: new Date().toISOString() });
    }
  },

  _refreshBoth: async () => {
    const { currentRaceId, primaryCpNumber, secondaryCpNumber } = get();
    const [primaryRunners, secondaryRunners] = await Promise.all([
      CheckpointRepository.getCheckpointRunners(currentRaceId, primaryCpNumber),
      CheckpointRepository.getCheckpointRunners(currentRaceId, secondaryCpNumber),
    ]);
    set({ primaryRunners, secondaryRunners, loading: false, lastSync: new Date().toISOString() });
  },

  // ── Initialisation ───────────────────────────────────────────────────────────
  /**
   * Initialize both checkpoints, creating runner records if missing.
   */
  initialize: async (raceId, primaryCpNumber, secondaryCpNumber) => {
    try {
      set({ loading: true, error: null });

      // Init each checkpoint if no runners yet
      for (const cpNumber of [primaryCpNumber, secondaryCpNumber]) {
        const existing = await CheckpointRepository.getCheckpointRunners(raceId, cpNumber);
        if (existing.length === 0) {
          await CheckpointRepository.initializeCheckpoint(raceId, cpNumber);
        }
      }

      const [primaryRunners, secondaryRunners] = await Promise.all([
        CheckpointRepository.getCheckpointRunners(raceId, primaryCpNumber),
        CheckpointRepository.getCheckpointRunners(raceId, secondaryCpNumber),
      ]);

      set({
        currentRaceId: raceId,
        primaryCpNumber,
        secondaryCpNumber,
        activeTab: 'primary',
        primaryRunners,
        secondaryRunners,
        loading: false,
        lastSync: new Date().toISOString(),
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ── Tab management ───────────────────────────────────────────────────────────
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Getters ──────────────────────────────────────────────────────────────────
  /** Runners for the currently-active tab. */
  getActiveRunners: () => {
    const { activeTab, primaryRunners, secondaryRunners } = get();
    return activeTab === 'primary' ? primaryRunners : secondaryRunners;
  },

  /** Runners for the specified checkpoint ('primary' | 'secondary'). */
  getRunnersFor: (tab) => {
    const { primaryRunners, secondaryRunners } = get();
    return tab === 'primary' ? primaryRunners : secondaryRunners;
  },

  // ── Runner operations (operate on activeTab checkpoint) ──────────────────────
  markRunner: async (runnerNumber, callInTime = null, markOffTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId } = get();
      const cpNumber = get()._activeCpNumber();
      if (!currentRaceId || !cpNumber) throw new Error('No active dual checkpoint session');

      set({ loading: true, error: null });
      await CheckpointRepository.markRunner(currentRaceId, cpNumber, runnerNumber, callInTime, markOffTime, status);
      await get()._refreshActive();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  bulkMarkRunners: async (runnerNumbers, callInTime = null, markOffTime = null, status = RUNNER_STATUS.PASSED) => {
    try {
      const { currentRaceId } = get();
      const cpNumber = get()._activeCpNumber();
      if (!currentRaceId || !cpNumber) throw new Error('No active dual checkpoint session');

      set({ loading: true, error: null });
      await CheckpointRepository.bulkMarkRunners(currentRaceId, cpNumber, runnerNumbers, callInTime, markOffTime, status);
      await get()._refreshActive();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateRunner: async (runnerNumber, updates) => {
    try {
      const { currentRaceId } = get();
      const cpNumber = get()._activeCpNumber();
      if (!currentRaceId || !cpNumber) throw new Error('No active dual checkpoint session');

      set({ loading: true, error: null });
      await CheckpointRepository.updateRunner(currentRaceId, cpNumber, runnerNumber, updates);
      await get()._refreshActive();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ── Callout sheet helpers ────────────────────────────────────────────────────
  /**
   * Build 5-minute time segments for a given tab ('primary' | 'secondary').
   */
  getTimeSegments: (tab) => {
    const runners = get().getRunnersFor(tab);
    const passed = runners.filter(r => r.status === 'passed' && r.commonTimeLabel);
    const groups = {};
    for (const r of passed) {
      const key = r.commonTimeLabel;
      if (!groups[key]) {
        groups[key] = { commonTimeLabel: key, commonTime: r.commonTime, runners: [], calledIn: true };
      }
      groups[key].runners.push(r);
      if (!r.calledIn) groups[key].calledIn = false;
    }
    return Object.values(groups).sort((a, b) => new Date(a.commonTime) - new Date(b.commonTime));
  },

  markSegmentCalledIn: async (tab, commonTimeLabel) => {
    try {
      const { currentRaceId, primaryCpNumber, secondaryCpNumber } = get();
      const cpNumber = tab === 'primary' ? primaryCpNumber : secondaryCpNumber;
      if (!currentRaceId || !cpNumber) throw new Error('No active dual checkpoint session');

      set({ loading: true, error: null });
      await CheckpointRepository.markGroupCalledIn(currentRaceId, cpNumber, commonTimeLabel);
      await get()._refreshBoth();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ── Reset ────────────────────────────────────────────────────────────────────
  reset: () => set({
    currentRaceId: null,
    primaryCpNumber: null,
    secondaryCpNumber: null,
    activeTab: 'primary',
    primaryRunners: [],
    secondaryRunners: [],
    loading: false,
    error: null,
    lastSync: null,
  }),
}));

export default useDualCheckpointStore;
