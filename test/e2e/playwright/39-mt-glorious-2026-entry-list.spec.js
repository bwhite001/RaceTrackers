/**
 * Mt Glorious Mountain Trails 2026 — race-eve run-through with the real entry
 * list (Alan's SES_Glorious_EntryList.xlsx: 198 runners, 22 km bibs 1–141 and
 * 196–199 in two waves, 11 km bibs 142–193 and 200 seen at CP4 only).
 *
 * The list is never committed: pass its path in MGT_ENTRY_LIST, otherwise the
 * spec skips. The coordinator's real Sunday flow sets the race up: template,
 * bib ranges 1–193 and 196–200, roster import, then CP1–CP3 limited to the
 * 22 km waves in Edit race. Five isolated browsers play base and CP1–4.
 *
 * The list has no times. 22 km runners reuse the 2025 runners' checkpoint
 * times (fixtures/MGMT_NOV25.xlsx, cycled); 11 km runners get a made-up CP4
 * and finish spread. A few DNS and one DNF at CP3 exercise those paths.
 * Problems are collected and asserted empty at the end.
 *
 * Run: make build && MGT_ENTRY_LIST=/path/to/SES_Glorious_EntryList.xlsx \
 *   npx playwright test test/e2e/playwright/39-mt-glorious-2026-entry-list.spec.js --workers=1
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { test, expect } from '@playwright/test';
import { installOverlay, caption, CAPTION_HEIGHT } from '../../../scripts/videos/overlay.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILES = path.join(HERE, 'fixtures/MGMT_NOV25.xlsx');
const ENTRY_LIST = process.env.MGT_ENTRY_LIST;
const OUT = path.resolve(HERE, '../../../test-results/mt-glorious-2026');
const BASE = 'http://localhost:3000';

const RACE = { name: 'Mt Glorious Mountain Trail', date: '2026-11-08', start: '06:30' };
const SHIFT = 30; // 2025 started 07:00, 2026 starts 06:30
const GPS = { 1: [-27.321677, 152.714852], 2: [-27.345838, 152.730526], 3: [-27.366238, 152.730747], 4: [-27.34649, 152.750306] };
const CPS = [1, 2, 3, 4];
const SILENT = { cp: 4, from: 8 * 60 + 40, to: 9 * 60 + 5 }; // a radio outage, to test a long catch-up call

const EXPORTS = ['Missing Numbers Report', 'Out List Report', 'Checkpoint Log Report', 'Race Summary Report', 'Finisher List', 'Full Officials Report', 'Split Times'];

const pad = (n) => String(n).padStart(2, '0');
const fmt = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const block = (m) => m - (m % 5);
const mins = (hm) => { const [h, x] = hm.split(':').map(Number); return h * 60 + x; };

// ── The race, from the spreadsheet ─────────────────────────────────────────
/** Excel "8.05" means 08:05. */
const sheetMinutes = (v) => {
  if (!v) return null;
  const [h, m] = Number(v).toFixed(2).split('.').map(Number);
  return h * 60 + m - SHIFT;
};

/** 2025 runners who reached CP4, as checkpoint-time profiles (minutes, already moved to the 06:30 start). */
function profiles2025() {
  const wb = XLSX.read(fs.readFileSync(PROFILES), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null }).slice(1);
  return rows.map(r => [2, 3, 4, 5].map(i => sheetMinutes(r[i]))).filter(t => t.every(Boolean) && t[0] < t[1] && t[1] < t[2] && t[2] < t[3]) // not bib 92's 2025 typo
    .sort((a, b) => a[3] - b[3]);
}

const DNS_BIBS = [5, 77, 198, 160]; // three 22 km, one 11 km
const DNF_BIB = 30;                  // 22 km, withdraws at CP3

/** The 2026 field from the entry list; times are synthetic (see header). */
function loadRace() {
  const wb = XLSX.read(fs.readFileSync(ENTRY_LIST), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  const profiles = profiles2025();
  const long = rows.filter(r => /22/.test(r.Event)).map(r => Number(r['Race No'])).sort((a, b) => a - b);
  const short = rows.filter(r => /11/.test(r.Event)).map(r => Number(r['Race No'])).sort((a, b) => a - b);
  const runners = [];
  long.forEach((bib, i) => {
    const p = profiles[(i * 7) % profiles.length]; // spread, so neighbouring bibs don't run together
    const dnf = bib === DNF_BIB;
    const times = dnf ? [p[0], p[1], p[2], null] : [...p];
    runners.push({ bib, km: 22, times, dns: false, dnf, finish: dnf ? null : p[3] + Math.max(15, Math.round((p[3] - p[2]) * 1.5)) });
  });
  short.forEach((bib, i) => {
    const cp4 = mins('07:40') + Math.round(i * 1.3);
    runners.push({ bib, km: 11, times: [null, null, null, cp4], dns: false, dnf: false, finish: cp4 + 22 + (i % 12) });
  });
  for (const r of runners) if (DNS_BIBS.includes(r.bib)) Object.assign(r, { dns: true, times: [null, null, null, null], finish: null });
  return runners.sort((a, b) => a.bib - b.bib);
}

// ── Devices ────────────────────────────────────────────────────────────────
// RACE_VIDEO_DIR=<dir>: record every device with captions and paced ticks, for scripts/videos/compose-race.mjs
const VIDEO_DIR = process.env.RACE_VIDEO_DIR;
const timeline = [];
/** Caption a device on video, and add the line to the side-by-side's caption track. */
const say = async (device, text) => {
  if (!VIDEO_DIR) return;
  timeline.push({ t: Date.now(), clock: raceClock, device: device.label, text });
  await caption(device.page, text);
};

const findings = [];
const diary = [];
let raceClock = 'setup';
const note = (area, msg) => { findings.push({ at: raceClock, area, msg }); console.log(`  [finding ${raceClock}] ${area}: ${msg}`); };
const log = (msg) => { diary.push({ at: raceClock, msg }); console.log(`  [${raceClock}] ${msg}`); };

/** Run a check without stopping the race; a failure becomes a finding. */
const check = async (area, what, fn) => {
  try { return await fn(); } catch (e) {
    note(area, `${what}: ${String(e.message).split('\n').slice(0, 4).join(' ').replace(/\x1b\[\d+m/g, '').slice(0, 300)}`);
    return undefined;
  }
};

async function openDevice(browser, label, viewport) {
  const size = VIDEO_DIR ? { ...viewport, height: viewport.height + CAPTION_HEIGHT } : viewport;
  const ctx = await browser.newContext({
    baseURL: BASE, viewport: size, timezoneId: 'Australia/Brisbane', locale: 'en-AU', serviceWorkers: 'block', acceptDownloads: true,
    ...(VIDEO_DIR && { recordVideo: { dir: VIDEO_DIR, size } }),
  });
  await ctx.clock.install({ time: new Date('2026-11-01T19:00:00+10:00') });
  if (VIDEO_DIR) await installOverlay(ctx);
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const device = { label, ctx, page, startedAt: Date.now() };
  page.on('pageerror', e => note(label, `Uncaught error: ${e.message.slice(0, 200)}`));
  page.on('console', m => {
    if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) note(label, `Console error: ${m.text().slice(0, 200)}`);
  });
  page.on('dialog', async d => { note(label, `Browser dialog: ${d.message().slice(0, 120)}`); await d.accept(); });
  return device;
}

/** Jump a device's clock (firing its timers, so useNow refreshes) to race-day minute m. */
async function setClock(device, m, date = RACE.date) {
  const t = new Date(`${date}T${fmt(m)}:05+10:00`).getTime();
  await device.ctx.clock.setSystemTime(t - 31000);
  await device.ctx.clock.fastForward(31000);
}

const shot = async (device, name) => {
  await device.page.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => {});
};

// ── Selectors ──────────────────────────────────────────────────────────────
const cpTab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });
const baseTab = (page, name) => page.getByRole('tab', { name });
const blockBtn = (page, hm) => page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: new RegExp(`^${hm}`) });

/** Every checkpoint on this device should carry its coordinates: a finding if not. */
async function checkGps({ page, label }, what) {
  const saved = await page.evaluate(() => new Promise((res, rej) => {
    const open = indexedDB.open('RaceTrackerDB');
    open.onerror = rej;
    open.onsuccess = e => { const q = e.target.result.transaction('checkpoints').objectStore('checkpoints').getAll(); q.onsuccess = () => res(q.result); };
  }));
  const withGps = saved.filter(c => c.latitude != null).length;
  log(`${label}: checkpoints with GPS: ${withGps} of ${saved.length}`);
  if (withGps !== 4 || saved.length !== 4) note(label, `${what}: ${withGps} of ${saved.length} checkpoints have coordinates, expected 4 of 4`);
}

// ── Setup ──────────────────────────────────────────────────────────────────
async function setupRace(base) {
  const { page } = base;
  await page.goto('/race-maintenance/setup');
  await page.locator('button').filter({ hasText: RACE.name }).first().click();

  await page.waitForSelector('#name');
  await check('Setup', 'template fills the 06:30 start', () => expect(page.locator('#startTime')).toHaveValue(RACE.start, { timeout: 2000 }));
  await check('Setup', 'template fills 4 checkpoints', () => expect(page.locator('#numCheckpoints')).toHaveValue('4', { timeout: 2000 }));
  await page.fill('#date', RACE.date);
  await page.getByRole('button', { name: /next: runner setup/i }).click();

  await page.waitForSelector('#min');
  // Alan: "there is a split in the bib numbers" — 194 and 195 aren't used
  for (const [min, max] of [[1, 193], [196, 200]]) {
    await page.fill('#min', String(min));
    await page.fill('#max', String(max));
    await page.getByRole('button', { name: /add range/i }).click();
  }
  await page.getByRole('button', { name: /next.*waves/i }).click();
  await page.getByRole('button', { name: /next.*course map/i }).click();

  await page.getByRole('heading', { name: /course map/i }).waitFor();
  await shot(base, '01-course-map-step');
  await check('Setup', 'template course shows on the map step', () => expect(page.getByText(/GPX loaded/)).toBeVisible({ timeout: 1500 }));
  await page.getByRole('tab', { name: 'Manual' }).click();
  for (const cp of CPS) {
    await page.locator(`input[aria-label^="CP${cp} - "][aria-label$="Lat"]`).fill(String(GPS[cp][0]));
    await page.locator(`input[aria-label^="CP${cp} - "][aria-label$="Lng"]`).fill(String(GPS[cp][1]));
  }
  await page.getByRole('button', { name: /save & continue/i }).click();
  await page.getByRole('button', { name: /^next$/i }).first().click();
  await page.waitForURL(/race-maintenance\/overview/, { timeout: 20000 });
  await shot(base, '02-race-created');
  await checkGps(base, 'GPS typed on the Manual tab was not saved');

  // The start list arrives Saturday: load it the way the coordinator would
  await page.getByRole('button', { name: /advanced tools/i }).click();
  await page.locator('input[type="file"]').first().setInputFiles(ENTRY_LIST);
  await shot(base, '03a-roster-mapping');
  for (const [col, field] of [['Race No', 'number'], ['Name', 'fullName'], ['Wave', 'batchNumber'], ['Category', 'ignore']]) {
    await check('Setup', `import maps ${col} → ${field}`, () => expect(page.locator('tr', { has: page.locator('td', { hasText: new RegExp(`^${col}`) }) }).locator('select')).toHaveValue(field, { timeout: 2000 }));
  }
  await page.getByRole('button', { name: /next: preview/i }).click();
  await shot(base, '03-roster-preview');
  await page.getByRole('button', { name: /^Import 198 Runners$/ }).click();
  await expect(page.getByText(/import complete/i)).toBeVisible();
  log(`Roster import: ${await page.getByText(/import complete/i).innerText()}`);

  // Only CP4 sees the 11 km runners: CP1–CP3 get the two 22 km waves
  const raceId = new URL(page.url()).searchParams.get('raceId');
  await page.goto(`/race-maintenance/edit?raceId=${raceId}`);
  await page.getByRole('button', { name: 'Next →' }).click();
  const waveOf = async (name) => Number((await page.getByText(new RegExp(`^Wave \\d+ · ${name}$`)).first().innerText()).match(/Wave (\d+)/)[1]);
  const waves22 = [await waveOf('Championship'), await waveOf('Community')];
  log(`22 km waves: ${waves22.join(', ')}`);
  for (const cp of [1, 2, 3]) {
    for (const w of waves22) await page.getByLabel(`Checkpoint ${cp} wave ${w}`).check();
    await page.getByLabel(`Checkpoint ${cp} wave ${waves22[0]}`).locator('xpath=ancestor::div[contains(@class,"flex-wrap")][1]').getByRole('button', { name: 'Save Waves' }).click();
    await expect(page.getByLabel(`Checkpoint ${cp} all waves`)).not.toBeChecked();
  }
  await shot(base, '03b-waves');
}

async function exportSetup(base) {
  const { page } = base;
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /share or import race config/i }).click();
  await expect(page.getByRole('heading', { name: /scan to load this race/i })).toBeVisible();
  await shot(base, '04-share-race');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download' }).click()]);
  const file = path.join(OUT, dl.suggestedFilename());
  await dl.saveAs(file);
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  log(`Setup file ${dl.suggestedFilename()}: ${pkg.data.runners?.length} runners, ${pkg.data.checkpoints?.length} checkpoints, frequency ${pkg.data.races?.[0]?.frequency}`);
  await page.getByRole('button', { name: 'Close share race' }).click();
  return file;
}

async function loadOntoDevice(device, file) {
  const { page } = device;
  await page.goto('/race-management');
  await page.getByRole('button', { name: /import race/i }).first().click();
  const dialog = page.getByRole('dialog', { name: /import.*export/i });
  await dialog.getByRole('button', { name: /import configuration/i }).click();
  await dialog.locator('input[type="file"]').setInputFiles(file);
  await expect(dialog.getByText(/file loaded successfully/i)).toBeVisible();
  await dialog.locator('button.btn-primary').click();
  await expect(dialog).toBeHidden({ timeout: 10000 });
}

async function openCheckpoint(device, cp) {
  const { page } = device;
  await page.goto('/');
  await page.getByRole('button', { name: /^checkpoint\b/i }).click();
  const modal = page.getByRole('dialog');
  await modal.locator('button').filter({ has: page.locator('h3') }).first().click();
  const picker = page.getByRole('dialog').filter({ hasText: /select your checkpoint/i });
  await picker.waitFor();
  await picker.getByRole('button').filter({ hasText: new RegExp(`^CP${cp}`) }).first().click();
  await page.waitForURL(new RegExp(`/checkpoint/${cp}`));
  await page.waitForSelector('#quick-entry-input');
}

async function openBase(base) {
  const { page } = base;
  await page.goto('/');
  await page.getByRole('button', { name: /base station/i }).click();
  await page.getByRole('dialog').locator('button').filter({ has: page.locator('h3') }).first().click();
  await page.getByRole('heading', { name: /who's calling/i }).waitFor({ timeout: 20000 });
}

// ── Radio ──────────────────────────────────────────────────────────────────
/** What the operator sees on the Callout sheet: [{ time, numbers }]. */
async function readCallout(page) {
  await cpTab(page, 'Callout').click();
  await page.getByTestId('pending-block').first().waitFor();
  const blocks = [];
  for (const text of await page.getByTestId('pending-block').allInnerTexts()) {
    const [head, ...rest] = text.split('\n');
    blocks.push({ time: head.match(/(\d\d:\d\d)/)[1], numbers: rest.join(' ').match(/\d+/g).map(Number) });
  }
  return blocks;
}

/** One radio call, heard and typed at base. Returns what base recorded. */
async function baseReceive(base, label, blocks) {
  const { page } = base;
  await baseTab(page, 'Receive').click().catch(() => {});
  await page.getByRole('button', { name: new RegExp(`^${label},`) }).click();
  const flags = [];
  for (const b of blocks) {
    await blockBtn(page, b.time).click({ timeout: 4000 });
    for (const n of b.numbers) {
      await page.fill('#bib-heard', String(n));
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('rx-flash')).toContainText(`${n} added`);
    }
    for (const name of await page.getByTestId('rx-numbers').getByRole('button').evaluateAll(els => els.map(e => e.getAttribute('aria-label') || e.innerText))) {
      if (name.includes(',')) flags.push(name);
    }
  }
  await page.getByRole('button', { name: /^(Complete|Log call) · \d+$/ }).click();
  const summary = await page.getByRole('status').first().innerText();
  await page.getByRole('button', { name: 'Next call' }).click();
  return { summary: summary.replace(/\n/g, ' · '), flags };
}

/** Checkpoint confirms base copied: read-out for a big call, one tap otherwise. */
async function confirmSent(page, count) {
  if (count > 5) {
    await page.getByRole('button', { name: 'Read out' }).click();
    const done = page.getByText(/^All \d+ copied$/);
    for (;;) {
      const over = await page.getByText(/^Over \d+ of \d+$/).innerText();
      for (const box of await page.getByRole('checkbox', { name: /^Read out / }).all()) await box.check();
      await page.getByRole('button', { name: 'Base copied — next' }).click();
      await expect(done.or(page.getByText(/^Over \d+ of \d+$/).filter({ hasNotText: over }))).toBeVisible();
      if (await done.isVisible()) break;
    }
    await page.getByRole('button', { name: 'Back to callout', exact: true }).click();
  } else {
    await page.getByRole('button', { name: /base copied — mark sent/i }).click();
  }
  await cpTab(page, 'Mark off').click();
}

/** On a hard stop: keep what was found, and a screenshot of every device. */
async function page_guard(stations, fn) {
  try { await fn(); } catch (e) {
    for (const s of stations) await shot(s, `FAILED-${s.label}`);
    fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify({ stopped: raceClock, findings, diary }, null, 2));
    throw e;
  }
}

test.describe('Mt Glorious 2026 run-through', () => {
  test.describe.configure({ retries: 0 });
  test.skip(!ENTRY_LIST || !fs.existsSync(ENTRY_LIST), 'MGT_ENTRY_LIST is not set to the entry list');

  test('the 2026 entry list, set up and run through by base and CP1–4', async ({ browser }) => {
    test.setTimeout(30 * 60 * 1000);
    fs.mkdirSync(OUT, { recursive: true });
    const runners = loadRace();
    const byBib = new Map(runners.map(r => [r.bib, r]));
    const base = await openDevice(browser, 'Base', { width: 1112, height: 834 });
    const cps = {};
    for (const cp of CPS) cps[cp] = await openDevice(browser, `CP${cp}`, { width: 390, height: 844 });
    const stations = [base, ...Object.values(cps)];

    // Passes and calls still waiting, per checkpoint
    const passes = new Map(); // `${cp}:${minute}` → bibs
    for (const r of runners) {
      r.times.forEach((t, i) => {
        if (!t) return;
        const k = `${i + 1}:${t}`;
        passes.set(k, [...(passes.get(k) ?? []), r.bib]);
      });
    }
    const waiting = { 1: [], 2: [], 3: [], 4: [] };
    const called = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
    const finishes = runners.filter(r => r.finish && !r.dnf);

    await test.step('Week before — coordinator sets the race up from the template', async () => {
      await setupRace(base);
      const file = await exportSetup(base);
      for (const cp of CPS) await loadOntoDevice(cps[cp], file);
      await checkGps(cps[1], 'GPS lost in the setup file');
    });

    await test.step('Race morning — every station opens the race', async () => {
      raceClock = '05:30';
      if (VIDEO_DIR) timeline.push({ t: Date.now(), clock: '05:30', start: true, text: 'Race morning: base and CP1–4 open the race on their own devices' });
      for (const s of stations) await setClock(s, mins('05:30'));
      await openBase(base);
      await say(base, 'Base VK4WIP is open and listening');
      await shot(base, '05-base-opened');
      for (const cp of CPS) {
        await openCheckpoint(cps[cp], cp);
        await say(cps[cp], 'Set up and ready');
        await check(`CP${cp}`, 'shows no callsign (not tracked)', () => expect(cps[cp].page.getByText(/VK4/)).toHaveCount(0, { timeout: 2000 }));
      }
      await shot(cps[1], '06-cp1-opened');
      await cpTab(cps[1].page, 'Callout').click();
      await shot(cps[1], '07-cp1-callout-empty');
      await cpTab(cps[1].page, 'Mark off').click();
    });

    await test.step('06:25 — organiser reports the non-starters to base', async () => {
      raceClock = '06:25';
      await setClock(base, mins('06:25'));
      const dns = runners.filter(r => r.dns).map(r => r.bib);
      const { page } = base;
      await say(base, `The organiser reports ${dns.length} non-starters: base marks them DNS`);
      await baseTab(page, 'DNF / DNS').click();
      await page.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNS' }).click();
      await page.fill('#bulk-bibs', dns.join(' '));
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: `Mark ${dns.length} as DNS` }).click();
      await expect(page.getByTestId('status-flash')).toHaveText(`${dns.length} marked DNS`);
      await shot(base, '08-dns-applied');
      await baseTab(page, 'Receive').click();
      log(`DNS: ${dns.join(', ')}`);
    });

    const call = async (cp, m) => {
      const device = cps[cp];
      const expected = waiting[cp];
      const blocks = await readCallout(device.page);
      const heard = blocks.flatMap(b => b.numbers);
      const missing = expected.filter(e => !heard.includes(e.bib)).map(e => e.bib);
      if (missing.length) note(`CP${cp}`, `Marked but not on the callout sheet: ${missing.join(', ')}`);
      for (const n of heard) {
        const e = expected.find(x => x.bib === n);
        if (e && fmt(block(e.t)) !== blocks.find(b => b.numbers.includes(n)).time) {
          note(`CP${cp}`, `Bib ${n} marked ${fmt(e.t)} but called at block ${blocks.find(b => b.numbers.includes(n)).time}`);
        }
      }
      await setClock(base, m);
      await say(device, `Calling base with ${heard.length} runner${heard.length === 1 ? '' : 's'}`);
      await say(base, `CP${cp} calls in ${heard.length} runner${heard.length === 1 ? '' : 's'}: base types each number`);
      const result = await baseReceive(base, `CP${cp}`, blocks);
      if (result.flags.length) log(`CP${cp} call flagged at base: ${result.flags.join(' | ')}`);
      if (!new RegExp(`^${heard.length} recorded`).test(result.summary)) note('Base', `CP${cp} call of ${heard.length}: ${result.summary}`);
      await confirmSent(device.page, heard.length);
      heard.forEach(n => called[cp].add(n));
      waiting[cp] = [];
      log(`CP${cp} → base: ${blocks.map(b => `${b.time} ×${b.numbers.length}`).join(', ')}`);
    };

    const pendingFinish = new Set(finishes.map(r => r.bib));
    const receiveFinish = async (m) => {
      const due = finishes.filter(r => pendingFinish.has(r.bib) && r.finish + 5 <= m);
      if (!due.length) return;
      const blocks = [...new Set(due.map(r => block(r.finish)))].sort((a, b) => a - b)
        .map(b => ({ time: fmt(b), numbers: due.filter(r => block(r.finish) === b).map(r => r.bib) }));
      await setClock(base, m);
      await say(base, `${due.length} runner${due.length === 1 ? '' : 's'} across the finish line`);
      const result = await baseReceive(base, 'Finish', blocks);
      if (result.flags.length) log(`Finish call flagged: ${result.flags.join(' | ')}`);
      due.forEach(r => pendingFinish.delete(r.bib));
    };

    const board = [];
    const falseDue = { 1: [], 2: [], 3: [], 4: [] };
    const events = new Map();
    // Several events can fall on one minute (a stand-down on a check): keep them all
    const at = (hm, title, fn) => events.set(mins(hm), [...(events.get(mins(hm)) ?? []), { title, fn }]);

    at('07:15', 'CP2 phone restarts, and base reloads, mid-race', async () => {
      const before = await cps[2].page.getByText('Passed').first().locator('..').innerText();
      await cps[2].page.reload();
      await cps[2].page.waitForSelector('#quick-entry-input');
      const after = await cps[2].page.getByText('Passed').first().locator('..').innerText();
      if (before !== after) note('CP2', `Passed tile changed across reload: ${before} → ${after}`);
      await base.page.reload();
      await base.page.getByRole('heading', { name: /who's calling/i }).waitFor();
      await shot(base, '09-base-mid-race');
    });

    at('07:50', 'Base looks at overdue and the checks mid-race', async () => {
      const { page } = base;
      await baseTab(page, 'Reports').click();
      await shot(base, '10-reports-mid-race');
      const overdue = await page.getByRole('button', { name: /^Overdue runners/ }).innerText();
      const checks = {};
      for (const id of ['dup', 'order', 'skip', 'after', 'unknown', 'pace']) checks[id] = await page.getByTestId(`check-count-${id}`).innerText();
      log(`Mid-race: ${overdue.replace(/\n/g, ' ')}; checks ${JSON.stringify(checks)}`);
      await baseTab(page, 'Overview').click();
      await shot(base, '11-overview-mid-race');
      await baseTab(page, 'Receive').click();
      await shot(base, '12-receive-mid-race');
    });

    at('08:30', 'No 11 km runner is missed or skipped at CP1–CP3', async () => {
      const { page } = base;
      const shortBibs = runners.filter(r => r.km === 11).map(r => String(r.bib));
      for (const cp of [1, 2, 3]) {
        const missed = await page.getByTestId(`missed-CP${cp}`).innerText().catch(() => '');
        const wrong = shortBibs.filter(b => new RegExp(`\\b${b}\\b`).test(missed));
        if (wrong.length) note('Base', `CP${cp} lists 11 km runners as missed: ${wrong.join(', ')}`);
      }
      await baseTab(page, 'Overview').click();
      await check('Base', 'leaders ranked per course', async () => {
        await expect(page.getByRole('columnheader', { name: 'Via CP1, CP2, CP3, CP4' })).toBeVisible({ timeout: 2000 });
        await expect(page.getByRole('columnheader', { name: 'Via CP4', exact: true })).toBeVisible({ timeout: 2000 });
      });
      log(`Progress: ${(await page.locator('section[aria-labelledby="cphd"]').innerText()).replace(/\s+/g, ' ')}`);
      await shot(base, '12b-overview-0830');
      await baseTab(page, 'Reports').click();
      const checks = {};
      for (const id of ['dup', 'order', 'skip', 'after', 'unknown', 'pace']) checks[id] = await page.getByTestId(`check-count-${id}`).innerText();
      log(`08:30 checks: ${JSON.stringify(checks)}`);
      if (checks.skip !== '✓') {
        await page.getByRole('button', { name: /^Skipped/ }).click();
        log(`Skipped: ${(await page.getByTestId('issue-row').allInnerTexts()).map(r => r.replace(/\n/g, ' ')).join(' | ').slice(0, 400)}`);
      }
      await baseTab(page, 'Receive').click();
    });

    at('09:00', 'CP4 has been silent since 08:40 (repeater trouble)', async () => {
      const { page } = base;
      log(`Board: ${(await page.getByTestId('board-CP4').innerText()).replace(/\n/g, ' ')}`);
      await baseTab(page, 'Overview').click();
      await shot(base, '12c-cp4-silent');
      await baseTab(page, 'Reports').click();
      log(`During the outage: ${(await page.getByRole('button', { name: /^Overdue runners/ }).innerText()).replace(/\n/g, ' ')}`);
      await baseTab(page, 'Receive').click();
    });

    const standDown = (cp, hm) => at(hm, `CP${cp} sweep through — CP${cp} stands down`, async () => {
      const { page } = base;
      await page.getByRole('button', { name: `Stand-down check CP${cp}` }).click();
      const sheet = page.getByRole('dialog', { name: `Stand-down check · CP${cp}` });
      await shot(base, `18-stand-down-cp${cp}`);
      if (cp < 4) {
        const lists = `${await sheet.getByTestId('seen-further').innerText()} ${await sheet.getByTestId('not-seen-past').innerText()}`;
        const wrong = runners.filter(r => r.km === 11 && new RegExp(`\\b${r.bib}\\b`).test(lists)).map(r => r.bib);
        if (wrong.length) note('Base', `Stand-down CP${cp} lists 11 km runners: ${wrong.slice(0, 10).join(', ')}`);
      }
      log(`Stand-down CP${cp}: seen further "${(await sheet.getByTestId('seen-further').innerText()).replace(/\n/g, ' ').slice(0, 120)}"; to account for "${(await sheet.getByTestId('not-seen-past').innerText()).replace(/\n/g, ' ').slice(0, 140)}"`);
      await sheet.getByRole('button', { name: 'Stand down', exact: true }).click();
      await sheet.getByRole('button', { name: 'Tap again to stand down' }).click();
      await expect(sheet.getByRole('status')).toHaveText(new RegExp(`CP${cp} stood down`));
      await sheet.getByRole('button', { name: 'Close' }).click();
    });
    // Each checkpoint stands down 15 minutes after its last runner (the sweep)
    const lastAt = (cp) => Math.max(...runners.map(r => r.times[cp - 1] ?? 0));
    for (const cp of [1, 2, 3, 4]) standDown(cp, fmt(block(lastAt(cp)) + 15));

    at(fmt(block(byBib.get(DNF_BIB).times[2]) + 10), `Bib ${DNF_BIB} withdraws at CP3: CP3 radios it in, base records the DNF`, async () => {
      const { page } = base;
      await page.evaluate(() => document.activeElement?.blur());
      await page.keyboard.press('d');
      await page.locator('input#runnerNumber').fill(String(DNF_BIB));
      await page.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP3' }).click();
      await shot(base, '20-withdraw');
      await page.getByRole('button', { name: 'Withdraw runner', exact: true }).click();
      await page.locator('input#runnerNumber').waitFor({ state: 'hidden' });
    });

    await test.step('Race — minute by minute, 06:30 to the last finisher', async () => {
      await page_guard(stations, async () => {
      const end = Math.max(...finishes.map(r => r.finish)) + 10;
      for (let m = mins(RACE.start); m <= end; m++) {
        raceClock = fmt(m);
        for (const cp of CPS) {
          const bibs = passes.get(`${cp}:${m}`);
          if (bibs) {
            await setClock(cps[cp], m);
            await say(cps[cp], `${bibs.length} runner${bibs.length === 1 ? '' : 's'} through at ${fmt(m)}`);
            await cps[cp].page.fill('#quick-entry-input', bibs.join(', '));
            await cps[cp].page.keyboard.press('Enter');
            await expect(cps[cp].page.getByTestId('markoff-status')).toContainText(bibs.length === 1 ? String(bibs[0]) : `${bibs.length} runners marked`);
            waiting[cp].push(...bibs.map(bib => ({ bib, t: m })));
          }
          // Brief: every 5–10 competitors, no more than about 5 minutes late
          const silent = cp === SILENT.cp && m >= SILENT.from && m < SILENT.to;
          if (!silent && (waiting[cp].length >= 5 || (waiting[cp].length && m - waiting[cp][0].t >= 5))) {
            await setClock(cps[cp], m);
            await call(cp, m);
          }
        }
        if (m % 5 === 0) {
          await receiveFinish(m);
          await setClock(base, m);
          const labels = await base.page.getByRole('button', { name: /^(CP\d|Finish), / }).evaluateAll(els => els.map(e => e.getAttribute('aria-label')));
          board.push({ at: fmt(m), labels });
          for (const cp of CPS) {
            const first = Math.min(...runners.map(r => r.times[cp - 1] ?? Infinity));
            if (m < first && labels.some(l => l.startsWith(`CP${cp}, Due`))) falseDue[cp].push(fmt(m));
          }
        }
        if (VIDEO_DIR) await base.page.waitForTimeout(250);
        for (const ev of events.get(m) ?? []) {
          for (const s of stations) await setClock(s, m);
          await test.step(`${fmt(m)} ${ev.title}`, async () => {
            log(ev.title);
            await say(base, ev.title);
            await check('Event', ev.title, ev.fn);
          });
        }
      }
      raceClock = 'after';
      });
    });

    await test.step('After the race — base reconciles against the source', async () => {
      const m = Math.max(...finishes.map(r => r.finish)) + 15;
      raceClock = fmt(m);
      for (const s of stations) await setClock(s, m);
      const { page } = base;
      await say(base, `Race over: ${finishes.length} finishers, ${DNS_BIBS.length} DNS, 1 DNF. Base checks every report`);
      if (VIDEO_DIR) timeline.push({ t: Date.now() + 12000, clock: '10:45', end: true, text: '' });

      await baseTab(page, 'Overview').click();
      await shot(base, '21-final-overview');
      log(`Overview: ${(await page.getByTestId('stats-grid').innerText()).replace(/\n/g, ' ')}`);

      await baseTab(page, 'Reports').click();
      await shot(base, '22-final-reports');
      const checks = {};
      for (const id of ['dup', 'order', 'skip', 'after', 'unknown', 'pace']) checks[id] = await page.getByTestId(`check-count-${id}`).innerText();
      log(`Final checks: ${JSON.stringify(checks)}`);
      for (const [id, want] of Object.entries({ dup: '✓', order: '✓', skip: '✓', after: '✓', unknown: '✓' })) {
        if (checks[id] !== want) note('Base', `Final check "${id}" reads ${checks[id]}, expected ${want}`);
      }
      await page.getByRole('button', { name: /^Impossible pace/ }).click();
      await shot(base, '23-pace');
      log(`Pace: ${(await page.getByTestId('issue-row').allInnerTexts()).map(r => r.replace(/\n/g, ' ')).join(' | ')}`);

      await page.getByRole('button', { name: /^Overdue runners/ }).click();
      await check('Base', 'nobody overdue at the end', () => expect(page.getByText('No runners overdue.')).toBeVisible({ timeout: 2000 }));
      await page.getByRole('button', { name: /^Still on course/ }).click();
      await shot(base, '24-still-on-course');
      log(`Still on course: ${(await page.locator('section[aria-labelledby="rephd"]').innerText()).replace(/\n/g, ' ').slice(0, 300)}`);
      await page.getByRole('button', { name: /^Call log/ }).click();
      await shot(base, '25-call-log');

      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      await shot(base, '26-times');
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'CSV', exact: true }).click()]);
      const csvFile = path.join(OUT, 'times-by-checkpoint.csv');
      await dl.saveAs(csvFile);
      const [head, ...rows] = fs.readFileSync(csvFile, 'utf8').trim().split('\n').map(l => l.split(','));
      log(`CSV header: ${head.join(',')}; ${rows.length} rows`);
      const mismatches = [];
      for (const row of rows) {
        const r = byBib.get(Number(row[0]));
        if (!r) { mismatches.push(`bib ${row[0]} not in source`); continue; }
        const want = r.times.map(t => (t ? fmt(block(t)) : null));
        want.push(r.finish && !r.dnf ? fmt(block(r.finish)) : null);
        want.forEach((w, i) => {
          const got = row[i + 2] ?? '';
          if (w && got !== w) mismatches.push(`bib ${r.bib} ${head[i + 2]}: got "${got}", want ${w}`);
          if (!w && /\d\d:\d\d/.test(got)) mismatches.push(`bib ${r.bib} ${head[i + 2]}: got "${got}", want nothing`);
        });
      }
      if (rows.length !== runners.length) note('Base', `Times CSV has ${rows.length} rows, expected ${runners.length}`);
      if (mismatches.length) note('Base', `Times differ from the source in ${mismatches.length} cells: ${mismatches.slice(0, 12).join('; ')}`);
      else log('Every CP and finish time at base matches the source block for block');
      const notFinished = rows.filter(r => /\d\d:\d\d/.test(r[6] ?? '') && r[1] !== 'Finished').map(r => `${r[0]}:${r[1] || 'blank'}`);
      if (notFinished.length) note('Base', `Times CSV Status is not Finished for ${notFinished.length} finishers: ${notFinished.slice(0, 8).join(' ')}`);
      log(`Statuses: ${JSON.stringify(rows.reduce((a, r) => ({ ...a, [r[1]]: (a[r[1]] ?? 0) + 1 }), {}))}`);

      // Exports TRAQ would ask for
      await page.getByRole('button', { name: /^Exports/ }).click();
      await shot(base, '27-exports');
      let splitText = '';
      const panel = page.locator('section[aria-labelledby="rephd"]');
      const preview = panel.locator('#showPreview');
      if (await preview.isChecked()) await preview.uncheck();
      for (const label of EXPORTS) {
        await check('Exports', label, async () => {
          await panel.getByRole('button', { name: new RegExp(`^${label}`) }).click();
          const [file] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), panel.getByRole('button', { name: /generate|download/i }).last().click()]);
          const to = path.join(OUT, `export-${label.replace(/\W+/g, '-').toLowerCase()}-${file.suggestedFilename()}`);
          await file.saveAs(to);
          const text = fs.readFileSync(to, 'utf8');
          log(`Export "${label}": ${file.suggestedFilename()}, ${text.split('\n').length} lines, starts ${JSON.stringify(text.slice(0, 200))}`);
          if (label === 'Finisher List') {
            const data = text.trim().split('\n').filter(l => /^\s*"?\d+"?\s*,/.test(l)).length;
            if (data !== finishes.length) note('Exports', `Finisher List has ${data} data rows, expected ${finishes.length}`);
          }
          if (label === 'Race Summary Report' && /not-started/.test(text)) note('Exports', 'Race Summary still has not-started runners');
          if (label === 'Missing Numbers Report') {
            const total = text.match(/Total Missing:\s*(\d+)/)?.[1];
            if (total !== '0') note('Exports', `Missing Numbers says Total Missing: ${total ?? 'absent'}, expected 0 for CP1`);
          }
          if (label === 'Out List Report') {
            const stray = text.split('\n').filter(l => /^\d+,/.test(l) && /(^|,)\s*\.\s*(,|$)|\.\s$|\. ?"/.test(l));
            if (stray.length) note('Exports', `Out List has a stray ". " in ${stray.length} rows: ${stray.slice(0, 3).join(' | ')}`);
          }
          if (label === 'Split Times') splitText = text;
        });
      }
      // Split Times must agree with the Times by checkpoint CSV, cell for cell
      const unq = (l) => l.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      const splitRows = splitText.split(/\r?\n/).filter(l => /^"?\d+"?,/.test(l)).map(unq);
      const csvByBib = new Map(rows.map(r => [r[0], r]));
      const bad = [];
      for (const sr of splitRows) {
        const cr = csvByBib.get(sr[0]);
        if (!cr) { bad.push(`bib ${sr[0]} not in CSV`); continue; }
        for (let i = 0; i < 5; i++) { // CP1-4 then Finish: CSV cols 2-6, Split cols 3-7
          const want = /\d\d:\d\d/.test(cr[i + 2] ?? '') ? cr[i + 2] : null;
          const got = /\d\d:\d\d/.test(sr[i + 3] ?? '') ? sr[i + 3] : null;
          if (want !== got) bad.push(`bib ${sr[0]} col ${i + 1}: Split ${got}, CSV ${want}`);
        }
      }
      if (splitRows.length !== rows.length) note('Exports', `Split Times has ${splitRows.length} rows, CSV has ${rows.length}`);
      if (bad.length) note('Exports', `Split Times differs from the CSV in ${bad.length} cells: ${bad.slice(0, 8).join('; ')}`);
      for (const cp of CPS) if (falseDue[cp].length) note('Base', `CP${cp} showed Due before any runner could have reached it, at ${falseDue[cp].join(' ')}`);
      fs.writeFileSync(path.join(OUT, 'board.json'), JSON.stringify(board, null, 1));
    });

    await test.step('After the race — CP3 hands its results file to base', async () => {
      const cp3 = cps[3].page;
      await cpTab(cp3, 'Mark off').click();
      await cp3.getByRole('button', { name: 'Export Results' }).click();
      await shot(cps[3], '29-cp3-export');
      const [dl] = await Promise.all([cp3.waitForEvent('download'), cp3.getByRole('button', { name: 'Download JSON' }).click()]);
      const file = path.join(OUT, dl.suggestedFilename());
      await dl.saveAs(file);
      await cp3.getByRole('button', { name: 'close' }).click();
      const { page } = base;
      await baseTab(page, 'Overview').click();
      await check('Base', 'imports the CP3 results file', async () => {
        await page.locator('input[type="file"]').last().setInputFiles(file);
        await expect(page.getByText(/imported — \d+ runners/)).toBeVisible({ timeout: 5000 });
        log(await page.getByText(/imported — \d+ runners/).innerText());
      });
      await check('Base', 'Overview shows CP1 at 100% of the 22 km starters', async () => {
        const cpText = (await page.locator('section[aria-labelledby="cphd"]').innerText()).replace(/\s+/g, ' ');
        const n = runners.filter(r => r.km === 22 && !r.dns).length;
        if (!new RegExp(`CP1\\D*${n}\\D*100%`).test(cpText)) throw new Error(`CP1 progress is not ${n} / 100%: ${cpText.slice(0, 160)}`);
      });
      await shot(base, '30-cp3-imported');
      await baseTab(page, 'Reports').click();
      const checks = {};
      for (const id of ['dup', 'order', 'skip', 'after', 'unknown', 'pace']) checks[id] = await page.getByTestId(`check-count-${id}`).innerText();
      log(`Checks after importing CP3: ${JSON.stringify(checks)}`);
      await page.getByRole('button', { name: /^Times by checkpoint/ }).click();
      await shot(base, '31-times-after-import');
      await check('Base', 'Live Dashboard opens', async () => {
        await page.getByRole('button', { name: 'Live Dashboard' }).click();
        await page.waitForURL(/dashboard/, { timeout: 5000 });
        await page.waitForTimeout(500);
        await shot(base, '32-live-dashboard');
        const dash = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
        log(`Live Dashboard: ${dash.slice(0, 240)}`);
        const n22 = runners.filter(r => r.km === 22).length;
        if (!new RegExp(`\\b\\d+/${n22}\\b`).test(dash)) note('Base', `Live Dashboard does not count CP1 against the ${n22} 22 km runners: ${dash.slice(0, 200)}`);
      });
    });

    await test.step('After the race — what each checkpoint device says', async () => {
      for (const cp of CPS) {
        const { page } = cps[cp];
        await cpTab(page, 'Mark off').click();
        const header = (await page.locator('header, [class*="bg-vk-navy"]').first().innerText()).replace(/\n/g, ' ');
        const unsent = await page.getByRole('button', { name: /Share batch/ }).getAttribute('aria-label').catch(() => '');
        log(`CP${cp} final: ${header.slice(0, 160)} | ${unsent}`);
        if (cp === 1 && !/Share batch, 0 runners/.test(unsent ?? '')) note('CP1', `Share batch badge after the race says "${unsent}", expected "Share batch, 0 runners"`);
        await cpTab(page, 'Overview').click();
        await shot(cps[cp], `28-cp${cp}-final`);
      }
    });

    fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify({ findings, diary }, null, 2));
    console.log(`\n${findings.length} findings — ${path.join(OUT, 'findings.json')}`);
    const videos = VIDEO_DIR ? stations.map(s => ({ label: s.label, startedAt: s.startedAt, video: s.page.video() })) : [];
    for (const s of stations) await s.ctx.close();
    if (VIDEO_DIR) {
      for (const v of videos) { await v.video.saveAs(path.join(VIDEO_DIR, `${v.label}.webm`)); await v.video.delete(); }
      fs.writeFileSync(path.join(VIDEO_DIR, 'timeline.json'), JSON.stringify({ devices: videos.map(({ label, startedAt }) => ({ label, startedAt })), timeline }, null, 1));
    }
    expect(findings).toEqual([]); // a green run means no bugs
  });
});
