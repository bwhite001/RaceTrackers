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

/** Status lines only (live regions and alerts) — short text, no page chrome. */
async function statusLines(page) {
  return page.evaluate(() => {
    const seen = new Set();
    const out = [];
    for (const el of document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')) {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      const t = el.innerText.replace(/\s+/g, ' ').trim();
      if (t && t.length <= 160 && !seen.has(t)) { seen.add(t); out.push(t); }
    }
    return out.slice(0, 4);
  });
}

/**
 * Evidence for "App showed": the element an event is about — its text,
 * accessible name, state (pressed, expanded, disabled, invalid) and any
 * computed style the plan talks about.
 */
async function describe(loc, label, style = []) {
  if (!(await loc.count().catch(() => 0))) return `${label}: (not on screen)`;
  return loc.first().evaluate((el, { label, style }) => {
    const cs = getComputedStyle(el);
    const STYLE = {
      bg: () => `background ${cs.backgroundColor}`,
      border: () => `border ${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      strike: () => `text-decoration ${cs.textDecorationLine}`,
      color: () => `colour ${cs.color}`,
    };
    const parts = [];
    const text = (el.matches('input, textarea, select') ? el.value : el.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (text) parts.push(`"${text.slice(0, 160)}${text.length > 160 ? '…' : ''}"`);
    const name = el.getAttribute('aria-label');
    if (name && name !== text) parts.push(`name "${name}"`);
    for (const a of ['aria-pressed', 'aria-expanded', 'aria-invalid', 'aria-live', 'role', 'data-active', 'title']) {
      const v = el.getAttribute(a);
      if (v != null && !(a === 'role' && ['button', 'group'].includes(v))) parts.push(`${a}=${v}`);
    }
    if (el.disabled) parts.push('disabled');
    for (const k of style) parts.push(STYLE[k]());
    return `${label}: ${parts.join(' · ') || '(empty)'}`;
  }, { label, style });
}

/** show: [S('Save button', p => p.getByRole(...), ['bg', 'border'])] */
const S = (label, loc, style) => async p => describe(loc(p), label, style);
/** show: [V('Page width', p => p.evaluate(...))] — a measured value */
const V = (label, fn) => async p => `${label}: ${await fn(p)}`;

/**
 * Record one event.
 * @param {string} id      e.g. "CP-07"
 * @param {string} spec    plan section, e.g. "§4.5 Behaviour 2"
 * @param {string} action  what was clicked / entered
 * @param {string} expect  the plan's wording (quoted from IMPLEMENTATION_SPEC.md or the fixes brief)
 * @param {Function} fn    performs the event on the page
 * @param {{ show?: Function[], full?: boolean }} opts  show = evidence captured after the event
 */
async function ev(id, spec, action, expect, fn = async () => {}, { full = false, show = [] } = {}) {
  const page = current.page;
  let error = null;
  try {
    await fn(page);
    await page.waitForTimeout(450);
  } catch (e) {
    error = e.message.split('\n')[0];
  }
  const evidence = [];
  for (const f of show) evidence.push(...[await f(page).catch(e => `(could not read: ${e.message.split('\n')[0]})`)].flat().filter(Boolean));
  const shot = await page.screenshot({ type: 'jpeg', quality: 62, fullPage: full }).catch(() => null);
  events.push({
    id, section: current.section, spec, action, expect,
    observed: evidence,
    status: await statusLines(page).catch(() => []),
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
  const T = (id) => (p) => p.getByTestId(id);
  const btn = (name, opts) => (p) => p.getByRole('button', { name, ...opts });
  const cpTab = (p, name) => p.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });
  const sheet = (p) => p.getByRole('dialog');
  const pageWidth = V('Page width', p => p.evaluate(() => `${document.documentElement.scrollWidth}px (viewport ${innerWidth}px)`));
  const htmlClass = V('Theme classes on <html>', p => p.evaluate(() => document.documentElement.className || '(none)'));

  // ── Home, Settings, Share, Race setup (phone) ─────────────────────────────
  if (want('home')) {
  page = await newPage(browser, PHONE);
  current.section = 'Home';
  await ev('HOME-01', '§4.1', 'Open the app at /', 'Navy header: badge, "RaceTracker", "Ipswich & District Radio Club · VK4WIP", "Offline ready" status. Current race card (name, date, checkpoint count, start time). Three role cards (≥76px): Checkpoint, Base station, Race setup — icon tile, title, one-line description, chevron. Primary button at bottom: Scan race QR code (existing import flow). Footer lockup: "Ipswich & District Radio Club · VK4WIP".',
    async p => { await p.goto(BASE); await p.getByRole('heading', { name: 'RaceTracker' }).waitFor(); },
    { show: [S('Header', p => p.locator('header').first()), S('Checkpoint role card', btn(/^checkpoint\b/i)), V('Role card heights', p => p.evaluate(() => [...document.querySelectorAll('button')].filter(b => /^(Checkpoint|Base station|Race setup)/.test(b.innerText)).map(b => `${b.innerText.split('\n')[0]} ${Math.round(b.getBoundingClientRect().height)}px`).join(', ')))] });
  await ev('HOME-02', '§4.1', 'Click "Scan race QR code"', 'Opens the existing import flow (QR scanner).',
    async p => { await p.getByRole('button', { name: /scan race qr code/i }).click(); },
    { show: [S('Dialog', p => p.getByRole('dialog').first())] });
  await ev('HOME-03', '§4.1', 'Close the scanner, then click the "Checkpoint" role card', 'Role cards keep the existing navigation (choose race, then checkpoint). Navigation protection unchanged.',
    async p => { await p.getByRole('button', { name: 'Close scanner' }).click().catch(() => {}); await p.keyboard.press('Escape'); await p.goto(BASE); await p.getByRole('button', { name: /^checkpoint\b/i }).click(); },
    { show: [V('URL', p => p.url().replace(BASE, '')), S('Dialog heading', p => p.getByRole('dialog').getByRole('heading').first())] });
  await ev('HOME-04', 'Fixes C6', 'Open Race setup and scroll to the footer', 'Footer text "Ipswich & District Radio Club · VK4WIP" (not "VK4WIP Radio Club").',
    async p => { await p.goto(`${BASE}/race-maintenance/setup`); await p.getByRole('contentinfo').scrollIntoViewIfNeeded(); },
    { show: [S('Footer', p => p.getByRole('contentinfo').locator('p').first())] });

  current.section = 'Settings';
  await ev('SET-01', '§4.4', 'Home → click the Settings (cog) button', 'Sections: Display (Theme segmented: Light / Dark / Sunlight; text-size slider), Status colours (rows with swatch, name, description; "Reset to club colours"), Race data (Share or import race config).',
    async p => { await p.goto(BASE); await p.getByRole('button', { name: 'Settings', exact: true }).click(); },
    { show: [V('Section headings', p => p.getByRole('dialog').locator('h3').allInnerTexts().then(t => t.join(' · '))), S('Theme: Light', btn('Light', { exact: true }))] });
  await ev('SET-02', '§4.4', 'Click Theme → "Sunlight"', 'Sunlight = new high-contrast theme option (pure white bg, ink text, thicker borders).',
    async p => { await p.getByRole('button', { name: 'Sunlight', exact: true }).click(); },
    { show: [S('Theme: Sunlight', btn('Sunlight', { exact: true })), htmlClass, V('Body background', p => p.evaluate(() => getComputedStyle(document.body).backgroundColor))] });
  await ev('SET-03', '§4.4 / G6 / Fixes C3', 'Click Theme → "Dark"', 'Dark mode: muted labels, the "Reset to club colours" link and "Standard · 100%" at least 4.5:1; Called-in swatch has a light outline.',
    async p => { await p.getByRole('button', { name: 'Dark', exact: true }).click(); },
    { show: [htmlClass, S('Section heading', p => p.getByRole('dialog').locator('h3').first(), ['color']), S('"Reset to club colours"', btn(/reset to club colours/i), ['color']), S('Text size label', p => p.getByText(/· \d+%$/), ['color']), V('axe colour-contrast', async p => { const AxeBuilder = (await import('@axe-core/playwright')).default; const r = await new AxeBuilder({ page: p }).withRules(['color-contrast']).analyze(); return r.violations.length ? r.violations.flatMap(v => v.nodes.map(n => n.target.join(' '))).join('; ') : 'no violations'; })] });
  await ev('SET-04', '§3.2 / §4.4', 'Click "Light", then drag Text size to 130%', 'Keep the existing --font-scale setting; all sizes scale with it.',
    async p => { await p.getByRole('button', { name: 'Light', exact: true }).click(); await p.locator('#text-size').fill('1.3'); },
    { show: [V('--font-scale', p => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-scale'))), S('Text size label', p => p.getByText(/· \d+%$/))] });
  await ev('SET-05', '§4.4 / G7', 'Change the "Passed" colour to #2a9d8f with its swatch', 'Users may still recolour in Settings.',
    async p => { await p.locator('#text-size').fill('1'); await p.getByLabel('Passed colour').fill('#2a9d8f'); },
    { show: [V('--color-status-passed', p => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-passed')))] });
  await ev('SET-06', '§4.4', 'Click "Reset to club colours"', 'Status colours … "Reset to club colours".',
    async p => { await p.getByRole('button', { name: /reset to club colours/i }).click(); },
    { show: [V('--color-status-passed (club blue = 30 92 179)', p => p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-passed')))] });
  await ev('SET-07', 'Fixes C2', 'Look at the accessibility toggles', 'Settings toggles: club blue when on, border colour when off.',
    async () => {},
    { show: [V('Toggle colours (on/off)', p => p.getByRole('switch').evaluateAll(els => els.map(e => `${e.getAttribute('aria-checked')}: ${getComputedStyle(e).backgroundColor}`).join(', ')))] });
  await ev('SET-08', 'Fixes D3', 'Click "Dark", then "Cancel"', 'Settings Cancel undoes the live theme preview.',
    async p => { await p.getByRole('button', { name: 'Dark', exact: true }).click(); await p.getByRole('button', { name: 'Cancel' }).click(); },
    { show: [htmlClass] });
  await ev('SET-09', 'Fixes D3', 'Settings → "Dark" → "Save Changes", then reload the page', 'Settings persist after reload.',
    async p => { await p.getByRole('button', { name: 'Settings', exact: true }).click(); await p.getByRole('button', { name: 'Dark', exact: true }).click(); await p.getByRole('button', { name: /save changes/i }).click(); await p.reload(); await p.getByRole('heading', { name: 'RaceTracker' }).waitFor(); },
    { show: [htmlClass] });

  current.section = 'Share race config';
  await ev('SHARE-01', '§4.3 / Fixes C1', 'Settings → "Light" → Save; Settings → Race data → "Share or import race config"', 'Existing QR export: large QR in a white card with shadow, runner/checkpoint count; Download / Email / Copy tiles; primary "Show full screen" (QRDisplayFullscreen). Note "Works without internet — device to device". Locked buttons: dashed border, muted text.',
    async p => {
      await p.getByRole('button', { name: 'Settings', exact: true }).click(); await p.getByRole('button', { name: 'Light', exact: true }).click(); await p.getByRole('button', { name: /save changes/i }).click();
      await p.getByRole('button', { name: 'Settings', exact: true }).click(); await p.getByRole('button', { name: /share or import race config/i }).click(); await p.getByRole('heading', { name: /scan to load/i }).waitFor();
    },
    { show: [S('QR card note', p => p.getByText(/too large for one QR|runners · \d+ checkpoints/).first()), S('Show full screen', btn(/full screen/i), ['bg', 'border', 'color'])] });
  await ev('SHARE-02', '§4.3', 'Click the "Copy" tile', 'Download / Email / Copy tiles.',
    async p => { await p.context().grantPermissions(['clipboard-read', 'clipboard-write']); await p.getByRole('button', { name: 'Copy' }).click(); },
    { show: [S('Copy tile', btn(/^Cop(y|ied)$/)), V('Clipboard starts', p => p.evaluate(() => navigator.clipboard.readText().then(t => t.slice(0, 60))))] });
  await ev('SHARE-03', 'Fixes A7', 'Click the "Email" tile (no Web Share on this browser)', 'Download the .json file and open mailto: with a short body (instructions only, ≤ 1,800 characters) telling the reader to attach it. The share payload contains no results.',
    async () => {},
    { show: [async p => {
      await p.evaluate(() => { navigator.canShare = undefined; window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.getByRole('button', { name: 'Email' }).click()]);
      const pkg = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
      const mailto = (await p.evaluate(() => window.__opened))[0] ?? '';
      return [`Downloaded: ${dl.suggestedFilename()} — data: ${Object.keys(pkg.data).join(', ')}`, `mailto: ${mailto.length} characters — ${decodeURIComponent(mailto).slice(0, 140)}…`];
    }] });
  await ev('SHARE-04', 'Fixes A7', '"Import a race instead" → Import tab → choose a race file the mail app labelled application/octet-stream', 'File import accepts by content, not file.type (.json, application/json, application/octet-stream, text/plain, \'\').',
    async p => {
      const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Download' }).click()]);
      const buf = fs.readFileSync(await dl.path());
      await p.getByRole('button', { name: /import a race instead/i }).click();
      const dialog = p.getByRole('dialog', { name: /import.*export/i });
      await dialog.getByRole('button', { name: /import configuration/i }).first().click();
      await dialog.locator('input[type="file"]').setInputFiles({ name: 'race-setup.json', mimeType: 'application/octet-stream', buffer: buf });
    },
    { show: [S('Import message', p => p.getByText(/file loaded successfully|isn't a race file/i).first())] });

  current.section = 'Race setup';
  await ev('SETUP-01', '§4.2 / Fixes C7', 'Open /race-maintenance/setup', 'Navy header with step and a gold progress bar. Restyle only; keep the wizard. Mt Glorious template per the WICEN brief: start 06:30, checkpoints / distances / operators from spec §10 (bib range unchanged).',
    async p => { await p.goto(`${BASE}/race-maintenance/setup`); await p.getByText('Start from Scratch').waitFor(); },
    { show: [S('Mt Glorious template card', btn(/Mt Glorious Mountain Trail/)), S('Template tag', p => p.getByRole('button', { name: /Mt Glorious/ }).locator('span').first(), ['bg', 'color'])] });
  await ev('SETUP-02', 'Fixes C7', 'Click the Mt Glorious template', 'Start 06:30 (spec §10).',
    async p => { await p.getByRole('button', { name: /Mt Glorious Mountain Trail/ }).click(); await p.locator('#startTime').waitFor(); },
    { show: [S('Start time', p => p.locator('#startTime')), S('Checkpoints', p => p.locator('#numCheckpoints'))] });
  await ev('SETUP-03', '§4.2', 'Back to templates; "Start from Scratch", enter name / date / start time, click Next', 'Keep the wizard (Back secondary, Next primary).',
    async p => {
      await p.goto(`${BASE}/race-maintenance/setup`);
      await p.getByText('Start from Scratch').click();
      await p.fill('#name', 'Validation Race'); await p.fill('#date', '2026-11-08'); await p.fill('#startTime', '06:30');
      await p.getByRole('button', { name: /next|continue/i }).first().click();
      await p.locator('#min').waitFor();
    },
    { show: [S('Step heading', p => p.getByRole('heading').filter({ hasText: /runner/i }).first())] });
  await ev('SETUP-04', '§4.2 / G1 / Fixes C5', 'Enter From 100, To 349 and click "Add Range"', 'Runner ranges input, live count ("250 runners will be created") and first/last preview chips. Configured range row must not overflow at 390px (badge and delete inside the card; delete has aria-label).',
    async p => { await p.fill('#min', '100'); await p.fill('#max', '349'); await p.getByRole('button', { name: /add range/i }).click(); await p.getByText(/runners will be created/).scrollIntoViewIfNeeded(); },
    { show: [S('Live count', p => p.getByText(/runners will be created/).locator('..')), S('Delete', btn(/^Remove range 100-349$/)), pageWidth] });
  await ev('SETUP-05', '§4.2 / Fixes C5', 'Scroll to the bottom of the runners step', 'Back/Next buttons: short labels ("Back", "Next: Waves") on one line.',
    async p => { await p.getByRole('button', { name: 'Next: Waves' }).scrollIntoViewIfNeeded(); },
    { show: [V('Back / Next', p => Promise.all(['Back', 'Next: Waves'].map(async n => { const b = await p.getByRole('button', { name: n, exact: true }).boundingBox(); return `"${n}" ${Math.round(b.height)}px high`; })).then(x => x.join(', '))), S('CSV / WebScorer link', p => p.getByText(/Import a CSV or WebScorer file/).first())] });
  await page.context().close();
  }

  // ── Checkpoint (phone) ────────────────────────────────────────────────────
  if (want('cp')) {
  page = await newPage(browser, PHONE);
  current.section = 'Checkpoint — Mark off';
  const status = S('Status line', T('markoff-status'));
  await ev('CP-01', '§4.5 Layout / Fixes B1 B2 C1', 'Open /checkpoint/3', 'AppBar (checkpoint number, location + operator callsign — two lines rather than an ellipsis) with 3 StatTiles → quick-entry input + gold Mark (locked until a number is typed) → status line → group chips → tile grid. Share batch is a labelled icon in the app bar with a count.',
    async p => { await p.goto(`${BASE}/checkpoint/3`); await tile(p, 100).waitFor(); },
    { show: [S('Subtitle', p => p.getByText('England Creek Rd & Joyners Ridge Rd · VK4PMC')), V('Subtitle cut off?', p => p.getByText('England Creek Rd & Joyners Ridge Rd · VK4PMC').evaluate(el => (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) ? 'yes' : 'no')), S('Share batch', btn(/^Share batch/)), S('Mark (empty entry)', p => p.getByRole('form', { name: 'Quick runner entry' }).getByRole('button'), ['border', 'color'])] });
  await ev('CP-02', '§4.5 Behaviour 1', 'Tap tile 101 (not passed)', 'Tap a not-passed tile → mark passed at now.',
    async p => { await tile(p, 101).click(); }, { show: [S('Tile 101', p => tile(p, 101), ['bg']), status] });
  await ev('CP-03', '§4.5 Behaviour 6', 'Type "103, 104 105" in quick entry and press Enter', 'Quick entry accepts multiple numbers, marks each at now, message "3 runners marked at 07:47".',
    async p => { await quick(p, '103, 104 105'); }, { show: [status, S('Share batch', btn(/^Share batch/))] });
  await ev('CP-04', 'G1 / §4.5 Behaviour 6', 'Type "110-115 999 101" and press Enter', 'Individual numbers only. Unknown / already-marked numbers are not marked.',
    async p => { await quick(p, '110-115 999 101'); }, { show: [status] });
  await ev('CP-05', '§4.5 Behaviour 6', 'Type "125" and press Enter', 'Jumps the grid to the group of the first number.',
    async p => { await quick(p, '125'); }, { show: [status, S('Group chip 120–139', btn('120–139'))] });
  await ev('CP-06', '§4.5', 'Tap group chip "100–119"', 'Group chips (20 per group).',
    async p => { await p.getByRole('button', { name: '100–119' }).click(); }, { show: [S('Group chip 100–119', btn('100–119'), ['bg'])] });
  await ev('CP-07', '§4.5 Behaviour 2–3', 'Tap tile 101 again (passed)', 'Edit sheet: bib, "Passed · not called in yet", "Marked at HH:MM", TimeStepper, Save HH:MM (or "Keep time"), Unmark runner, Cancel.',
    async p => { await tile(p, 101).click(); await sheet(p).waitFor(); },
    { show: [S('Sheet', sheet), S('Primary', p => sheet(p).getByRole('button').filter({ hasText: /Keep time|Save/ }))] });
  await ev('CP-08', '§3.5 TimeStepper', 'In the sheet tap "−5"', 'Primary changes to "Save HH:MM"; "Was HH:MM" note.',
    async p => { await p.getByLabel('5 minutes earlier').click(); },
    { show: [S('Primary', p => sheet(p).getByRole('button').filter({ hasText: /Keep time|Save/ })), S('Note', p => sheet(p).getByText(/^Was /))] });
  await ev('CP-09', '§3.5 TimeStepper / Fixes B4', 'Tap "+5" three times', 'Clamp to now. Back at the original minute the button reads "Keep time" and the "Was" note is hidden.',
    async p => { for (let i = 0; i < 3; i++) await p.getByLabel('5 minutes later').click(); },
    { show: [S('Primary', p => sheet(p).getByRole('button').filter({ hasText: /Keep time|Save/ })), V('"Was" note', p => sheet(p).getByText(/^Was /).count().then(n => n ? 'shown' : 'hidden'))] });
  await ev('CP-10', '§4.5 Behaviour 3', 'Tap "−5" twice, then "Save HH:MM"', 'Save changes the time; status line confirms.',
    async p => { await p.getByLabel('5 minutes earlier').click(); await p.getByLabel('5 minutes earlier').click(); await p.getByRole('button', { name: /^Save / }).click(); },
    { show: [status, S('Tile 101', p => tile(p, 101))] });
  await ev('CP-11', '§4.5 Behaviour 4', 'Tap tile 103 → "Unmark runner"', 'Tile becomes "unmarked earlier" (dashed blue, was HH:MM); UndoBar "103 unmarked · Undo".',
    async p => { await tile(p, 103).click(); await p.getByRole('button', { name: 'Unmark runner' }).click(); },
    { show: [S('Tile 103', p => tile(p, 103), ['border']), S('Undo bar', p => p.getByRole('status').filter({ hasText: 'Undo' }))] });
  await ev('CP-12', '§4.5 Behaviour 4 / G5', 'Tap "Undo" on the undo bar', 'Undo restores the original record exactly.',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); }, { show: [S('Tile 103', p => tile(p, 103))] });
  await ev('CP-13', '§4.5 Behaviour 4 / Fixes D3', 'Tap tile 104 → "Unmark runner", wait 6.5 s', 'Tile becomes "unmarked earlier"; Undo auto-dismisses after ~6 s.',
    async p => { await tile(p, 104).click(); await p.getByRole('button', { name: 'Unmark runner' }).click(); await p.getByRole('button', { name: 'Undo' }).waitFor(); await p.waitForTimeout(6500); },
    { show: [S('Tile 104', p => tile(p, 104), ['border']), V('Undo bar after 6.5 s', p => p.getByRole('button', { name: 'Undo' }).count().then(n => n ? 'still shown' : 'gone'))] });
  await ev('CP-14', '§4.5 Behaviour 5', 'Tap tile 104 (unmarked earlier)', 'Restore mode: "Unmarked earlier · It had been marked at 07:37", primary Mark at 07:37, secondary Use now (HH:MM).',
    async p => { await tile(p, 104).click(); await sheet(p).waitFor(); },
    { show: [S('Sheet', sheet)] });
  await ev('CP-15', '§4.5 Behaviour 5', 'Tap "Mark at HH:MM"', 'Restores the original time.',
    async p => { await p.getByRole('button', { name: /^Mark at / }).click(); }, { show: [status, S('Tile 104', p => tile(p, 104))] });
  await ev('CP-16', '§4.5 Behaviour 7 / Fixes B3', 'In Overview mark 119 DNS, back to Mark off, scroll the grid to the bottom, tap tile 119', 'DNS/DNF tiles are not editable here. The quick-entry bar and status line stay in view while the grid scrolls.',
    async p => {
      await cpTab(p, 'Overview').click();
      await p.locator('button[aria-expanded]').filter({ hasText: /^119/ }).click();
      await p.getByRole('button', { name: 'Mark DNS' }).click();
      await cpTab(p, 'Mark off').click();
      await p.locator('main[data-screenshot-target]').evaluate(el => { el.scrollTop = el.scrollHeight; });
      await tile(p, 119).click();
    },
    { show: [status, V('Status line in view', p => T('markoff-status')(p).evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight ? 'yes' : 'no'; }))] });
  await ev('CP-17', 'Accessibility (Fixes D3)', 'Tap tile 101, press Tab 12 times, then Escape', 'Sheets trap focus and close on Escape.',
    async p => { await tile(p, 101).click(); await sheet(p).waitFor(); for (let i = 0; i < 12; i++) await p.keyboard.press('Tab'); },
    { show: [V('Focus inside the sheet after 12 Tabs', p => sheet(p).evaluate(el => el.contains(document.activeElement) ? 'yes' : 'no')), async p => { await p.keyboard.press('Escape'); await p.waitForTimeout(200); return `Sheet after Escape: ${await sheet(p).count() ? 'open' : 'closed'}`; }] });

  current.section = 'Checkpoint — Callout sheet';
  await ev('CO-01', '§4.6 / Fixes B1', 'Mark 107 108 109, then tap the "Callout" tab', 'Title "CP3 · Callout", subtitle "VK4PMC → VK4WIP · 147.225". Call-due banner when ≥ 5 waiting or oldest ≥ 5 min. Next call card with one white card per pending block. Read out + Base copied — mark sent.',
    async p => { await quick(p, '107 108 109'); await cpTab(p, 'Callout').click(); },
    { show: [S('Title', p => p.getByRole('heading', { level: 1 })), S('Subtitle', p => p.getByText('VK4PMC → VK4WIP · 147.225')), S('Call due', p => p.getByRole('status').filter({ hasText: 'Call due' })), S('Pending block', T('pending-block'))] });
  await ev('CO-02', '§4.6', 'Tap "Base copied — mark sent"', 'Marks every pending runner called in; called-in blocks collapse to one compact row.',
    async p => { await p.getByRole('button', { name: /base copied — mark sent/i }).click(); },
    { show: [V('Callout badge', p => p.getByLabel(/to call in$/).count().then(n => n ? 'shown' : 'gone (nothing left to call in)')), S('Sent row', p => p.getByText(/^Sent \d\d:\d\d/).first())] });
  await ev('CO-03', 'Fixes A3', 'Mark off → tap 101 (called in) → move it one minute inside its 5-minute block', 'Same block → no correction. Sheet note "Same common time (HH:MM) — base doesn\'t need a correction."',
    async p => {
      await cpTab(p, 'Mark off').click(); await tile(p, 101).click();
      const minute = Number((await tile(p, 101).getAttribute('aria-label')).match(/:(\d\d)$/)[1]);
      await sheet(p).getByLabel(minute % 5 === 0 ? '1 minute later' : '1 minute earlier').click();
    },
    { show: [S('Note', T('same-block-note')), V('Correction warning', p => T('correction-warning')(p).count().then(n => n ? 'shown' : 'not shown'))] });
  await ev('CO-04', 'Fixes A3', 'Tap "Save HH:MM"', 'Keep calledIn, no correction, no ✎. Status line "101 time changed — same common time, nothing to send".',
    async p => { await p.getByRole('button', { name: /^Save / }).click(); },
    { show: [status, S('Tile 101', p => tile(p, 101)), V('Callout badge', p => p.getByLabel(/to call in$/).count().then(n => n ? 'shown' : 'none'))] });
  await ev('CO-05', '§4.5 Behaviour 3', 'Tap 101 again → "−5"', 'Block changes → warning box "Base already has 07:31. A changed time goes back on the callout sheet as a correction."',
    async p => { await tile(p, 101).click(); await p.getByLabel('5 minutes earlier').click(); },
    { show: [S('Warning', T('correction-warning'), ['bg', 'border'])] });
  await ev('CO-06', '§4.5 Behaviour 3 / §4.6', 'Tap "Save HH:MM", then the "Callout" tab', 'Saving sets correction = true; tile shows ✎; corrections appear in the pending list tagged "Correction".',
    async p => { await p.getByRole('button', { name: /^Save / }).click(); await cpTab(p, 'Callout').click(); },
    { show: [S('Pending block', T('pending-block'))] });
  await ev('CO-07', '§4.6', 'Tap "Official message", type a message', 'Official message … (plain buttons; v1 can open a simple notes modal / log entry).',
    async p => { await p.getByRole('button', { name: 'Official message' }).click(); await p.locator('[role="dialog"] textarea').fill('Request extra water at CP3'); },
    { show: [S('Dialog', p => p.getByRole('dialog').getByRole('heading').first()), S('Message', p => p.locator('[role="dialog"] textarea'))] });
  await ev('CO-08', '§4.6', 'Tap "Log message"', 'v1 can open a simple notes modal / log entry.',
    async p => { await p.getByRole('button', { name: 'Log message' }).click(); },
    { show: [S('Log', p => p.getByText(/logged|in the log/i).first())] });
  await ev('CO-09', '§4.6', 'Tap "Request stand down"', 'Request stand down (plain button; v1 notes modal / log entry). No radio phrases on screen.',
    async p => { await p.getByRole('button', { name: 'Request stand down' }).click(); },
    { show: [S('Dialog', p => p.getByRole('dialog').first())] });

  current.section = 'Checkpoint — Read-out';
  await ev('RO-01', '§4.7 / Fixes C1', 'Cancel; send the pending correction; mark 12 runners (130–141); tap "Read out"', 'Numbers split into overs of up to 5, each bib its own row. Lead "Common time 07:45". Base copied — next locked (dashed) until every number is ticked ("Tick each number as you read · 0 of 5").',
    async p => {
      await p.getByRole('button', { name: 'Cancel' }).click();
      await p.getByRole('button', { name: /base copied — mark sent/i }).click();
      await cpTab(p, 'Mark off').click();
      await quick(p, '130 131 132 133 134 135 136 137 138 139 140 141');
      await cpTab(p, 'Callout').click();
      await p.getByRole('button', { name: 'Read out' }).click();
    },
    { show: [S('Lead', p => p.getByText(/^(Common time|Continuing) \d\d:\d\d$/)), V('Rows', p => p.getByRole('checkbox').count()), S('Next', btn(/^Tick each number/), ['border', 'color'])] });
  await ev('RO-02', '§4.7', 'Tick the first two numbers', 'Ticked rows muted, struck through; "Tick each number as you read · 2 of 5".',
    async p => { const boxes = p.getByRole('checkbox'); await boxes.nth(0).check(); await boxes.nth(1).check(); },
    { show: [S('Next', btn(/^Tick each number/))] });
  await ev('RO-03', '§4.7', 'Tap "Reset"', 'Reset clears ticks on the current over.',
    async p => { await p.getByRole('button', { name: 'Reset' }).click(); },
    { show: [V('Ticked', p => p.getByRole('checkbox', { checked: true }).count())] });
  await ev('RO-04', '§4.7', 'Tick all numbers in the over', 'Base copied — next unlocks.',
    async p => { const boxes = p.getByRole('checkbox'); for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check(); },
    { show: [S('Next', btn(/base copied — next/i), ['bg'])] });
  await ev('RO-05', '§4.7', 'Tap "Base copied — next"', 'Next over: lead "Continuing 07:45"; progress advances.',
    async p => { await p.getByRole('button', { name: /base copied — next/i }).click(); },
    { show: [S('Lead', p => p.getByText(/^(Common time|Continuing) \d\d:\d\d$/)), S('Progress', p => p.getByText(/copied by base/))] });
  await ev('RO-06', '§4.7', 'Tick one number, tap back, then tap "Read out" again', 'Read-out progress persists.',
    async p => { await p.getByRole('checkbox').first().check(); await p.getByRole('button', { name: /back to callout sheet/i }).click(); await p.getByRole('button', { name: 'Read out' }).click(); },
    { show: [S('Lead', p => p.getByText(/^(Common time|Continuing) \d\d:\d\d$/)), V('Ticked', p => p.getByRole('checkbox', { checked: true }).count())] });
  await ev('RO-07', '§4.7', 'Tap "Previous over"', 'Previous over steps back.',
    async p => { await p.getByRole('button', { name: 'Previous over' }).click(); },
    { show: [S('Lead', p => p.getByText(/^(Common time|Continuing) \d\d:\d\d$/))] });
  await ev('RO-08', '§4.7', 'Complete every over to the end', 'Done state "All N copied", which marks the block called in.',
    async p => {
      for (let k = 0; k < 6; k++) {
        const next = p.getByRole('button', { name: /base copied — next|tick each number/i });
        if (!(await next.isVisible().catch(() => false))) break;
        const boxes = p.getByRole('checkbox');
        for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).check();
        await p.getByRole('button', { name: /base copied — next/i }).click();
        await p.waitForTimeout(200);
      }
    },
    { show: [S('Done', p => p.getByText(/^All \d+ copied/))] });

  current.section = 'Checkpoint — Overview';
  await ev('OV-01', '§4.8 / Fixes B1 B5', 'Back to callout, tap the "Overview" tab', 'Title "CP3 · Overview"; hint in the list header. Stacked bar: DNS muted dashed, DNF red; aria-label "20 called in, 0 passed not called in, 39 to come, 1 DNS, 0 DNF".',
    async p => { await p.getByRole('button', { name: 'Back to callout', exact: true }).click(); await cpTab(p, 'Overview').click(); },
    { show: [S('Title', p => p.getByRole('heading', { level: 1 })), S('Bar', p => p.getByRole('img', { name: /called in, / })), S('DNS segment', T('bar-dns'), ['bg', 'border']), S('List header', p => p.getByText('Tap a runner to fix it'))] });
  await ev('OV-02', '§4.8', 'Tap filter "Passed"', 'Filter pills: All · Passed · To come · DNS / DNF.',
    async p => { await p.getByRole('button', { name: 'Passed', exact: true }).click(); },
    { show: [S('Filter Passed', btn('Passed', { exact: true }))] });
  await ev('OV-03', '§4.8 table (Called in)', 'Tap row 107 (called in)', 'Called in: TimeStepper, Undo call-in, Reset — not passed, Mark DNF (+ note "Base already has HH:MM. Changing the time sends a correction.")',
    async p => { await p.locator('button[aria-expanded]').filter({ hasText: /^107/ }).click(); },
    { show: [S('Row 107', p => p.locator('button[aria-expanded]').filter({ hasText: /^107/ })), V('Actions', p => p.locator('button[aria-expanded="true"]').locator('xpath=..').getByRole('button').allInnerTexts().then(t => t.slice(1).join(' · ')))] });
  await ev('OV-04', '§4.8', 'Tap "Undo call-in"', 'Every action shows UndoBar; totals and the Callout badge update.',
    async p => { await p.getByRole('button', { name: 'Undo call-in' }).click(); },
    { show: [S('Undo bar', p => p.getByRole('status').filter({ hasText: 'Undo' })), S('Callout badge', p => p.getByLabel(/to call in$/))] });
  await ev('OV-05', '§4.8 table (Passed)', 'Row 107 now Passed: tap "Mark called in"', 'Passed: TimeStepper, Mark called in, Reset — not passed, Mark DNF.',
    async p => { await p.getByRole('button', { name: 'Mark called in' }).click(); },
    { show: [S('Row 107', p => p.locator('button[aria-expanded]').filter({ hasText: /^107/ }))] });
  await ev('OV-06', 'Fixes B6', 'On row 107 tap "−5", then "+5"', 'The stepper changes a local value; nothing saved, no correction. A gold "Save HH:MM" appears only while it differs.',
    async p => { await p.getByLabel('5 minutes earlier').click(); await p.getByLabel('5 minutes later').click(); },
    { show: [V('Save button', p => p.getByRole('button', { name: /^Save \d\d:\d\d$/ }).count().then(n => n ? 'shown' : 'not shown')), S('Row 107', p => p.locator('button[aria-expanded]').filter({ hasText: /^107/ }))] });
  await ev('OV-07', 'Fixes B6 / §4.8', 'Tap "−5", then "Save HH:MM"', 'Save applies the A3 rule once (new block → correction); Undo restores exactly.',
    async p => { await p.getByLabel('5 minutes earlier').click(); await p.getByRole('button', { name: /^Save \d\d:\d\d$/ }).click(); },
    { show: [S('Row 107', p => p.locator('button[aria-expanded]').filter({ hasText: /^107/ })), S('Undo bar', p => p.getByRole('status').filter({ hasText: 'Undo' }))] });
  await ev('OV-08', '§4.8', 'Tap "Reset — not passed", then "Undo"', 'Every action shows UndoBar.',
    async p => { await p.getByRole('button', { name: 'Reset — not passed' }).click(); await p.waitForTimeout(300); await p.getByRole('button', { name: 'Undo' }).click(); },
    { show: [S('Row 107', p => p.locator('button[aria-expanded]').filter({ hasText: /^107/ }))] });
  await ev('OV-09', '§4.8 table (To come)', 'Filter "To come", tap row 102', 'To come: Passed now (HH:MM) (gold), Mark DNS, Mark DNF.',
    async p => { await p.getByRole('button', { name: 'To come', exact: true }).click(); await p.locator('button[aria-expanded]').filter({ hasText: /^102/ }).click(); },
    { show: [S('Passed now', btn(/^Passed now/), ['bg'])] });
  await ev('OV-10', '§4.8', 'Tap "Mark DNF"', 'DNF shown with red style; counts update.',
    async p => { await p.getByRole('button', { name: 'Mark DNF' }).click(); },
    { show: [V('Stat tiles', p => p.locator('.grid-cols-4').first().innerText().then(t => t.replace(/\s+/g, ' '))), V('Row 102 in "To come"', p => p.locator('button[aria-expanded]').filter({ hasText: /^102/ }).count().then(n => n ? 'still listed' : 'gone (now DNF)'))] });
  await ev('OV-11', '§4.8 table (DNS / DNF)', 'Filter "DNS / DNF", tap row 102', 'DNS / DNF: Clear DNS/DNF, Passed now (+ note that base is flagged).',
    async p => {
      await p.getByRole('button', { name: 'DNS / DNF' }).click();
      const row = p.locator('button[aria-expanded]').filter({ hasText: /^102/ });
      if ((await row.getAttribute('aria-expanded')) !== 'true') await row.click();
    },
    { show: [S('Row 102', p => p.locator('button[aria-expanded]').filter({ hasText: /^102/ }), ['color'])] });
  await ev('OV-12', '§4.8', 'Tap "Clear DNF"', 'Clear DNS/DNF; UndoBar.',
    async p => { await p.getByRole('button', { name: 'Clear DNF' }).click(); },
    { show: [S('Undo bar', p => p.getByRole('status').filter({ hasText: 'Undo' }))] });
  await page.context().close();

  // Read-out across two blocks, overs of 3 (separate race state)
  const passes = [140, 141, 142, 143].map(number => ({ cp: 3, number, minutesAgo: 22 })).concat([150, 151].map(number => ({ cp: 3, number, minutesAgo: 8 })));
  page = await newPage(browser, PHONE, { cpPasses: passes, overSize: 3 });
  current.section = 'Checkpoint — Read-out';
  const lead = S('Lead', p => p.getByText(/^(Common time|Continuing) \d\d:\d\d$/));
  const rows = V('Numbers in this over', p => p.getByRole('checkbox').count());
  const tickAll = async (p) => { const b = p.getByRole('checkbox'); for (let i = 0; i < await b.count(); i++) await b.nth(i).check(); };
  await ev('RO-09', 'Fixes D3 / §4.7', 'Race with overs of 3; four runners in one block and two in the next; Callout → "Read out"', 'Read-out across two blocks; overSize 3.',
    async p => { await p.goto(`${BASE}/checkpoint/3`); await cpTab(p, 'Callout').click(); await p.getByRole('button', { name: 'Read out' }).click(); },
    { show: [lead, rows] });
  await ev('RO-10', 'Fixes D3 / §4.7', 'Tick all, "Base copied — next"', 'The rest of the first block continues ("Continuing").',
    async p => { await tickAll(p); await p.getByRole('button', { name: /base copied — next/i }).click(); }, { show: [lead, rows] });
  await ev('RO-11', 'Fixes D3 / §4.7', 'Tick all, "Base copied — next"', 'The second block starts "Common time".',
    async p => { await tickAll(p); await p.getByRole('button', { name: /base copied — next/i }).click(); }, { show: [lead, rows] });
  await page.context().close();

  // Sunlight on the working screens (C4)
  page = await newPage(browser, PHONE);
  current.section = 'Sunlight';
  const sun = [V('Body background', p => p.evaluate(() => getComputedStyle(document.body).backgroundColor)), V('Main background', p => p.evaluate(() => getComputedStyle(document.querySelector('[data-screenshot-target]') ?? document.body).backgroundColor))];
  await ev('SUN-01', 'Fixes C4 / §4.4', 'Settings → Sunlight → Save; open CP3 Mark off and mark 100 101 102', 'Sunlight: white page, ink text, 2px borders.',
    async p => {
      await p.goto(BASE); await p.getByRole('button', { name: 'Settings', exact: true }).click(); await p.getByRole('button', { name: 'Sunlight', exact: true }).click(); await p.getByRole('button', { name: /save changes/i }).click();
      await p.goto(`${BASE}/checkpoint/3`); await tile(p, 100).waitFor(); await quick(p, '100 101 102');
    },
    { show: [...sun, S('Tile 110', p => tile(p, 110), ['border'])] });
  await ev('SUN-02', 'Fixes C4', 'Tap "Callout"', 'Sunlight on Callout.', async p => { await cpTab(p, 'Callout').click(); }, { show: sun });
  await ev('SUN-03', 'Fixes C4', 'Tap "Read out"', 'Sunlight on Read-out.', async p => { await p.getByRole('button', { name: 'Read out' }).click(); }, { show: sun });
  await ev('SUN-04', 'Fixes C4', 'Base station → Receive → "CP1"', 'Sunlight on Receive.',
    async p => { await p.goto(`${BASE}/base-station/operations`); await p.getByRole('button', { name: /^CP1,/ }).click(); }, { show: [...sun, S('Block button', p => p.getByRole('group', { name: 'Common time block' }).getByRole('button').first(), ['border'])] });
  await page.context().close();
  }

  // ── Base (tablet, with earlier calls already received) ────────────────────
  if (want('base')) {
  page = await newPage(browser, TABLET, { withBaseData: true });
  current.section = 'Base — Receive';
  const flash = S('Status line', T('rx-flash'));
  const selected = S('Selected block', p => p.getByRole('group', { name: 'Common time block' }).locator('[aria-pressed="true"]'));
  const chipOf = (n) => (p) => p.getByTestId('rx-numbers').getByRole('button', { name: new RegExp(`^Remove ${n}\\b`) });
  await ev('RX-01', '§4.9 / §3.5 BaseTabs', 'Open /base-station/operations (tablet 1112×834)', 'Idle "Who\'s calling?": grid of compact buttons (≥64px) for CP1–CP3, Finish: short name, status pill, "VK4PMC · up to 07:15". Checkpoint board rows: "Up to 07:15 · 30 min behind · call 11m ago", count, pill.',
    async p => { await p.goto(`${BASE}/base-station/operations`); await p.getByRole('heading', { name: /who's calling/i }).waitFor(); },
    { show: [S('CP1 button', btn(/^CP1,/)), S('Board CP1', T('board-CP1')), V('Page scroll', p => p.evaluate(() => `${document.scrollingElement.scrollHeight - innerHeight}px`))] });
  await ev('RX-02', '§4.9 / Fixes B7 C1', 'Tap "CP1"', 'Default selection = next unreceived block. "Exact" pinned outside the scrolling block row. Complete locked (dashed) with nothing taken.',
    async p => { await p.getByRole('button', { name: /^CP1,/ }).click(); },
    { show: [selected, S('Exact', p => p.locator('#exact-time'), ['border']), V('Exact in view with the row scrolled to the start', async p => { await p.getByRole('group', { name: 'Common time block' }).evaluate(el => { el.scrollLeft = 0; }); return p.locator('#exact-time').evaluate(el => { const r = el.getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0 ? 'yes' : 'no'; }); }), S('Complete', btn(/^Complete/), ['border', 'color'])] });
  await ev('RX-03', '§4.9 / §3.5 NumberPad', 'Type 120 + Enter; then press keypad 1, 2, 1 and "Add"', 'Enter adds. Each number becomes a BibChip validated live.',
    async p => { await add(p, [120]); for (const k of ['1', '2', '1']) await p.getByRole('group', { name: 'Number pad' }).getByRole('button', { name: k, exact: true }).click(); await p.getByRole('button', { name: 'Add number' }).click(); },
    { show: [S('Chip 120', chipOf(120), ['bg']), S('Chip 121', chipOf(121)), flash] });
  await ev('RX-04', '§4.9 validation table', 'Add 999, 121 again, 100, 150', 'Not in race → rejected (red) "Not in race"; same bib earlier in this call → "Said twice"; already logged → "Had 07:40"; otherwise ok (blue).',
    async p => { await add(p, [999, 121, 100, 150]); },
    { show: [S('Chip 999', chipOf(999), ['border', 'strike']), V('Chips', p => p.getByTestId('rx-numbers').getByRole('button').evaluateAll(els => els.map(e => e.getAttribute('aria-label')).join(' | '))), S('Complete', btn(/^Complete/))] });
  await ev('RX-05', '§4.9', 'Tap chip 999 (remove), then "Undo"', 'Tap a chip to remove (Undo).',
    async p => { await chipOf(999)(p).click(); await p.waitForTimeout(200); await p.getByRole('button', { name: 'Undo' }).click(); },
    { show: [flash, S('Chip 999', chipOf(999))] });
  await ev('RX-06', '§4.9', 'Tap "Next HH:MM →"', 'Next → move to the next 5-minute block, clear the box.',
    async p => { await p.getByRole('button', { name: /^Next \d\d:\d\d →$/ }).click(); },
    { show: [selected, flash] });
  await ev('RX-07', '§4.9 / Fixes B8', 'Add 122, 123', 'Other blocks in the call show as pills; the count is only the numbers that will be recorded (ok + info).',
    async p => { await add(p, [122, 123]); },
    { show: [S('Also in this call', btn(/^Show the numbers at/))] });
  await ev('RX-08', '§4.9', 'Tap the "Also in this call" pill', 'Tap to switch back.',
    async p => { await p.getByRole('button', { name: /^Show the numbers at/ }).first().click(); },
    { show: [selected] });
  await ev('RX-09', '§4.9 / Fixes B7', `Type an exact time as HHMM (${hhmm(new Date(Date.now() - 22 * 60000)).replace(':', '')}) and add 124`, '"Exact" accepts HH:MM or HHMM between race start and now; shown as HH:MM and selected.',
    async p => { await p.locator('#exact-time').fill(hhmm(new Date(Date.now() - 22 * 60000)).replace(':', '')); await add(p, [124]); },
    { show: [S('Exact', p => p.locator('#exact-time'), ['bg']), flash] });
  await ev('RX-10', '§4.9 / Fixes B7', 'Pick the "next" block, then type 2359 in Exact', 'Invalid value → red border, error in the status line, field cleared, previous block stays selected; Exact not selected.',
    async p => { await p.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: /next|this call/ }).first().click(); await p.locator('#exact-time').fill('2359'); },
    { show: [S('Exact', p => p.locator('#exact-time'), ['border']), selected, flash] });
  await ev('RX-11', 'Fixes D3', `Type an exact time with a colon (${hhmm(new Date(Date.now() - 18 * 60000))})`, 'Exact time typed as HH:MM.',
    async p => { await p.locator('#exact-time').fill(hhmm(new Date(Date.now() - 18 * 60000))); },
    { show: [S('Exact', p => p.locator('#exact-time'))] });
  await ev('RX-12', '§4.9', 'Pick the "next" block again, tap "Clear HH:MM"', 'Clears all numbers in the current block (Undo).',
    async p => { await p.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: /next|this call/ }).first().click(); await p.getByRole('button', { name: /^Clear \d\d:\d\d$/ }).click(); },
    { show: [flash, V('Chips in block', p => p.getByTestId('rx-numbers').getByRole('button').count())] });
  await ev('RX-13', '§4.9 / G5', 'Tap "Undo"', 'Undo restores the cleared numbers.',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); },
    { show: [V('Chips in block', p => p.getByTestId('rx-numbers').getByRole('button').count())] });
  await ev('RX-14', 'Fixes D3', 'Switch to the Overview tab and back to Receive', 'The draft survives a tab switch.',
    async p => { await p.getByRole('tab', { name: 'Overview' }).click(); await p.getByRole('tab', { name: 'Receive' }).click(); },
    { show: [selected, V('Chips in block', p => p.getByTestId('rx-numbers').getByRole('button').count())] });
  await ev('RX-15', '§4.9 / Fixes A2', 'Tap "Complete · N"', 'Done card "N recorded at CP1 · M skipped (flagged)". The board\'s "up to" is the latest block received; an exact time never moves it.',
    async p => { await p.getByRole('button', { name: /^Complete · \d+$/ }).click(); },
    { show: [S('Done card', p => p.getByRole('status').filter({ hasText: 'recorded at' })), S('Board CP1', T('board-CP1'))] });
  await ev('RX-16', '§4.9', 'Tap "Undo" on the done card', 'Undo reopens the call, reverts writes.',
    async p => { await p.getByRole('button', { name: 'Undo' }).click(); },
    { show: [flash, S('Board CP1', T('board-CP1'))] });
  await ev('RX-17', '§4.9', 'Tap "Complete", then "Next call"', 'Next call returns to "Who\'s calling?"; board updated.',
    async p => { await p.getByRole('button', { name: /^Complete · \d+$/ }).click(); await p.getByRole('button', { name: 'Next call' }).click(); },
    { show: [S('CP1 button', btn(/^CP1,/)), S('Board CP1', T('board-CP1'))] });
  await ev('RX-18', 'Fixes D3 / §4.9 validation table', 'Tap "CP3", add 115 (reported at CP1, never at CP2)', 'Not seen at the previous checkpoint → info (blue, recorded) "Not seen CP2".',
    async p => { await p.getByRole('button', { name: /^CP3,/ }).click(); await add(p, [115]); },
    { show: [S('Chip 115', chipOf(115), ['bg', 'border']), S('Complete', btn(/^Complete/))] });
  await ev('RX-19', '§4.9 / G5', 'Add 101 102, tap "Cancel call" once', 'First tap turns solid red "Tap again to cancel" and says how many will be dropped.',
    async p => { await add(p, [101, 102]); await p.getByRole('button', { name: 'Cancel call' }).click(); },
    { show: [S('Cancel', btn('Tap again to cancel'), ['bg']), flash] });
  await ev('RX-20', '§4.9', 'Tap "Tap again to cancel"', 'Second tap drops the call.',
    async p => { await p.getByRole('button', { name: 'Tap again to cancel' }).click(); },
    { show: [S('Heading', p => p.getByRole('heading', { name: /who's calling/i }))] });
  await ev('RX-21', 'Fixes B9', 'Tap "CP2", add 998 and 997 (not in the race)', 'Complete stays enabled (rejected numbers must be logged) but reads "Log call · 0" in the plain style.',
    async p => { await p.getByRole('button', { name: /^CP2,/ }).click(); await add(p, [998, 997]); },
    { show: [S('Button', btn(/^(Log call|Complete) · 0$/), ['bg', 'border'])] });
  await ev('RX-22', 'Fixes B9', 'Tap "Log call · 0"', 'Done card "0 recorded · 2 skipped (flagged)".',
    async p => { await p.getByRole('button', { name: 'Log call · 0' }).click(); },
    { show: [S('Done card', p => p.getByRole('status').filter({ hasText: 'recorded at' }))] });
  await ev('RX-23', 'Fixes D3 / §4.9', '"Next call"; "Finish"; add every bib 100–159; Complete; Next call', 'Board pill Closed when every runner still in the race has been reported there.',
    async p => {
      await p.getByRole('button', { name: 'Next call' }).click();
      await p.getByRole('button', { name: /^Finish,/ }).click();
      for (let n = 100; n <= 159; n++) { await p.fill('#bib-heard', String(n)); await p.keyboard.press('Enter'); }
      await p.getByRole('button', { name: /^Complete · \d+$/ }).click();
      await p.getByRole('button', { name: 'Next call' }).click();
    },
    { show: [S('Finish button', btn(/^Finish,/)), S('Board Finish', T('board-Finish'))] });
  await page.setViewportSize(PHONE); current.viewport = PHONE;
  await ev('RX-24', '§4.9 Layout', 'Phone 390×844: tap "CP2", add 110 111', 'Phone: stacks, receive panel first.',
    async p => { await p.getByRole('button', { name: /^CP2,/ }).click(); await add(p, [110, 111]); },
    { full: true, show: [pageWidth] });
  await ev('RX-25', '§4.9', 'Phone: Cancel call (two taps)', 'Back to idle.',
    async p => { await p.getByRole('button', { name: 'Cancel call' }).click(); await p.getByRole('button', { name: 'Tap again to cancel' }).click(); },
    { show: [S('Heading', p => p.getByRole('heading', { name: /who's calling/i }))] });
  await page.setViewportSize(TABLET); current.viewport = TABLET;
  await page.context().close();

  page = await newPage(browser, TABLET, { withBaseData: true });
  current.section = 'Base — DNF / DNS';
  const sflash = S('Status line', T('status-flash'));
  const pend = (n) => (p) => p.getByTestId('bulk-pending').getByRole('button', { name: new RegExp(`^Remove ${n}\\b`) });
  const outRow = (n) => (p) => p.getByTestId('out-row').filter({ hasText: new RegExp(`^${n}(?!\\d)`) });
  await ev('ST-01', '§4.11 / Fixes C1', 'Open base, tap the "DNF / DNS" tab', 'Bulk add: DNF/DNS toggle (DNF active = red), Where pills, Reason pills, Time (−5/+5). "Add numbers to mark" locked. Out of the race panel with totals and rows.',
    async p => { await p.goto(`${BASE}/base-station/operations`); await p.getByRole('tab', { name: 'DNF / DNS' }).click(); },
    { show: [S('DNF toggle', p => p.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNF' }), ['bg']), S('Mark button', btn('Add numbers to mark'), ['border', 'color']), S('Totals', p => p.getByText(/\d+ DNS · \d+ DNF/))] });
  await ev('ST-02', '§4.11', 'Tap Where "CP1", Reason "Injury", tap "Injury" again, tap "Medical"', 'Reason pills — optional, tap again to unset.',
    async p => { await p.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP1' }).click(); await p.getByRole('button', { name: 'Injury' }).click(); await p.getByRole('button', { name: 'Injury' }).click(); await p.getByRole('button', { name: 'Medical' }).click(); },
    { show: [S('Injury', btn('Injury')), S('Medical', btn('Medical'))] });
  await ev('ST-03', '§4.11', 'Tap Time "−5" nine times (45 minutes back)', 'Time (−5/+5, clamped).',
    async p => { for (let i = 0; i < 9; i++) await p.getByLabel('5 minutes earlier').click(); },
    { show: [S('Time', p => p.locator('[aria-live="polite"]').filter({ hasText: /^\d\d:\d\d$/ }).first())] });
  await ev('ST-04', '§4.11 validation table / Fixes D1 B10', 'Paste "108, 130 131; 999 130" and press Enter (108 was reported at CP2)', 'Not in race / listed twice → rejected (white, 2px red border, struck through — same as Receive); DNF at CP1 but seen at a later CP → warning "Seen later at CP2".',
    async p => { await p.fill('#bulk-bibs', '108, 130 131; 999 130'); await p.keyboard.press('Enter'); },
    { show: [S('Chip 108', pend(108), ['border']), S('Chip 999', pend(999), ['bg', 'border', 'strike']), S('Second 130', p => p.getByTestId('bulk-pending').getByRole('button', { name: /^Remove 130, Listed twice/ }))] });
  await ev('ST-05', '§4.11', 'Tap "Mark N as DNF"', 'Primary Mark N as DNF (red). Undo. DNF writes withdrawal_records + runner status.',
    async p => { await p.getByRole('button', { name: /^Mark \d+ as DNF$/ }).click(); },
    { show: [sflash, S('Row 108', outRow(108))] });
  await ev('ST-06', '§4.11', 'Tap "Undo"', 'Undo.',
    async p => { await p.getByRole('button', { name: 'Undo', exact: true }).click(); },
    { show: [sflash, V('Row 108', p => outRow(108)(p).count().then(n => n ? 'still out' : 'gone'))] });
  await ev('ST-07', '§4.11 validation table', 'Paste "108 130 131" → Mark as DNF; switch to DNS, add "101 130"', 'DNS but recorded at a checkpoint → warning "Seen CP2 — started"; currently the other status → "Was DNF — will change".',
    async p => {
      await p.fill('#bulk-bibs', '108 130 131'); await p.keyboard.press('Enter');
      await p.getByRole('button', { name: /^Mark \d+ as DNF$/ }).click();
      await p.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNS' }).click();
      await p.fill('#bulk-bibs', '101 130'); await p.keyboard.press('Enter');
    },
    { show: [S('Chip 101', pend(101)), S('Chip 130', pend(130)), S('DNS explainer', p => p.getByText(/Non-starters:/))] });
  await ev('ST-08', '§4.11', 'Tap "Mark 2 as DNS"', 'DNS sets runner status non-starter. Audit-log every change.',
    async p => { await p.getByRole('button', { name: /^Mark \d+ as DNS$/ }).click(); },
    { show: [sflash, S('Row 101', outRow(101))] });
  await ev('ST-09', 'Fixes D3', 'Switch to DNF and add "131" again', '"Already DNF" → rejected.',
    async p => { await p.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNF' }).click(); await p.fill('#bulk-bibs', '131'); await p.keyboard.press('Enter'); },
    { show: [S('Chip 131', pend(131), ['border', 'strike']), S('Mark button', btn(/^(Add numbers to mark|Mark \d+ as DNF)$/))] });
  await ev('ST-10', '§4.11 / Fixes B10', 'Clear list; out list filter "DNF"', 'Rows (bib, status chip, "CP1 · Medical · 07:12") — two lines on narrow panels so the detail is never cut off.',
    async p => { await p.getByRole('button', { name: 'Clear list' }).click(); await p.getByRole('group', { name: 'Filter out list' }).getByRole('button', { name: 'DNF' }).click(); },
    { show: [S('Row 131 detail', p => outRow(131)(p).getByTestId('out-detail')), V('Detail cut off?', p => outRow(131)(p).getByTestId('out-detail').evaluate(el => el.scrollWidth > el.clientWidth ? 'yes' : 'no'))] });
  await ev('ST-11', '§4.11', 'Tap "Clear" on 131', 'Clear → back in race, Undo.',
    async p => { await p.getByRole('button', { name: 'Clear DNF for 131' }).click(); },
    { show: [sflash, V('Row 131', p => outRow(131)(p).count().then(n => n ? 'still out' : 'gone'))] });
  await ev('ST-12', '§4.11', 'Tap "Undo", then filter "All"', 'Undo.',
    async p => { await p.getByRole('button', { name: 'Undo', exact: true }).click(); await p.getByRole('group', { name: 'Filter out list' }).getByRole('button', { name: 'All' }).click(); },
    { show: [S('Row 131', outRow(131))] });
  await ev('ST-13', 'Fixes D3', 'Tap "Clear" on the DNS row for 130, then "Undo"', 'Clear on a DNS row.',
    async p => { await p.getByRole('button', { name: 'Clear DNS for 130' }).click(); await p.waitForTimeout(300); },
    { show: [V('Row 130 after Clear', p => outRow(130)(p).count().then(n => n ? 'still out' : 'back in the race')), async p => { await p.getByRole('button', { name: 'Undo', exact: true }).click(); await p.waitForTimeout(300); return describe(outRow(130)(p), 'Row 130 after Undo'); }] });
  await ev('ST-14', 'Fixes D3', 'Look at 145 (marked DNF at CP2 by the checkpoint)', 'A checkpoint-only DNF shows Clear disabled.',
    async () => {},
    { show: [S('Clear for 145', btn('Clear DNF for 145'))] });
  await ev('ST-15', '§4.9 validation table', 'Receive → CP2 → add 131 (DNF) and 101 (DNS)', 'Marked DNF / DNS → rejected "DNF" / "DNS".',
    async p => { await p.getByRole('tab', { name: 'Receive' }).click(); await p.getByRole('button', { name: /^CP2,/ }).click(); await add(p, [131, 101]); },
    { show: [V('Chips', p => p.getByTestId('rx-numbers').getByRole('button').evaluateAll(els => els.map(e => e.getAttribute('aria-label')).join(' | ')))] });
  await ev('ST-16', 'Fixes B11 / §3.5', 'Cancel call; DNF / DNS → "Withdraw runner with comments or vet-out details…"', 'Bottom sheet with design-system components, 24-hour date/time (TimeStepper + date text, no browser datetime-local), reasons Injury, Self-withdrew, Cut-off, Medical, Other; comments; red primary "Withdraw runner", plain Cancel. No "*" reverse syntax advertised.',
    async p => { await p.getByRole('button', { name: 'Cancel call' }).click(); await p.getByRole('button', { name: 'Tap again to cancel' }).click(); await p.getByRole('tab', { name: 'DNF / DNS' }).click(); await p.getByRole('button', { name: /withdraw runner with comments/i }).click(); },
    { show: [S('Time', p => p.getByRole('dialog').locator('[aria-live="polite"]')), S('Date', T('withdraw-date')), V('Reasons', p => p.getByRole('dialog').getByRole('group', { name: 'Reason' }).getByRole('button').allInnerTexts().then(t => t.join(', '))), S('Primary', p => p.getByRole('dialog').getByRole('button', { name: 'Withdraw runner' }), ['bg']), V('Mentions "*"', p => p.getByRole('dialog').innerText().then(t => t.includes('*') ? 'yes' : 'no'))] });
  await ev('ST-17', 'Fixes B11', 'Withdraw 133 at CP2, Injury, comment "Rolled ankle"', 'Submits; appears in the out list; Undo offered.',
    async p => {
      const d = p.getByRole('dialog');
      await d.getByLabel('Runner number').fill('133');
      await d.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP2' }).click();
      await d.getByRole('group', { name: 'Reason' }).getByRole('button', { name: 'Injury' }).click();
      await d.getByLabel(/Comments/).fill('Rolled ankle');
      await d.getByRole('button', { name: 'Withdraw runner' }).click();
    },
    { show: [S('Row 133', outRow(133)), S('Undo bar', p => p.getByRole('status').filter({ hasText: 'withdrawn' }))] });
  await ev('ST-18', 'Fixes B11', 'Tap "Undo"', 'Undo works.',
    async p => { await p.getByRole('status').filter({ hasText: 'withdrawn' }).getByRole('button', { name: 'Undo' }).click(); },
    { show: [V('Row 133', p => outRow(133)(p).count().then(n => n ? 'still out' : 'gone'))] });

  current.section = 'Base — Overview';
  await page.setViewportSize(DESKTOP); current.viewport = DESKTOP;
  await ev('BO-01', '§4.10 / Fixes A1 A4', 'Tap the "Overview" tab (desktop 1280)', 'Red role="alert" only for overdue runners; if a checkpoint is only behind on calls, a gold note "CP2 hasn\'t reported past 10:40 · 14 expected". On course = in the race, not finished, with "N not seen yet".',
    async p => { await p.getByRole('tab', { name: 'Overview' }).click(); },
    { show: [S('Awaiting note', T('awaiting-report'), ['bg']), V('Red alerts', p => p.getByRole('alert').count()), S('On course tile', T('tile-on-course'))] });
  await ev('BO-02', '§4.10 / Fixes B13', 'Look at Current leaders', 'Gold warning icon after the bib (aria-label "Open data issue") for duplicates, out-of-order times, sightings after DNF/DNS and impossible pace. Elapsed HH:MM.',
    async p => { await p.getByRole('heading', { name: 'Current leaders' }).scrollIntoViewIfNeeded(); },
    { show: [V('Leaders', p => p.locator('section[aria-labelledby="lbhd"] tbody tr').evaluateAll(rows => rows.map(r => `${r.cells[1].innerText.trim()}${r.querySelector('[aria-label="Open data issue"]') ? ' ⚠' : ''} ${r.cells[4].innerText.trim()}`).join(' | ')))] });
  await ev('BO-03', '§4.10', 'Tap leader filter "Female"', 'Leaderboard filter pills (All, Female, Male, Wave 1…).',
    async p => { await p.getByRole('group', { name: 'Leader filter' }).getByRole('button', { name: 'Female' }).click(); },
    { show: [S('Female', p => p.getByRole('group', { name: 'Leader filter' }).getByRole('button', { name: 'Female' }), ['bg'])] });
  await ev('BO-04', 'Fixes A1 / D3', 'Receive → CP2 → latest block → add 150 and 777 (not in race) → Complete → Next call → Overview', 'Once the checkpoint has reported past expected + 10 min, the runners are overdue: red banner with role="alert".',
    async p => {
      await p.getByRole('tab', { name: 'Receive' }).click(); await p.getByRole('button', { name: /^CP2,/ }).click();
      await p.getByRole('group', { name: 'Common time block' }).getByRole('button').last().click();
      await add(p, [150, 777]); await p.getByRole('button', { name: /^Complete · \d+$/ }).click(); await p.getByRole('button', { name: 'Next call' }).click();
      await p.getByRole('tab', { name: 'Overview' }).click();
    },
    { show: [S('Alert', p => p.getByRole('alert'), ['bg'])] });
  await ev('BO-05', '§4.10', 'Tap "View runners" on the overdue alert', '"View runners" → Reports › Overdue.',
    async p => { await p.getByRole('button', { name: 'View runners' }).click(); },
    { show: [S('Report heading', p => p.locator('#rephd'))] });

  current.section = 'Base — Reports & data checks';
  const rflash = S('Status line', T('reports-flash'));
  const issueRow = (n) => (p) => p.getByTestId('issue-row').filter({ hasText: new RegExp(`^${n}`) });
  await ev('RP-01', '§4.12 / Fixes A1', 'Reports › "Overdue runners"', 'Bib, last seen, expected at, overdue minutes. An "Awaiting report" group underneath, by checkpoint, with "reported up to HH:MM".',
    async () => {},
    { show: [V('Overdue rows', p => p.locator('section[aria-labelledby="rephd"] tbody tr').count()), V('First row', p => p.locator('section[aria-labelledby="rephd"] tbody tr').first().innerText().then(t => t.replace(/\s+/g, ' '))), V('Awaiting report group', p => T('awaiting-group')(p).count().then(n => n ? 'shown' : 'none — CP2 has now reported past everyone'))] });
  await ev('RP-02', '§4.12 / Fixes A1', 'Click "CSV"', 'CSV gets a Status column.',
    async () => {},
    { show: [async p => {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.getByRole('button', { name: 'CSV' }).click()]);
      return [`Downloaded: ${dl.suggestedFilename()}`, `First lines: ${fs.readFileSync(await dl.path(), 'utf8').split('\n').slice(0, 3).join(' | ')}`];
    }] });
  await ev('RP-03', 'Fixes D3', 'Click "Print"', 'Print.',
    async p => { await p.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; }); await p.getByRole('button', { name: 'Print' }).click(); },
    { show: [V('window.print() called', p => p.evaluate(() => window.__printed))] });
  await ev('RP-04', '§4.12 / Fixes A4', 'Click "Still on course"', 'Same count as the Overview tile; grouped by last checkpoint passed.',
    async p => { await p.getByRole('button', { name: /^Still on course/ }).click(); },
    { show: [S('Sidebar', btn(/^Still on course/)), S('Not seen since start', p => p.getByText('Not seen since start').locator('..'))] });
  await ev('RP-05', '§4.12 / Fixes A5', 'Click "Times by checkpoint"', 'Never replace a recorded time. Status column (DNS, DNF @CPx); DNF only in an empty cell at the withdrawal checkpoint; a time recorded while DNS / after DNF has a gold outline.',
    async p => { await p.getByRole('button', { name: /^Times by checkpoint/ }).click(); },
    { show: [S('Row 101', p => p.getByRole('row').filter({ hasText: /^101/ })), S('Flagged cell', p => p.getByTitle('Recorded after DNS/DNF').first(), ['border'])] });
  await ev('RP-06', '§4.12', 'Click "Call log"', 'Per checkpoint: calls received, numbers, last call time, up to.',
    async p => { await p.getByRole('button', { name: /^Call log/ }).click(); },
    { show: [S('CP1 row', p => p.getByRole('row').filter({ hasText: /^CP1/ }))] });
  await ev('RP-07', '§4.12 Needs attention', 'Click "Duplicates"', 'Keep A / Keep B (or Merge if identical).',
    async p => { await p.getByRole('button', { name: /^Duplicates/ }).click(); },
    { show: [S('105', issueRow(105)), S('115', issueRow(115))] });
  await ev('RP-08', '§4.12 / Fixes B12', 'Click the first "Keep HH:MM" on 105', 'Resolving removes it; Undo labelled with what it undoes.',
    async p => { await issueRow(105)(p).getByRole('button', { name: /^Keep / }).first().click(); },
    { show: [rflash, S('Undo', btn(/^Undo /))] });
  await ev('RP-09', '§4.12', 'Click the Undo', 'Undo brings it back.',
    async p => { await p.getByRole('button', { name: /^Undo / }).click(); },
    { show: [S('105', issueRow(105))] });
  await ev('RP-10', 'Fixes D3', 'Click "Merge" on 115 (same time twice)', 'Merge (identical duplicates).',
    async p => { await issueRow(115)(p).getByRole('button', { name: 'Merge' }).click(); },
    { show: [rflash, V('115 row', p => issueRow(115)(p).count().then(n => n ? 'still listed' : 'resolved'))] });
  await ev('RP-11', '§4.12 / Fixes B12', 'Click "Out of order"', 'Ask CPx / Mark checked. The Undo from the last list is gone.',
    async p => { await p.getByRole('button', { name: /^Out of order/ }).click(); },
    { show: [S('106', issueRow(106)), V('Undo button', p => p.getByRole('button', { name: /^Undo/ }).count().then(n => n ? 'shown' : 'none'))] });
  await ev('RP-12', '§4.12', 'Click "Ask CP2"', 'Resolutions persist so resolved items don\'t reappear.',
    async p => { await p.getByRole('button', { name: /^Ask CP/ }).first().click(); },
    { show: [rflash, S('Undo', btn(/^Undo /))] });
  await ev('RP-13', '§4.12 / Fixes D1', 'Click "Skipped a checkpoint"', 'Has later CP time, missing an earlier CP (128: seen CP2, never at CP1) → Ask CPx / Mark checked.',
    async p => { await p.getByRole('button', { name: /^Skipped a checkpoint/ }).click(); },
    { show: [S('128', issueRow(128))] });
  await ev('RP-14', '§4.12', 'Click "Seen after DNF / DNS"', 'Checkpoint time after DNF time, or any time while DNS → Clear DNF/DNS / Remove that time.',
    async p => { await p.getByRole('button', { name: /^Seen after DNF/ }).click(); },
    { show: [S('101', p => issueRow(101)(p).first()), S('108', issueRow(108))] });
  await ev('RP-15', 'Fixes D3', 'Click "Remove CP2 time" on 108', 'Remove CPx time.',
    async p => { await issueRow(108)(p).getByRole('button', { name: 'Remove CP2 time' }).click(); },
    { show: [rflash, V('108 row', p => issueRow(108)(p).count().then(n => n ? 'still listed' : 'resolved'))] });
  await ev('RP-16', 'Fixes D3', 'Click "Clear DNS" on 101', 'Clear DNS from a check.',
    async p => { await issueRow(101)(p).first().getByRole('button', { name: 'Clear DNS' }).click(); },
    { show: [rflash, V('101 rows', p => issueRow(101)(p).count())] });
  await ev('RP-17', '§4.12', 'Click "Unknown bibs"', 'Numbers outside the race reported in calls → Remove / Keep for review.',
    async p => { await p.getByRole('button', { name: /^Unknown bibs/ }).click(); },
    { show: [V('Rows', p => p.getByTestId('issue-row').allInnerTexts().then(t => t.map(x => x.replace(/\s+/g, ' ')).join(' | ')))] });
  await ev('RP-18', 'Fixes D3', 'Click "Keep for review" on the first row', 'Keep for review.',
    async p => { await p.getByTestId('issue-row').first().getByRole('button', { name: 'Keep for review' }).click(); },
    { show: [rflash] });
  await ev('RP-19', '§4.12', 'Click "Impossible pace"', 'Split speed above 20 km/h → Ask CPx / Mark checked.',
    async p => { await p.getByRole('button', { name: /^Impossible pace/ }).click(); },
    { show: [S('107', issueRow(107))] });
  await ev('RP-20', '§4.12', 'Click "Mark checked", reload, open Reports › Impossible pace', 'Resolved items don\'t reappear.',
    async p => { await p.getByRole('button', { name: 'Mark checked' }).first().click(); await p.reload(); await p.getByRole('tab', { name: 'Reports' }).click(); await p.getByRole('button', { name: /^Impossible pace/ }).click(); },
    { show: [S('Count', T('check-count-pace')), S('Empty state', p => p.getByText('All sorted'))] });
  await ev('RP-21', '§4.12', 'Click "Exports"', 'Existing exports kept.',
    async p => { await p.getByRole('button', { name: /^Exports/ }).click(); },
    { show: [V('Export cards', p => p.locator('section[aria-labelledby="rephd"] button .font-medium').allInnerTexts().then(t => t.join(', ')))] });

  current.section = 'Base — phone and accessibility';
  await page.setViewportSize(PHONE); current.viewport = PHONE;
  await ev('PH-01', 'Fixes D3', 'Phone 390×844: Overview', 'Base Overview on a phone (the leaders table scrolls in its box).',
    async p => { await p.getByRole('tab', { name: 'Overview' }).click(); }, { show: [pageWidth] });
  await ev('PH-02', 'Fixes D3', 'Phone: DNF / DNS', 'DNF / DNS on a phone (bulk add above the out list).',
    async p => { await p.getByRole('tab', { name: 'DNF / DNS' }).click(); }, { show: [pageWidth, V('Out list below bulk add', async p => { const a = await p.getByRole('heading', { name: 'Bulk add' }).boundingBox(); const b = await p.getByRole('heading', { name: 'Out of the race' }).boundingBox(); return b.y > a.y ? 'yes' : 'no'; })] });
  await ev('PH-03', 'Fixes D3', 'Phone: Reports', 'Reports on a phone (stacked: list of reports above the report).',
    async p => { await p.getByRole('tab', { name: 'Reports' }).click(); }, { show: [pageWidth, V('Report below the list', async p => { const a = await p.getByRole('navigation', { name: 'Reports' }).boundingBox(); const b = await p.locator('section[aria-labelledby="rephd"]').boundingBox(); return b.y >= a.y + a.height ? 'yes' : 'no'; })] });
  await ev('A11Y-01', 'Fixes D3', 'Check the status lines', 'Status lines are aria-live="polite"; overdue banner is role="alert".',
    async () => {},
    { show: [S('Reports status line', T('reports-flash')), async p => { await p.getByRole('tab', { name: 'DNF / DNS' }).click(); return describe(T('status-flash')(p), 'DNF / DNS status line'); }, async p => { await p.getByRole('tab', { name: 'Receive' }).click(); await p.getByRole('button', { name: /^CP1,/ }).click(); return describe(T('rx-flash')(p), 'Receive status line'); }] });
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
            <tr><th>App showed</th><td>${e.observed.length ? `<ul>${e.observed.map(o => `<li>${esc(o)}</li>`).join('')}</ul>` : '<em>(see screenshot)</em>'}</td></tr>
            ${e.status.length ? `<tr><th>Status line</th><td>${e.status.map(esc).join(' · ')}</td></tr>` : ''}
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
  <strong>Plan says</strong> (wording quoted from the plan — not the developer's own description), <strong>App showed</strong> (evidence read from the running app for that event:
  the element's text, accessible name, state such as pressed / disabled / invalid, and the computed colour or border where the plan specifies one),
  <strong>Status line</strong> (any live status or alert text on screen) and a screenshot taken straight after the event.
  Events whose Plan column says <strong>Fixes A1 … D3</strong> check an item from the validation-fixes brief (docs/design-handoff/VALIDATION_FIXES.md) and quote it.
  The full plan is reproduced in the appendix.</p>
  <div class="box"><strong>Suggested prompt for Claude.ai</strong> — attach this PDF and say:<br>
  "This PDF documents a built UI against the plan in its appendix (IMPLEMENTATION_SPEC.md) and the validation-fixes brief. For every event, compare 'App showed' and the screenshot with 'Plan says' and the referenced plan section.
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
