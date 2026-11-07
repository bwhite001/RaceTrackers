/**
 * Base keeps a second copy of the race as a file: choose a folder once, then
 * every entry reaches the file after a pause, and a new device restores the
 * whole race from it — calls, DNF reasons and all.
 *
 * The folder picker is stood in by the browser's private file system (OPFS),
 * which gives the same kind of folder handle the real picker returns.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';

const readBackup = (page) => page.evaluate(async () => {
  const root = await navigator.storage.getDirectory();
  for await (const [name, handle] of root.entries()) {
    if (name.startsWith('race-backup-')) return { name, data: JSON.parse(await (await handle.getFile()).text()).data };
  }
  return null;
});

test.describe('Automatic file backup', () => {
  test('base backs the race up to a folder and a new device restores it', async ({ page, browser, step }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => { window.showDirectoryPicker = () => navigator.storage.getDirectory(); });
    await page.clock.install();
    await seedRace(page, BASE);
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    let backup;

    await step('File backup off — choose a folder once', async () => {
      await page.getByRole('button', { name: 'File backup off' }).click();
      const sheet = page.getByRole('dialog', { name: 'File backup' });
      await expect(sheet.getByText(/second copy of the whole race/i)).toBeVisible();
      await sheet.getByRole('button', { name: 'Choose folder…' }).click();
      await expect(sheet.getByText(/race-backup-Mt-Glorious-Mountain-Trails-/)).toBeVisible();
      await sheet.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('button', { name: /^Backed up \d\d:\d\d$/ })).toBeVisible();
    });

    await step('Take a CP1 call — 30 s later the file has it', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await page.fill('#bib-heard', '100');
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: /^Complete/ }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
      await expect(page.getByRole('button', { name: 'Backup due' })).toBeVisible();
      await page.clock.fastForward(31000);
      await expect(page.getByRole('button', { name: /^Backed up \d\d:\d\d$/ })).toBeVisible();
      backup = await readBackup(page);
      expect(backup.data.radioCalls).toHaveLength(1);
      expect(backup.data.baseStationRunners.map(r => r.number)).toContain(100);
    });

    await step('Withdraw a runner — the next backup has the DNF', async () => {
      await page.evaluate(() => document.activeElement?.blur());
      await page.keyboard.press('d');
      await page.locator('input#runnerNumber').fill('105');
      await page.getByRole('group', { name: 'Reason' }).getByRole('button').first().click();
      await page.getByRole('button', { name: 'Withdraw runner', exact: true }).click();
      await page.locator('input#runnerNumber').waitFor({ state: 'hidden' });
      await page.clock.fastForward(31000);
      await expect(page.getByRole('button', { name: /^Backed up \d\d:\d\d$/ })).toBeVisible();
      backup = await readBackup(page);
      expect(backup.data.withdrawalRecords.map(w => Number(w.runnerNumber))).toContain(105);
    });

    await step('Reload base — the folder is remembered and backing up continues', async () => {
      await page.reload();
      await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /^Backed up \d\d:\d\d$/ })).toBeVisible();
    });

    await step('A new device restores the file — call log and DNF come back', async () => {
      const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
      const other = await ctx.newPage();
      await other.goto(`${BASE}/race-management`);
      await other.getByRole('button', { name: /import race/i }).first().click();
      const dialog = other.getByRole('dialog', { name: /import.*export/i });
      await dialog.getByRole('button', { name: /import configuration/i }).click();
      const text = await page.evaluate(async (name) => {
        const root = await navigator.storage.getDirectory();
        return (await (await root.getFileHandle(name)).getFile()).text();
      }, backup.name);
      await dialog.locator('input[type="file"]').setInputFiles({ name: backup.name, mimeType: 'application/json', buffer: Buffer.from(text) });
      await expect(dialog.getByText(/file loaded successfully/i)).toBeVisible();
      await dialog.locator('button.btn-primary').click();
      await expect(dialog).toBeHidden({ timeout: 15000 });

      await other.goto(BASE);
      await other.getByRole('button', { name: /base station/i }).click();
      await other.getByRole('dialog').locator('button').filter({ has: other.locator('h3') }).first().click();
      await expect(other.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
      await other.getByRole('tab', { name: 'Reports' }).click();
      await other.getByRole('button', { name: /^Call log/ }).click();
      const cp1 = other.getByRole('row').filter({ has: other.getByRole('cell', { name: 'CP1', exact: true }) });
      await expect(cp1.getByRole('cell').nth(1)).toHaveText('1');
      await other.getByRole('tab', { name: 'DNF / DNS' }).click();
      await expect(other.getByTestId('out-row').filter({ hasText: '105' })).toBeVisible();
      await ctx.close();
    });
  });
});
