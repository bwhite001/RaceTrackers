/**
 * Playwright Shared Helpers & Fixtures
 * Reusable utilities for all customer journey tests.
 */

import { expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

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
  // LandingPage starts with isLoading=true (spinner shown) until getAllRaces resolves.
  // Use a longer timeout to accommodate the initial IndexedDB query.
  await page.waitForSelector('h1:has-text("Race Tracker Pro")', { timeout: 30000 });
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

  // Submit
  const createBtn = page.getByRole('button', { name: /create race|save|finish|submit/i });
  await createBtn.click();

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
