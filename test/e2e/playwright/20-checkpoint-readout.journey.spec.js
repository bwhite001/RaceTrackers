/**
 * Customer Journey: Checkpoint read-out for a busy block (VK4WIP redesign, Phase 3)
 *
 *   3. checkpoint-readout — 12 runners waiting → read-out in 3 overs (5, 5, 2);
 *      "Base copied — next" is locked until every number in the over is
 *      ticked; Reset clears the ticks; an interrupted read resumes at the
 *      same over; finishing marks the call sent.
 */

import { test, expect } from './fixtures.js';
import { seedRace } from './helpers.js';

const RACE = { name: 'Read-out Race', numCheckpoints: 1, runnerRange: { min: 100, max: 115 } };
const TWELVE = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111];

test.describe('Checkpoint — read-out', () => {
  test('busy block is read out in overs of five, each number ticked', async ({ page, step }) => {
    await seedRace(page, RACE);
    await page.goto('/checkpoint/1');
    await page.waitForSelector('#quick-entry-input', { timeout: 15000 });

    const nextBtn = () => page.getByRole('button', { name: /base copied — next|tick each number/i });
    const tick = (n) => page.getByRole('checkbox', { name: `Read out ${n}` });

    await step('Mark off — 12 runners arrive together', async () => {
      await page.fill('#quick-entry-input', TWELVE.join(', '));
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('markoff-status')).toContainText('12 runners marked');
    });

    await step('Callout sheet — call due, Read out', async () => {
      await page.getByRole('button', { name: /^Callout/ }).click();
      await expect(page.getByText(/call due — 12 waiting/i)).toBeVisible();
      await page.getByRole('button', { name: 'Read out' }).click();
      await expect(page.getByRole('heading', { name: 'Read-out' })).toBeVisible();
    });

    await step('Over 1 of 3 — five numbers, one row each; Next is locked', async () => {
      await expect(page.getByText('Over 1 of 3')).toBeVisible();
      await expect(page.getByText(/^Common time \d\d:\d\d$/)).toBeVisible();
      for (const n of TWELVE.slice(0, 5)) await expect(tick(n)).toBeVisible();
      await expect(nextBtn()).toBeDisabled();
      await expect(nextBtn()).toHaveText(/tick each number as you read · 0 of 5/i);
      await expect(page.getByText('Read next')).toBeVisible();
    });

    await step('Tick two, then Reset — ticks cleared for this over', async () => {
      await tick(100).check();
      await tick(101).check();
      await expect(nextBtn()).toHaveText(/2 of 5/);
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(page.getByText('Ticks cleared for this over')).toBeVisible();
      await expect(nextBtn()).toHaveText(/0 of 5/);
    });

    await step('Tick all five — Base copied — next unlocks', async () => {
      for (const n of TWELVE.slice(0, 5)) await tick(n).check();
      await expect(nextBtn()).toBeEnabled();
      await nextBtn().click();
      await expect(page.getByText('Over 2 of 3')).toBeVisible();
      await expect(page.getByText(/^Continuing \d\d:\d\d$/)).toBeVisible();
      await expect(page.getByText('5 of 12 copied by base')).toBeVisible();
    });

    await step('Interrupted — leave and come back, the read resumes at over 2', async () => {
      await tick(105).check();
      await page.getByRole('button', { name: 'Back to callout sheet' }).click();
      await page.getByRole('button', { name: 'Read out' }).click();
      await expect(page.getByText('Over 2 of 3')).toBeVisible();
      await expect(tick(105)).toBeChecked();
      await expect(page.getByText(/resumed at over 2/i)).toBeVisible();
    });

    await step('Finish overs 2 and 3 — all 12 copied, call marked sent', async () => {
      for (const n of TWELVE.slice(5, 10)) await tick(n).check();
      await nextBtn().click();
      await expect(page.getByText('Over 3 of 3')).toBeVisible();
      for (const n of TWELVE.slice(10)) await tick(n).check();
      await nextBtn().click();
      await expect(page.getByText('All 12 copied')).toBeVisible();
      await page.getByRole('button', { name: 'Back to callout', exact: true }).click();
      await expect(page.getByText('Nothing to call in')).toBeVisible();
    });
  });
});
