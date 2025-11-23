/**
 * Test Data Factory for Schema v6
 * Generates realistic test data for all 11 tables
 */

/**
 * Create a test race with default or custom values
 * @param {Object} overrides - Custom values to override defaults
 * @returns {Object} Race object
 */
export const createTestRace = (overrides = {}) => ({
  name: 'Test Race 2024',
  date: '2024-07-13',
  startTime: '08:00',
  minRunner: 1,
  maxRunner: 100,
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a test runner
 * @param {string} raceId - Race ID
 * @param {number} runnerNumber - Runner number
 * @param {Object} overrides - Custom values
 * @returns {Object} Runner object
 */
export const createTestRunner = (raceId, runnerNumber, overrides = {}) => ({
  raceId,
  number: runnerNumber,
  status: 'not-started',
  recordedTime: null,
  notes: '',
  ...overrides,
});

/**
 * Create a test checkpoint
 * @param {string} raceId - Race ID
 * @param {number} checkpointNumber - Checkpoint number
 * @param {string} name - Checkpoint name
 * @param {Object} overrides - Custom values
 * @returns {Object} Checkpoint object
 */
export const createTestCheckpoint = (raceId, checkpointNumber, name, overrides = {}) => ({
  raceId,
  number: checkpointNumber,
  name,
  ...overrides,
});

/**
 * Create a test checkpoint runner entry
 * @param {string} raceId - Race ID
 * @param {number} checkpointNumber - Checkpoint number
 * @param {number} runnerNumber - Runner number
 * @param {Object} overrides - Custom values
 * @returns {Object} Checkpoint runner object
 */
export const createTestCheckpointRunner = (raceId, checkpointNumber, runnerNumber, overrides = {}) => ({
  raceId,
  checkpointNumber,
  number: runnerNumber,
  markOffTime: null,
  callInTime: null,
  status: 'not-started',
  notes: '',
  ...overrides,
});

/**
 * Create a test base station runner entry
 * @param {string} raceId - Race ID
 * @param {number} checkpointNumber - Checkpoint number
 * @param {number} runnerNumber - Runner number
 * @param {Object} overrides - Custom values
 * @returns {Object} Base station runner object
 */
export const createTestBaseStationRunner = (raceId, checkpointNumber, runnerNumber, overrides = {}) => ({
  raceId,
  checkpointNumber,
  number: runnerNumber,
  commonTime: null,
  status: 'not-started',
  notes: '',
  ...overrides,
});

/**
 * Create a test deleted entry
 * @param {string} raceId - Race ID
 * @param {string} entryType - Type of entry (runner, checkpoint, etc.)
 * @param {Object} overrides - Custom values
 * @returns {Object} Deleted entry object
 */
export const createTestDeletedEntry = (raceId, entryType, overrides = {}) => ({
  raceId,
  entryType,
  deletedAt: new Date().toISOString(),
  restorable: true,
  ...overrides,
});

/**
 * Create a test strapper call
 * @param {string} raceId - Race ID
 * @param {number} checkpoint - Checkpoint number
 * @param {Object} overrides - Custom values
 * @returns {Object} Strapper call object
 */
export const createTestStrapperCall = (raceId, checkpoint, overrides = {}) => ({
  raceId,
  checkpoint,
  status: 'pending',
  priority: 'normal',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a test audit log entry
 * @param {string} raceId - Race ID
 * @param {string} entityType - Type of entity
 * @param {string} action - Action performed
 * @param {Object} overrides - Custom values
 * @returns {Object} Audit log object
 */
export const createTestAuditLog = (raceId, entityType, action, overrides = {}) => ({
  raceId,
  entityType,
  action,
  performedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a test withdrawal record
 * @param {string} raceId - Race ID
 * @param {number} runnerNumber - Runner number
 * @param {number} checkpoint - Checkpoint number
 * @param {Object} overrides - Custom values
 * @returns {Object} Withdrawal record object
 */
export const createTestWithdrawalRecord = (raceId, runnerNumber, checkpoint, overrides = {}) => ({
  raceId,
  runnerNumber,
  checkpoint,
  withdrawalTime: new Date().toISOString(),
  reversedAt: null,
  ...overrides,
});

/**
 * Create a test vet out record
 * @param {string} raceId - Race ID
 * @param {number} runnerNumber - Runner number
 * @param {number} checkpoint - Checkpoint number
 * @param {Object} overrides - Custom values
 * @returns {Object} Vet out record object
 */
export const createTestVetOutRecord = (raceId, runnerNumber, checkpoint, overrides = {}) => ({
  raceId,
  runnerNumber,
  checkpoint,
  vetOutTime: new Date().toISOString(),
  ...overrides,
});

/**
 * Generate a complete test dataset with specified size
 * @param {string} size - Dataset size: 'tiny', 'small', 'medium', 'large', 'xlarge'
 * @returns {Object} Complete dataset with race, runners, checkpoints, etc.
 */
export const generateTestDataset = (size = 'small') => {
  const sizes = {
    tiny: { runners: 5, checkpoints: 1 },
    small: { runners: 10, checkpoints: 2 },
    medium: { runners: 100, checkpoints: 4 },
    large: { runners: 1000, checkpoints: 6 },
    xlarge: { runners: 2000, checkpoints: 8 },
  };

  const config = sizes[size] || sizes.small;
  const { runners: runnerCount, checkpoints: checkpointCount } = config;

  // Create race
  const race = createTestRace({
    name: `Test Race ${size.toUpperCase()}`,
    minRunner: 1,
    maxRunner: runnerCount,
  });

  // Generate runners
  const runners = Array.from({ length: runnerCount }, (_, i) => 
    createTestRunner(null, i + 1) // raceId will be set after race is created
  );

  // Generate checkpoints
  const checkpoints = Array.from({ length: checkpointCount }, (_, i) => 
    createTestCheckpoint(null, i + 1, `Checkpoint ${i + 1}`)
  );

  return { race, runners, checkpoints, config };
};

/**
 * Generate edge case test data
 * @returns {Object} Collection of edge case test data
 */
export const createEdgeCaseData = () => ({
  // Empty strings
  emptyStrings: createTestRunner('race-1', 1, { 
    notes: '' 
  }),
  
  // Special characters
  specialChars: createTestRunner('race-1', 2, { 
    notes: "Runner with O'Neill & Müller-Schmidt" 
  }),
  
  // Maximum length strings (typical database limits)
  maxLength: createTestRunner('race-1', 3, { 
    notes: 'A'.repeat(1000) 
  }),
  
  // Unicode characters
  unicode: createTestRunner('race-1', 4, { 
    notes: '🏃‍♂️ Runner from 日本 (Japan)' 
  }),
  
  // Null values
  nullValues: createTestRunner('race-1', 5, {
    recordedTime: null,
    notes: null,
  }),
  
  // Boundary numbers
  boundaryNumbers: {
    minRunner: createTestRunner('race-1', 1),
    maxRunner: createTestRunner('race-1', 9999),
  },
  
  // Special timestamps
  timestamps: {
    past: createTestRace({ date: '2020-01-01' }),
    future: createTestRace({ date: '2030-12-31' }),
    today: createTestRace({ date: new Date().toISOString().split('T')[0] }),
  },
});

/**
 * Generate realistic race scenario data
 * @param {string} raceId - Race ID
 * @returns {Object} Realistic race scenario with various statuses
 */
export const generateRealisticScenario = (raceId) => {
  const runners = [
    // Finished runners
    ...Array.from({ length: 50 }, (_, i) => 
      createTestRunner(raceId, i + 1, { 
        status: 'passed',
        recordedTime: new Date(Date.now() - (i * 60000)).toISOString() // Staggered finish times
      })
    ),
    // In progress
    ...Array.from({ length: 30 }, (_, i) => 
      createTestRunner(raceId, i + 51, { 
        status: 'not-started' 
      })
    ),
    // DNF
    ...Array.from({ length: 10 }, (_, i) => 
      createTestRunner(raceId, i + 81, { 
        status: 'dnf',
        notes: 'Did not finish'
      })
    ),
    // Non-starters
    ...Array.from({ length: 10 }, (_, i) => 
      createTestRunner(raceId, i + 91, { 
        status: 'non-starter',
        notes: 'Did not start'
      })
    ),
  ];

  const checkpoints = [
    createTestCheckpoint(raceId, 1, 'Start'),
    createTestCheckpoint(raceId, 2, 'Mile 10'),
    createTestCheckpoint(raceId, 3, 'Mile 20'),
    createTestCheckpoint(raceId, 4, 'Finish'),
  ];

  return { runners, checkpoints };
};

/**
 * Generate corrupted data for error handling tests
 * @returns {Object} Collection of corrupted data scenarios
 */
export const generateCorruptedData = () => ({
  // Missing required fields
  missingRaceId: createTestRunner(null, 1),
  missingRunnerNumber: createTestRunner('race-1', null),
  
  // Invalid data types
  invalidNumber: createTestRunner('race-1', 'not-a-number'),
  invalidDate: createTestRace({ date: 'not-a-date' }),
  
  // Out of range values
  negativeNumber: createTestRunner('race-1', -1),
  zeroNumber: createTestRunner('race-1', 0),
  
  // Duplicate keys (for unique constraint testing)
  duplicate: {
    runner1: createTestRunner('race-1', 100),
    runner2: createTestRunner('race-1', 100), // Same race and number
  },
});
