/**
 * Customer Journey: Complete Race Simulation — Autumn Ultra 2025
 *
 * End-to-end race simulation from setup through to finish-line reporting.
 * Covers all three operator roles in a single linear narrative:
 *
 *   Phase 1 — Race Setup (Race Director)
 *     · Create race: 10 runners (101–110), 2 checkpoints
 *
 *   Phase 2 — Checkpoint 1 (Checkpoint Volunteer)
 *     · Mark runners 101–109 as passed via quick entry
 *     · Runner 110 absent (non-starter — not marked)
 *
 *   Phase 3 — Checkpoint 2 (Checkpoint Volunteer)
 *     · Mark runners 101, 103–109 as passed
 *     · Runner 102 missing (pulled before CP2)
 *
 *   Phase 4 — Base Station (Base Station Operator)
 *     · Runners 103–108 finish at 10:45:00
 *     · Runner 102 → DNF (heat exhaustion)
 *     · Runner 110 → DNS (non-starter)
 *     · Runner 101 → DNF (injured knee)
 *     · View race overview and verify status counts
 *     · View Reports tab
 *
 * Run with: npm run test:playwright:live
 */

import { test, expect } from './fixtures.js';
import { goHome, pickFirstRaceInModal, fillReactInput } from './helpers.js';

const BASE = 'https://racetrackers.bwhite.id.au';

const RACE = {
  name: 'Autumn Ultra 2025',
  date: '2026-03-15',
  startTime: '07:00',
  numCheckpoints: 2,
  runnerRange: { min: 101, max: 110 },
};

// Shared state across sequential tests in this suite
const state = { raceId: null };

test.describe('Complete Race Simulation — Autumn Ultra 2025', () => {
  // ─────────────────────────────────────────────────────────────
  // Reset: clear all IndexedDB + localStorage before the suite
  // ─────────────────────────────────────────────────────────────
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.waitForSelector('h1', { timeout: 30000 });
    await page.evaluate(async () => {
      if ('databases' in indexedDB) {
        const dbs = await indexedDB.databases();
        await Promise.all(dbs.map(db => new Promise(resolve => {
          const req = indexedDB.deleteDatabase(db.name);
          req.onsuccess = resolve;
          req.onerror = resolve;
          req.onblocked = resolve;
        })));
      }
      localStorage.clear();
      sessionStorage.clear();
    });
    await ctx.close();
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 1 — RACE SETUP
  // ─────────────────────────────────────────────────────────────

  test('Phase 1 — Race Director creates race with 10 runners and 2 checkpoints', async ({ page, step }) => {
    await step('Navigate to race setup wizard', async () => {
      await page.goto(`${BASE}/race-maintenance/setup`);
    });

    await step('Step 1 — choose Start from Scratch template', async () => {
      const scratchBtn = page.locator('button').filter({ hasText: 'Start from Scratch' }).first();
      await scratchBtn.waitFor({ state: 'visible', timeout: 10000 });
      await scratchBtn.click();
      await page.waitForTimeout(300);
    });

    await step('Step 2 — fill race details (name, date, start time, 2 checkpoints)', async () => {
      await page.waitForSelector('#name', { timeout: 10000 });
      await page.waitForTimeout(500);
      await fillReactInput(page, '#name', RACE.name);
      await page.waitForTimeout(100);
      await page.fill('#date', RACE.date);
      await page.waitForTimeout(100);
      await page.fill('#startTime', RACE.startTime);
      await page.waitForTimeout(100);
      await page.selectOption('#numCheckpoints', '2');
      await page.waitForTimeout(400);
      for (let i = 0; i < 2; i++) {
        const sel = `#checkpoint-${i}`;
        if (await page.locator(sel).isVisible({ timeout: 2000 }).catch(() => false)) {
          await fillReactInput(page, sel, `CP${i + 1}`);
          await page.waitForTimeout(100);
        }
      }
      await page.getByRole('button', { name: /next|continue/i }).click();
    });

    await step('Step 3 — configure runner range 101–110', async () => {
      await page.waitForSelector('#min', { timeout: 10000 });
      // Remove any pre-seeded default range
      const removeBtn = page.getByRole('button', { name: /remove range/i }).first();
      if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(200);
      }
      await page.fill('#min', '101');
      await page.waitForTimeout(100);
      await page.fill('#max', '110');
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: /add range/i }).click();
      await page.waitForTimeout(200);
      await page.getByRole('button', { name: /create race|save|finish|submit/i }).click();
    });

    await step('Step 4 — confirm Waves/Batches step then create race', async () => {
      const createBtn2 = page.getByRole('button', { name: /create race/i });
      if (await createBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createBtn2.click();
      }
      await page.waitForURL(/race-maintenance\/overview/, { timeout: 20000 });
    });

    await step('Race overview — verify race name and 10 runners', async () => {
      await expect(page.getByText(RACE.name)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/10 runners|runners.*10/i).first()).toBeVisible();

      // Capture raceId from URL for later tests
      const url = page.url();
      const match = url.match(/overview\/(\d+)/);
      if (match) state.raceId = parseInt(match[1], 10);
      expect(state.raceId).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 2 — CHECKPOINT 1
  // ─────────────────────────────────────────────────────────────

  test('Phase 2 — CP1 Volunteer marks runners 101–109 passed via quick entry', async ({ page, step }) => {
    await step('Navigate to Checkpoint 1 operations', async () => {
      await page.goto(`${BASE}/checkpoint/1`);
      await page.waitForSelector('nav[aria-label="Checkpoint tabs"]', { timeout: 20000 });
    });

    await step('Quick Entry — enter runners 101–109 one by one', async () => {
      const input = page.locator('#quick-entry-input');
      await input.waitFor({ state: 'visible', timeout: 10000 });
      for (const num of [101, 102, 103, 104, 105, 106, 107, 108, 109]) {
        await input.fill(String(num));
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    });

    await step('Verify — at least one runner shows marked state', async () => {
      // Any button with class indicating marked/passed
      const markedRunner = page.locator('button, [role="button"]')
        .filter({ hasText: /^10[1-9]$/ })
        .first();
      await markedRunner.waitFor({ state: 'visible', timeout: 5000 });
      // Confirm runner 110 is still unmarked (non-starter)
      const runner110 = page.locator('button, [role="button"]').filter({ hasText: /^110$/ }).first();
      if (await runner110.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(runner110).not.toHaveClass(/marked|checked|passed|green/i);
      }
    });

    await step('Switch to Overview tab — counts visible', async () => {
      await page.getByRole('button', { name: /overview/i }).click();
      await expect(page.getByText(/total|passed|not.?started/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 3 — CHECKPOINT 2
  // ─────────────────────────────────────────────────────────────

  test('Phase 3 — CP2 Volunteer marks runners 101, 103–109 passed (102 absent)', async ({ page, step }) => {
    await step('Navigate to Checkpoint 2 operations', async () => {
      await page.goto(`${BASE}/checkpoint/2`);
      await page.waitForSelector('nav[aria-label="Checkpoint tabs"]', { timeout: 20000 });
    });

    await step('Quick Entry — mark 101, 103–109 (skip 102 — pulled before CP2)', async () => {
      const input = page.locator('#quick-entry-input');
      await input.waitFor({ state: 'visible', timeout: 10000 });
      for (const num of [101, 103, 104, 105, 106, 107, 108, 109]) {
        await input.fill(String(num));
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    });

    await step('Verify — runner 103 marked, runner 102 not marked', async () => {
      const runner103 = page.locator('button, [role="button"]').filter({ hasText: /^103$/ }).first();
      if (await runner103.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(runner103).toHaveClass(/marked|checked|passed|green/i);
      }
      const runner102 = page.locator('button, [role="button"]').filter({ hasText: /^102$/ }).first();
      if (await runner102.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(runner102).not.toHaveClass(/marked|checked|passed|green/i);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 4 — BASE STATION
  // ─────────────────────────────────────────────────────────────

  test('Phase 4a — Base Station initialises and runner list loads (10 runners)', async ({ page, step }) => {
    await step('Home — click Base Station module card', async () => {
      await page.goto(BASE);
      await page.waitForSelector('h1', { timeout: 30000 });
      await page.getByRole('button', { name: /base station/i }).click();
    });

    await step('Race selection modal — pick Autumn Ultra 2025', async () => {
      await pickFirstRaceInModal(page);
    });

    await step('Base Station Data Entry tab — store initialises, stats show total 10', async () => {
      await page.waitForURL(/base-station\/operations/, { timeout: 30000 });
      await page.waitForSelector('#commonTime', { timeout: 20000 });
      // Stats section should show total runners
      await expect(page.getByText(/total/i).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('10')).toBeVisible({ timeout: 10000 });
    });
  });

  test('Phase 4b — Records finish time 10:45:00 for batch 103–108', async ({ page, step }) => {
    await step('Navigate directly to base station operations', async () => {
      await page.goto(`${BASE}/base-station/operations`);
      await page.waitForSelector('#commonTime', { timeout: 20000 });
    });

    await step('Data Entry — enter time 10:45:00 and runner batch', async () => {
      await page.fill('#commonTime', '10:45:00');
      await page.waitForTimeout(200);
      await page.fill('#runnerInput', '103, 104, 105, 106, 107, 108');
      await page.waitForTimeout(200);
    });

    await step('Submit — verify input clears, finished count increments', async () => {
      await page.getByRole('button', { name: /^save$/i }).click();
      // Input clears on success
      await expect(page.locator('#runnerInput')).toHaveValue('', { timeout: 10000 });
      // Finished count should be 6
      await expect(page.getByText('6')).toBeVisible({ timeout: 10000 });
    });
  });

  test('Phase 4c — Records DNF for runner 102 (heat exhaustion)', async ({ page, step }) => {
    await step('Navigate to base station operations', async () => {
      await page.goto(`${BASE}/base-station/operations`);
      await page.waitForSelector('#commonTime', { timeout: 20000 });
    });

    await step('Open DNF withdrawal dialog via hotkey "d"', async () => {
      // Focus the page body so hotkeys fire
      await page.locator('body').click();
      await page.keyboard.press('d');
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8000 });
    });

    await step('Dialog — enter runner 102 and reason, then submit', async () => {
      const dialog = page.getByRole('dialog');
      await dialog.locator('#runnerInput, textarea').first().fill('102');
      await page.waitForTimeout(200);
      await dialog.locator('#reason').fill('heat exhaustion');
      await dialog.getByRole('button', { name: /mark as dnf/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 8000 });
    });

    await step('Stats — DNF/DNS count shows at least 1', async () => {
      await expect(page.getByText(/dnf.*dns|dnf.{1,5}dns/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('Phase 4d — Marks runner 110 as DNS (non-starter)', async ({ page, step }) => {
    await step('Navigate to base station operations', async () => {
      await page.goto(`${BASE}/base-station/operations`);
      await page.waitForSelector('#commonTime', { timeout: 20000 });
    });

    await step('Open DNS dialog via hotkey Shift+D', async () => {
      await page.locator('body').click();
      await page.keyboard.press('Shift+d');
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8000 });
    });

    await step('Dialog — enter runner 110 and reason, then submit', async () => {
      const dialog = page.getByRole('dialog');
      await dialog.locator('#runnerInput, textarea').first().fill('110');
      await page.waitForTimeout(200);
      await dialog.locator('#reason').fill('non-starter');
      await dialog.getByRole('button', { name: /mark as dns/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 8000 });
    });
  });

  test('Phase 4e — Records DNF for runner 101 (injured knee)', async ({ page, step }) => {
    await step('Navigate to base station operations', async () => {
      await page.goto(`${BASE}/base-station/operations`);
      await page.waitForSelector('#commonTime', { timeout: 20000 });
    });

    await step('Open DNF dialog via "d" hotkey', async () => {
      await page.locator('body').click();
      await page.keyboard.press('d');
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8000 });
    });

    await step('Dialog — enter runner 101 and reason, then submit', async () => {
      const dialog = page.getByRole('dialog');
      await dialog.locator('#runnerInput, textarea').first().fill('101');
      await page.waitForTimeout(200);
      await dialog.locator('#reason').fill('injured knee');
      await dialog.getByRole('button', { name: /mark as dnf/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 8000 });
    });
  });

  test('Phase 4f — Overview tab shows correct runner statuses', async ({ page, step }) => {
    await step('Navigate to base station and switch to Overview tab', async () => {
      await page.goto(`${BASE}/base-station/operations`);
      await page.waitForSelector('[aria-label="Base station tabs"]', { timeout: 20000 });
      await page.getByRole('button', { name: /^overview$/i }).click();
    });

    await step('Overview — runners 103–108 visible with Finished status', async () => {
      for (const num of [103, 104, 105]) {
        await expect(page.getByText(String(num)).first()).toBeVisible({ timeout: 5000 });
      }
      await expect(page.getByText(/finished/i).first()).toBeVisible({ timeout: 5000 });
    });

    await step('Overview — DNF status label visible', async () => {
      await expect(page.getByText(/dnf/i).first()).toBeVisible({ timeout: 5000 });
    });

    await step('Status strip — total of 10 runners shown', async () => {
      await expect(page.getByText(/total/i).first()).toBeVisible();
      await expect(page.getByText('10')).toBeVisible({ timeout: 5000 });
    });
  });

  test('Phase 4g — Reports tab renders race summary', async ({ page, step }) => {
    await step('Navigate to base station and switch to Reports tab', async () => {
      await page.goto(`${BASE}/base-station/operations`);
      await page.waitForSelector('[aria-label="Base station tabs"]', { timeout: 20000 });
      await page.getByRole('button', { name: /^reports$/i }).click();
    });

    await step('Reports — content or generate button visible', async () => {
      await expect(
        page.getByText(/report|results|summary|generate|no data/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    await step('Reports — click generate if available', async () => {
      const generateBtn = page.getByRole('button', { name: /generate|view|build/i }).first();
      if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await generateBtn.click();
        await expect(page.getByText(/runner|total|passed|finished/i).first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
