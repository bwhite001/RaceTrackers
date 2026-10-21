/**
 * Race-day safety fixes (validation Phase A — A1 to A5).
 */
import { test, expect } from './fixtures.js';
import { seedRace } from './helpers.js';

const RACE = { name: 'Race Day Safety', numCheckpoints: 2, runnerRange: { min: 100, max: 129 } };

/** Add base records directly: [{ cp, bibs, minutesAgo, manual }] (block times relative to now). */
const seedBase = (page, raceId, rows) => page.evaluate(async ({ raceId, rows }) => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open('RaceTrackerDB'); r.onsuccess = e => res(e.target.result); r.onerror = rej; });
  const blk = (m) => { const d = new Date(Date.now() - m * 60000); d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0); return d.toISOString(); };
  await new Promise((res, rej) => {
    const tx = db.transaction('base_station_runners', 'readwrite');
    const s = tx.objectStore('base_station_runners');
    for (const { cp, bibs, minutesAgo } of rows) {
      for (const number of bibs) s.add({ raceId, checkpointNumber: cp, number, status: 'passed', commonTime: blk(minutesAgo), markOffEntryTime: new Date().toISOString(), notes: null });
    }
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}, { raceId, rows });

const blockLabel = (page, minutesAgo) => page.evaluate((m) => {
  const d = new Date(Date.now() - m * 60000);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}, minutesAgo);

const openBase = async (page) => {
  await page.goto('/base-station/operations');
  await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
};
const add = async (page, nums) => { for (const n of nums) { await page.fill('#bib-heard', String(n)); await page.keyboard.press('Enter'); } };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

test.describe('Race-day safety', () => {
  test('overdue waits for the checkpoint to report', async ({ page, step }) => {
    const raceId = await seedRace(page, RACE);
    // CP1 an hour ago for 100–114; 100–104 reached CP2 half an hour ago (median split 30 min).
    await seedBase(page, raceId, [{ cp: 1, bibs: range(100, 114), minutesAgo: 60 }, { cp: 2, bibs: range(100, 104), minutesAgo: 30 }]);

    await step('Overview — CP2 is only behind on calls: gold note, no red alert', async () => {
      await openBase(page);
      await page.getByRole('tab', { name: 'Overview' }).click();
      await expect(page.getByTestId('awaiting-report')).toContainText(/CP2 hasn't reported past \d\d:\d\d · 10 expected/);
      await expect(page.getByRole('alert')).toHaveCount(0);
    });

    await step('CP2 calls in up to now without those runners — now they are overdue', async () => {
      await page.getByRole('tab', { name: 'Receive' }).click();
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await page.getByRole('group', { name: 'Common time block' }).getByRole('button').last().click();
      await add(page, [120]);
      await page.getByRole('button', { name: /^Complete · 1$/ }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
      await page.getByRole('tab', { name: 'Overview' }).click();
      const alert = page.getByRole('alert');
      await expect(alert).toContainText('10 runners overdue at CP2');
      await expect(alert).toContainText('105');
    });
  });

  test('exact time does not move up-to', async ({ page, step }) => {
    await seedRace(page, RACE);
    await openBase(page);
    const early = await blockLabel(page, 30);
    const next = await blockLabel(page, 25);

    await step('CP1 call — two numbers at an earlier block and one at an exact recent time', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: new RegExp(`^${early}`) }).click();
      await add(page, [100, 101]);
      const exact = await page.evaluate(() => { const d = new Date(Date.now() - 2 * 60000); return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`; });
      await page.locator('#exact-time').fill(exact);
      await add(page, [102]);
      await page.getByRole('button', { name: /^Complete · 3$/ }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
    });

    await step('Board says up to the earlier block; the next call opens on the block after it', async () => {
      await expect(page.getByTestId('board-CP1')).toContainText(`Up to ${early}`);
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await expect(page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: new RegExp(`^${next}`) })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('same-block edit is not a correction', async ({ page, step }) => {
    await seedRace(page, RACE);
    await page.goto('/checkpoint/1');
    const tile = () => page.getByRole('button', { name: /^Runner 101,/ });
    const sheet = page.getByRole('dialog');

    await step('Mark 101, set it 10 minutes back, send it to base', async () => {
      await tile().click();
      await expect(tile()).toHaveAccessibleName(/\d\d:\d\d$/);
      await tile().click();
      await sheet.getByLabel('5 minutes earlier').click();
      await sheet.getByLabel('5 minutes earlier').click();
      await sheet.getByRole('button', { name: /^Save / }).click();
      await page.getByRole('button', { name: /^Callout/ }).click();
      await page.getByRole('button', { name: /base copied — mark sent/i }).click();
      await page.getByRole('button', { name: /^Mark off/ }).click();
      await expect(tile()).toHaveAccessibleName(/^Runner 101, ✓ \d\d:\d\d$/);
    });

    await step('Move the time by a minute inside the same block — no correction', async () => {
      const minute = Number((await tile().getAttribute('aria-label')).match(/:(\d\d)$/)[1]);
      await tile().click();
      await sheet.getByLabel(minute % 5 === 0 ? '1 minute later' : '1 minute earlier').click();
      await expect(sheet.getByTestId('same-block-note')).toBeVisible();
      await expect(sheet.getByTestId('correction-warning')).toHaveCount(0);
      await sheet.getByRole('button', { name: /^Save / }).click();
      await expect(page.getByTestId('markoff-status')).toHaveText('101 time changed — same common time, nothing to send');
      await expect(tile()).toHaveAccessibleName(/^Runner 101, ✓ /);
      await expect(page.getByLabel(/to call in$/)).toHaveCount(0);
    });

    await step('Move it into another block — now it is a correction', async () => {
      await tile().click();
      await sheet.getByLabel('5 minutes earlier').click();
      await expect(sheet.getByTestId('correction-warning')).toBeVisible();
      await sheet.getByRole('button', { name: /^Save / }).click();
      await page.getByRole('button', { name: /^Callout/ }).click();
      await expect(page.getByTestId('pending-block').getByText('Correction')).toBeVisible();
    });
  });

  test('on course count matches report', async ({ page, step }) => {
    const raceId = await seedRace(page, RACE);
    await seedBase(page, raceId, [{ cp: 1, bibs: range(100, 109), minutesAgo: 30 }, { cp: 0, bibs: [100], minutesAgo: 5 }]);
    await openBase(page);

    let onCourse; let notSeen;
    await step('Overview — On course tile with "not seen yet"', async () => {
      await page.getByRole('tab', { name: 'Overview' }).click();
      const tile = page.getByTestId('tile-on-course');
      onCourse = (await tile.locator('div').nth(1).innerText()).trim();
      notSeen = (await tile.innerText()).match(/(\d+) not seen yet/)[1];
      expect([onCourse, notSeen]).toEqual(['29', '20']);
    });

    await step('Reports — Still on course shows the same numbers', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await expect(page.getByRole('button', { name: /^Still on course/ })).toContainText(onCourse);
      await page.getByRole('button', { name: /^Still on course/ }).click();
      await expect(page.getByText('Not seen since start').locator('..')).toContainText(notSeen);
    });
  });

  test('matrix keeps times for DNS runners', async ({ page, step }) => {
    const raceId = await seedRace(page, RACE);
    await seedBase(page, raceId, [{ cp: 1, bibs: [101], minutesAgo: 40 }, { cp: 2, bibs: [101], minutesAgo: 20 }]);
    await openBase(page);
    const t1 = await blockLabel(page, 40);
    const t2 = await blockLabel(page, 20);

    await step('Mark 101 DNS (it was seen — flagged, applied anyway)', async () => {
      await page.getByRole('tab', { name: 'DNF / DNS' }).click();
      await page.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNS' }).click();
      await page.fill('#bulk-bibs', '101');
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Mark 1 as DNS' }).click();
    });

    await step('Times by checkpoint — times kept, DNS in the Status column, CSV matches', async () => {
      await page.getByRole('tab', { name: 'Reports' }).click();
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      const row = page.getByRole('row').filter({ hasText: /^101/ });
      await expect(row).toContainText('DNS');
      await expect(row).toContainText(t1);
      await expect(row).toContainText(t2);
      await expect(row.getByTitle('Recorded after DNS/DNF').first()).toBeVisible();
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'CSV' }).click()]);
      const csv = (await import('fs')).readFileSync(await dl.path(), 'utf8').split('\n');
      expect(csv[0]).toBe('Bib,Status,CP1,CP2,Finish');
      expect(csv.find(l => l.startsWith('101,'))).toBe(`101,DNS,${t1},${t2},—`);
    });
  });
});
