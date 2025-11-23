import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import StorageService from '../services/storage.js';
import TimeUtils from '../services/timeUtils.js';
import { DEFAULT_SETTINGS, APP_MODES, RUNNER_STATUSES } from '../types/index.js';

export const useRaceStore = create(
    persist(
        (set, get) => ({
            // State
            raceConfig: null,
            mode: APP_MODES.SETUP,
            runners: [],
            checkpoints: [],
            currentCheckpoint: 1,
            settings: DEFAULT_SETTINGS,
            isLoading: false,
            error: null,
            currentRaceId: null,
            selectedRaceForMode: null, // Race selected for entering a module
            isOnline: navigator.onLine, // Network status

            // Actions
            setLoading: (loading) => set({ isLoading: loading }),

            setError: (error) => set({ error }),

            clearError: () => set({ error: null }),

            // Network status actions
            setNetworkStatus: (status) => set({ isOnline: status }),

            // Race selection for module entry
            setSelectedRaceForMode: (raceId) => set({ selectedRaceForMode: raceId }),

            clearSelectedRaceForMode: () => set({ selectedRaceForMode: null }),

            // Get race statistics (categorized)
            getRaceStatistics: async () => {
                try {
                    const races = await get().getAllRaces();
                    const { categorizeRaces } = await import('../utils/raceStatistics.js');
                    return categorizeRaces(races);
                } catch (error) {
                    console.error('Failed to get race statistics:', error);
                    return {
                        current: [],
                        upcoming: [],
                        recent: [],
                        all: [],
                    };
                }
            },

            // Race configuration actions
            createRace: async (raceData) => {
                set({ isLoading: true, error: null });
                try {
                    const raceId = await StorageService.saveRace(raceData);
                    const runners = await StorageService.getRunners(raceId);

                    set({
                        raceConfig: { ...raceData, id: raceId },
                        currentRaceId: raceId,
                        runners,
                        mode: APP_MODES.RACE_OVERVIEW,
                        isLoading: false,
                    });

                    return raceId;
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            loadRace: async (raceId) => {
                set({ isLoading: true, error: null });
                try {
                    const race = await StorageService.getRace(raceId);
                    const runners = await StorageService.getRunners(raceId);
                    const checkpoints = await StorageService.getCheckpoints(
                        raceId
                    );

                    set({
                        raceConfig: race,
                        currentRaceId: raceId,
                        runners,
                        checkpoints: checkpoints || [],
                        currentCheckpoint:
                            checkpoints && checkpoints.length > 0
                                ? checkpoints[0].number
                                : 1,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            loadCurrentRace: async () => {
                set({ isLoading: true, error: null });
                try {
                    const race = await StorageService.getCurrentRace();
                    if (race) {
                        await get().loadRace(race.id);
                    } else {
                        set({ isLoading: false });
                    }
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
            },

            getAllRaces: async () => {
                set({ isLoading: true, error: null });
                try {
                    const races = await StorageService.getAllRaces();
                    set({ isLoading: false });
                    return races;
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            switchToRace: async (raceId) => {
                set({ isLoading: true, error: null });
                try {
                    await get().loadRace(raceId);
                    set({ mode: APP_MODES.SETUP });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            deleteRace: async (raceId) => {
                set({ isLoading: true, error: null });
                try {
                    await StorageService.deleteRace(raceId);

                    // If this was the current race, reset state
                    if (get().currentRaceId === raceId) {
                        set({
                            raceConfig: null,
                            currentRaceId: null,
                            runners: [],
                            checkpoints: [],
                            mode: APP_MODES.SETUP,
                        });
                    }

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Mode actions
            setMode: (mode) => set({ mode }),

            // Runner actions
            markRunnerPassed: async (runnerNumber, timestamp = null) => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });
                try {
                    const recordedTime =
                        timestamp || TimeUtils.getCurrentTimestamp();
                    await StorageService.markRunnerPassed(
                        currentRaceId,
                        runnerNumber,
                        recordedTime
                    );

                    // Update local state
                    const runners = get().runners.map((runner) =>
                        runner.number === runnerNumber
                            ? {
                                  ...runner,
                                  status: RUNNER_STATUSES.PASSED,
                                  recordedTime,
                              }
                            : runner
                    );

                    set({ runners, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            markRunnerStatus: async (runnerNumber, status) => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });
                try {
                    await StorageService.markRunnerStatus(
                        currentRaceId,
                        runnerNumber,
                        status
                    );

                    // Update local state
                    const runners = get().runners.map((runner) =>
                        runner.number === runnerNumber
                            ? {
                                  ...runner,
                                  status,
                                  recordedTime:
                                      status === RUNNER_STATUSES.PASSED
                                          ? runner.recordedTime
                                          : null,
                              }
                            : runner
                    );

                    set({ runners, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            bulkMarkRunners: async (
                runnerNumbers,
                status,
                timestamp = null
            ) => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });
                try {
                    const updates = { status };
                    if (status === RUNNER_STATUSES.PASSED) {
                        updates.recordedTime =
                            timestamp || TimeUtils.getCurrentTimestamp();
                    } else {
                        updates.recordedTime = null;
                    }

                    await StorageService.bulkUpdateRunners(
                        currentRaceId,
                        runnerNumbers,
                        updates
                    );

                    // Update local state
                    const runners = get().runners.map((runner) =>
                        runnerNumbers.includes(runner.number)
                            ? { ...runner, ...updates }
                            : runner
                    );

                    set({ runners, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Settings actions
            updateSettings: async (newSettings) => {
                const settings = { ...get().settings, ...newSettings };
                set({ settings });

                // Persist individual settings
                for (const [key, value] of Object.entries(newSettings)) {
                    try {
                        await StorageService.saveSetting(key, value);
                    } catch (error) {
                        console.error(`Failed to save setting ${key}:`, error);
                    }
                }
            },

            loadSettings: async () => {
                try {
                    const savedSettings = await StorageService.getAllSettings();
                    const settings = { ...DEFAULT_SETTINGS, ...savedSettings };
                    set({ settings });
                } catch (error) {
                    console.error("Failed to load settings:", error);
                }
            },

            // Import/Export actions
            exportRaceConfig: async (raceId = null) => {
                const { currentRaceId } = get();
                const targetRaceId = raceId || currentRaceId;
                if (!targetRaceId) throw new Error("No race to export");

                try {
                    return await StorageService.exportRaceConfig(targetRaceId);
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            exportRaceResults: async (format = "csv", raceId = null) => {
                const { currentRaceId, raceConfig, runners } = get();
                const targetRaceId = raceId || currentRaceId;
                if (!targetRaceId) throw new Error("No race to export");

                try {
                    // If a specific raceId is provided, we need to load that race's data
                    let targetRaceConfig = raceConfig;
                    let targetRunners = runners;
                    
                    if (raceId && raceId !== currentRaceId) {
                        targetRaceConfig = await StorageService.getRace(raceId);
                        targetRunners = await StorageService.getRunners(raceId);
                    }
                    
                    return await StorageService.exportRaceResults(
                        targetRaceId,
                        targetRaceConfig,
                        targetRunners,
                        format
                    );
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            importRaceConfig: async (exportData) => {
                set({ isLoading: true, error: null });
                try {
                    const raceId = await StorageService.importRaceConfig(
                        exportData
                    );
                    await get().loadRace(raceId);
                    return raceId;
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Computed getters
            getRunnersByStatus: (status) => {
                return get().runners.filter(
                    (runner) => runner.status === status
                );
            },

            getPassedRunners: () => {
                return get().runners.filter(
                    (runner) =>
                        runner.status === RUNNER_STATUSES.PASSED &&
                        runner.recordedTime
                );
            },

            getRunnerCounts: () => {
                const runners = get().runners;
                return {
                    total: runners.length,
                    notStarted: runners.filter(
                        (r) => r.status === RUNNER_STATUSES.NOT_STARTED
                    ).length,
                    passed: runners.filter(
                        (r) => r.status === RUNNER_STATUSES.PASSED
                    ).length,
                    nonStarter: runners.filter(
                        (r) => r.status === RUNNER_STATUSES.NON_STARTER
                    ).length,
                    dnf: runners.filter((r) => r.status === RUNNER_STATUSES.DNF)
                        .length,
                };
            },

            getRunner: (runnerNumber) => {
                return get().runners.find(
                    (runner) => runner.number === runnerNumber
                );
            },

            // New isolated tracking state
            checkpointRunners: {}, // { [checkpointNumber]: [...runners] }
            baseStationRunners: [],

            // Checkpoint actions
            setCurrentCheckpoint: (checkpointNumber) => {
                set({ currentCheckpoint: checkpointNumber });
            },

            // New isolated checkpoint methods
            loadCheckpointRunners: async (checkpointNumber) => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });
                try {
                    let checkpointRunners =
                        await StorageService.getCheckpointRunners(
                            currentRaceId,
                            checkpointNumber
                        );

                    // Initialize if empty
                    if (checkpointRunners.length === 0) {
                        checkpointRunners =
                            await StorageService.initializeCheckpointRunners(
                                currentRaceId,
                                checkpointNumber
                            );
                    }

                    set((state) => ({
                        checkpointRunners: {
                            ...state.checkpointRunners,
                            [checkpointNumber]: checkpointRunners,
                        },
                        isLoading: false,
                    }));
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            markCheckpointRunner: async (
                runnerNumber,
                checkpointNumber = null,
                callInTime = null,
                markOffTime = null,
                status = "passed"
            ) => {
                const { currentRaceId, currentCheckpoint } = get();
                if (!currentRaceId) return;

                const checkpoint = checkpointNumber || currentCheckpoint;
                set({ isLoading: true, error: null });

                try {
                    await StorageService.markCheckpointRunner(
                        currentRaceId,
                        checkpoint,
                        runnerNumber,
                        callInTime,
                        markOffTime,
                        status
                    );

                    // Reload checkpoint runners
                    await get().loadCheckpointRunners(checkpoint);

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            unmarkCheckpointRunner: async (
                runnerNumber,
                checkpointNumber = null
            ) => {
                const { currentRaceId, currentCheckpoint } = get();
                if (!currentRaceId) return;

                const checkpoint = checkpointNumber || currentCheckpoint;
                set({ isLoading: true, error: null });

                try {
                    // Reset runner to not-started status
                    await StorageService.markCheckpointRunner(
                        currentRaceId,
                        checkpoint,
                        runnerNumber,
                        null,
                        null,
                        RUNNER_STATUSES.NOT_STARTED
                    );

                    // Reload checkpoint runners
                    await get().loadCheckpointRunners(checkpoint);

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            updateCheckpointRunnerTime: async (
                runnerNumber,
                newTime,
                checkpointNumber = null
            ) => {
                const { currentRaceId, currentCheckpoint } = get();
                if (!currentRaceId) return;

                const checkpoint = checkpointNumber || currentCheckpoint;
                set({ isLoading: true, error: null });

                try {
                    // Get current runner data
                    const runner = get().getCheckpointRunner(
                        runnerNumber,
                        checkpoint
                    );
                    if (runner) {
                        // Update with new time, preserving other data
                        await StorageService.markCheckpointRunner(
                            currentRaceId,
                            checkpoint,
                            runnerNumber,
                            runner.callInTime,
                            newTime,
                            RUNNER_STATUSES.PASSED
                        );

                        // Reload checkpoint runners
                        await get().loadCheckpointRunners(checkpoint);
                    }

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            bulkMarkCheckpointRunners: async (
                runnerNumbers,
                checkpointNumber = null,
                callInTime = null,
                markOffTime = null,
                status = "passed"
            ) => {
                const { currentRaceId, currentCheckpoint } = get();
                if (!currentRaceId) return;

                const checkpoint = checkpointNumber || currentCheckpoint;
                set({ isLoading: true, error: null });

                try {
                    await StorageService.bulkMarkCheckpointRunners(
                        currentRaceId,
                        checkpoint,
                        runnerNumbers,
                        callInTime,
                        markOffTime,
                        status
                    );

                    // Reload checkpoint runners
                    await get().loadCheckpointRunners(checkpoint);

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            getCheckpointRunners: (checkpointNumber = null) => {
                const { checkpointRunners, currentCheckpoint } = get();
                const checkpoint = checkpointNumber || currentCheckpoint;

                return checkpointRunners[checkpoint] || [];
            },

            getCheckpointRunner: (runnerNumber, checkpointNumber = null) => {
                const { checkpointRunners, currentCheckpoint } = get();
                const checkpoint = checkpointNumber || currentCheckpoint;

                const runners = checkpointRunners[checkpoint] || [];
                return runners.find((runner) => runner.number === runnerNumber);
            },

            // New isolated base station methods
            loadBaseStationRunners: async (checkpointNumber = 1) => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });
                try {
                    let baseStationRunners =
                        await StorageService.getBaseStationRunners(
                            currentRaceId,
                            checkpointNumber
                        );

                    // Initialize if empty
                    if (baseStationRunners.length === 0) {
                        baseStationRunners =
                            await StorageService.initializeBaseStationRunners(
                                currentRaceId,
                                checkpointNumber
                            );
                    }

                    set({ baseStationRunners, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            markBaseStationRunner: async (
                runnerNumber,
                checkpointNumber = 1,
                commonTime = null,
                status = "passed"
            ) => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });

                try {
                    await StorageService.markBaseStationRunner(
                        currentRaceId,
                        checkpointNumber,
                        runnerNumber,
                        commonTime,
                        status
                    );

                    // Reload base station runners
                    await get().loadBaseStationRunners(checkpointNumber);

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            bulkMarkBaseStationRunners: async (
                runnerNumbers,
                checkpointNumber = 1,
                commonTime = null,
                status = "passed"
            ) => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });

                try {
                    await StorageService.bulkMarkBaseStationRunners(
                        currentRaceId,
                        checkpointNumber,
                        runnerNumbers,
                        commonTime,
                        status
                    );

                    // Reload base station runners
                    await get().loadBaseStationRunners(checkpointNumber);

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // New export methods for isolated data
            exportIsolatedCheckpointResults: async (
                checkpointNumber = null,
                raceId = null
            ) => {
                const { currentRaceId, currentCheckpoint } = get();
                const targetRaceId = raceId || currentRaceId;
                if (!targetRaceId) throw new Error("No race to export");

                const checkpoint = checkpointNumber || currentCheckpoint;

                try {
                    return await StorageService.exportIsolatedCheckpointResults(
                        targetRaceId,
                        checkpoint
                    );
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            exportIsolatedBaseStationResults: async (checkpointNumber = 1) => {
                const { currentRaceId } = get();
                if (!currentRaceId) throw new Error("No race to export");

                try {
                    return await StorageService.exportIsolatedBaseStationResults(
                        currentRaceId,
                        checkpointNumber
                    );
                } catch (error) {
                    set({ error: error.message });
                    throw error;
                }
            },

            // Migration method
            migrateToIsolatedTracking: async () => {
                const { currentRaceId } = get();
                if (!currentRaceId) return;

                set({ isLoading: true, error: null });
                try {
                    await StorageService.migrateToIsolatedTracking(
                        currentRaceId
                    );

                    // Load all isolated data
                    const checkpoints = get().checkpoints;
                    for (const checkpoint of checkpoints) {
                        await get().loadCheckpointRunners(checkpoint.number);
                    }
                    await get().loadBaseStationRunners();

                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Initialize runners from race configuration
            initializeRunnersFromRace: async (raceConfig) => {
                if (!raceConfig || !raceConfig.runnerRanges) return;

                set({ isLoading: true, error: null });
                try {
                    // If we have a race ID, load runners from storage
                    if (raceConfig.id) {
                        const runners = await StorageService.getRunners(raceConfig.id);
                        if (runners && runners.length > 0) {
                            set({ runners, isLoading: false });
                            return;
                        }
                    }

                    // Otherwise, create runners from runner ranges (for display purposes)
                    const runners = [];
                    
                    // Parse runner ranges and create runner objects
                    for (const range of raceConfig.runnerRanges) {
                        // Handle both string format and object format
                        if (typeof range === 'string') {
                            // String format: "100-200"
                            const [start, end] = range.split('-').map(num => parseInt(num.trim()));
                            
                            for (let num = start; num <= end; num++) {
                                runners.push({
                                    number: num,
                                    status: RUNNER_STATUSES.NOT_STARTED,
                                    recordedTime: null,
                                });
                            }
                        } else if (range && typeof range === 'object') {
                            // Object format: { min, max, individualNumbers, etc. }
                            if (range.individualNumbers && range.individualNumbers.length > 0) {
                                // Individual numbers
                                for (const num of range.individualNumbers) {
                                    runners.push({
                                        number: num,
                                        status: RUNNER_STATUSES.NOT_STARTED,
                                        recordedTime: null,
                                    });
                                }
                            } else if (range.min !== undefined && range.max !== undefined) {
                                // Range with min/max
                                for (let num = range.min; num <= range.max; num++) {
                                    runners.push({
                                        number: num,
                                        status: RUNNER_STATUSES.NOT_STARTED,
                                        recordedTime: null,
                                    });
                                }
                            }
                        }
                    }

                    set({ runners, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Utility actions
            resetRace: () => {
                set({
                    raceConfig: null,
                    currentRaceId: null,
                    runners: [],
                    checkpoints: [],
                    currentCheckpoint: 1,
                    mode: APP_MODES.SETUP,
                    error: null,
                });
            },

            clearAllData: async () => {
                set({ isLoading: true, error: null });
                try {
                    await StorageService.clearAllData();
                    // Also clear the persisted state from localStorage
                    localStorage.removeItem("race-tracker-storage");
                    get().resetRace();
                    set({ isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },
        }),
        {
            name: "race-tracker-storage",
            partialize: (state) => ({
                currentRaceId: state.currentRaceId,
                selectedRaceForMode: state.selectedRaceForMode,
                mode: state.mode,
                settings: state.settings,
            }),
        }
    )
);
