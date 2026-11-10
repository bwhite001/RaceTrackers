/**
 * WICEN2 keyboard layer on Base (WICEN2_PARITY.md Phase 1). After page load
 * everything is done from the keyboard, the way a WICEN2 operator works:
 * CheckPt ⏎ Time ⏎ Number ⏎ … Alt+U. Undo buttons are reached by focus + Enter.
 * Times are typed relative to now (the seeded race started two hours ago).
 */
import { test, expect } from './fixtures.js';
import { seedRace } from '../../../scripts/ui-validation/seed.mjs';

const BASE = 'http://localhost:3000';

const pad = (n) => String(n).padStart(2, '0');
/** HHMM `m` minutes ago, floored to a 5-minute block unless `exact` */
const typed = (m, exact = false) => {
  const d = new Date(Date.now() - m * 60000);
  if (!exact) d.setMinutes(Math.floor(d.getMinutes() / 5) * 5);
  return `${pad(d.getHours())}${pad(d.getMinutes())}`;
};
const colon = (t) => `${t.slice(0, 2)}:${t.slice(2)}`;
/** An exact minute that is not on a block boundary, ~30 min ago */
const offBlock = () => {
  const d = new Date(Date.now() - 30 * 60000);
  if (d.getMinutes() % 5 === 0) d.setMinutes(d.getMinutes() + 2);
  return `${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const chipsText = (page) => page.getByTestId('rx-numbers').getByRole('button').allInnerTexts();
const keys = async (page, seq) => { for (const k of seq) await page.keyboard.press(k); };
const typeEnter = async (page, ...items) => { for (const s of items) { await page.keyboard.type(String(s)); await page.keyboard.press('Enter'); } };

test.describe('WICEN2 keyboard on Base', () => {
  test('a WICEN2 operator takes calls at base from the keyboard', async ({ page, step }) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width: 1112, height: 834 });
    await seedRace(page, BASE);
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });
    // Early in a minute, so "now" doesn't tick over mid-step
    await page.waitForFunction(() => new Date().getSeconds() < 30, null, { timeout: 35000 });
    const t1 = typed(30);

    await step('1 ⏎ time ⏎ then numbers — four chips at that time, Alt+U completes', async () => {
      await page.keyboard.type('1');
      await expect(page.locator('#rx-cp')).toBeFocused();
      await expect(page.locator('#rx-cp')).toHaveValue('1');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'CP1', exact: true })).toBeVisible();
      await expect(page.locator('#exact-time')).toBeFocused();
      await typeEnter(page, t1, 129, 136, 139, 135);
      await expect(page.locator('#bib-heard')).toBeFocused();
      expect((await chipsText(page)).map(t => t.split('\n')[0])).toEqual(['129', '136', '139', '135']);
      await expect(page.getByRole('group', { name: 'Common time block' }).getByRole('button', { pressed: true })).toContainText(colon(t1));
      await keys(page, ['Alt+U']);
      await expect(page.getByRole('status').filter({ hasText: '4 recorded at CP1' })).toBeVisible();
      await expect(page.locator('#rx-cp')).toBeFocused();
    });

    await step('1 ⏎ ⏎ number — Enter on the Time box keeps the block shown', async () => {
      await typeEnter(page, '1');
      const shown = await page.locator('#exact-time').inputValue();
      await page.keyboard.press('Enter');
      await expect(page.locator('#bib-heard')).toBeFocused();
      await typeEnter(page, 140);
      await expect(page.getByTestId('rx-numbers')).toContainText('140');
      await expect(page.locator('#exact-time')).toHaveValue(shown);
    });

    await step('Shift+Tab back to Time, a new time — "Also in this call" shows the first', async () => {
      const first = await page.locator('#exact-time').inputValue();
      await keys(page, ['Shift+Tab']);
      await expect(page.locator('#exact-time')).toBeFocused();
      await typeEnter(page, typed(20), 141);
      await expect(page.getByTestId('rx-numbers')).toContainText('141');
      await expect(page.getByRole('button', { name: new RegExp(`Show the numbers at ${first}, 1 to record`) })).toBeVisible();
    });

    await step('Alt+C 2 ⏎ mid-call — CP1 is completed with Undo, CP2 opens', async () => {
      await keys(page, ['Alt+C']);
      await expect(page.locator('#rx-cp')).toBeFocused();
      await typeEnter(page, '2');
      await expect(page.getByRole('heading', { name: 'CP2', exact: true })).toBeVisible();
      await expect(page.getByTestId('rx-flash')).toHaveText('CP1 call completed · 2 recorded');
      await expect(page.getByTestId('board-count-CP1')).toHaveText('6');
      await page.getByTestId('switch-undo').focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'CP1', exact: true })).toBeVisible();
      await expect(page.getByTestId('rx-flash')).toHaveText('CP1 call reopened');
      await expect(page.getByTestId('board-count-CP1')).toHaveText('4');
      await expect(page.getByTestId('rx-numbers')).toContainText('141');
    });

    await step('Alt+E removes the last number; Esc clears a typed number', async () => {
      await keys(page, ['Alt+E']);
      await expect(page.getByTestId('rx-flash')).toHaveText('141 removed');
      await expect(page.getByTestId('rx-numbers')).not.toContainText('141');
      await page.getByRole('button', { name: 'Undo' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('rx-numbers')).toContainText('141');
      await keys(page, ['Alt+N']);
      await page.keyboard.type('99');
      await keys(page, ['Escape']);
      await expect(page.locator('#bib-heard')).toHaveValue('');
      await expect(page.getByRole('heading', { name: 'CP1', exact: true })).toBeVisible();
    });

    await step('A time off the 5-minute mark stays exact; a future time is refused', async () => {
      const exact = offBlock();
      await keys(page, ['Alt+T']);
      await typeEnter(page, exact);
      await expect(page.locator('#exact-time')).toHaveAttribute('data-active', 'true');
      await expect(page.locator('#exact-time')).toHaveValue(colon(exact));
      await keys(page, ['Alt+T']);
      await typeEnter(page, typed(-30, true));
      await expect(page.locator('#exact-time')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByTestId('rx-flash')).toContainText('Time must be between');
      await expect(page.locator('#exact-time')).toBeFocused();
      await keys(page, ['Escape']);
      await expect(page.locator('#exact-time')).toHaveValue(colon(exact));
      await keys(page, ['Alt+U']);
      await expect(page.getByRole('status').filter({ hasText: 'recorded at CP1' })).toBeVisible();
    });

    await step('Numeric keypad — the same entry sequence on Numpad keys', async () => {
      // Playwright's Numpad keys act as if Num Lock is off; send real keypad digits over CDP
      const cdp = await page.context().newCDPSession(page);
      const pad = async (d) => {
        const ev = { key: d, code: `Numpad${d}`, text: d, unmodifiedText: d, windowsVirtualKeyCode: 96 + Number(d), location: 3 };
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...ev });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...ev });
      };
      await pad('2'); await keys(page, ['NumpadEnter', 'NumpadEnter']);
      await expect(page.getByRole('heading', { name: 'CP2', exact: true })).toBeVisible();
      await expect(page.locator('#bib-heard')).toBeFocused();
      await keys(page, ['Numpad1']); // Num Lock off: End, not 1
      await expect(page.getByTestId('rx-flash')).toHaveText('Num Lock is off');
      for (const d of '130') await pad(d);
      await keys(page, ['NumpadEnter']);
      await expect(page.getByTestId('rx-numbers')).toContainText('130');
      await keys(page, ['Alt+U']);
      await expect(page.getByRole('status').filter({ hasText: '1 recorded at CP2' })).toBeVisible();
    });

    await step('Alt+W quick withdraw — preview, Enter applies; "128 *" puts them back', async () => {
      await keys(page, ['Alt+W']);
      await expect(page.getByRole('heading', { name: 'Quick withdraw' })).toBeVisible();
      await page.keyboard.type(`128 ${t1}`);
      await expect(page.getByTestId('quickwd-preview')).toHaveText(`DNF 128 · On course · ${colon(t1)}`);
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'Quick withdraw' })).toBeHidden();
      await expect(page.getByText('128 DNF', { exact: true })).toBeVisible();
      await keys(page, ['Alt+W']);
      await page.keyboard.type('128 CP2');
      await expect(page.getByTestId('quickwd-preview')).toContainText('Already DNF');
      await page.keyboard.press('Control+A');
      await page.keyboard.type('128 *');
      await expect(page.getByTestId('quickwd-preview')).toContainText('Put 128 back in the race');
      await page.keyboard.press('Enter');
      await expect(page.getByText('128 back in the race', { exact: true })).toBeVisible();
    });

    await step('WICEN2 keys with no job here say where the job went', async () => {
      await keys(page, ['Alt+V']);
      await expect(page.getByTestId('kb-status')).toHaveText("Vet Out isn't used in running events");
      await keys(page, ['Alt+L']);
      await expect(page.getByTestId('kb-status')).toHaveText('No strapper list in running events');
      await keys(page, ['Alt+Q']);
      await expect(page.getByTestId('kb-status')).toHaveText('Close the app window to quit. Your data is saved.');
    });

    await step('Hold Alt — each button shows its key, and nothing moves', async () => {
      await typeEnter(page, '3');
      await expect(page.getByRole('heading', { name: 'CP3', exact: true })).toBeVisible();
      const complete = page.getByRole('button', { name: /Complete/ });
      const before = await complete.boundingBox();
      await page.keyboard.down('Alt');
      await expect(page.getByTestId('key-hint').first()).toBeVisible();
      expect(await page.getByTestId('key-hint').count()).toBeGreaterThan(4);
      expect(await complete.boundingBox()).toEqual(before);
      const scroll = await page.evaluate(() => document.scrollingElement.scrollHeight - window.innerHeight);
      expect(scroll).toBeLessThanOrEqual(0);
      await page.keyboard.up('Alt');
      await expect(page.getByTestId('key-hint')).toHaveCount(0);
    });

    await step('Alt+H — the shortcut sheet, and a printable keyboard card', async () => {
      await keys(page, ['Alt+H']);
      await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible();
      await expect(page.getByRole('dialog')).toContainText('Update Main');
      await expect(page.getByRole('dialog')).toContainText('Where did it go?');
      await page.evaluate(() => { window.print = () => {}; });
      await page.getByRole('button', { name: 'Print keyboard card' }).focus();
      await page.keyboard.press('Enter');
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('#keycard-print')).toBeVisible();
      await expect(page.locator('#keycard-print')).toContainText('Alt+U');
      await page.emulateMedia({ media: 'screen' });
      await page.evaluate(() => document.body.classList.remove('print-keycard'));
      await keys(page, ['Escape']);
      await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeHidden();
    });
  });

  test('the race director turns WICEN2 keys off in Settings', async ({ page, step }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1112, height: 834 });
    await seedRace(page, BASE);
    await page.goto(`${BASE}/base-station/operations`);
    await expect(page.getByRole('heading', { name: /who's calling/i })).toBeVisible({ timeout: 15000 });

    await step('Settings › WICEN2 keyboard shortcuts off', async () => {
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('switch', { name: 'WICEN2 keyboard shortcuts' }).click();
      await page.getByRole('button', { name: 'Save Changes' }).click();
    });

    await step('Keys off — typing a checkpoint and Alt+U do nothing', async () => {
      await page.getByRole('button', { name: /^CP1,/ }).click();
      await page.locator('#bib-heard').fill('120');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Alt+U');
      await expect(page.getByRole('heading', { name: 'CP1', exact: true })).toBeVisible();
      await expect(page.locator('#rx-cp')).toHaveCount(0);
      await page.keyboard.press('Alt+V');
      await expect(page.getByTestId('kb-status')).toHaveCount(0);
    });
  });
});
