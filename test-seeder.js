// test-seeder.js
// Script to seed a race for today with 2 checkpoints, starting at the start of the current hour.
// Usage: npm run seed:test

import { StorageService } from './src/services/storage.js';

async function seedRace() {
  const now = new Date();
  const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  const raceName = `Test Race ${now.toISOString().slice(0, 10)}`;

  const raceConfig = {
    name: raceName,
    date: now.toISOString().slice(0, 10),
    startTime: startOfHour.toISOString(),
    minRunner: 1,
    maxRunner: 10,
    checkpoints: [
      { number: 1, name: 'Checkpoint 1' },
      { number: 2, name: 'Checkpoint 2' }
    ]
  };

  try {
    const raceId = await StorageService.saveRace(raceConfig);
    console.log(`Seeded race: ${raceName} (ID: ${raceId})`);
  } catch (error) {
    console.error('Failed to seed race:', error);
    process.exit(1);
  }
}

seedRace();
