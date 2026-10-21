/**
 * Customer Journey: Base station reports and data checks (VK4WIP redesign, Phase 6)
 *
 *   9. base-reports-checks — seed a duplicate and an out-of-order time;
 *      resolve both; the counts reach ✓ and stay resolved after a reload.
 *   Also: the four reports render (overdue, still on course, times, call log).
 */

import { test, expect } from './fixtures.js';
import { seedRace } from './helpers.js';

const RACE = { name: 'Reports Race', numCheckpoints: 2, runnerRange: { min: 100, max: 119 } };

const receive = async (page, cp, nums, blockIdx) => {
  await page.getByRole('button', { name: new RegExp(`^${cp},`) }).click();
  if (blockIdx != null) {
    await page.getByRole('group', { name: 'Common time block' }).getByRole('button').nth(blockIdx).click();
  }
  for (const n of nums) {
    await page.fill('#bib-heard', String(n));
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: /^Complete/ }).click();
  await page.getByRole('button', { name: 'Next call' }).click();
};

/** Two base records for the same bib at CP1 — what an imported or repeated call can leave. */
const seedDuplicate = (page, raceId) => page.evaluate(async (rid) => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open('RaceTrackerDB'); r.onsuccess = e => res(e.target.result); r.onerror = rej; });
  const t = (m) => new Date(Date.now() - m * 60000).toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction('base_station_runners', 'readwrite');
    const s = tx.objectStore('base_station_runners');
    s.add({ raceId: rid, checkpointNumber: 1, number: 105, status: 'passed', commonTime: t(20), markOffEntryTime: t(18) });
    s.add({ raceId: rid, checkpointNumber: 1, number: 105, status: 'passed', commonTime: t(10), markOffEntryTime: t(8) });
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}, raceId);

test.describe('Base — reports and data checks', () => {
  test('base resolves a duplicate and an out-of-order time until checks are clear', async ({ page, step }) => {
    const raceId = await seedRace(page, RACE);
    await seedDuplicate(page, raceId);
    await page.goto('/base-station/operations');
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });

    await step('Receive — CP1 now, then CP2 reports the same runner at an earlier block', async () => {
      await receive(page, 'CP1', [100]);
      await receive(page, 'CP2', [100], 0);
    });

    await step('Reports — Needs attention shows a duplicate and an out-of-order time', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await expect(page.getByTestId('check-count-dup')).toHaveText('1');
      await expect(page.getByTestId('check-count-order')).toHaveText('1');
    });

    await step('Duplicates — keep the first time; Undo brings it back; keep again', async () => {
      await page.getByRole('button', { name: /^Duplicates/ }).click();
      await expect(page.getByTestId('issue-row')).toContainText('CP1 — 2 times');
      await page.getByTestId('issue-row').getByRole('button', { name: /^Keep / }).first().click();
      await expect(page.getByTestId('check-count-dup')).toHaveText('✓');
      await expect(page.getByText('All sorted')).toBeVisible();
      await page.getByRole('button', { name: /^Undo 105: Keep / }).click();
      await expect(page.getByTestId('check-count-dup')).toHaveText('1');
      await page.getByTestId('issue-row').getByRole('button', { name: /^Keep / }).first().click();
      await expect(page.getByTestId('check-count-dup')).toHaveText('✓');
    });

    await step('Out of order — Mark checked; the check clears', async () => {
      await page.getByRole('button', { name: /^Out of order/ }).click();
      await expect(page.getByTestId('issue-row')).toContainText('CP2 before CP1');
      await page.getByRole('button', { name: 'Mark checked' }).click();
      await expect(page.getByTestId('check-count-order')).toHaveText('✓');
    });

    await step('Reload — resolved checks stay resolved', async () => {
      await page.reload();
      await page.getByRole('tab', { name: 'Reports' }).click();
      await expect(page.getByTestId('check-count-dup')).toHaveText('✓');
      await expect(page.getByTestId('check-count-order')).toHaveText('✓');
    });
  });

  test('base reports show still on course, times by checkpoint and the call log', async ({ page, step }) => {
    await seedRace(page, RACE);
    await page.goto('/base-station/operations');
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    await receive(page, 'CP1', [100, 101]);
    await receive(page, 'Finish', [100]);
    await page.getByRole('tab', { name: 'Reports' }).click();

    await step('Still on course — grouped by last checkpoint passed', async () => {
      await page.getByRole('button', { name: /^Still on course/ }).click();
      await expect(page.getByText('Last at CP1')).toBeVisible();
      await expect(page.getByText('Not seen since start')).toBeVisible();
    });

    await step('Times by checkpoint — one row per bib, CP1 … Finish', async () => {
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      await expect(page.getByRole('columnheader', { name: 'Finish' })).toBeVisible();
      await expect(page.getByRole('row').filter({ hasText: /^100/ })).toContainText(/\d\d:\d\d/);
    });

    await step('Call log — calls and numbers per checkpoint; CSV available', async () => {
      await page.getByRole('button', { name: /^Call log/ }).click();
      const cp1 = page.getByRole('row').filter({ hasText: /^CP1/ });
      await expect(cp1).toContainText('1');
      await expect(cp1).toContainText('2');
      await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible();
    });
  });
});
