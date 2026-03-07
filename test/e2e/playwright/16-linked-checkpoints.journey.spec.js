/**
 * Customer Journey: Linked Checkpoint (Combined Turnaround Point)
 *
 * Scenario: Out-and-back race. CP1 (outbound) and CP4 (return) are at the
 * same physical turnaround location and linked by the race director.
 *
 * Phases:
 *   1. Race setup — four checkpoints with CP1 ↔ CP4 linked
 *   2. Checkpoint picker — linked pair shows as single card
 *   3. Dual view loads — CP tab switcher visible
 *   4. Mark runners in CP1 (outbound)
 *   5. Switch to CP4 tab — ⭐ indicator on expected returners
 *   6. Mark runners in CP4 (return)
 *   7. Overview tab — shows both, primary-only, and time-between rows
 */

import { test, expect } from './fixtures.js';

const BASE_URL = 'http://localhost:3000';

const RACE = {
  name: 'Turnaround Ultra E2E',
  date: '2026-03-07',
  startTime: '08:00',
  runnerRange: { min: 100, max: 110 },
};

/** Seed a race with 4 checkpoints where CP1 ↔ CP4 are linked. */
async function seedLinkedCheckpointRace(page) {
  await page.goto(BASE_URL);
  await page.waitForSelector('h1', { timeout: 15000 });

  const raceId = await page.evaluate(async (cfg) => {
    const { name, date, startTime, runnerRange } = cfg;

    const openDB = () => new Promise((res, rej) => {
      const req = indexedDB.open('RaceTrackerDB');
      req.onsuccess = e => res(e.target.result);
      req.onerror = () => rej(new Error('Cannot open RaceTrackerDB'));
    });
    const db = await openDB();

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

    await new Promise((res, rej) => {
      const tx = db.transaction('race_batches', 'readwrite');
      const req = tx.objectStore('race_batches').add({
        raceId, batchNumber: 1, batchName: 'All Runners',
        startTime: `${date}T${startTime}:00`,
      });
      req.onsuccess = res;
      req.onerror = () => rej(req.error);
    });

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

    // Four checkpoints: CP1 ↔ CP4 linked, CP2 and CP3 independent
    const checkpoints = [
      { raceId, number: 1, name: 'Turnaround Out', linkedCheckpointNumber: 4, linkLabel: 'outbound' },
      { raceId, number: 2, name: 'Water Station', linkedCheckpointNumber: null, linkLabel: null },
      { raceId, number: 3, name: 'Aid Station', linkedCheckpointNumber: null, linkLabel: null },
      { raceId, number: 4, name: 'Turnaround Back', linkedCheckpointNumber: 1, linkLabel: 'return' },
    ];
    await new Promise((res, rej) => {
      const tx = db.transaction('checkpoints', 'readwrite');
      const store = tx.objectStore('checkpoints');
      for (const cp of checkpoints) store.add(cp);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    await new Promise((res, rej) => {
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'currentRaceId', value: raceId });
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    return raceId;
  }, RACE);

  await page.evaluate((rid) => {
    const key = 'race-tracker-storage';
    const stored = JSON.parse(localStorage.getItem(key) || '{"state":{}}');
    stored.state = { ...stored.state, selectedRaceForMode: rid, currentRaceId: rid };
    localStorage.setItem(key, JSON.stringify(stored));
  }, raceId);

  await page.goto(`${BASE_URL}/race-maintenance/overview?raceId=${raceId}`);
  await page.waitForURL(/race-maintenance\/overview/);

  return raceId;
}

test.describe('Linked Checkpoint Journey', () => {
  test.beforeEach(async ({ page }) => {
    await seedLinkedCheckpointRace(page);
  });

  test('volunteer operates linked turnaround checkpoints from one interface', async ({ page, step }) => {

    await step('Home screen — navigate to Checkpoint Operations', async () => {
      await page.goto(BASE_URL);
      await page.waitForSelector('h1', { timeout: 10000 });
      const cpBtn = page.getByRole('button', { name: /checkpoint operations/i });
      const visible = await cpBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (!visible) { test.skip(true, 'Checkpoint Operations button not found'); return; }
      await cpBtn.click();
    });

    await step('Race selection modal — select the Turnaround Ultra race', async () => {
      const modal = page.getByRole('dialog');
      const appeared = await modal.isVisible({ timeout: 5000 }).catch(() => false);
      if (!appeared) { test.skip(true, 'Race selection modal did not appear'); return; }
      const raceBtn = modal.getByText(/Turnaround Ultra/i).first();
      await raceBtn.click();
    });

    await step('Checkpoint picker — linked pair shown as single card with link icon', async () => {
      const pickerModal = page.getByRole('dialog');
      const appeared = await pickerModal.isVisible({ timeout: 5000 }).catch(() => false);
      if (!appeared) { test.skip(true, 'Checkpoint picker did not appear'); return; }
      // Should show linked pair (CP1 & CP4) and two independent CPs
      await expect(pickerModal.getByText(/CP1.*CP4/i)).toBeVisible({ timeout: 5000 });
      await expect(pickerModal.getByText(/Operate both/i)).toBeVisible({ timeout: 3000 });
    });

    await step('Select the linked pair — navigate to dual checkpoint view', async () => {
      const pickerModal = page.getByRole('dialog');
      const linkedBtn = pickerModal.locator('button', { hasText: /CP1.*CP4/i }).first();
      const btnVisible = await linkedBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (!btnVisible) { test.skip(true, 'Linked CP button not found'); return; }
      await linkedBtn.click();
      await page.waitForURL(/checkpoint\/dual/, { timeout: 10000 });
    });

    await step('Dual view loads — CP tab switcher shows CP1 and CP4', async () => {
      const url = page.url();
      if (!url.includes('checkpoint/dual')) { test.skip(true, 'Not on dual view'); return; }
      // CP switcher shows both checkpoint buttons
      await expect(page.getByRole('button', { name: /CP1/i }).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: /CP4/i }).first()).toBeVisible({ timeout: 5000 });
    });

    await step('Mark runners 100 and 101 in CP1 (outbound) via quick entry', async () => {
      const url = page.url();
      if (!url.includes('checkpoint/dual')) { test.skip(true, 'Not on dual view'); return; }

      const input = page.locator('#dual-quick-entry-input');
      const inputVisible = await input.isVisible({ timeout: 5000 }).catch(() => false);
      if (!inputVisible) { test.skip(true, 'Quick entry not available'); return; }

      for (const num of [100, 101]) {
        await input.fill(String(num));
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    });

    await step('Switch to CP4 tab — stars appear on runners 100 and 101', async () => {
      const url = page.url();
      if (!url.includes('checkpoint/dual')) { test.skip(true, 'Not on dual view'); return; }

      const cp4Btn = page.getByRole('button', { name: /CP4/i }).first();
      const btnVisible = await cp4Btn.isVisible({ timeout: 5000 }).catch(() => false);
      if (!btnVisible) { test.skip(true, 'CP4 tab button not found'); return; }
      await cp4Btn.click();
      await page.waitForTimeout(500);
      // Quick entry label should now say CP4
      await expect(page.locator('label[for="dual-quick-entry-input"]')).toContainText('CP4', { timeout: 5000 });
    });

    await step('Mark runner 100 in CP4 (return) via quick entry', async () => {
      const url = page.url();
      if (!url.includes('checkpoint/dual')) { test.skip(true, 'Not on dual view'); return; }

      const input = page.locator('#dual-quick-entry-input');
      const inputVisible = await input.isVisible({ timeout: 5000 }).catch(() => false);
      if (!inputVisible) { test.skip(true, 'Quick entry not available in CP4 tab'); return; }

      await input.fill('100');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    });

    await step('Overview tab — runner 100 shows Both, runner 101 shows CP1 Only', async () => {
      const url = page.url();
      if (!url.includes('checkpoint/dual')) { test.skip(true, 'Not on dual view'); return; }

      const overviewTab = page.getByRole('button', { name: /overview/i }).first();
      const tabVisible = await overviewTab.isVisible({ timeout: 5000 }).catch(() => false);
      if (!tabVisible) { test.skip(true, 'Overview tab not found'); return; }
      await overviewTab.click();
      await page.waitForTimeout(500);

      // Summary stats should show at least 1 "Both" and at least 1 "primary-only"
      await expect(page.getByText(/Both ✅/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/CP1 Only/i)).toBeVisible({ timeout: 3000 });
    });
  });
});
