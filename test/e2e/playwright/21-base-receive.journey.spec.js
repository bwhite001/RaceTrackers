/**
 * Customer Journey: Base station receives radio calls (VK4WIP redesign, Phase 4)
 *
 *   5. base-receive-blocks — a behind checkpoint opens on its next unreceived
 *      block; add 5, Next block, add 5; switch back via "Also in this call";
 *      Complete; board updates; Undo the call. Run at tablet 1112×834 (no
 *      vertical page scroll) and phone 390×844.
 *   6. base-receive-validation — unknown bib, said twice, already logged, not
 *      seen at the previous checkpoint → chip states; only valid numbers recorded
 *   7. base-receive-actions — Clear block + Undo; Cancel call needs two taps
 */

import { test, expect } from './fixtures.js';
import { seedRace } from './helpers.js';

const RACE = { name: 'Base Receive Race', numCheckpoints: 2, runnerRange: { min: 100, max: 129 } };

/** Local HH:MM of the 5-minute block `minutesAgo` before now, computed in the page. */
const blockAgo = (page, minutesAgo) => page.evaluate((m) => {
  const d = new Date(Date.now() - m * 60000);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}, minutesAgo);

const openBase = async (page) => {
  await seedRace(page, RACE);
  await page.goto('/base-station/operations');
  await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
};

const add = async (page, nums) => {
  for (const n of nums) {
    await page.fill('#bib-heard', String(n));
    await page.keyboard.press('Enter');
  }
};

const block = (page, hhmm) => page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: new RegExp(`^${hhmm}`) });
const chip = (page, n) => page.getByTestId('rx-numbers').getByRole('button', { name: new RegExp(`^Remove ${n}\\b`) });

async function receiveBlocksJourney(page, step, { checkNoScroll }) {
  await openBase(page);
  const earlier = await blockAgo(page, 30);

  await step('Who\'s calling? — CP1 calls; take its 5 numbers at an earlier block', async () => {
    await page.getByRole('button', { name: /^CP1,/ }).click();
    await block(page, earlier).click();
    await add(page, [100, 101, 102, 103, 104]);
    await page.getByRole('button', { name: /^Complete · 5$/ }).click();
    await expect(page.getByText('5 recorded at CP1')).toBeVisible();
    await page.getByRole('button', { name: 'Next call' }).click();
    await expect(page.getByTestId('board-count-CP1')).toHaveText('5');
  });

  const nextBlock = await page.evaluate((hm) => {
    const [h, m] = hm.split(':').map(Number);
    const d = new Date(); d.setHours(h, m + 5, 0, 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, earlier);

  await step('CP1 calls again — receiving opens on its next unreceived block', async () => {
    await expect(page.getByTestId('board-CP1')).toContainText(`Up to ${earlier}`);
    await page.getByRole('button', { name: /^CP1,/ }).click();
    await expect(block(page, nextBlock)).toHaveAttribute('aria-pressed', 'true');
    await expect(block(page, earlier)).toContainText('done');
    if (checkNoScroll) {
      const scroll = await page.evaluate(() => document.scrollingElement.scrollHeight - window.innerHeight);
      expect(scroll).toBeLessThanOrEqual(0);
    }
  });

  await step('Add 5 numbers, Next block, add 5 more — the box shows only the current block', async () => {
    await add(page, [105, 106, 107, 108, 109]);
    await page.getByRole('button', { name: /^Next \d\d:\d\d →$/ }).click();
    await expect(page.getByTestId('rx-numbers')).toContainText(/No numbers at \d\d:\d\d yet/);
    await add(page, [110, 111, 112, 113, 114]);
    await expect(chip(page, 110)).toBeVisible();
    await expect(chip(page, 105)).toHaveCount(0);
  });

  await step('Also in this call — tap the earlier block to see its numbers again', async () => {
    await page.getByRole('button', { name: new RegExp(`Show the 5 numbers at ${nextBlock}`) }).click();
    await expect(chip(page, 105)).toBeVisible();
    await expect(chip(page, 110)).toHaveCount(0);
    if (checkNoScroll) {
      const scroll = await page.evaluate(() => document.scrollingElement.scrollHeight - window.innerHeight);
      expect(scroll).toBeLessThanOrEqual(0);
    }
  });

  await step('Complete — 10 recorded across two blocks; the board updates', async () => {
    await page.getByRole('button', { name: /^Complete · 10$/ }).click();
    await expect(page.getByText('10 recorded at CP1')).toBeVisible();
    await expect(page.getByText(/^Blocks \d\d:\d\d, \d\d:\d\d$/)).toBeVisible();
    await expect(page.getByTestId('board-count-CP1')).toHaveText('15');
  });

  await step('Undo — the call reopens and its records are removed', async () => {
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Call reopened')).toBeVisible();
    await expect(page.getByTestId('board-count-CP1')).toHaveText('5');
    await expect(page.getByRole('button', { name: /^Complete · 10$/ })).toBeVisible();
  });
}

test.describe('Base — receive (tablet 1112×834)', () => {
  test.use({ viewport: { width: 1112, height: 834 } });
  test('base receives a call in two blocks on a tablet without page scroll', async ({ page, step }) => {
    await receiveBlocksJourney(page, step, { checkNoScroll: true });
  });
});

test.describe('Base — receive (phone 390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('base receives a call in two blocks on a phone', async ({ page, step }) => {
    await receiveBlocksJourney(page, step, { checkNoScroll: false });
  });
});

test.describe('Base — receive checks and actions', () => {
  test('base receive flags unknown, repeated, already-logged and unseen numbers', async ({ page, step }) => {
    await openBase(page);

    await step('CP1 sends 100 and 101 — recorded', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await add(page, [100, 101]);
      await page.getByRole('button', { name: /^Complete · 2$/ }).click();
      await page.getByRole('button', { name: 'Next call' }).click();
    });

    await step('CP2 call — each number is checked as it is added', async () => {
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await add(page, [100, 999, 100, 120]);
      await expect(chip(page, 999)).toHaveAccessibleName('Remove 999, Not in race');
      await expect(chip(page, 100).nth(1)).toHaveAccessibleName('Remove 100, Said twice');
      await expect(chip(page, 120)).toHaveAccessibleName('Remove 120, Not seen CP1');
      await expect(chip(page, 100).first()).toHaveAccessibleName('Remove 100');
      await expect(page.getByText('2 to record')).toBeVisible();
    });

    await step('Complete — only the valid and not-seen numbers are recorded', async () => {
      await page.getByRole('button', { name: /^Complete · 2$/ }).click();
      await expect(page.getByText('2 recorded at CP2')).toBeVisible();
      await expect(page.getByText(/2 skipped \(flagged\)/)).toBeVisible();
      await page.getByRole('button', { name: 'Next call' }).click();
      await expect(page.getByTestId('board-count-CP2')).toHaveText('2');
    });

    await step('CP1 repeats 101 — already logged at this checkpoint', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await add(page, [101]);
      await expect(chip(page, 101)).toHaveAccessibleName(/^Remove 101, Had \d\d:\d\d$/);
      await expect(page.getByRole('button', { name: /^Complete · 0$/ })).toBeVisible();
    });
  });

  test('base clears a block with undo and cancels a call with two taps', async ({ page, step }) => {
    await openBase(page);

    await step('CP2 call — four numbers in the current block', async () => {
      await page.getByRole('button', { name: /^CP2,/ }).click();
      await add(page, [110, 111, 112, 113]);
      await expect(page.getByText('4 to record')).toBeVisible();
    });

    await step('Clear the block — then Undo brings the numbers back', async () => {
      await page.getByRole('button', { name: /^Clear \d\d:\d\d$/ }).click();
      await expect(page.getByTestId('rx-flash')).toHaveText(/Cleared 4 from \d\d:\d\d/);
      await expect(page.getByText('0 to record')).toBeVisible();
      await page.getByRole('button', { name: 'Undo' }).click();
      await expect(page.getByText('4 to record')).toBeVisible();
    });

    await step('Cancel call — the first tap asks to confirm', async () => {
      await page.getByRole('button', { name: 'Cancel call' }).click();
      await expect(page.getByRole('button', { name: 'Tap again to cancel' })).toBeVisible();
      await expect(page.getByTestId('rx-flash')).toHaveText('Cancel drops all 4 numbers in this call');
    });

    await step('Second tap — the call is dropped, nothing recorded', async () => {
      await page.getByRole('button', { name: 'Tap again to cancel' }).click();
      await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible();
      await expect(page.getByTestId('board-count-CP2')).toHaveText('0');
    });
  });
});
