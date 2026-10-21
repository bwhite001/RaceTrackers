#!/usr/bin/env node
/**
 * Builds the VK4WIP UI validation pack: drives the real built app through
 * every new screen, performs each event (click / entry), records what the
 * app showed (screenshot + on-screen messages), and writes a PDF that pairs
 * each event with the plan's wording (IMPLEMENTATION_SPEC.md) so the result
 * can be checked against the plan.
 *
 * Usage:
 *   npm run build && npx serve dist -p 4173 --single &
 *   node scripts/ui-validation/build-validation-pdf.mjs [baseUrl]
 *
 * Output: docs/design-handoff/ui-validation/VK4WIP-UI-validation.pdf (+ events.json)
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedRace as seedRaceAt } from './seed.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.argv[2] || 'http://localhost:4173';
const OUT_DIR = path.join(ROOT, 'docs/design-handoff/ui-validation');
const SPEC = path.join(ROOT, 'docs/design-handoff/IMPLEMENTATION_SPEC.md');
const PHONE = { width: 390, height: 844 };
const TABLET = { width: 1112, height: 834 };
const DESKTOP = { width: 1280, height: 800 };

const events = [];
let current = { section: '', page: null, viewport: PHONE };

const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const blockAgo = (m) => { const d = new Date(Date.now() - m * 60000); d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0); return d; };

/** On-screen messages a validator needs: live regions, alerts, dialog titles, undo bars. */
async function observed(page) {
  return page.evaluate(() => {
    const seen = new Set();
    const out = [];
    const sel = '[aria-live], [role="status"], [role="alert"], [role="dialog"] h1, [role="dialog"] h2, #sheet-bib';
    for (const el of document.querySelectorAll(sel)) {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      const t = el.innerText.replace(/\s+/g, ' ').trim();
      if (t && t.length < 400 && !seen.has(t)) { seen.add(t); out.push(t); }
    }
    return out.slice(0, 8);
  });
}

/**
 * Record one event.
 * @param {string} id      e.g. "CP-07"
 * @param {string} spec    plan section, e.g. "§4.5 Behaviour 2"
 * @param {string} action  what was clicked / entered
 * @param {string} expect  the plan's wording (quoted from IMPLEMENTATION_SPEC.md)
 * @param {Function} fn    performs the event on the page
 */
async function ev(id, spec, action, expect, fn = async () => {}, { full = false, extra } = {}) {
  const page = current.page;
  let error = null;
  try {
    await fn(page);
    await page.waitForTimeout(450);
  } catch (e) {
    error = e.message.split('\n')[0];
  }
  const shot = await page.screenshot({ type: 'jpeg', quality: 62, fullPage: full }).catch(() => null);
  const obs = await observed(page).catch(() => []);
  events.push({
    id, section: current.section, spec, action, expect,
    observed: [...(extra ? [await extra(page)].flat().filter(Boolean) : []), ...obs],
    error,
    viewport: `${current.viewport.width}×${current.viewport.height}`,
    phone: current.viewport.width < 600,
    shot: shot ? shot.toString('base64') : null,
  });
  if (process.env.SHOTS && shot) {
    fs.mkdirSync('/tmp/uival', { recursive: true });
    fs.writeFileSync(`/tmp/uival/${id}.jpg`, shot);
  }
  console.log(`${error ? '✗' : '✓'} ${id} ${action}${error ? `  — ${error}` : ''}`);
}

async function newPage(browser, viewport, opts = {}) {
  // Service workers blocked (as in playwright.config.js): the first-visit SW
  // takeover reloads the page, which would interrupt a scripted step.
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  PAGEERROR', e.message));
  await seedRaceAt(page, BASE, opts);
  current = { ...current, page, viewport };
  return page;
}

const quick = async (page, text) => { await page.fill('#quick-entry-input', text); await page.keyboard.press('Enter'); await page.waitForTimeout(250); };
const tile = (page, n) => page.getByRole('button', { name: new RegExp(`^Runner ${n},`) });
const add = async (page, nums) => { for (const n of nums) { await page.fill('#bib-heard', String(n)); await page.keyboard.press('Enter'); } };

// ─────────────────────────────────────────────────────────────────────────────
const want = (k) => !process.env.ONLY || process.env.ONLY.split(',').includes(k);

async function run() {
  const browser = await chromium.launch();
  let page;

  // ── Home, Settings, Share, Race setup (phone) ─────────────────────────────
  if (want('home')) {
  page = await newPage(browser, PHONE);
  current.section = 'Home';
  await ev('HOME-01', '§4.1', 'Open the app at /', 'Navy header: badge, "RaceTracker", "Ipswich & District Radio Club · VK4WIP", "Offline ready" status. Current race card (name, date, checkpoint count, start time). Three role cards (≥76px): Checkpoint, Base station, Race setup — icon tile, title, one-line description, chevron. Primary button at bottom: Scan race QR code (existing import flow). Footer lockup: "Ipswich & District Radio Club · VK4WIP".',
    async p => { await p.goto(BASE); await p.getByRole('heading', { name: 'RaceTracker' }).waitFor(); });
  await ev('HOME-02', '§4.1', 'Click "Scan race QR code"', 'Opens the existing import flow (QR scanner).',
    async p => { await p.getByRole('button', { name: /scan race qr code/i }).click(); });
  await ev('HOME-03', '§4.1', 'Close the scanner, then click the "Checkpoint" role card', 'Role cards keep the existing navigation (choose race, then checkpoint). Navigation protection unchanged.',
    async p => { await p.getByRole('button', { name: 'Close scanner' }).click().catch(() => {}); await p.keyboard.press('Escape'); await p.goto(BASE); await p.getByRole('button', { name: /^checkpoint\b/i }).click(); });

  current.section = 'Settings';
  await ev('SET-01', '§4.4', 'Home → click the Settings (cog) button', 'Sections: Display (Theme segmented: Light / Dark / Sunlight; text-size slider), Status colours (rows with swatch, name, description; "Reset to club colours"), Race data (Share or import race config).',
    async p => { await p.goto(BASE); await p.getByRole('button', { name: 'Settings' }).click(); });
  await ev('SET-02', '§4.4', 'Click Theme → "Sunlight"', 'Sunlight = new high-contrast theme option (pure white bg, ink text, thicker borders).',
    async p => { await p.getByRole('button', { name: 'Sunlight', exact: true }).click(); },
    { extra: async p => `html classes: ${await p.evaluate(() => document.documentElement.className)}` });
  await ev('SET-03', '§4.4 / G7', 'Click Theme → "Dark"', 'Theme segmented: Light / Dark / Sunlight.',
    async p => { await p.getByRole('button', { name: 'Dark', exact: true }).click(); },
    { extra: async p => `html classes: ${await p.evaluate(() => document.documentElement.className)}` });
  await ev('SET-04', '§3.2 / §4.4', 'Click "Light", then drag Text size to 130%', 'Keep the existing --font-scale setting; all sizes scale with it.',
    async p => { await p.getByRole('button', { name: 'Light', exact: true }).click(); await p.locator('#text-size').fill('1.3'); },
    { extra: async p => `--font-scale = ${await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-scale'))}` });
  await ev('SET-05', '§4.4 / G7', 'Change the "Passed" colour to #2a9d8f with its swatch', 'Users may still recolour in Settings.',
    async p => { await p.locator('#text-size').fill('1'); await p.getByLabel('Passed colour').fill('#2a9d8f'); },
    { extra: async p => `--color-status-passed = ${await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-passed'))}` });
  await ev('SET-06', '§4.4', 'Click "Reset to club colours"', 'Status colours … "Reset to club colours".',
    async p => { await p.getByRole('button', { name: /reset to club colours/i }).click(); },
    { extra: async p => `--color-status-passed = ${await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-passed'))} (club blue = 30 92 179)` });

  current.section = 'Share race config';
  await ev('SHARE-01', '§4.3', 'Settings → Race data → "Share or import race config"', 'Existing QR export: large QR in a white card with shadow, runner/checkpoint count; Download / Email / Copy tiles; primary "Show full screen" (QRDisplayFullscreen). Note "Works without internet — device to device".',
    async p => { await p.getByRole('button', { name: /share or import race config/i }).click(); await p.getByRole('heading', { name: /scan to load/i }).waitFor(); });
  await ev('SHARE-02', '§4.3', 'Click the "Copy" tile', 'Download / Email / Copy tiles.',
    async p => { await p.context().grantPermissions(['clipboard-read', 'clipboard-write']); await p.getByRole('button', { name: 'Copy' }).click(); });
  await ev('SHARE-03', '§4.3', 'Click back ("Close share race")', 'Returns to Settings.',
    async p => { await p.getByRole('button', { name: /close share race/i }).click(); });

  current.section = 'Race setup';
  await ev('SETUP-01', '§4.2', 'Open /race-maintenance/setup', 'Navy header with step "Step 3 of 4 · Runners" and a 4-segment gold progress bar. Restyle only; keep the wizard.',
    async p => { await p.goto(`${BASE}/race-maintenance/setup`); await p.getByText('Start from Scratch').waitFor(); });
  await ev('SETUP-02', '§4.2', 'Click "Start from Scratch", enter name / date / start time, click Next', 'Keep the wizard (Back secondary, Next primary).',
    async p => {
      await p.getByText('Start from Scratch').click();
      await p.fill('#name', 'Validation Race'); await p.fill('#date', '2026-11-08'); await p.fill('#startTime', '06:30');
      await p.getByRole('button', { name: /next|continue/i }).first().click();
      await p.locator('#min').waitFor();
    });
  await ev('SETUP-03', '§4.2 / G1', 'Enter From 100, To 349 and click "Add Range"', 'Runner ranges input (ranges allowed here only), live count ("250 runners will be created") and first/last preview chips. Link to CSV / WebScorer import. Back (secondary) + Next (primary).',
    async p => { await p.fill('#min', '100'); await p.fill('#max', '349'); await p.getByRole('button', { name: /add range/i }).click(); await p.getByText(/runners will be created/).scrollIntoViewIfNeeded(); });
  await ev('SETUP-04', '§4.2', 'Scroll to the bottom of the runners step', 'Link to CSV / WebScorer import. Back (secondary) + Next (primary).',
    async p => { await p.getByRole('button', { name: /next: waves/i }).scrollIntoViewIfNeeded(); });
  await page.context().close();
  }

  // ── Checkpoint (phone) ────────────────────────────────────────────────────
  if (want('cp')) {
  page = await newPage(browser, PHONE);
  current.section = 'Checkpoint — Mark off';
  await ev('CP-01', '§4.5 Layout', 'Open /checkpoint/3', 'AppBar (checkpoint number, location + operator callsign) with 3 StatTiles (Passed, Still to come, To call in gold) → quick-entry input + gold Mark → status line (aria-live) → group chips (20 per group) → 4-column tile grid (64px rows) → CheckpointTabBar.',
    async p => { await p.goto(`${BASE}/checkpoint/3`); await tile(p, 100).waitFor(); });
  await ev('CP-02', '§4.5 Behaviour 1', 'Tap tile 101 (not passed)', 'Tap a not-passed tile → mark passed at now (actualTime = now, commonTime = block).',
    async p => { await tile(p, 101).click(); });
  await ev('CP-03', '§4.5 Behaviour 6', 'Type "103, 104 105" in quick entry and press Enter', 'Quick entry accepts multiple numbers separated by commas/spaces (individual numbers only), marks each at now, jumps the grid to the group of the first number, message "3 runners marked at 07:47".',
    async p => { await quick(p, '103, 104 105'); });
  await ev('CP-04', 'G1 / §4.5 Behaviour 6', 'Type "110-115 999 101" and press Enter', 'Individual numbers only (no ranges outside Race setup). Unknown / already-marked numbers are not marked.',
    async p => { await quick(p, '110-115 999 101'); });
  await ev('CP-05', '§4.5 Behaviour 6', 'Type "125" and press Enter', 'Jumps the grid to the group of the first number.',
    async p => { await quick(p, '125'); });
  await ev('CP-06', '§4.5', 'Tap group chip "100–119"', 'Group chips (20 per group: 100–119 …, horizontally scrolling).',
    async p => { await p.getByRole('button', { name: '100–119' }).click(); });
  await ev('CP-07', '§4.5 Behaviour 2–3', 'Tap tile 101 again (passed)', 'Tap a passed or called-in tile → opens the Edit sheet (never unmarks directly). Edit sheet: bib, status line ("Passed · not called in yet" / "Called in to base"), "Marked at HH:MM". TimeStepper (clamped). Primary Save HH:MM (or "Keep time" if unchanged). Secondary Unmark runner. Cancel.',
    async p => { await tile(p, 101).click(); await p.getByRole('dialog').waitFor(); });
  await ev('CP-08', '§3.5 TimeStepper', 'In the sheet tap "−5"', 'TimeStepper: −5 / −1 / big time / +1 / +5. Clamp to [race start, now]. Primary changes to "Save HH:MM".',
    async p => { await p.getByLabel('5 minutes earlier').click(); });
  await ev('CP-09', '§3.5 TimeStepper', 'Tap "+5" three times', 'Clamp to [race start, now] — the time cannot go past now.',
    async p => { for (let i = 0; i < 3; i++) await p.getByLabel('5 minutes later').click(); });
  await ev('CP-10', '§4.5 Behaviour 3', 'Tap "−5" twice, then "Save HH:MM"', 'Save changes the time; status line confirms.',
    async p => { await p.getByLabel('5 minutes earlier').click(); await p.getByLabel('5 minutes earlier').click(); await p.getByRole('button', { name: /^Save / }).click(); });
  await ev('CP-11', '§4.5 Behaviour 4', 'Tap tile 103 → "Unmark runner"', 'Unmark → tile becomes "unmarked earlier" (dashed blue, was HH:MM) and an UndoBar "142 unmarked · Undo" appears.',
    async p => { await tile(p, 103).click(); await p.getByRole('button', { name: 'Unmark runner' }).click(); });
  await ev('CP-12', '§4.5 Behaviour 4 / G5', 'Tap "Undo" on the undo bar', 'Undo restores the original record exactly.',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); });
  await ev('CP-13', '§4.5 Behaviour 4', 'Tap tile 104 → "Unmark runner", wait for the undo bar to clear', 'Tile becomes "unmarked earlier" (dashed blue, was HH:MM).',
    async p => { await tile(p, 104).click(); await p.getByRole('button', { name: 'Unmark runner' }).click(); await p.waitForTimeout(6500); });
  await ev('CP-14', '§4.5 Behaviour 5', 'Tap tile 104 (unmarked earlier)', 'Sheet in restore mode: "Unmarked earlier · It had been marked at 07:37", TimeStepper preset to the original, primary Mark at 07:37, secondary Use now (HH:MM).',
    async p => { await tile(p, 104).click(); await p.getByRole('dialog').waitFor(); });
  await ev('CP-15', '§4.5 Behaviour 5', 'Tap "Mark at HH:MM"', 'Restores the original time.',
    async p => { await p.getByRole('button', { name: /^Mark at / }).click(); });
  await ev('CP-16', '§4.5 Behaviour 7', 'In Overview mark 106 DNS, back to Mark off, tap tile 106', 'DNS/DNF tiles are not editable here (use Overview).',
    async p => {
      await p.getByRole('button', { name: /^Overview/ }).click();
      await p.locator('button[aria-expanded]').filter({ hasText: /^106/ }).click();
      await p.getByRole('button', { name: 'Mark DNS' }).click();
      await p.getByRole('button', { name: /^Mark off/ }).click();
      await tile(p, 106).click();
    });

  current.section = 'Checkpoint — Callout sheet';
  await ev('CO-01', '§4.6', 'Mark 107 108 109, then tap the "Callout" tab', 'AppBar subtitle: CP3 · VK4PMC → VK4WIP · 147.225. Call-due banner (gold) when ≥ 5 runners waiting or oldest ≥ 5 min: "Call due — 9 waiting, oldest 6 min". Next call card (gold border): heading "Next call · 2 blocks", badge "9 competitors", one white card per pending block: "Common time 07:40 · 5" + numbers in Montserrat 800 22px separated by " · ". Buttons: Read out + Base copied — mark sent. Below: Official message and Request stand down. No radio phrases on screen.',
    async p => { await quick(p, '107 108 109'); await p.getByRole('button', { name: /^Callout/ }).click(); });
  await ev('CO-02', '§4.6', 'Tap "Base copied — mark sent"', 'Marks every runner in the pending blocks calledIn = true, callInTime = now. Called-in blocks collapse to one compact row (navy tick, 07:30 – 07:35 · 4, numbers, "Sent 07:36").',
    async p => { await p.getByRole('button', { name: /base copied — mark sent/i }).click(); });
  await ev('CO-03', '§4.5 Behaviour 3 / §4.6', 'Mark off → tap 101 (called in) → "−1"', 'If the runner was called in and the time changes → warning box "Base already has 07:31. A changed time goes back on the callout sheet as a correction."',
    async p => { await p.getByRole('button', { name: /^Mark off/ }).click(); await tile(p, 101).click(); await p.getByLabel('1 minute earlier').click(); });
  await ev('CO-04', '§4.5 Behaviour 3', 'Tap "Save HH:MM"', 'Saving sets status back to passed with correction = true so it reappears on the callout sheet; tile shows ✎.',
    async p => { await p.getByRole('button', { name: /^Save / }).click(); });
  await ev('CO-05', '§4.6', 'Tap the "Callout" tab', 'Corrections (runners with correction = true) appear in the pending list tagged "Correction".',
    async p => { await p.getByRole('button', { name: /^Callout/ }).click(); });
  await ev('CO-06', '§4.6', 'Tap "Official message", type a message', 'Official message … (plain buttons; v1 can open a simple notes modal / log entry).',
    async p => { await p.getByRole('button', { name: 'Official message' }).click(); await p.locator('[role="dialog"] textarea').fill('Request extra water at CP3'); });
  await ev('CO-07', '§4.6', 'Tap "Log message"', 'v1 can open a simple notes modal / log entry.',
    async p => { await p.getByRole('button', { name: 'Log message' }).click(); });
  await ev('CO-08', '§4.6', 'Tap "Request stand down"', 'Request stand down (plain button; v1 notes modal / log entry). No radio phrases on screen.',
    async p => { await p.getByRole('button', { name: 'Request stand down' }).click(); });

  current.section = 'Checkpoint — Read-out';
  await ev('RO-01', '§4.7', 'Cancel; send the pending correction (Base copied — mark sent); mark 12 runners (130–141); tap "Read out"', 'Header: "Read-out", CP3 · block 07:45–07:50 · 27 competitors, progress "X of N copied by base", segmented bar (one segment per over). Numbers split into overs of up to 5. Each bib is its own row. Current over: lead "Common time 07:45"; one row per number with a checkbox; next unticked row highlighted ("Read next"). Primary Base copied — next locked until every number in the over is ticked ("Tick each number as you read · 2 of 5").',
    async p => {
      await p.getByRole('button', { name: 'Cancel' }).click();
      await p.getByRole('button', { name: /base copied — mark sent/i }).click(); // send the 101 correction first
      await p.getByRole('button', { name: /^Mark off/ }).click();
      await quick(p, '130 131 132 133 134 135 136 137 138 139 140 141');
      await p.getByRole('button', { name: /^Callout/ }).click();
      await p.getByRole('button', { name: 'Read out' }).click();
    });
  await ev('RO-02', '§4.7', 'Tick the first two numbers', 'Ticked rows go muted with strike-through; next unticked row highlighted; "Tick each number as you read · 2 of 5".',
    async p => { const boxes = p.getByRole('checkbox'); await boxes.nth(0).check(); await boxes.nth(1).check(); });
  await ev('RO-03', '§4.7', 'Tap "Reset"', 'Reset clears ticks on the current over.',
    async p => { await p.getByRole('button', { name: 'Reset' }).click(); });
  await ev('RO-04', '§4.7', 'Tick all numbers in the over', 'Primary Base copied — next unlocks when every number is ticked.',
    async p => { const boxes = p.getByRole('checkbox'); for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check(); });
  await ev('RO-05', '§4.7', 'Tap "Base copied — next"', 'Next over: lead "Continuing 07:45"; progress advances.',
    async p => { await p.getByRole('button', { name: /base copied — next/i }).click(); });
  await ev('RO-06', '§4.7', 'Tick one number, tap back, then tap "Read out" again', 'Persist read-out progress so an interrupted read resumes at the same over.',
    async p => { await p.getByRole('checkbox').first().check(); await p.getByRole('button', { name: /back to callout sheet/i }).click(); await p.getByRole('button', { name: 'Read out' }).click(); });
  await ev('RO-07', '§4.7', 'Tap "Previous over"', 'Previous over steps back.',
    async p => { await p.getByRole('button', { name: 'Previous over' }).click(); });
  await ev('RO-08', '§4.7', 'Complete every over (tick all → next) to the end', 'Finishing the last over → done state "All 27 copied", which marks the block called in.',
    async p => {
      for (let k = 0; k < 6; k++) {
        const next = p.getByRole('button', { name: /base copied — next|tick each number/i });
        if (!(await next.isVisible().catch(() => false))) break;
        const boxes = p.getByRole('checkbox');
        for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check();
        await p.getByRole('button', { name: /base copied — next/i }).click();
        await p.waitForTimeout(200);
      }
    });

  current.section = 'Checkpoint — Overview';
  await ev('OV-01', '§4.8', 'Back to callout, tap the "Overview" tab', 'Header: % through, "142 of 250 through", stacked bar (called in / passed not called / to come / out), role="img" with aria-label. 4 StatTiles: Passed, To come, DNS, DNF. Filter pills: All · Passed · To come · DNS / DNF. Scrollable runner list; tap a row to expand (one open at a time, aria-expanded).',
    async p => { await p.getByRole('button', { name: 'Back to callout', exact: true }).click(); await p.getByRole('button', { name: /^Overview/ }).click(); },
    { extra: async p => `progress bar aria-label: ${await p.getByRole('img').first().getAttribute('aria-label')}` });
  await ev('OV-02', '§4.8', 'Tap filter "Passed"', 'Filter pills: All · Passed · To come · DNS / DNF.',
    async p => { await p.getByRole('button', { name: 'Passed', exact: true }).click(); });
  await ev('OV-03', '§4.8 table (Called in)', 'Tap row 107 (called in)', 'Called in: TimeStepper, Undo call-in, Reset — not passed, Mark DNF (+ note "Base already has HH:MM. Changing the time sends a correction.")',
    async p => { await p.locator('button[aria-expanded]').filter({ hasText: /^107/ }).click(); });
  await ev('OV-04', '§4.8', 'Tap "Undo call-in"', 'Every action shows UndoBar; totals, bar and the Callout badge update live.',
    async p => { await p.getByRole('button', { name: 'Undo call-in' }).click(); });
  await ev('OV-05', '§4.8 table (Passed)', 'Row 107 now Passed: tap "Mark called in"', 'Passed: TimeStepper, Mark called in, Reset — not passed, Mark DNF.',
    async p => { await p.getByRole('button', { name: 'Mark called in' }).click(); });
  await ev('OV-06', '§4.8', 'Tap the time "−5" on row 107 (called in)', 'Changing the time of a called-in runner → status passed + correction = true.',
    async p => { await p.getByLabel('5 minutes earlier').click(); });
  await ev('OV-07', '§4.8', 'Tap "Reset — not passed", then "Undo"', 'Every action shows UndoBar.',
    async p => { await p.getByRole('button', { name: 'Reset — not passed' }).click(); await p.waitForTimeout(300); await p.getByRole('button', { name: 'Undo' }).click(); });
  await ev('OV-08', '§4.8 table (To come)', 'Filter "To come", tap row 102', 'To come: Passed now (HH:MM) (gold), Mark DNS, Mark DNF.',
    async p => { await p.getByRole('button', { name: 'To come', exact: true }).click(); await p.locator('button[aria-expanded]').filter({ hasText: /^102/ }).click(); });
  await ev('OV-09', '§4.8', 'Tap "Mark DNF"', 'DNF shown with red style (§3.3); counts update.',
    async p => { await p.getByRole('button', { name: 'Mark DNF' }).click(); });
  await ev('OV-10', '§4.8 table (DNS / DNF)', 'Filter "DNS / DNF", tap row 102', 'DNS / DNF: Clear DNS/DNF, Passed now (+ note that base is flagged).',
    async p => {
      await p.getByRole('button', { name: 'DNS / DNF' }).click();
      const row = p.locator('button[aria-expanded]').filter({ hasText: /^102/ });
      if ((await row.getAttribute('aria-expanded')) !== 'true') await row.click();
    });
  await ev('OV-11', '§4.8', 'Tap "Clear DNF"', 'Clear DNS/DNF; UndoBar.',
    async p => { await p.getByRole('button', { name: 'Clear DNF' }).click(); });
  await page.context().close();
  }

  // ── Base (tablet, with earlier calls already received) ────────────────────
  if (want('base')) {
  page = await newPage(browser, TABLET, { withBaseData: true });
  current.section = 'Base — Receive';
  await ev('RX-01', '§4.9 / §3.5 BaseTabs', 'Open /base-station/operations (tablet 1112×834)', 'AppBar: badge, "Base · VK4WIP", "147.225 · now HH:MM", inline tabs Receive · Overview · DNF / DNS · Reports, single row on tablet. Idle "Who\'s calling?": grid of compact buttons (≥64px) for Start, CP1–CP4, Finish: short name, status pill (Due gold / OK / Closed), "VK4PMC · up to 07:15". Checkpoint board: rows with short name, "Up to 07:15 · 30 min behind · call 11m ago", count, Due/OK/Closed pill.',
    async p => { await p.goto(`${BASE}/base-station/operations`); await p.getByRole('heading', { name: /who's calling/i }).waitFor(); },
    { extra: async p => {
      const out = [`page scroll: ${await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight)}px`];
      return out;
    } });
  await ev('RX-02', '§4.9', 'Tap "CP1"', 'Tap a checkpoint → straight into receiving. Header row: CP short name, operator · location, "N to record". BlockPicker from lastBlock − 5 to the current block. Default selection = that checkpoint\'s next unreceived block (lastBlock + 5, capped at now). Chips: done (≤ lastBlock, muted), next, this call, selected = navy. "Exact" input.',
    async p => { await p.getByRole('button', { name: /^CP1,/ }).click(); });
  await ev('RX-03', '§4.9 / §3.5 NumberPad', 'Type 120 on the keyboard + Enter; then press keypad 1, 2, 1 and "Add"', 'Input + Add + NumberPad side by side. Enter adds. Each added number becomes a BibChip validated live.',
    async p => { await add(p, [120]); for (const k of ['1', '2', '1']) await p.getByRole('group', { name: 'Number pad' }).getByRole('button', { name: k, exact: true }).click(); await p.getByRole('button', { name: 'Add number' }).click(); });
  await ev('RX-04', '§4.9 validation table', 'Add 999, 121 again, 100, 150', 'Not in race → rejected (red) "Not in race"; same bib earlier in this call → warning (gold) "Said twice"; already logged at this checkpoint → warning "Had 07:40"; otherwise ok (blue). Only ok + info are recorded.',
    async p => { await add(p, [999, 121, 100, 150]); });
  await ev('RX-05', '§4.9', 'Tap chip 999 (remove), then "Undo"', 'Tap a chip to remove (Undo). Status line (aria-live) + inline Undo when available.',
    async p => { await p.getByTestId('rx-numbers').getByRole('button', { name: /^Remove 999/ }).click(); await p.waitForTimeout(200); await p.getByRole('button', { name: 'Undo' }).click(); });
  await ev('RX-06', '§4.9', 'Tap "Next HH:MM →"', 'Next → move to the next 5-minute block, clear the box; disabled "At now" at the current block. Switching block clears the box and the typed number (nothing is lost).',
    async p => { await p.getByRole('button', { name: /^Next \d\d:\d\d →$/ }).click(); });
  await ev('RX-07', '§4.9', 'Add 122, 123', 'Numbers box shows only the current block\'s numbers. Other blocks in the call show underneath as pills: "Also in this call: 07:40 · 5".',
    async p => { await add(p, [122, 123]); });
  await ev('RX-08', '§4.9', 'Tap the "Also in this call" pill', 'Tap to switch back.',
    async p => { await p.getByRole('button', { name: /^Show the \d+ numbers at/ }).first().click(); });
  await ev('RX-09', '§4.9', `Type an exact time in "Exact" (${hhmm(new Date(Date.now() - 22 * 60000)).replace(':', '')})`, '"Exact" input accepts HH:MM or HHMM between race start and now; sets a non-block time and shows it selected.',
    async p => { await p.locator('#exact-time').fill(hhmm(new Date(Date.now() - 22 * 60000)).replace(':', '')); await add(p, [124]); });
  await ev('RX-10', '§4.9', 'Type an exact time in the future (2359)', 'Exact time must be between race start and now.',
    async p => { await p.locator('#exact-time').fill('2359'); });
  await ev('RX-11', '§4.9', 'Pick the "next" block again, tap "Clear HH:MM"', 'Clear 07:40 — clears all numbers in the current block (Undo).',
    async p => { await p.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: /next|this call/ }).first().click(); await p.getByRole('button', { name: /^Clear \d\d:\d\d$/ }).click(); });
  await ev('RX-12', '§4.9 / G5', 'Tap "Undo"', 'Undo restores the cleared numbers.',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); });
  await ev('RX-13', '§4.9', 'Tap "Complete · N"', 'Complete → writes base_station_runners, writes a radio_calls record, updates the board (count, last call = now, lastBlock = max block received). Done card: "N recorded at CP3", "Blocks 07:40, 07:45 · 2 skipped (flagged)", Undo (reopens the call, reverts writes) and Next call.',
    async p => { await p.getByRole('button', { name: /^Complete · \d+$/ }).click(); });
  await ev('RX-14', '§4.9', 'Tap "Undo" on the done card', 'Undo (reopens the call, reverts writes).',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); });
  await ev('RX-15', '§4.9', 'Tap "Complete", then "Next call"', 'Next call returns to "Who\'s calling?"; board updated.',
    async p => { await p.getByRole('button', { name: /^Complete · \d+$/ }).click(); await p.getByRole('button', { name: 'Next call' }).click(); });
  await ev('RX-16', '§4.9 / G5', 'Tap "CP3", add 101 102, tap "Cancel call" once', 'Cancel call — red outline; if numbers exist, first tap turns solid red "Tap again to cancel" and says how many will be dropped.',
    async p => { await p.getByRole('button', { name: /^CP3,/ }).click(); await add(p, [101, 102]); await p.getByRole('button', { name: 'Cancel call' }).click(); });
  await ev('RX-17', '§4.9', 'Tap "Tap again to cancel"', 'Second tap drops the call.',
    async p => { await p.getByRole('button', { name: 'Tap again to cancel' }).click(); });
  await page.setViewportSize(PHONE); current.viewport = PHONE;
  await ev('RX-18', '§4.9 Layout', 'Phone 390×844: tap "CP2", add 110 111', 'Phone: stacks, receive panel first. Tabs horizontally scrollable on phone.',
    async p => { await p.getByRole('button', { name: /^CP2,/ }).click(); await add(p, [110, 111]); }, { full: true });
  await ev('RX-19', '§4.9', 'Phone: Cancel call (two taps)', 'Back to idle.',
    async p => { await p.getByRole('button', { name: 'Cancel call' }).click(); await p.getByRole('button', { name: 'Tap again to cancel' }).click(); });
  await page.setViewportSize(TABLET); current.viewport = TABLET;

  current.section = 'Base — DNF / DNS';
  await ev('ST-01', '§4.11', 'Tap the "DNF / DNS" tab', 'Bulk add panel: DNF/DNS segmented toggle (DNF active = red). DNF shows Where pills (CP1–CP4, On course), Reason pills (Injury, Self-withdrew, Cut-off, Medical, Other — optional, tap again to unset), Time (−5/+5, clamped). Out of the race panel: totals "3 DNS · 3 DNF", filter pills, rows.',
    async p => { await p.getByRole('tab', { name: 'DNF / DNS' }).click(); });
  await ev('ST-02', '§4.11', 'Tap Where "CP1", Reason "Injury", tap "Injury" again, tap "Medical"', 'Reason pills — optional, tap again to unset.',
    async p => { await p.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP1' }).click(); await p.getByRole('button', { name: 'Injury' }).click(); await p.getByRole('button', { name: 'Injury' }).click(); await p.getByRole('button', { name: 'Medical' }).click(); });
  await ev('ST-03', '§4.11', 'Tap Time "+5"', 'Time (−5/+5, clamped).',
    async p => { await p.getByLabel('5 minutes later').click(); });
  await ev('ST-04', '§4.11 validation table', 'Paste "112, 130 131; 999 130" and press Enter (112 was seen at CP2)', 'Input accepts one number or a pasted list (commas, spaces, semicolons, newlines). Not in race / listed twice → rejected; DNF at CPx but seen at a later CP → warning "Seen later at CP3".',
    async p => { await p.fill('#bulk-bibs', '112, 130 131; 999 130'); await p.keyboard.press('Enter'); });
  await ev('ST-05', '§4.11', 'Tap "Mark N as DNF"', 'Clear list + primary Mark 6 as DNF (red for DNF, gold for DNS; disabled when 0). Undo. DNF writes withdrawal_records (checkpoint, withdrawalTime, reason) + runner status.',
    async p => { await p.getByRole('button', { name: /^Mark \d+ as DNF$/ }).click(); });
  await ev('ST-06', '§4.11', 'Tap "Undo"', 'Undo.',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); });
  await ev('ST-07', '§4.11 validation table', 'Paste "130 131" again → Mark as DNF; switch to DNS, add "101 130"', 'DNS but recorded at a checkpoint → warning "Seen CP2 — started"; currently the other status → warning "Was DNS — will change". DNS shows a one-line explainer.',
    async p => {
      await p.fill('#bulk-bibs', '130 131'); await p.keyboard.press('Enter');
      await p.getByRole('button', { name: /^Mark \d+ as DNF$/ }).click();
      await p.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNS' }).click();
      await p.fill('#bulk-bibs', '101 130'); await p.keyboard.press('Enter');
    });
  await ev('ST-08', '§4.11', 'Tap "Mark 2 as DNS"', 'DNS sets runner status non-starter. Audit-log every change.',
    async p => { await p.getByRole('button', { name: /^Mark \d+ as DNS$/ }).click(); });
  await ev('ST-09', '§4.11', 'Out of the race: tap filter "DNF", then "Clear" on 131', 'Rows (bib, status chip, "CP2 · Injury · 07:12" / "Did not start", Clear → back in race, Undo).',
    async p => { await p.getByRole('group', { name: 'Filter out list' }).getByRole('button', { name: 'DNF' }).click(); await p.getByRole('button', { name: 'Clear DNF for 131' }).click(); });
  await ev('ST-10', '§4.11', 'Tap "Undo", then filter "All"', 'Undo.',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); await p.getByRole('group', { name: 'Filter out list' }).getByRole('button', { name: 'All' }).click(); });
  await ev('ST-11', '§4.9 validation table', 'Receive → CP2 → add 131 (DNF) and 101 (DNS)', 'Marked DNF / DNS → rejected "DNF" / "DNS".',
    async p => { await p.getByRole('tab', { name: 'Receive' }).click(); await p.getByRole('button', { name: /^CP2,/ }).click(); await add(p, [131, 101]); });
  await ev('ST-12', '§4.11 (existing WithdrawalDialog)', 'Cancel call; DNF / DNS → "Withdraw runner with comments or vet-out details…"', 'Evolves BulkDnsView.jsx + WithdrawalDialog.jsx.',
    async p => { await p.getByRole('button', { name: 'Cancel call' }).click(); await p.getByRole('button', { name: 'Tap again to cancel' }).click(); await p.getByRole('tab', { name: 'DNF / DNS' }).click(); await p.getByRole('button', { name: /withdraw runner with comments/i }).click(); });

  current.section = 'Base — Overview';
  await page.setViewportSize(DESKTOP); current.viewport = DESKTOP;
  await ev('BO-01', '§4.10', 'Close the dialog; tap the "Overview" tab (desktop 1280)', 'Red overdue alert banner (role="alert", "View runners" → Reports › Overdue), stat tiles (On course, Finished, DNS, DNF), checkpoint progress bars (navy = closed out, blue = arriving, gold = finish), leaderboard table with filter pills (All, Female, Male, Wave 1…), gold rank badge for #1, overflow-x box on phone.',
    async p => { await p.keyboard.press('Escape'); await p.getByRole('button', { name: /cancel/i }).first().click().catch(() => {}); await p.getByRole('tab', { name: 'Overview' }).click(); }, { full: false });
  await ev('BO-02', '§4.10', 'Tap leader filter "Female"', 'Leaderboard filter pills (All, Female, Male, Wave 1…).',
    async p => { await p.getByRole('group', { name: 'Leader filter' }).getByRole('button', { name: 'Female' }).click(); await p.getByRole('heading', { name: 'Current leaders' }).scrollIntoViewIfNeeded(); });
  await ev('BO-03', '§4.10', 'Scroll to the top and tap "View runners" on the overdue alert', '"View runners" → Reports › Overdue.',
    async p => { await p.evaluate(() => scrollTo(0, 0)); await p.getByRole('button', { name: 'View runners' }).click(); });

  current.section = 'Base — Reports & data checks';
  await ev('RP-01', '§4.12 Reports', 'Reports › "Overdue runners" (opened from the alert)', 'Bib, last seen (CP + time), expected at, overdue minutes (gold badge; red ≥ 60). Expected time = last seen + typical split for that leg (median of recorded splits). CSV + Print buttons. Sidebar (flex 1 1 250px) + report panel; "Needs attention" group with total gold badge; each item red count badge or ✓.',
    async () => {});
  await ev('RP-02', '§4.12 Reports', 'Click "CSV"', 'CSV + Print buttons; reuse existing export utilities.',
    async () => {},
    { extra: async p => {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.getByRole('button', { name: 'CSV' }).click()]);
      const file = await dl.path();
      const text = fs.readFileSync(file, 'utf8').split('\n').slice(0, 4).join(' | ');
      return [`downloaded: ${dl.suggestedFilename()}`, `first lines: ${text}`];
    } });
  await ev('RP-03', '§4.12 Reports', 'Click "Still on course"', 'Not finished and not out, grouped by last checkpoint passed (tiles). For sweep / stand-down.',
    async p => { await p.getByRole('button', { name: /^Still on course/ }).click(); });
  await ev('RP-04', '§4.12 Reports', 'Click "Times by checkpoint"', 'Matrix bib × CP1…Finish (common times; DNF/DNS shown in place).',
    async p => { await p.getByRole('button', { name: /^Times by checkpoint/ }).click(); });
  await ev('RP-05', '§4.12 Reports', 'Click "Call log"', 'Per checkpoint: calls received, numbers, last call time, up to (lastBlock). From radio_calls.',
    async p => { await p.getByRole('button', { name: /^Call log/ }).click(); });
  await ev('RP-06', '§4.12 Needs attention', 'Click "Duplicates"', 'Same bib, same checkpoint, >1 base record (different or same time) → Keep A / Keep B (or Merge if identical).',
    async p => { await p.getByRole('button', { name: /^Duplicates/ }).click(); });
  await ev('RP-07', '§4.12', 'Click the first "Keep HH:MM"', 'Each issue row: bib, headline, detail, 1–2 action buttons; resolving removes it (Undo).',
    async p => { await p.getByTestId('issue-row').getByRole('button', { name: /^Keep / }).first().click(); });
  await ev('RP-08', '§4.12', 'Click "Undo"', 'Resolving removes it (Undo).',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); });
  await ev('RP-09', '§4.12 Needs attention', 'Click "Out of order"', 'Time at CP(n+1) < time at CP(n) → Ask CPx (flag for radio check) / Mark checked.',
    async p => { await p.getByRole('button', { name: /^Out of order/ }).click(); });
  await ev('RP-10', '§4.12', 'Click "Ask CP2"', 'Resolutions persist in a new data_issue_resolutions table so resolved items don\'t reappear.',
    async p => { await p.getByRole('button', { name: /^Ask CP/ }).first().click(); });
  await ev('RP-11', '§4.12 Needs attention', 'Click "Skipped a checkpoint"', 'Has later CP time, missing an earlier CP → Ask CPx / Mark checked.',
    async p => { await p.getByRole('button', { name: /^Skipped a checkpoint/ }).click(); });
  await ev('RP-12', '§4.12 Needs attention', 'Click "Seen after DNF / DNS"', 'Checkpoint time after DNF time, or any time while DNS → Clear DNF/DNS / Remove that time.',
    async p => { await p.getByRole('button', { name: /^Seen after DNF/ }).click(); });
  await ev('RP-13', '§4.12 Needs attention', 'Click "Unknown bibs"', 'Numbers outside the race reported in calls (keep them in radio_calls.rejected) → Remove / Keep for review.',
    async p => { await p.getByRole('button', { name: /^Unknown bibs/ }).click(); });
  await ev('RP-14', '§4.12 Needs attention', 'Click "Impossible pace"', 'Split speed above a threshold (default > 20 km/h; checkpoint distances from race config) → Ask CPx / Mark checked.',
    async p => { await p.getByRole('button', { name: /^Impossible pace/ }).click(); });
  await ev('RP-15', '§4.12', 'Click "Mark checked", then reload the page and open Reports › Impossible pace', '"Mark checked" = acknowledged, data unchanged. Resolved items don\'t reappear.',
    async p => { await p.getByRole('button', { name: 'Mark checked' }).first().click(); await p.reload(); await p.getByRole('tab', { name: 'Reports' }).click(); await p.getByRole('button', { name: /^Impossible pace/ }).click(); });
  await ev('RP-16', '§4.12', 'Click "Exports"', 'Evolves ReportsPanel.jsx, ReportBuilder.jsx (existing exports kept).',
    async p => { await p.getByRole('button', { name: /^Exports/ }).click(); });
  }

  await browser.close();
}

// ── Markdown → HTML (spec appendix): headings, tables, lists, code, paragraphs ─
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inline(s) {
  return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
function md(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith('```')) {
      const buf = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) buf.push(lines[i]);
      out.push(`<pre>${esc(buf.join('\n'))}</pre>`);
    } else if (/^#{1,4} /.test(l)) {
      const n = l.match(/^#+/)[0].length;
      out.push(`<h${n + 1}>${inline(l.replace(/^#+ /, ''))}</h${n + 1}>`);
    } else if (l.startsWith('|')) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i]);
      i--;
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\|[\s|:-]+\|$/.test(r));
      out.push('<table>' + body.map((r, k) => `<tr>${cells(r).map(c => k === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('')}</tr>`).join('') + '</table>');
    } else if (/^\s*([-*]|\d+\.) /.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      for (; i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i]); i++) items.push(lines[i].replace(/^\s*([-*]|\d+\.) /, ''));
      i--;
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else if (l.trim() === '---') {
      out.push('<hr>');
    } else if (l.trim()) {
      out.push(`<p>${inline(l)}</p>`);
    }
  }
  return out.join('\n');
}

function buildHtml() {
  const sections = [...new Set(events.map(e => e.section))];
  const failed = events.filter(e => e.error);
  const toc = sections.map(s => {
    const list = events.filter(e => e.section === s);
    return `<li><a href="#${s.replace(/\W+/g, '-')}">${esc(s)}</a> — ${list[0].id} … ${list.at(-1).id} (${list.length})</li>`;
  }).join('');
  const body = sections.map(s => {
    const list = events.filter(e => e.section === s);
    return `<section class="screen"><h2 id="${s.replace(/\W+/g, '-')}">${esc(s)}</h2>` + list.map(e => `
      <article class="event ${e.phone ? 'phone' : 'wide'}">
        <div class="meta">
          <div class="id">${e.id} <span class="vp">${e.viewport}</span></div>
          <table class="kv">
            <tr><th>Plan</th><td>${esc(e.spec)}</td></tr>
            <tr><th>Event</th><td><strong>${esc(e.action)}</strong></td></tr>
            <tr><th>Plan says</th><td class="quote">${esc(e.expect)}</td></tr>
            <tr><th>App showed</th><td>${e.observed.length ? `<ul>${e.observed.map(o => `<li>${esc(o)}</li>`).join('')}</ul>` : '<em>(no status messages — see screenshot)</em>'}</td></tr>
            ${e.error ? `<tr><th>Automation</th><td class="err">Step could not be completed: ${esc(e.error)}</td></tr>` : ''}
            <tr><th>Result</th><td class="tick">☐ Matches plan &nbsp; ☐ Issue: ________________________</td></tr>
          </table>
        </div>
        ${e.shot ? `<img src="data:image/jpeg;base64,${e.shot}" alt="${esc(e.id)} screenshot">` : ''}
      </article>`).join('') + '</section>';
  }).join('');

  const spec = fs.readFileSync(SPEC, 'utf8');
  const generated = new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>VK4WIP UI validation</title>
<style>
  @page { size: A4; margin: 12mm 11mm; }
  body { font-family: Inter, system-ui, sans-serif; color: #222A35; font-size: 10.5px; line-height: 1.45; }
  h1 { font-family: Montserrat, sans-serif; color: #0B2D53; font-size: 26px; margin: 0 0 6px; }
  h2 { font-family: Montserrat, sans-serif; color: #0B2D53; font-size: 17px; border-bottom: 3px solid #D4AF37; padding-bottom: 4px; margin: 0 0 10px; }
  h3, h4, h5 { color: #0B2D53; }
  .cover { page-break-after: always; }
  .band { background: #0B2D53; color: #fff; padding: 16px 18px; border-radius: 10px; margin-bottom: 14px; }
  .band h1 { color: #fff; } .band p { color: #E9F2FF; margin: 2px 0; }
  .box { background: #EEF3FA; border-radius: 8px; padding: 10px 12px; margin: 10px 0; }
  .screen { page-break-before: always; }
  .event { display: flex; gap: 10px; border: 1px solid #E0E6F0; border-radius: 8px; padding: 8px; margin-bottom: 9px; page-break-inside: avoid; }
  .event.wide { flex-direction: column; }
  .event.phone img { width: 190px; flex-shrink: 0; align-self: flex-start; }
  .event.wide img { width: 100%; max-height: 140mm; object-fit: contain; object-position: left top; }
  .event img { border: 1px solid #E0E6F0; border-radius: 6px; }
  .meta { flex: 1; min-width: 0; }
  .id { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 13px; color: #0B2D53; margin-bottom: 4px; }
  .vp { font-family: Inter, sans-serif; font-weight: 600; font-size: 9px; color: #5A6579; margin-left: 6px; }
  table.kv { border-collapse: collapse; width: 100%; }
  table.kv th { text-align: left; vertical-align: top; width: 74px; color: #5A6579; font-weight: 700; padding: 2px 6px 2px 0; }
  table.kv td { padding: 2px 0; vertical-align: top; }
  .quote { color: #0B2D53; font-style: italic; }
  .err { color: #CC0000; font-weight: 600; }
  .tick { color: #5A6579; }
  ul { margin: 0; padding-left: 14px; }
  .appendix { page-break-before: always; font-size: 9.5px; }
  .appendix table { border-collapse: collapse; margin: 6px 0; width: 100%; }
  .appendix th, .appendix td { border: 1px solid #E0E6F0; padding: 3px 5px; text-align: left; vertical-align: top; }
  .appendix th { background: #EEF3FA; }
  pre { background: #F7F8FB; border: 1px solid #E0E6F0; padding: 6px; white-space: pre-wrap; font-size: 8.5px; }
  code { background: #F7F8FB; padding: 0 2px; }
</style></head><body>
<div class="cover">
  <div class="band"><h1>RaceTracker — VK4WIP UI validation pack</h1>
    <p>Every new screen, every event (click or entry), with what the plan says and what the built app showed.</p>
    <p>Branch feature/vk4wip-ui · generated ${esc(generated)} · ${events.length} events · ${sections.length} screens</p></div>
  <h2 style="border:0">How to validate</h2>
  <p>Each event block has: <strong>Plan</strong> (section of IMPLEMENTATION_SPEC.md), <strong>Event</strong> (exactly what was clicked or entered),
  <strong>Plan says</strong> (wording quoted from the plan — not the developer's own description), <strong>App showed</strong> (on-screen messages captured as text from the running app)
  and a screenshot taken straight after the event. The full plan is reproduced in the appendix.</p>
  <div class="box"><strong>Suggested prompt for Claude.ai</strong> — attach this PDF and say:<br>
  "This PDF documents a built UI against the plan in its appendix (IMPLEMENTATION_SPEC.md). For every event, compare 'App showed' and the screenshot with 'Plan says' and the referenced plan section.
  List every mismatch, missing behaviour, styling difference from §3 (colours, buttons, runner states) and accessibility concern, with the event ID and the plan section. Also list plan items (§4, §7, §8) that no event exercises."</div>
  <p><strong>Notes for the reviewer.</strong> The race is generated for the run (started two hours before the screenshots), so times differ from the plan's 07:47 examples.
  Base screens were seeded with earlier calls (an hour and half an hour before) including deliberate data problems, so the overdue alert and every data check have something to show.
  Known, deliberate differences from the plan are listed in DECISIONS.md (e.g. no Start checkpoint, the setup wizard has 5–6 steps, the race list stays on Home).
  ${failed.length ? `<br><strong>${failed.length} event(s) could not be completed by the automation</strong> — they are marked in red.` : 'All events were completed by the automation.'}</p>
  <h2 style="border:0">Screens</h2><ul>${toc}</ul>
</div>
${body}
<div class="appendix"><h2>Appendix — the plan (IMPLEMENTATION_SPEC.md, verbatim)</h2>${md(spec)}</div>
</body></html>`;
}

await run();
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'events.json'), JSON.stringify(events.map(({ shot, ...e }) => e), null, 2));
const html = buildHtml();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const pdfPath = path.join(OUT_DIR, 'VK4WIP-UI-validation.pdf');
await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '11mm', right: '11mm' } });
await browser.close();
console.log(`\nWrote ${pdfPath} (${(fs.statSync(pdfPath).size / 1e6).toFixed(1)} MB), ${events.length} events, ${events.filter(e => e.error).length} not completed`);
