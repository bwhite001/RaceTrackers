/**
 * Test Data Seeder for E2E Testing
 * Creates realistic test data for Race Tracker Pro
 */

import db from '../../src/shared/services/database/schema.js';

/**
 * Test Race Configuration
 */
export const TEST_RACE_CONFIG = {
  name: "Mountain Trail 100K - Test Race",
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  startTime: "06:00",
  checkpoints: [
    { number: 1, name: "Mile 10 - First Aid" },
    { number: 2, name: "Mile 25 - Mountain Pass" },
    { number: 3, name: "Mile 40 - Valley Station" }
  ],
  runnerRanges: [
    { start: 100, end: 150 },  // 51 runners
    { start: 200, end: 225 },  // 26 runners
    { start: 300, end: 310 }   // 11 runners
  ]
};

/**
 * Calculate total runners from ranges
 */
function calculateTotalRunners(ranges) {
  return ranges.reduce((total, range) => {
    return total + (range.end - range.start + 1);
  }, 0);
}

/**
 * Generate runner numbers from ranges
 */
function generateRunnerNumbers(ranges) {
  const numbers = [];
  ranges.forEach(range => {
    for (let i = range.start; i <= range.end; i++) {
      numbers.push(i);
    }
  });
  return numbers;
}

/**
 * Seed Race Configuration
 */
export async function seedRaceConfiguration() {
  console.log('🌱 Seeding race configuration...');
  
  try {
    // Create race
    const raceId = await db.races.add({
      name: TEST_RACE_CONFIG.name,
      date: TEST_RACE_CONFIG.date,
      startTime: TEST_RACE_CONFIG.startTime,
      minRunner: Math.min(...TEST_RACE_CONFIG.runnerRanges.map(r => r.start)),
      maxRunner: Math.max(...TEST_RACE_CONFIG.runnerRanges.map(r => r.end)),
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Race created with ID: ${raceId}`);

    // Create checkpoints
    for (const checkpoint of TEST_RACE_CONFIG.checkpoints) {
      await db.checkpoints.add({
        raceId,
        number: checkpoint.number,
        name: checkpoint.name
      });
    }

    console.log(`✅ Created ${TEST_RACE_CONFIG.checkpoints.length} checkpoints`);

    // Generate runner numbers
    const runnerNumbers = generateRunnerNumbers(TEST_RACE_CONFIG.runnerRanges);
    
    // Create runner records
    for (const number of runnerNumbers) {
      await db.runners.add({
        raceId,
        number,
        status: 'not_started',
        recordedTime: null,
        notes: ''
      });
    }

    console.log(`✅ Created ${runnerNumbers.length} runner records`);

    return {
      raceId,
      runnerNumbers,
      totalRunners: runnerNumbers.length
    };
  } catch (error) {
    console.error('❌ Error seeding race configuration:', error);
    throw error;
  }
}

/**
 * Seed Checkpoint Data
 * Simulates runners passing through checkpoints
 */
export async function seedCheckpointData(raceId, checkpointNumber, runnerCount = 20) {
  console.log(`🌱 Seeding checkpoint ${checkpointNumber} data...`);
  
  try {
    const runners = await db.runners.where({ raceId }).toArray();
    const selectedRunners = runners.slice(0, runnerCount);
    
    const baseTime = new Date();
    baseTime.setHours(6, 15, 0, 0); // Start at 6:15 AM
    
    for (let i = 0; i < selectedRunners.length; i++) {
      const runner = selectedRunners[i];
      const markOffTime = new Date(baseTime.getTime() + (i * 30000)); // 30 seconds apart
      
      await db.checkpoint_runners.add({
        raceId,
        checkpointNumber,
        number: runner.number,
        markOffTime: markOffTime.toISOString(),
        callInTime: null,
        status: 'marked',
        notes: ''
      });
    }

    console.log(`✅ Marked ${selectedRunners.length} runners at checkpoint ${checkpointNumber}`);
    
    return selectedRunners.map(r => r.number);
  } catch (error) {
    console.error(`❌ Error seeding checkpoint ${checkpointNumber} data:`, error);
    throw error;
  }
}

/**
 * Seed Base Station Finish Times
 */
export async function seedBaseStationData(raceId, finisherCount = 30) {
  console.log('🌱 Seeding base station finish times...');
  
  try {
    const runners = await db.runners.where({ raceId }).toArray();
    const finishers = runners.slice(0, finisherCount);
    
    const baseTime = new Date();
    baseTime.setHours(8, 30, 0, 0); // Finishes start at 8:30 AM
    
    for (let i = 0; i < finishers.length; i++) {
      const runner = finishers[i];
      const finishTime = new Date(baseTime.getTime() + (i * 120000)); // 2 minutes apart
      
      await db.base_station_runners.add({
        raceId,
        checkpointNumber: 1, // Base station checkpoint
        number: runner.number,
        commonTime: finishTime.toISOString(),
        status: 'finished',
        notes: i % 5 === 0 ? 'Strong finish' : ''
      });

      // Update runner status
      await db.runners.update(runner.id, {
        status: 'finished',
        recordedTime: finishTime.toISOString()
      });
    }

    console.log(`✅ Recorded ${finishers.length} finish times`);
    
    return finishers.map(r => r.number);
  } catch (error) {
    console.error('❌ Error seeding base station data:', error);
    throw error;
  }
}

/**
 * Seed Status Changes (Withdrawals, Vet Outs, DNFs)
 */
export async function seedStatusChanges(raceId) {
  console.log('🌱 Seeding status changes...');
  
  try {
    const runners = await db.runners.where({ raceId }).toArray();
    const statusRunners = runners.slice(50, 58); // Use runners 50-57 for status changes
    
    // Withdrawal
    const withdrawnRunner = statusRunners[0];
    await db.withdrawal_records.add({
      raceId,
      runnerNumber: withdrawnRunner.number,
      checkpoint: 2,
      withdrawalTime: new Date().toISOString(),
      reason: 'Personal reasons',
      comments: 'Family emergency - test data',
      reversedAt: null
    });
    await db.runners.update(withdrawnRunner.id, { status: 'withdrawn' });

    // Vet Out
    const vetOutRunner = statusRunners[1];
    await db.vet_out_records.add({
      raceId,
      runnerNumber: vetOutRunner.number,
      checkpoint: 3,
      vetOutTime: new Date().toISOString(),
      reason: 'Dehydration',
      vetName: 'Dr. Smith',
      notes: 'Advised to rest - test data'
    });
    await db.runners.update(vetOutRunner.id, { status: 'vet_out' });

    // DNF
    const dnfRunner = statusRunners[2];
    await db.runners.update(dnfRunner.id, { status: 'dnf' });

    // Non-Starter
    const nonStarterRunner = statusRunners[3];
    await db.runners.update(nonStarterRunner.id, { status: 'non_starter' });

    console.log('✅ Created status changes: 1 withdrawal, 1 vet out, 1 DNF, 1 non-starter');
    
    return {
      withdrawn: withdrawnRunner.number,
      vetOut: vetOutRunner.number,
      dnf: dnfRunner.number,
      nonStarter: nonStarterRunner.number
    };
  } catch (error) {
    console.error('❌ Error seeding status changes:', error);
    throw error;
  }
}

/**
 * Seed Audit Log Entries
 */
export async function seedAuditLog(raceId, entryCount = 50) {
  console.log('🌱 Seeding audit log...');
  
  try {
    const actions = [
      'data_entry',
      'withdrawal',
      'vet_out',
      'status_change',
      'checkpoint_mark',
      'deletion',
      'restoration'
    ];
    
    const baseTime = new Date();
    
    for (let i = 0; i < entryCount; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(baseTime.getTime() - (i * 60000)); // 1 minute apart, going back
      
      await db.audit_log.add({
        raceId,
        entityType: 'runner',
        action,
        performedAt: timestamp.toISOString(),
        details: `Test audit entry ${i + 1}`,
        userId: 'test_user'
      });
    }

    console.log(`✅ Created ${entryCount} audit log entries`);
  } catch (error) {
    console.error('❌ Error seeding audit log:', error);
    throw error;
  }
}

/**
 * Seed Strapper Calls
 */
export async function seedStrapperCalls(raceId) {
  console.log('🌱 Seeding strapper calls...');
  
  try {
    const calls = [
      {
        checkpoint: 1,
        status: 'pending',
        priority: 'high',
        type: 'medical_supplies',
        notes: 'Need additional bandages and ice packs'
      },
      {
        checkpoint: 2,
        status: 'complete',
        priority: 'medium',
        type: 'food_water',
        notes: 'Water resupply completed'
      },
      {
        checkpoint: 3,
        status: 'pending',
        priority: 'low',
        type: 'equipment',
        notes: 'Extra chairs needed for volunteers'
      }
    ];

    for (const call of calls) {
      await db.strapper_calls.add({
        raceId,
        ...call,
        createdAt: new Date().toISOString()
      });
    }

    console.log(`✅ Created ${calls.length} strapper calls`);
  } catch (error) {
    console.error('❌ Error seeding strapper calls:', error);
    throw error;
  }
}

/**
 * Seed Deleted Entries
 */
export async function seedDeletedEntries(raceId) {
  console.log('🌱 Seeding deleted entries...');
  
  try {
    const deletedEntries = [
      {
        entryType: 'checkpoint_runner',
        deletedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        restorable: true,
        originalData: JSON.stringify({
          raceId,
          checkpointNumber: 1,
          number: 999,
          markOffTime: new Date().toISOString()
        })
      },
      {
        entryType: 'base_station_runner',
        deletedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        restorable: false,
        originalData: JSON.stringify({
          raceId,
          number: 998,
          commonTime: new Date().toISOString()
        })
      }
    ];

    for (const entry of deletedEntries) {
      await db.deleted_entries.add({
        raceId,
        ...entry
      });
    }

    console.log(`✅ Created ${deletedEntries.length} deleted entries`);
  } catch (error) {
    console.error('❌ Error seeding deleted entries:', error);
    throw error;
  }
}

/**
 * Clear All Test Data
 */
export async function clearAllTestData() {
  console.log('🧹 Clearing all test data...');
  
  try {
    await db.races.clear();
    await db.runners.clear();
    await db.checkpoints.clear();
    await db.checkpoint_runners.clear();
    await db.base_station_runners.clear();
    await db.deleted_entries.clear();
    await db.strapper_calls.clear();
    await db.audit_log.clear();
    await db.withdrawal_records.clear();
    await db.vet_out_records.clear();
    
    console.log('✅ All test data cleared');
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    throw error;
  }
}

/**
 * Seed Complete Test Dataset
 * Creates a full race scenario with all data types
 */
export async function seedCompleteTestDataset() {
  console.log('🚀 Starting complete test data seeding...\n');
  
  try {
    // Clear existing data
    await clearAllTestData();
    
    // Seed race configuration
    const { raceId, runnerNumbers, totalRunners } = await seedRaceConfiguration();
    console.log(`\n📊 Race ID: ${raceId}, Total Runners: ${totalRunners}\n`);
    
    // Seed checkpoint data
    await seedCheckpointData(raceId, 1, 25); // 25 runners at checkpoint 1
    await seedCheckpointData(raceId, 2, 20); // 20 runners at checkpoint 2
    await seedCheckpointData(raceId, 3, 15); // 15 runners at checkpoint 3
    
    // Seed base station data
    await seedBaseStationData(raceId, 30); // 30 finishers
    
    // Seed status changes
    const statusChanges = await seedStatusChanges(raceId);
    
    // Seed audit log
    await seedAuditLog(raceId, 50);
    
    // Seed strapper calls
    await seedStrapperCalls(raceId);
    
    // Seed deleted entries
    await seedDeletedEntries(raceId);
    
    console.log('\n✅ Complete test dataset seeded successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Race ID: ${raceId}`);
    console.log(`   - Total Runners: ${totalRunners}`);
    console.log(`   - Checkpoint 1: 25 marked`);
    console.log(`   - Checkpoint 2: 20 marked`);
    console.log(`   - Checkpoint 3: 15 marked`);
    console.log(`   - Finishers: 30`);
    console.log(`   - Withdrawn: ${statusChanges.withdrawn}`);
    console.log(`   - Vet Out: ${statusChanges.vetOut}`);
    console.log(`   - DNF: ${statusChanges.dnf}`);
    console.log(`   - Non-Starter: ${statusChanges.nonStarter}`);
    console.log(`   - Audit Log Entries: 50`);
    console.log(`   - Strapper Calls: 3`);
    console.log(`   - Deleted Entries: 2\n`);
    
    return {
      raceId,
      runnerNumbers,
      totalRunners,
      statusChanges
    };
  } catch (error) {
    console.error('\n❌ Error seeding complete test dataset:', error);
    throw error;
  }
}

/**
 * Seed Minimal Test Dataset
 * Creates minimal data for quick testing
 */
export async function seedMinimalTestDataset() {
  console.log('🚀 Starting minimal test data seeding...\n');
  
  try {
    await clearAllTestData();
    
    const { raceId, runnerNumbers, totalRunners } = await seedRaceConfiguration();
    await seedCheckpointData(raceId, 1, 10);
    await seedBaseStationData(raceId, 5);
    
    console.log('\n✅ Minimal test dataset seeded successfully!\n');
    console.log(`   - Race ID: ${raceId}`);
    console.log(`   - Total Runners: ${totalRunners}`);
    console.log(`   - Checkpoint 1: 10 marked`);
    console.log(`   - Finishers: 5\n`);
    
    return { raceId, runnerNumbers, totalRunners };
  } catch (error) {
    console.error('\n❌ Error seeding minimal test dataset:', error);
    throw error;
  }
}

// Export for use in tests
export default {
  seedCompleteTestDataset,
  seedMinimalTestDataset,
  seedRaceConfiguration,
  seedCheckpointData,
  seedBaseStationData,
  seedStatusChanges,
  seedAuditLog,
  seedStrapperCalls,
  seedDeletedEntries,
  clearAllTestData,
  TEST_RACE_CONFIG
};
