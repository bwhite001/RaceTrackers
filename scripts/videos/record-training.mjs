/**
 * Paced training videos, one per role, with captions and click animations.
 *
 *   make build
 *   npx serve dist -p 3000 --single &
 *   node scripts/videos/record-training.mjs [checkpoint|base] <setup.json> <outDir>
 *
 * setup.json is a race setup file (Share race › Download), e.g. the one the
 * rehearsal writes to test-results/mt-glorious/. Bibs 1–128, start 06:30.
 */
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import { installOverlay, caption, CAPTION_HEIGHT } from './overlay.mjs';

const BASE = 'http://localhost:3000';
const [role = 'all', setupFile, outDir = 'docs/videos'] = process.argv.slice(2);
const at = (hm) => new Date(`2026-11-08T${hm}:05+10:00`).getTime();

const sleep = (page, ms) => page.waitForTimeout(ms);

/** One narrated session: paced clicks and typing, with the cursor travelling to each target. */
function director(page, ctx) {
  let first = true;
  const say = async (text, hold = 2600) => {
    await caption(page, text);
    // ponytail: the recorder can miss the first caption on a still page; a screenshot forces a fresh frame
    if (first) { first = false; await page.screenshot(); }
    await sleep(page, hold);
  };
  const point = async (loc) => {
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
    await sleep(page, 260);
  };
  // Keep the post-click pause short so the next caption arrives with the new screen; a pause of 2 s or more
  // is a deliberate hold on a screen worth seeing (a sheet, Overview, Reports), so it's kept
  const click = async (loc, after = 300) => { await point(loc); await loc.click(); await sleep(page, after >= 2000 ? after : Math.min(after, 400)); };
  const type = async (loc, text, after = 500) => {
    await point(loc);
    await loc.click();
    await loc.pressSequentially(text, { delay: 110 });
    await sleep(page, after);
  };
  const clock = async (hm) => {
    await ctx.clock.setSystemTime(at(hm) - 31000);
    await ctx.clock.fastForward(31000);
  };
  return { say, point, click, type, clock };
}

async function open(browser, name, viewport, startAt) {
  const ctx = await browser.newContext({
    baseURL: BASE, viewport: { width: viewport.width, height: viewport.height + CAPTION_HEIGHT },
    timezoneId: 'Australia/Brisbane', locale: 'en-AU', serviceWorkers: 'block',
    recordVideo: { dir: path.join(outDir, '.raw'), size: { width: viewport.width, height: viewport.height + CAPTION_HEIGHT } },
  });
  await ctx.clock.install({ time: at(startAt) });
  await installOverlay(ctx);

  // Off camera: load the race onto this device. Each page gets its own video.
  const prep = await ctx.newPage();
  await prep.goto('/race-management');
  await prep.getByRole('button', { name: /import race/i }).first().click();
  const dialog = prep.getByRole('dialog', { name: /import.*export/i });
  await dialog.getByRole('button', { name: /import configuration/i }).click();
  await dialog.locator('input[type="file"]').setInputFiles(setupFile);
  await dialog.getByText(/file loaded successfully/i).waitFor();
  await dialog.locator('button.btn-primary').click();
  await dialog.waitFor({ state: 'hidden' });

  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await prep.close();
  const prepVideo = prep.video();
  return { ctx, page, prepVideo, name };
}

async function finish({ ctx, page, prepVideo, name }) {
  const video = page.video();
  await page.close();
  await ctx.close();
  await video.saveAs(path.join(outDir, `${name}.webm`));
  await video.delete();
  await prepVideo.delete();
  console.log(`wrote ${path.join(outDir, `${name}.webm`)}`);
}

const tile = (page, n) => page.getByRole('button', { name: new RegExp(`^Runner ${n},`) });
const tab = (page, name) => page.getByRole('navigation', { name: 'Checkpoint tabs' }).getByRole('button', { name: new RegExp(`^${name}`) });

async function checkpoint(browser) {
  const s = await open(browser, 'training-checkpoint-operator', { width: 390, height: 844 }, '07:02');
  const { page, ctx } = s;
  const { say, click, type, clock } = director(page, ctx);
  await page.goto('/');
  await page.getByRole('button', { name: /^checkpoint\b/i }).waitFor();

  await say('Checkpoint operator training. CP1 at Mt Glorious. Everything here works with no signal.', 4000);
  await say('On the home screen, tap Checkpoint.');
  await click(page.getByRole('button', { name: /^checkpoint\b/i }), 1000);
  await say('Choose the race.', 1600);
  await click(page.getByRole('dialog').locator('button').filter({ has: page.locator('h3') }).first(), 1000);
  await say('Then choose your checkpoint.', 1600);
  const picker = page.getByRole('dialog').filter({ hasText: /select your checkpoint/i });
  await click(picker.getByRole('button').filter({ hasText: /^CP1/ }).first());
  await page.waitForSelector('#quick-entry-input');

  await say('This is Mark off. The tiles at the top show who has passed, who is still to come, and who you still need to call in.', 4800);
  await clock('07:07');
  await say('A runner passes. Tap their number. The app records the time.');
  await click(tile(page, 3), 900);
  await say('Tap the next runner as they go past.', 1800);
  await click(tile(page, 7), 800);
  await click(tile(page, 12), 800);
  await say('Busy group? Type several numbers into the box, then tap Mark.', 3000);
  await type(page.locator('#quick-entry-input'), '14, 15, 18, 19');
  await click(page.getByRole('button', { name: 'Mark', exact: true }), 1400);

  await clock('07:11');
  await say('Five to ten runners waiting, or five minutes gone? Time to call base. Tap Callout.', 3400);
  await click(tab(page, 'Callout'), 1200);
  await say('Numbers are grouped by common time. Say "VK4WIP this is VK4MUD, Scores Checkpoint 1", and wait for base.', 5200);
  await say('For more than five numbers, tap Read out. It splits them into short overs.', 3000);
  await click(page.getByRole('button', { name: 'Read out' }), 1200);
  await say('Read the common time, then each number in full. Tick each one as you read it.', 3400);
  const over = page.getByText(/^Over \d+ of \d+$/);
  for (;;) {
    const label = await over.innerText();
    for (const box of await page.getByRole('checkbox', { name: /^Read out / }).all()) {
      await click(box, 450);
    }
    await say('Base confirms this over. Tap Base copied, next.', 1800);
    await click(page.getByRole('button', { name: 'Base copied — next' }), 700);
    if (await page.getByText(/^All \d+ copied$/).isVisible()) break;
    if ((await over.innerText().catch(() => label)) === label) break;
  }
  await say('Done. The call is marked as sent.', 2200);
  await click(page.getByRole('button', { name: 'Back to callout', exact: true }), 1000);
  await click(tab(page, 'Mark off'), 1000);

  await say('Made a mistake? Tap a marked runner to fix their time. It never unmarks by accident.', 3800);
  await click(tile(page, 3), 1200);
  const sheet = page.getByRole('dialog');
  await say('Use the minus and plus buttons to move the time, then Save.', 2200);
  await click(sheet.getByLabel('5 minutes earlier'), 900);
  await click(sheet.getByRole('button', { name: /^Save / }), 1200);
  await say('Base already had that runner, so it becomes a correction. Tap Callout to see it.', 3400);
  await click(tab(page, 'Callout'), 1400);
  await say('Radio it as its own call: "Checkpoint 1 correction, runner 3, time is now..."', 4000);
  await click(page.getByRole('button', { name: /base copied — correction/i }), 1400);

  await clock('08:05');
  await say('Once the sweep has passed, call base for permission to stand down.', 3200);
  await say('Overview shows your whole checkpoint at a glance.', 2400);
  await click(tab(page, 'Overview'), 2600);
  await say('That is the checkpoint job: mark, call, fix, stand down. Thank you for helping!', 4000);
  await finish(s);
}

async function base(browser) {
  const s = await open(browser, 'training-base-operator', { width: 1112, height: 834 }, '07:02');
  const { page, ctx } = s;
  const { say, click, type, clock } = director(page, ctx);
  const baseTab = (name) => page.getByRole('tab', { name });
  const block = (hm) => page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: new RegExp(`^${hm}`) });
  const add = async (nums) => {
    for (const n of nums) {
      await type(page.locator('#bib-heard'), String(n), 120);
      await page.keyboard.press('Enter');
      await sleep(page, 350);
    }
  };
  await page.goto('/');
  await page.getByRole('button', { name: /base station/i }).waitFor();

  await say('Base operator training. VK4WIP at Maiala Picnic Area. Base keeps the master record of the race.', 4200);
  await say('On the home screen, tap Base Station and choose the race.', 2600);
  await click(page.getByRole('button', { name: /base station/i }), 1000);
  await click(page.getByRole('dialog').locator('button').filter({ has: page.locator('h3') }).first(), 1200);
  await page.getByRole('heading', { name: /who's calling/i }).waitFor();

  await say('Before the start, the organiser gives you the non-starters. Open DNF / DNS.', 3400);
  await click(baseTab('DNF / DNS'), 1000);
  await click(page.getByRole('group', { name: 'Status to apply' }).getByRole('button', { name: 'DNS' }), 800);
  await say('Choose DNS, type the numbers, press Enter, then mark them.', 2600);
  await type(page.locator('#bulk-bibs'), '6 18 46');
  await page.keyboard.press('Enter');
  await sleep(page, 800);
  await click(page.getByRole('button', { name: 'Mark 3 as DNS' }), 1600);

  await clock('07:12');
  await click(baseTab('Receive'), 900);
  await say('Who\'s calling? This board shows every checkpoint and how far each has reported.', 3800);
  await say('CP1 calls with scores. Tap CP1.', 2000);
  await click(page.getByRole('button', { name: /^CP1,/ }), 1000);
  await say('Pick the common time they give you.', 2000);
  await click(block('07:05'), 800);
  await say('Type each number as you hear it. Enter adds it to the call.', 2400);
  await add([3, 7, 12]);
  await say('They move on to the next five-minute block. Tap Next.', 2400);
  await click(page.getByRole('button', { name: /^Next \d\d:\d\d →$/ }), 800);
  await add([14, 15, 18]);
  await say('18 is a non-starter, so the app flags it and won\'t record it. Ask them to check that number.', 4200);
  await say('Tap Complete. Everything recorded is confirmed on screen.', 2600);
  await click(page.getByRole('button', { name: /^Complete · \d+$/ }), 1800);
  await click(page.getByRole('button', { name: 'Next call' }), 1200);

  await say('A correction is its own call, one runner at a time. Tap the checkpoint, then Correction.', 3600);
  await click(page.getByRole('button', { name: /^CP1,/ }), 900);
  await click(page.getByRole('button', { name: 'Correction', exact: true }), 1000);
  await type(page.locator('#corr-bib'), '3', 900);
  await say('It shows what base has. Pick the new time and apply it. The old record is kept, never deleted.', 4000);
  await click(page.getByRole('group', { name: 'Common time block' }).getByRole('button', { name: /^06:55/ }), 800);
  await click(page.getByRole('button', { name: /^Apply correction/ }), 1800);
  await click(page.getByRole('button', { name: /^Back to call/ }), 800);
  await click(page.getByRole('button', { name: 'Cancel call' }), 1000);

  await say('A runner withdraws? Press D on the keyboard, or use DNF / DNS.', 3000);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('d');
  await type(page.locator('input#runnerNumber'), '12');
  await click(page.getByRole('group', { name: 'Where' }).getByRole('button', { name: 'CP1' }), 900);
  await click(page.getByRole('button', { name: 'Withdraw runner', exact: true }), 1800);

  await say('Before a checkpoint packs up, run its Stand-down check. It lists anyone still unaccounted for.', 4000);
  await click(page.getByRole('button', { name: 'Stand-down check CP1' }), 2600);
  await click(page.getByRole('dialog').getByRole('button', { name: 'Close' }), 1200);

  await say('Overview shows counts, progress and the leaders.', 2400);
  await click(baseTab('Overview'), 3000);
  await say('Reports checks your data and lists anything that needs attention.', 2800);
  await click(baseTab('Reports'), 2400);
  await say('After the race, Times by checkpoint gives every runner\'s times. Use CSV to send them to the organisers.', 4200);
  await click(page.getByRole('button', { name: /^Times by checkpoint/ }), 3000);
  await say('That is base: receive, check, correct, and report. Thank you for helping!', 4000);
  await finish(s);
}

fs.mkdirSync(path.join(outDir, '.raw'), { recursive: true });
const browser = await chromium.launch();
if (role === 'checkpoint' || role === 'all') await checkpoint(browser);
if (role === 'base' || role === 'all') await base(browser);
await browser.close();
fs.rmSync(path.join(outDir, '.raw'), { recursive: true, force: true });
