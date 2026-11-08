/**
 * Base keeps a crew & vehicle log for insurance: which car went to each
 * checkpoint, who was in it, when it left home and arrived. Kept on the base
 * device only — never in the race setup that goes to volunteers.
 *
 * The clock is fixed at 05:52 on race morning (start 06:30), so cars can
 * leave home before the start and Receive shows the crew pills.
 */
import fs from 'fs';
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';
const NOW = new Date('2026-11-08T05:52:00');

/** Tap a stepper button n times. */
const tap = async (scope, name, n) => { for (let i = 0; i < n; i++) await scope.getByRole('button', { name, exact: true }).click(); };

test.describe('Crew & vehicle log', () => {
  test('base logs the crews and vehicles going to each checkpoint', async ({ page, step }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1112, height: 834 });
    await page.clock.install({ time: NOW });
    await page.clock.pauseAt(NOW);
    const raceId = await seedRace(page, BASE);
    // Race morning: start at 06:30, still to come
    await page.evaluate(async (id) => {
      const db = await new Promise((res, rej) => { const r = indexedDB.open('RaceTrackerDB'); r.onsuccess = e => res(e.target.result); r.onerror = rej; });
      const store = db.transaction('races', 'readwrite').objectStore('races');
      const race = await new Promise(res => { store.get(id).onsuccess = e => res(e.target.result); });
      await new Promise(res => { db.transaction('races', 'readwrite').objectStore('races').put({ ...race, date: '2026-11-08', startTime: '06:30' }).onsuccess = res; });
    }, raceId);
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    const card = page.getByTestId('crew-card-CP3');
    const editor = page.getByTestId('vehicle-editor');

    await step('Crews tab — a card per checkpoint, Base first, nothing logged yet', async () => {
      await page.getByRole('tab', { name: 'Crews' }).click();
      await expect(page.getByRole('heading', { name: 'Crew & vehicle log' })).toBeVisible();
      await expect(page.getByTestId('crew-summary')).toHaveText('0 vehicles · 0 arrived · 0 on the way');
      await expect(page.getByTestId('crew-card-Base')).toBeVisible();
      await expect(card.getByTestId('crew-pill')).toHaveText('Nothing logged');
    });

    await step('Add a car to CP3 — rego, driver, passenger, left home 04:45 (before the start)', async () => {
      await card.getByRole('button', { name: '+ Vehicle to CP3' }).click();
      await expect(editor.getByRole('heading', { name: 'New vehicle · CP3' })).toBeVisible();
      await expect(editor.getByRole('button', { name: 'Enter rego' })).toBeDisabled();
      await editor.getByLabel('Car rego').fill('987pqr');
      await expect(editor.getByLabel('Car rego')).toHaveValue('987PQR');
      // The first person added drives; the next rides along
      await editor.getByLabel('Add a person').fill('VK4PMC');
      await editor.getByRole('button', { name: 'Add', exact: true }).click();
      await editor.getByLabel('Add a person').fill('VK4JBX');
      await editor.getByRole('button', { name: 'Add', exact: true }).click();
      await expect(editor.getByRole('button', { name: 'VK4PMC', pressed: true })).toBeVisible();
      await expect(editor.getByRole('button', { name: 'VK4JBX', pressed: true })).toBeVisible();
      await editor.getByRole('button', { name: 'Left home now' }).click();
      await tap(editor, 'Left home five minutes earlier', 13);
      await tap(editor, 'Left home one minute earlier', 2);
      await expect(editor.getByTestId('time-Left home')).toHaveText('04:45');
      // Arrived can't be before left home
      await editor.getByRole('button', { name: 'Arrived now' }).click();
      await tap(editor, 'Arrived five minutes earlier', 14);
      await expect(editor.getByRole('button', { name: 'Arrived before left' })).toBeDisabled();
      await editor.getByRole('button', { name: 'Clear Arrived' }).click();
      await editor.getByRole('button', { name: 'Save vehicle' }).click();
      await expect(page.getByTestId('crew-flash')).toHaveText('987PQR added to CP3');
    });

    await step('Add a second car to CP3 — more than one car can go to a checkpoint', async () => {
      await card.getByRole('button', { name: '+ Vehicle to CP3' }).click();
      await editor.getByLabel('Car rego').fill('321 JKL');
      // People already logged are offered as pills
      await expect(editor.getByRole('button', { name: 'VK4PMC' }).first()).toBeVisible();
      await editor.getByLabel('Add a person').fill('Alan B');
      await editor.getByRole('button', { name: 'Add', exact: true }).click();
      await editor.getByRole('button', { name: 'Left home now' }).click();
      await tap(editor, 'Left home five minutes earlier', 4);
      await editor.getByRole('button', { name: 'Save vehicle' }).click();
      await expect(card.getByTestId('crew-vehicle')).toHaveCount(2);
      await expect(card.getByTestId('crew-pill')).toHaveText('2 on the way');
      await expect(card).toContainText('Left home 04:45 · on the way');
      await expect(page.getByTestId('crew-summary')).toHaveText('2 vehicles · 0 arrived · 2 on the way');
    });

    await step('Operator radios in — Arrived now, one tap', async () => {
      await card.getByRole('button', { name: '987PQR arrived now' }).click();
      await expect(page.getByTestId('crew-flash')).toHaveText('987PQR arrived at CP3 05:52');
      await expect(card).toContainText('Left home 04:45 · arrived 05:52');
      await card.getByRole('button', { name: '321 JKL arrived now' }).click();
      await expect(card.getByTestId('crew-pill')).toHaveText('On site');
    });

    await step('Undo the last arrival — back on the way', async () => {
      await page.getByRole('button', { name: /^Undo 321 JKL arrived/ }).click();
      await expect(card.getByTestId('crew-pill')).toHaveText('1 on the way');
      await expect(page.getByTestId('crew-flash')).toHaveText(/^Undone: 321 JKL arrived/);
    });

    await step('Crews fit the tablet — no page scroll at 1112×834', async () => {
      const fits = await page.evaluate(() => document.scrollingElement.scrollHeight <= window.innerHeight + 1);
      expect(fits).toBe(true);
    });

    await step('From Receive, CP3 shows its crew on the way — Crew opens the same editor', async () => {
      await page.getByRole('tab', { name: 'Receive' }).click();
      const cp3 = page.getByRole('button', { name: /^CP3,/ });
      await expect(cp3.getByTestId('crew-status')).toHaveText('On the way');
      await cp3.click();
      await page.getByRole('button', { name: 'Crew', exact: true }).click();
      const sheet = page.getByRole('dialog', { name: 'Crew · CP3' });
      await sheet.getByRole('button', { name: /^Edit 987PQR/ }).click();
      const ed = page.getByTestId('vehicle-editor');
      await ed.getByLabel('Car rego').fill('987 PQS');
      await ed.getByRole('button', { name: 'Save vehicle' }).click();
      await expect(page.getByTestId('crew-flash')).toHaveText('987 PQS updated');
      await page.getByRole('button', { name: 'Undo 987 PQS updated' }).click();
      await expect(page.getByTestId('crew-flash')).toHaveText('Undone: 987 PQS updated');
      await expect(page.getByRole('dialog').getByTestId('crew-card-CP3')).toContainText('987PQR');
    });

    await step('Remove a vehicle takes two taps, and Undo brings it back', async () => {
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: /^Edit 321 JKL/ }).click();
      await dialog.getByRole('button', { name: 'Remove vehicle' }).click();
      await dialog.getByRole('button', { name: 'Tap again to remove vehicle' }).click();
      await expect(dialog.getByTestId('crew-vehicle')).toHaveCount(1);
      await dialog.getByRole('button', { name: 'Undo 321 JKL removed' }).click();
      await expect(dialog.getByTestId('crew-vehicle')).toHaveCount(2);
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    });

    await step('Reports — Crew & vehicle log for insurance, CSV has every vehicle', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await expect(page.getByTestId('crew-not-arrived')).toHaveText('1 not arrived');
      await page.getByRole('button', { name: /^Crew & vehicle log/ }).click();
      await expect(page.getByTestId('crew-report-title')).toContainText('Sun 8 Nov 2026 · Prepared by VK4WIP base');
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'CSV' }).click()]);
      const csv = fs.readFileSync(await dl.path(), 'utf8');
      expect(csv.split('\n')[0]).toBe('Checkpoint,Rego,Driver,Also in the car,Left home,Arrived,Left site,Home safe,Notes');
      expect(csv).toContain('CP3,321 JKL,Alan B,,05:32,,,,');
      expect(csv).toContain('CP3,987PQR,VK4PMC,VK4JBX,04:45,05:52,,,');
    });

    await step('The race setup shared with volunteers carries no crew or rego details', async () => {
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('button', { name: /share or import race config/i }).click();
      await page.evaluate(() => { navigator.canShare = undefined; window.open = () => null; });
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download' }).click()]);
      const text = fs.readFileSync(await dl.path(), 'utf8');
      expect(JSON.parse(text).data.crewVehicles).toBeUndefined();
      expect(text).not.toContain('987PQR');
      expect(text).not.toContain('Alan B');
    });
  });
});
