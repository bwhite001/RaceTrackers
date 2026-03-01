/**
 * Playwright fixtures for progressive screenshot capture.
 *
 * Exports a drop-in replacement for `{ test, expect }` from @playwright/test.
 * Two capture mechanisms run automatically:
 *
 *  1. page.on('load') — screenshot after every full page load (hard navigation)
 *  2. SPA navigation hook — screenshot after every React Router client-side
 *     route change (history.pushState / replaceState)
 *  3. `step(title, fn)` fixture — wraps test.step() with a before + after
 *     screenshot so key workflow phases are captured explicitly
 */

import { test as base, expect } from '@playwright/test';

export { expect };

export const test = base.extend({

  /**
   * Extended `page` that auto-screenshots on navigations (both hard and SPA).
   */
  page: async ({ page }, use, testInfo) => {
    let seq = 0;
    const capture = async (label) => {
      try {
        const body = await page.screenshot({ fullPage: false });
        await testInfo.attach(
          `${String(++seq).padStart(3, '0')} ${label}`,
          { body, contentType: 'image/png' }
        );
      } catch {
        // Ignore — page may be mid-navigation or already closed
      }
    };

    // Hard navigations (initial load, page.goto, form POST reloads)
    page.on('load', () => {
      setImmediate(async () => {
        try {
          await capture(`page load → ${new URL(page.url()).pathname}`);
        } catch {}
      });
    });

    // SPA / client-side routing (React Router pushState / replaceState).
    // The exposed function returns immediately so the browser isn't blocked,
    // then we defer the screenshot with setImmediate to avoid re-entrancy.
    await page.exposeFunction('__pwNavCapture__', (pathname) => {
      setImmediate(async () => {
        try {
          // Brief wait for React to finish rendering the new route
          await new Promise((r) => setTimeout(r, 250));
          await capture(`route → ${pathname}`);
        } catch {}
      });
    });

    await page.addInitScript(() => {
      const fire = () => {
        if (typeof window.__pwNavCapture__ === 'function') {
          window.__pwNavCapture__(window.location.pathname + window.location.search);
        }
      };
      const origPush = history.pushState.bind(history);
      history.pushState = (...args) => { origPush(...args); fire(); };
      const origReplace = history.replaceState.bind(history);
      history.replaceState = (...args) => { origReplace(...args); fire(); };
    });

    await use(page);
  },

  /**
   * `step(title, fn)` — use instead of test.step() to get a before & after
   * screenshot at each named workflow phase.
   *
   * Usage:
   *   test('my journey', async ({ page, step }) => {
   *     await step('fill race details', async () => {
   *       await page.fill('#name', 'My Race');
   *     });
   *   });
   */
  step: async ({ page }, use, testInfo) => {
    let stepSeq = 0;

    const step = (title, fn) =>
      base.step(title, async () => {
        const n = ++stepSeq;
        // Before
        try {
          const body = await page.screenshot({ fullPage: false });
          await testInfo.attach(
            `${String(n).padStart(2, '0')}-A ${title}`,
            { body, contentType: 'image/png' }
          );
        } catch {}

        const result = await fn();

        // After
        try {
          const body = await page.screenshot({ fullPage: false });
          await testInfo.attach(
            `${String(n).padStart(2, '0')}-B ${title}`,
            { body, contentType: 'image/png' }
          );
        } catch {}

        return result;
      });

    await use(step);
  },

  /**
   * Automatically takes a final screenshot at the end of every test,
   * whether it passes or fails.
   */
  _finalScreenshot: [
    async ({ page }, use, testInfo) => {
      await use();
      try {
        const body = await page.screenshot({ fullPage: false });
        await testInfo.attach('final state', { body, contentType: 'image/png' });
      } catch {}
    },
    { auto: true },
  ],
});
