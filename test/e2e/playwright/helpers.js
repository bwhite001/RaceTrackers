/**
 * Playwright Shared Helpers & Fixtures
 * Reusable utilities for all customer journey tests.
 */

import { expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * Seed a race directly into IndexedDB without going through the setup wizard.
 *
 * ~200 ms vs ~30 s for createRace(). Safe for parallel workers because each
 * Playwright worker gets its own browser context with isolated IndexedDB.
 *
 * After seeding it navigates to the race overview so the Zustand store has
 * the race loaded — identical end-state to createRace().
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} opts
 * @param {string}  opts.name
 * @param {string}  opts.date          yyyy-MM-dd
 * @param {string}  opts.startTime     HH:mm
 * @param {number}  opts.numCheckpoints
 * @param {{ min: number, max: number }} opts.runnerRange
 * @returns {Promise<number>} raceId
 */
export async function seedRace(page, {
  name = 'E2E Seed Race',
  date = '2025-07-01',
  startTime = '07:00',
  numCheckpoints = 2,
  runnerRange = { min: 100, max: 115 },
} = {}) {
  // Navigate to app so Dexie initialises the schema before we touch the DB.
  await page.goto(BASE_URL);
  await page.waitForSelector('h1', { timeout: 15000 });

  const raceId = await page.evaluate(async (cfg) => {
    const { name, date, startTime, numCheckpoints, runnerRange } = cfg;

    const openDB = () => new Promise((res, rej) => {
      const req = indexedDB.open('RaceTrackerDB');
      req.onsuccess = e => res(e.target.result);
      req.onerror = () => rej(new Error('Cannot open RaceTrackerDB'));
    });

    const db = await openDB();

    // Clear all race-related tables so each test starts clean.
    const tablesToClear = [
      'races', 'runners', 'checkpoints', 'race_batches',
      'checkpoint_runners', 'base_station_runners',
      'withdrawal_records', 'audit_log',
    ];
    await new Promise((res, rej) => {
      const tx = db.transaction(tablesToClear, 'readwrite');
      tablesToClear.forEach(t => tx.objectStore(t).clear());
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    // Insert race row.
    const raceId = await new Promise((res, rej) => {
      const tx = db.transaction('races', 'readwrite');
      const req = tx.objectStore('races').add({
        name, date, startTime,
        minRunner: runnerRange.min,
        maxRunner: runnerRange.max,
        createdAt: new Date().toISOString(),
      });
      req.onsuccess = e => res(e.target.result);
      req.onerror = () => rej(req.error);
    });

    // Insert default batch.
    await new Promise((res, rej) => {
      const tx = db.transaction('race_batches', 'readwrite');
      const req = tx.objectStore('race_batches').add({
        raceId,
        batchNumber: 1,
        batchName: 'All Runners',
        startTime: `${date}T${startTime}:00`,
      });
      req.onsuccess = res;
      req.onerror = () => rej(req.error);
    });

    // Insert runners.
    await new Promise((res, rej) => {
      const tx = db.transaction('runners', 'readwrite');
      const store = tx.objectStore('runners');
      for (let n = runnerRange.min; n <= runnerRange.max; n++) {
        store.add({
          raceId, number: n, status: 'not-started',
          firstName: null, lastName: null, gender: 'X',
          batchNumber: 1, recordedTime: null, notes: null,
        });
      }
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    // Insert checkpoints.
    await new Promise((res, rej) => {
      const tx = db.transaction('checkpoints', 'readwrite');
      const store = tx.objectStore('checkpoints');
      for (let i = 1; i <= numCheckpoints; i++) {
        store.add({ raceId, number: i, name: `Checkpoint ${i}` });
      }
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    // Store currentRaceId in settings so CheckpointView/BaseStationView can load it.
    await new Promise((res, rej) => {
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'currentRaceId', value: raceId });
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    return raceId;
  }, { name, date, startTime, numCheckpoints, runnerRange });

  // Set selectedRaceForMode + currentRaceId in Zustand's persisted localStorage so
  // BaseStationView doesn't redirect to "/" when no race is selected.
  await page.evaluate((rid) => {
    const key = 'race-tracker-storage';
    const stored = JSON.parse(localStorage.getItem(key) || '{"state":{}}');
    stored.state = { ...stored.state, selectedRaceForMode: rid, currentRaceId: rid };
    localStorage.setItem(key, JSON.stringify(stored));
  }, raceId);

  // Navigate to race overview so the Zustand store loads this race —
  // same end-state as createRace() which also lands on overview.
  await page.goto(`${BASE_URL}/race-maintenance/overview?raceId=${raceId}`);
  await page.waitForURL(/race-maintenance\/overview/);
  // Wait for the race data to render (confirms loadRace() completed).
  await page.waitForSelector(`text=${name}`, { timeout: 10000 });

  return raceId;
}

/**
 * Set the value of a React-controlled input element.
 * Uses pressSequentially which types character-by-character with appropriate
 * delays, allowing React to process onChange between keystrokes.
 */
export async function fillReactInput(page, selector, value) {
  const locator = page.locator(selector);
  await locator.click({ clickCount: 3 }); // select all existing content
  await locator.pressSequentially(value, { delay: 30 });
}

/**
 * Navigate to the home page and wait for it to be ready.
 */
export async function goHome(page) {
  await page.goto(BASE_URL);
  // LandingPage starts with isLoading=true (skeleton cards shown) until getAllRaces resolves.
  // Wait for the module cards to appear (not just the heading, which is visible during loading too).
  await page.waitForSelector('button:has-text("Base Station")', { timeout: 30000 });
}

/**
 * Clear all IndexedDB databases and localStorage programmatically
 * so each journey starts from a clean slate.
 */
export async function clearAppData(page) {
  await page.goto(BASE_URL);
  await page.evaluate(async () => {
    if ('databases' in indexedDB) {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map(db => new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = resolve;
        req.onerror = resolve;
        req.onblocked = () => {
          // Proceed even if blocked; deletion will complete after page reload
          resolve();
        };
      })));
    }
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('h1:has-text("Race Tracker Pro")');
}

/**
 * Create a race via the setup form and return the race name used.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} opts
 * @param {string} opts.name
 * @param {string} opts.date  - yyyy-MM-dd
 * @param {string} opts.startTime - HH:mm
 * @param {number} opts.numCheckpoints
 * @param {{ min: number, max: number }} opts.runnerRange
 */
export async function createRace(page, {
  name = 'Test Race',
  date = '2025-06-15',
  startTime = '07:00',
  numCheckpoints = 2,
  runnerRange = { min: 100, max: 110 },
} = {}) {
  await page.goto(`${BASE_URL}/race-maintenance/setup`);

  // Step 0 — Template Selection (wizard now has a template step first)
  // Click "Start from Scratch" to skip templates and go to Race Details
  // Use locator with hasText filter for reliability
  const scratchBtn = page.locator('button').filter({ hasText: 'Start from Scratch' }).first();
  try {
    await scratchBtn.waitFor({ state: 'visible', timeout: 8000 });
    await scratchBtn.click();
    await page.waitForTimeout(300);
  } catch (_) {
    // Template step not present — already on Race Details
  }

  await page.waitForSelector('#name');
  // Wait for React to finish mounting and running effects
  await page.waitForTimeout(500);

  // Step 1 — Race Details
  // Use fillReactInput (pressSequentially) for text inputs to avoid stale-closure batching
  await fillReactInput(page, '#name', name);
  // Small wait between fields so React can process state updates
  await page.waitForTimeout(100);
  await page.fill('#date', date);
  await page.waitForTimeout(100);
  await page.fill('#startTime', startTime);
  await page.waitForTimeout(100);
  await page.selectOption('#numCheckpoints', String(numCheckpoints));
  // Wait for checkpoint name inputs to render after select change
  await page.waitForTimeout(400);

  // Fill in checkpoint names
  for (let i = 0; i < numCheckpoints; i++) {
    const cpSelector = `#checkpoint-${i}`;
    const cpInput = page.locator(cpSelector);
    if (await cpInput.isVisible()) {
      await fillReactInput(page, cpSelector, `Checkpoint ${i + 1}`);
      await page.waitForTimeout(100);
    }
  }

  const nextBtn = page.getByRole('button', { name: /next|continue/i });
  await nextBtn.click();

  // Step 2 — Runner Ranges
  await page.waitForSelector('#min');
  // Delete the default pre-loaded range (100-200)
  const removeBtn = page.getByRole('button', { name: /remove range/i }).first();
  if (await removeBtn.isVisible()) {
    await removeBtn.click();
    await page.waitForTimeout(200);
  }
  // Fill in the new range form
  await page.fill('#min', String(runnerRange.min));
  await page.waitForTimeout(100);
  await page.fill('#max', String(runnerRange.max));
  await page.waitForTimeout(100);
  // Add the range to the list
  await page.getByRole('button', { name: /add range/i }).click();
  await page.waitForTimeout(200);

  // Submit to Batches step
  const createBtn = page.getByRole('button', { name: /create race|save|finish|submit/i });
  await createBtn.click();

  // Step 3 — Batches/Waves (new step)
  // The "Create Race" from Runner Ranges goes to Batches step — click Create Race again
  const createBtn2 = page.getByRole('button', { name: /create race/i });
  if (await createBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createBtn2.click();
  }

  // Should redirect to race overview
  await page.waitForURL(/race-maintenance\/overview/);

  return name;
}

/**
 * Select a module from the home screen.
 * Opens the race-selection modal then picks the first available race.
 */
export async function selectModuleWithFirstRace(page, moduleTitle) {
  await goHome(page);
  await page.getByRole('button', { name: moduleTitle }).click();

  // Race selection modal
  const modal = page.getByRole('dialog');
  await modal.waitFor();

  // Click the first race card button (which contains an h3 with the race name)
  const firstRaceBtn = modal.locator('button').filter({ has: page.locator('h3') }).first();
  await firstRaceBtn.waitFor({ state: 'visible', timeout: 5000 });
  await firstRaceBtn.click();
}

/**
 * Wait for the race-selection modal and pick the first race listed.
 * Race cards are buttons containing an h3 element (filter buttons do not).
 */
export async function pickFirstRaceInModal(page) {
  const modal = page.getByRole('dialog');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  // Click the first race card button (which contains an h3 with the race name)
  const raceCard = modal.locator('button').filter({ has: page.locator('h3') }).first();
  await raceCard.waitFor({ state: 'visible', timeout: 5000 });
  await raceCard.click();
}

/**
 * Wait for the race-selection modal and pick a race by name.
 */
export async function pickRaceInModalByName(page, raceName) {
  const modal = page.getByRole('dialog');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  const raceCard = modal.locator('button').filter({ has: page.locator(`h3:has-text("${raceName}")`) });
  await raceCard.waitFor({ state: 'visible', timeout: 5000 });
  await raceCard.click();
}
