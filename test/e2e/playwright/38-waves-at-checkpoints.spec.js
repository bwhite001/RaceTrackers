/**
 * A race-office entry list where one event only passes some checkpoints
 * (Mt Glorious 2026: the 11 km runners are seen at CP4 only, and their bibs
 * sit in a gap in the 22 km range). Synthetic names — the real list is never
 * committed. Import auto-detects Race No / Name / Wave; base doesn't call the
 * 11 km field missed at CP1–3.
 */
import fs from 'fs';
import XLSX from 'xlsx';
import { test, expect } from './fixtures.js';

const BASE = 'http://localhost:3000';
const RACE_DAY = '2026-11-08';

/** Same columns and bib split as the 2026 entry list; the 11 km row comes first, as in the real file. */
function entryList(file) {
  const row = (no, event, wave) => ({
    Event: event, Name: `RUNNER${no}, Test`, 'Race No': no, Category: no % 2 ? 'M Open' : 'F Open',
    Gender: no % 2 ? 'Male' : 'Female', Age: 30, Team: '', Wave: wave,
  });
  const k11 = [...Array.from({ length: 52 }, (_, i) => 142 + i), 200].map(n => row(n, '11km', 'Wave 1'));
  const k22 = [...Array.from({ length: 141 }, (_, i) => 1 + i), 196, 197, 198, 199]
    .map(n => row(n, '22km', n <= 56 ? 'Championship' : 'Community'));
  const ws = XLSX.utils.json_to_sheet([k11[0], ...k22, ...k11.slice(1)]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Entries');
  XLSX.writeFile(wb, file);
}

test.use({ timezoneId: 'Australia/Brisbane' });

test.describe('Waves at checkpoints', () => {
  test('an 11 km field seen only at CP4 is not missed at CP1 to CP3', async ({ page, step }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.clock.install({ time: new Date(`${RACE_DAY}T07:40:00+10:00`) });
    const file = testInfo.outputPath('entry-list.xlsx');
    entryList(file);
    expect(fs.existsSync(file)).toBe(true);

    await step('Import the entry list — Race No, Name and Wave are picked up on their own', async () => {
      await page.goto(`${BASE}/race-maintenance/setup`);
      await page.getByRole('button', { name: /import from webscorer/i }).click();
      await page.locator('input[type="file"]').setInputFiles(file);
      await expect(page.getByText('198 rows loaded')).toBeVisible();
      const mapped = (col) => page.locator('tr', { has: page.locator('td', { hasText: new RegExp(`^${col}`) }) }).locator('select');
      await expect(mapped('Race No')).toHaveValue('number');
      await expect(mapped('Name')).toHaveValue('fullName');
      await expect(mapped('Wave')).toHaveValue('batchNumber');
      await expect(mapped('Category')).toHaveValue('ignore');
    });

    await step('Race details — four checkpoints', async () => {
      await page.getByRole('button', { name: /next: race details/i }).click();
      await page.getByPlaceholder(/BTM2026/).fill('Waves check');
      await page.locator('input[type="date"]').fill(RACE_DAY);
      await page.locator('input[type="time"]').first().fill('06:30');
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '+ Add checkpoint' }).click();
      await page.getByRole('button', { name: /next: confirm/i }).click();
      await page.getByRole('button', { name: 'Create Race (198 runners)' }).click();
      await page.waitForURL(/race-maintenance\/overview\?raceId=\d+/);
    });

    await step('Edit race — CP1 to CP3 see the two 22 km waves only', async () => {
      const raceId = new URL(page.url()).searchParams.get('raceId');
      await page.goto(`${BASE}/race-maintenance/edit?raceId=${raceId}`);
      await page.getByRole('button', { name: 'Next →' }).click();
      // Numbered in order of first appearance: the 11 km "Wave 1" row is first in the file
      await expect(page.getByText('Wave 1', { exact: true }).first()).toBeVisible();
      await expect(page.getByText(/^Wave [23] · Championship$/).first()).toBeVisible();
      await expect(page.getByText(/^Wave [23] · Community$/).first()).toBeVisible();
      for (const cp of [1, 2, 3]) {
        await page.getByLabel(`Checkpoint ${cp} wave 2`).check();
        await page.getByLabel(`Checkpoint ${cp} wave 3`).check();
        const row = page.getByLabel(`Checkpoint ${cp} wave 2`).locator('xpath=ancestor::div[contains(@class,"flex-wrap")][1]');
        await row.getByRole('button', { name: 'Save Waves' }).click();
        await expect(page.getByLabel(`Checkpoint ${cp} all waves`)).not.toBeChecked();
      }
    });

    await step('Base hears CP4 — 11 km bib 150 is not "Not seen CP3"; 22 km bib 10 is', async () => {
      await page.goto(`${BASE}/`);
      await page.getByRole('button', { name: /base station/i }).click();
      await page.getByRole('dialog').locator('button').filter({ has: page.locator('h3') }).first().click();
      await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 20000 });
      await page.getByRole('button', { name: /^CP4,/ }).click();
      await page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: /^07:30/ }).click();
      for (const n of [150, 10]) {
        await page.fill('#bib-heard', String(n));
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('rx-flash')).toContainText(`${n} added`);
      }
      const numbers = page.getByTestId('rx-numbers');
      await expect(numbers.getByRole('button', { name: 'Remove 10, Not seen CP3' })).toBeVisible();
      await expect(numbers.getByRole('button', { name: 'Remove 150', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /^(Complete|Log call) · \d+$/ }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
    });

    await step('Board — CP1 to CP3 have nobody missed except the 22 km runner', async () => {
      for (const cp of ['CP1', 'CP2', 'CP3']) {
        await expect(page.getByRole('button', { name: new RegExp(`^${cp},.*missed 10$`) })).toBeVisible();
      }
    });

    await step('Stand-down check CP1 — the 11 km runner is not on it', async () => {
      await page.getByRole('button', { name: 'Stand-down check CP1' }).click();
      const sheet = page.getByRole('dialog', { name: 'Stand-down check · CP1' });
      await expect(sheet.getByTestId('seen-further')).toContainText('10');
      await expect(sheet.getByTestId('seen-further')).not.toContainText('150');
      await expect(sheet.getByTestId('not-seen-past')).not.toContainText('142');
      await page.keyboard.press('Escape');
    });
  });
});
