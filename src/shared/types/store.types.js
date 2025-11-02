// Race types
export const RUNNER_STATUS = {
  NOT_STARTED: 'not-started',
  PASSED: 'passed',
  DNF: 'dnf',
  NON_STARTER: 'non-starter'
};

// Race configuration type
export const RaceConfig = {
  name: '',
  date: '',
  startTime: '',
  minRunner: 0,
  maxRunner: 0,
  checkpoints: [], // Array of { number: number, name: string }
  runnerRanges: [] // Array of { min: number, max: number } or { isIndividual: true, individualNumbers: number[] }
};

// Runner type
export const Runner = {
  id: 0,
  raceId: 0,
  number: 0,
  status: RUNNER_STATUS.NOT_STARTED,
  recordedTime: null,
  notes: null
};

// Checkpoint Runner type
export const CheckpointRunner = {
  id: 0,
  raceId: 0,
  checkpointNumber: 0,
  number: 0,
  status: RUNNER_STATUS.NOT_STARTED,
  markOffTime: null,
  callInTime: null,
  notes: null
};

// Base Station Runner type
export const BaseStationRunner = {
  id: 0,
  raceId: 0,
  checkpointNumber: 0,
  number: 0,
  status: RUNNER_STATUS.NOT_STARTED,
  commonTime: null,
  notes: null
};

// Settings type
export const Settings = {
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30, // seconds
  defaultCheckpoint: 1
};
