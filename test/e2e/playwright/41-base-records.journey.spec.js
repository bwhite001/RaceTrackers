/**
 * Base Records: see every number base holds for a checkpoint, what's wrong
 * with them, and fix them — one at a time or a block at a time. Every change
 * keeps history and has Undo.
 *
 * CP2 is seeded with a duplicate (102), two missed runners (110, 111 seen at
 * CP3), a wrong number (999 heard on a call) and three other issues: 106 out
 * of order, 107 impossible pace, 147 recorded after DNS.
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';

/** Extra base data for CP2 on top of the seeded race (withBaseData). */
const seedCp2 = (page, raceId, extra = []) => page.evaluate(async ({ raceId, extra }) => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open('RaceTrackerDB'); r.onsuccess = e => res(e.target.result); r.onerror = rej; });
  const add = (store, val) => new Promise((res, rej) => { const q = db.transaction(store, 'readwrite').objectStore(store).add(val); q.onsuccess = e => res(e.target.result); q.onerror = () => rej(q.error); });
  const now = Date.now();
  const blk = (m) => { const d = new Date(now - m * 60000); d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0); return d.toISOString(); };
  const row = (cp, number, m) => add('base_station_runners', { raceId, checkpointNumber: cp, number, status: 'passed', commonTime: blk(m), markOffEntryTime: new Date(now - (m - 2) * 60000).toISOString(), notes: null });
  await row(2, 102, 25);                                   // duplicate at CP2
  await row(3, 110, 10); await row(3, 111, 10);            // seen at CP3, missed at CP2
  await add('checkpoint_runners', { raceId, checkpointNumber: 1, number: 147, status: 'non-starter', notes: null });
  await row(2, 147, 30);                                   // recorded after DNS
  await add('radio_calls', { raceId, checkpointNumber: 2, receivedAt: new Date(now - 22 * 60000).toISOString(), blocks: [{ time: blk(25), numbers: [999] }], recorded: [], skipped: [], rejected: [{ number: 999, reason: 'Not in setup', time: blk(25) }], undoneAt: null, replaced: [] });
  for (const n of extra) await row(2, n, 20);
}, { raceId, extra });

const openRecords = async (page) => {
  await page.getByRole('tab', { name: 'Receive' }).click();
  // The board row's Records button is there whether or not a call is open
  await page.getByRole('button', { name: 'Records CP2' }).click();
  await expect(page.getByRole('heading', { name: 'CP2 · Records' })).toBeVisible();
};
const chip = (page, n) => page.getByTestId('records-list').getByRole('button', { name: new RegExp(`^${n},`) });
const editor = (page) => page.getByTestId('record-editor');
const flash = (page) => page.getByTestId('records-flash');

test.describe('Base Records', () => {
  test('base fixes the numbers it recorded at a checkpoint', async ({ page, step }) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width: 1112, height: 834 });
    const raceId = await seedRace(page, BASE, { withBaseData: true });
    await seedCp2(page, raceId);
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });

    await step('CP2 header — Records shows how many need checking', async () => {
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await expect(page.getByRole('button', { name: 'Records, 7 to check' })).toBeVisible();
      await expect(page.getByTestId('records-badge')).toHaveText('7');
      await page.getByRole('button', { name: /^Records(, \d+ to check)?$/ }).click();
      await expect(page.getByRole('heading', { name: 'CP2 · Records' })).toBeVisible();
      await expect(page.getByTestId('records-sub')).toContainText('7 to check');
    });

    await step('Needs attention at CP2 — counts match, each filter shows only its numbers', async () => {
      await expect(page.getByTestId('records-count-dup')).toHaveText('1');
      await expect(page.getByTestId('records-count-missed')).toHaveText('2');
      await expect(page.getByTestId('records-count-wrong')).toHaveText('1');
      await expect(page.getByTestId('records-count-other')).toHaveText('3');
      const chips = page.getByTestId('record-chip');
      await page.getByRole('button', { name: 'Duplicate · 1' }).click();
      await expect(chips).toHaveCount(2);
      for (const label of await chips.evaluateAll(els => els.map(e => e.getAttribute('aria-label')))) expect(label).toMatch(/^102, .*Duplicate$/);
      await page.getByRole('button', { name: 'Missed · 2' }).click();
      await expect(chips).toHaveCount(2);
      await expect(chip(page, 110)).toBeVisible();
      await expect(chip(page, 111)).toBeVisible();
      await page.getByRole('button', { name: 'Wrong number · 1' }).click();
      await expect(chips).toHaveCount(1);
      await expect(chip(page, 999)).toHaveAttribute('aria-label', /Not in race/);
      await page.getByRole('button', { name: 'Other · 3' }).click();
      expect((await chips.evaluateAll(els => els.map(e => e.getAttribute('aria-label').split(',')[0]))).sort()).toEqual(['106', '107', '147']);
      await page.getByRole('button', { name: 'All', exact: true }).click();
    });

    await step('Change a time — Save is locked until a reason is picked', async () => {
      await chip(page, 101).click();
      await expect(editor(page).getByRole('button', { name: 'Time', pressed: true })).toBeVisible();
      await editor(page).getByRole('button', { name: 'Five minutes earlier' }).click();
      const to = await editor(page).getByTestId('record-time').textContent();
      await expect(editor(page).getByRole('button', { name: 'Pick a reason' })).toBeDisabled();
      await editor(page).getByRole('button', { name: 'Checkpoint correction' }).click();
      await editor(page).getByRole('button', { name: `Save · ${to}` }).click();
      await expect(flash(page)).toContainText(new RegExp(`^101 changed \\d\\d:\\d\\d → ${to}`));
      await expect(chip(page, 101)).toHaveAttribute('aria-label', `101, ✎ ${to}`);
    });

    await step('Undo restores the time exactly', async () => {
      await page.getByRole('button', { name: /^Undo 101 changed/ }).click();
      await expect(flash(page)).toContainText('Undone: 101 changed');
      await expect(chip(page, 101)).not.toHaveAttribute('aria-label', /✎/);
    });

    await step('Times by checkpoint and the call log show the correction', async () => {
      await chip(page, 101).click();
      await editor(page).getByRole('button', { name: 'Five minutes earlier' }).click();
      const to = await editor(page).getByTestId('record-time').textContent();
      await editor(page).getByRole('button', { name: 'Checkpoint correction' }).click();
      await editor(page).getByRole('button', { name: `Save · ${to}` }).click();
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      const r101 = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '101', exact: true }) });
      await expect(r101.getByRole('cell').nth(3)).toHaveText(to);
      await page.getByRole('button', { name: /^Call log/ }).click();
      const cp2 = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'CP2', exact: true }) });
      await expect(cp2.getByRole('cell').nth(3)).toHaveText('1');
      await expect(page.getByTestId('edits-CP2')).toContainText('checkpoint correction');
      await openRecords(page);
    });

    await step('Wrong number — change 999 to 129 (base typing error); 999 stays in history', async () => {
      await chip(page, 999).click();
      await expect(editor(page).getByRole('button', { name: 'Change number', pressed: true })).toBeVisible();
      await editor(page).getByLabel('Correct number').fill('129');
      await editor(page).getByRole('button', { name: 'Base typing error' }).click();
      await editor(page).getByRole('button', { name: 'Save · 129' }).click();
      await expect(flash(page)).toContainText('999 renumbered to 129');
      await expect(chip(page, 129)).toBeVisible();
      await expect(page.getByTestId('records-count-wrong')).toHaveText('✓');
      await page.getByLabel('Show history').check();
      await expect(chip(page, 999)).toHaveAttribute('aria-label', /Was 999 · now 129/);
      await page.getByLabel('Show history').uncheck();
    });

    await step('Select a block — every bib listed on its own row, moved together, then Undo', async () => {
      await page.getByRole('button', { name: 'Select', exact: true }).click();
      const card = page.getByTestId('records-group').filter({ has: page.getByRole('button', { name: /^100,/ }) });
      await card.getByRole('button', { name: 'Select block' }).click();
      const batch = page.getByTestId('batch-editor');
      const n = await batch.getByTestId('batch-rows').locator('> div').count();
      expect(n).toBeGreaterThan(3);
      for (const bib of [100, 103, 104]) await expect(batch.getByTestId('batch-rows')).toContainText(String(bib));
      await batch.getByRole('button', { name: 'Five minutes later' }).click();
      const to = await batch.getByTestId('batch-time').textContent();
      await batch.getByRole('button', { name: 'Other' }).click();
      await batch.getByRole('button', { name: `Move ${n} to ${to}` }).click();
      await expect(flash(page)).toContainText(`${n} numbers moved to ${to}`);
      await page.getByRole('button', { name: new RegExp(`^Undo ${n} numbers moved`) }).click();
      await expect(flash(page)).toContainText('Undone');
    });

    await step('Move three numbers to CP3, then Undo', async () => {
      await page.getByRole('button', { name: 'Select', exact: true }).click();
      for (const n of [103, 104, 105]) await chip(page, n).click();
      const batch = page.getByTestId('batch-editor');
      await expect(batch.getByRole('heading', { name: '3 selected' })).toBeVisible();
      await batch.getByRole('button', { name: 'Checkpoint', exact: true }).click();
      await batch.getByRole('button', { name: 'CP3', exact: true }).click();
      await batch.getByRole('button', { name: 'Base typing error' }).click();
      await batch.getByRole('button', { name: 'Move 3 to CP3' }).click();
      await expect(flash(page)).toContainText('3 numbers moved to CP3');
      // Now seen at CP1 and CP3 only, so Records lists it as missed here
      await expect(chip(page, 104)).toHaveAttribute('aria-label', /Missed · seen CP3/);
      await page.getByRole('button', { name: /^Undo 3 numbers moved/ }).click();
      await expect(chip(page, 104)).not.toHaveAttribute('aria-label', /Missed/);
    });

    await step('Remove a number takes two taps, and Undo puts it back', async () => {
      await chip(page, 108).click();
      await editor(page).getByRole('button', { name: 'Remove', exact: true }).click();
      await editor(page).getByRole('button', { name: 'Base typing error' }).click();
      await editor(page).getByRole('button', { name: 'Remove 108' }).click();
      await expect(editor(page).getByRole('button', { name: 'Tap again to remove' })).toBeVisible();
      await editor(page).getByRole('button', { name: 'Tap again to remove' }).click();
      await expect(flash(page)).toContainText('108 removed from CP2');
      await expect(chip(page, 108)).toHaveCount(0);
      await page.getByRole('button', { name: /^Undo 108 removed/ }).click();
      await expect(chip(page, 108)).toBeVisible();
    });

    await step('Missed runners — CP2 has 110; 111 not seen there', async () => {
      await chip(page, 110).click();
      await expect(editor(page).getByRole('button', { name: 'They have it', pressed: true })).toBeVisible();
      await editor(page).getByRole('button', { name: 'Five minutes earlier' }).click();
      await editor(page).getByRole('button', { name: /^Record at \d\d:\d\d$/ }).click();
      await expect(flash(page)).toContainText(/^110 recorded at \d\d:\d\d \(was missed\)/);
      await chip(page, 111).click();
      await editor(page).getByRole('button', { name: 'Not seen there' }).click();
      await editor(page).getByRole('button', { name: 'Confirm not seen' }).click();
      await expect(flash(page)).toContainText('111 confirmed not seen at CP2');
      await expect(page.getByTestId('records-count-missed')).toHaveText('✓');
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      const r111 = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '111', exact: true }) });
      await expect(r111.getByRole('cell').nth(3)).toHaveText('missed');
    });
  });

  test('Records fits the tablet with 150 numbers at one checkpoint', async ({ page, step }) => {
    await page.setViewportSize({ width: 1112, height: 834 });
    const raceId = await seedRace(page, BASE, { withBaseData: true });
    await seedCp2(page, raceId, Array.from({ length: 140 }, (_, i) => 300 + i));
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    await step('150 numbers at CP2 — the list scrolls inside its panel, the page does not', async () => {
      await openRecords(page);
      await expect(page.getByTestId('records-sub')).toContainText(/^1[45]\d numbers/);
      const fits = await page.evaluate(() => document.scrollingElement.scrollHeight <= window.innerHeight + 1);
      expect(fits).toBe(true);
      const list = page.getByTestId('records-list');
      expect(await list.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    });
  });
});
