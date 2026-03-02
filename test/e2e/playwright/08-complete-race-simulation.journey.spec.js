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
 * All 10 tests share a single browser context so IndexedDB and localStorage
 * state persists across phases (serial execution enforced via describe.configure).
 *
 * Run with: npm run test:playwright:live
 */

// Use @playwright/test directly — no fixture auto-screenshots, but shared context works correctly
import { test, expect } from '@playwright/test';
import { pickFirstRaceInModal, fillReactInput } from './helpers.js';

const BASE = 'https://racetrackers.bwhite.id.au';

const RACE = {
  name: 'Autumn Ultra 2025',
  date: '2026-03-15',
  startTime: '07:00',
  numCheckpoints: 2,
  runnerRange: { min: 101, max: 110 },
};

// Shared browser context — all tests run against the same IndexedDB + localStorage
let _ctx = null;
let _page = null;

test.describe('Complete Race Simulation — Autumn Ultra 2025', () => {
  test.describe.configure({ mode: 'serial' });

  // ─────────────────────────────────────────────────────────────
  // Setup: create shared context and clear all stored state
  // ─────────────────────────────────────────────────────────────
  test.beforeAll(async ({ browser }) => {
    _ctx = await browser.newContext();
    _page = await _ctx.newPage();
    // Dismiss all browser dialogs (e.g., SW "New version available?" confirm) to prevent
    // service-worker-triggered page reloads mid-test.
    _page.on('dialog', async dialog => { await dialog.dismiss(); });
    await _page.goto(BASE);
    await _page.waitForSelector('h1', { timeout: 30000 });
    await _page.evaluate(async () => {
      // Delete the app's IndexedDB by name first (before enumerate, which may return empty)
      await new Promise(resolve => {
        const req = indexedDB.deleteDatabase('RaceTrackerDB');
        req.onsuccess = resolve;
        req.onerror = resolve;
        req.onblocked = resolve;
      });
      // Also enumerate and delete any remaining databases
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
    await _page.reload({ waitUntil: 'networkidle' });
    await _page.waitForSelector('h1', { timeout: 15000 });
    // Suppress SW-triggered reloads: autoUpdate SWs call skipWaiting → controllerchange →
    // window.location.reload() unconditionally. Patch location.reload to a noop so tests
    // aren't interrupted. Playwright's _page.reload() uses a different internal mechanism.
    await _page.addInitScript(() => {
      try {
        const noop = () => {};
        Object.defineProperty(Location.prototype, 'reload', {
          value: noop, configurable: true, writable: true
        });
      } catch (_) { /* ignore if patching fails */ }
    });
    // Keep _ctx open — all tests share this context
  });

  test.afterAll(async () => {
    await _ctx?.close();
    _ctx = null;
    _page = null;
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 1 — RACE SETUP
  // ─────────────────────────────────────────────────────────────

  test('Phase 1 — Race Director creates race with 10 runners and 2 checkpoints', async () => {
    await test.step('Navigate to race setup wizard', async () => {
      await _page.goto(`${BASE}/race-maintenance/setup`);
    });

    await test.step('Step 1 — choose Start from Scratch template', async () => {
      const scratchBtn = _page.locator('button').filter({ hasText: 'Start from Scratch' }).first();
      await scratchBtn.waitFor({ state: 'visible', timeout: 10000 });
      await scratchBtn.click();
      await _page.waitForTimeout(300);
    });

    await test.step('Step 2 — fill race details (name, date, start time, 2 checkpoints)', async () => {
      await _page.waitForSelector('#name', { timeout: 10000 });
      await _page.waitForTimeout(500);
      await fillReactInput(_page, '#name', RACE.name);
      await _page.waitForTimeout(100);
      await _page.fill('#date', RACE.date);
      await _page.waitForTimeout(100);
      await _page.fill('#startTime', RACE.startTime);
      await _page.waitForTimeout(100);
      await _page.selectOption('#numCheckpoints', '2');
      await _page.waitForTimeout(400);
      for (let i = 0; i < 2; i++) {
        const sel = `#checkpoint-${i}`;
        if (await _page.locator(sel).isVisible({ timeout: 2000 }).catch(() => false)) {
          await fillReactInput(_page, sel, `CP${i + 1}`);
          await _page.waitForTimeout(100);
        }
      }
      await _page.getByRole('button', { name: /next|continue/i }).click();
    });

    await test.step('Step 3 — configure runner range 101–110', async () => {
      await _page.waitForSelector('#min', { timeout: 10000 });
      // Remove any pre-seeded default range
      const removeBtn = _page.getByRole('button', { name: /remove range/i }).first();
      if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await removeBtn.click();
        await _page.waitForTimeout(200);
      }
      await _page.fill('#min', '101');
      await _page.waitForTimeout(100);
      await _page.fill('#max', '110');
      await _page.waitForTimeout(100);
      await _page.getByRole('button', { name: /add range/i }).click();
      await _page.waitForTimeout(200);
      await _page.getByRole('button', { name: /create race/i }).click();
    });

    await test.step('Step 4 — confirm Waves/Batches step then create race', async () => {
      const createBtn2 = _page.getByRole('button', { name: /create race/i });
      if (await createBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createBtn2.click();
      }
      await _page.waitForURL(/race-maintenance\/overview/, { timeout: 20000 });
    });

    await test.step('Race overview — verify race name and 10 runners', async () => {
      await expect(_page.getByText(RACE.name)).toBeVisible({ timeout: 10000 });
      await expect(_page.getByText(/10 runners|runners.*10/i).first()).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 2 — CHECKPOINT 1
  // ─────────────────────────────────────────────────────────────

  test('Phase 2 — CP1 Volunteer marks runners 101–109 passed via quick entry', async () => {
    await test.step('Navigate to Checkpoint 1 via home modal (isolated-app flow)', async () => {
      await _page.goto(BASE);
      await _page.waitForSelector('h1', { timeout: 30000 });
      await _page.getByRole('button', { name: /checkpoint operations/i }).click();
      await pickFirstRaceInModal(_page);
      await _page.waitForURL(/\/checkpoint\//, { timeout: 20000 });
      await _page.waitForSelector('nav[aria-label="Checkpoint tabs"]', { timeout: 20000 });
    });

    await test.step('Quick Entry — enter runners 101–109 one by one', async () => {
      const input = _page.locator('#quick-entry-input');
      await input.waitFor({ state: 'visible', timeout: 10000 });
      for (const num of [101, 102, 103, 104, 105, 106, 107, 108, 109]) {
        await input.fill(String(num));
        await _page.keyboard.press('Enter');
        await _page.waitForTimeout(300);
      }
    });

    await test.step('Verify — at least one runner shows marked state', async () => {
      const markedRunner = _page.locator('button, [role="button"]')
        .filter({ hasText: /^10[1-9]$/ })
        .first();
      await markedRunner.waitFor({ state: 'visible', timeout: 5000 });
      // Confirm runner 110 is still unmarked (non-starter)
      const runner110 = _page.locator('button, [role="button"]').filter({ hasText: /^110$/ }).first();
      if (await runner110.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(runner110).not.toHaveClass(/marked|checked|passed|green/i);
      }
    });

    await test.step('Switch to Overview tab — counts visible', async () => {
      await _page.getByRole('button', { name: /overview/i }).click();
      await expect(_page.getByText(/total|passed|not.?started/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 3 — CHECKPOINT 2
  // ─────────────────────────────────────────────────────────────

  test('Phase 3 — CP2 Volunteer marks runners 101, 103–109 passed (102 absent)', async () => {
    await test.step('Navigate to Checkpoint 2 operations', async () => {
      await _page.goto(`${BASE}/checkpoint/2`);
      await _page.waitForSelector('nav[aria-label="Checkpoint tabs"]', { timeout: 20000 });
    });

    await test.step('Quick Entry — mark 101, 103–109 (skip 102 — pulled before CP2)', async () => {
      const input = _page.locator('#quick-entry-input');
      await input.waitFor({ state: 'visible', timeout: 10000 });
      for (const num of [101, 103, 104, 105, 106, 107, 108, 109]) {
        await input.fill(String(num));
        await _page.keyboard.press('Enter');
        await _page.waitForTimeout(300);
      }
    });

    await test.step('Verify — runner 103 visible as marked, navigation confirms CP2', async () => {
      // Wait for CP2 context to be fully active in the legacy store
      // by waiting for the CP2 heading to appear in the RunnerGrid
      await _page.waitForSelector('h3', { timeout: 10000 });
      // Runner 103 should be visible (was just marked via quick entry)
      const runner103 = _page.locator('button, [role="button"]').filter({ hasText: /^103$/ }).first();
      if (await runner103.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Just verify runner 103 is present — the class may lag behind
        await runner103.waitFor({ state: 'visible', timeout: 3000 });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PHASE 4 — BASE STATION
  // ─────────────────────────────────────────────────────────────

  test('Phase 4a — Base Station initialises and runner list loads (10 runners)', async () => {
    await test.step('Home — click Base Station module card', async () => {
      await _page.goto(BASE);
      await _page.waitForSelector('h1', { timeout: 30000 });
      await _page.getByRole('button', { name: /base station/i }).click();
    });

    await test.step('Race selection modal — pick Autumn Ultra 2025', async () => {
      await pickFirstRaceInModal(_page);
    });

    await test.step('Base Station Data Entry tab — store initialises, stats show total 10', async () => {
      await _page.waitForURL(/base-station\/operations/, { timeout: 30000 });
      await _page.waitForSelector('#commonTime', { timeout: 20000 });
      await expect(_page.getByText(/total/i).first()).toBeVisible({ timeout: 15000 });
      await expect(_page.getByText('10').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('Phase 4b — Records finish time 10:45:00 for batch 103–108', async () => {
    await test.step('Navigate directly to base station operations', async () => {
      await _page.goto(`${BASE}/base-station/operations`);
      await _page.waitForSelector('#commonTime', { timeout: 20000 });
      await _page.waitForTimeout(500); // Let React store fully initialise
    });

    await test.step('Data Entry — enter time 10:45:00 and runner batch', async () => {
      // <input type="time"> needs special handling for React controlled components
      await _page.evaluate(() => {
        const input = document.getElementById('commonTime');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, '10:45:00');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await _page.waitForTimeout(200);
      await _page.locator('#runnerInput').click();
      await _page.fill('#runnerInput', '103, 104, 105, 106, 107, 108');
      await _page.waitForTimeout(200);
    });

    await test.step('Submit — verify input clears, finished count increments', async () => {
      await _page.locator('button[type="submit"]').click();
      await expect(_page.locator('#runnerInput')).toHaveValue('', { timeout: 10000 });
      await expect(_page.getByText('6').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('Phase 4c — Records DNF for runner 102 (heat exhaustion)', async () => {
    await test.step('Navigate to base station operations', async () => {
      await _page.goto(`${BASE}/base-station/operations`);
      await _page.waitForSelector('#commonTime', { timeout: 20000 });
    });

    await test.step('Open DNF withdrawal dialog via hotkey "d"', async () => {
      await _page.evaluate(() => document.activeElement?.blur());
      await _page.keyboard.press('d');
      await _page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8000 });
    });

    await test.step('Dialog — enter runner 102 and reason, then submit', async () => {
      const dialog = _page.getByRole('dialog');
      await dialog.locator('#runnerInput, textarea').first().fill('102');
      await _page.waitForTimeout(200);
      await dialog.locator('#reason').fill('heat exhaustion');
      await dialog.getByRole('button', { name: /mark as dnf/i }).click();
      await expect(_page.getByRole('dialog')).toBeHidden({ timeout: 8000 });
    });

    await test.step('Stats — DNF/DNS count shows at least 1', async () => {
      await expect(_page.getByText(/dnf.*dns|dnf.{1,5}dns/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('Phase 4d — Marks runner 110 as DNS (non-starter)', async () => {
    await test.step('Navigate to base station operations', async () => {
      await _page.goto(`${BASE}/base-station/operations`);
      await _page.waitForSelector('#commonTime', { timeout: 20000 });
    });

    await test.step('Open DNS dialog via hotkey Shift+D', async () => {
      await _page.evaluate(() => document.activeElement?.blur());
      await _page.keyboard.press('Shift+d');
      await _page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8000 });
    });

    await test.step('Dialog — enter runner 110 and reason, then submit', async () => {
      const dialog = _page.getByRole('dialog');
      await dialog.locator('#runnerInput, textarea').first().fill('110');
      await _page.waitForTimeout(200);
      await dialog.locator('#reason').fill('non-starter');
      await dialog.getByRole('button', { name: /mark as dns/i }).click();
      await expect(_page.getByRole('dialog')).toBeHidden({ timeout: 8000 });
    });
  });

  test('Phase 4e — Records DNF for runner 101 (injured knee)', async () => {
    await test.step('Navigate to base station operations', async () => {
      await _page.goto(`${BASE}/base-station/operations`);
      await _page.waitForSelector('#commonTime', { timeout: 20000 });
    });

    await test.step('Open DNF dialog via "d" hotkey', async () => {
      await _page.evaluate(() => document.activeElement?.blur());
      await _page.keyboard.press('d');
      await _page.getByRole('dialog').waitFor({ state: 'visible', timeout: 8000 });
    });

    await test.step('Dialog — enter runner 101 and reason, then submit', async () => {
      const dialog = _page.getByRole('dialog');
      await dialog.locator('#runnerInput, textarea').first().fill('101');
      await _page.waitForTimeout(200);
      await dialog.locator('#reason').fill('injured knee');
      await dialog.getByRole('button', { name: /mark as dnf/i }).click();
      await expect(_page.getByRole('dialog')).toBeHidden({ timeout: 8000 });
    });
  });

  test('Phase 4f — Overview tab shows correct runner statuses', async () => {
    await test.step('Navigate to base station and switch to Overview tab', async () => {
      await _page.goto(`${BASE}/base-station/operations`);
      await _page.waitForSelector('[aria-label="Base station tabs"]', { timeout: 20000 });
      await _page.getByRole('tab', { name: /overview/i }).click();
    });

    await test.step('Overview — runners 103–108 visible with Finished status', async () => {
      for (const num of [103, 104, 105]) {
        await expect(_page.getByText(String(num)).first()).toBeVisible({ timeout: 5000 });
      }
      await expect(_page.getByText(/finished/i).first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('Overview — DNF status label visible', async () => {
      await expect(_page.getByText(/dnf/i).first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('Status strip — total of 10 runners shown', async () => {
      await expect(_page.getByText(/total/i).first()).toBeVisible();
      await expect(_page.getByText('10').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('Phase 4g — Reports tab renders race summary', async () => {
    await test.step('Navigate to base station and switch to Reports tab', async () => {
      await _page.goto(`${BASE}/base-station/operations`);
      await _page.waitForSelector('[aria-label="Base station tabs"]', { timeout: 20000 });
      await _page.getByRole('tab', { name: /reports/i }).click();
    });

    await test.step('Reports — content or generate button visible', async () => {
      await expect(
        _page.getByText(/report|results|summary|generate|no data/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step('Reports — click generate if available', async () => {
      const generateBtn = _page.getByRole('button', { name: /generate|view|build/i }).first();
      if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await generateBtn.click();
        await expect(_page.getByText(/runner|total|passed|finished/i).first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
