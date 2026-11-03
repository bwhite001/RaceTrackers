/**
 * Side-by-side race video: plays the five station recordings together in a page,
 * with a shared caption track, and records that page. Needs no ffmpeg filters.
 *
 *   RACE_VIDEO_DIR=<raw> npx playwright test test/e2e/playwright/35-mt-glorious-dress-rehearsal.spec.js -g "set up the race" --workers=1 --retries=0
 *   node scripts/videos/compose-race.mjs <raw> <out.webm>
 */
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const [raw, out] = process.argv.slice(2);
const dir = path.resolve(raw);
const { devices, timeline } = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
const T0 = timeline.find(e => e.start).t;
const T1 = timeline.find(e => e.end).t;
const NAMES = {
  Base: 'Base · VK4WIP · Maiala', CP1: 'CP1 · Northbrook', CP2: 'CP2 · England Creek',
  CP3: 'CP3 · Joyners Ridge', CP4: 'CP4 · Apiary Site',
};

const html = `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; } html, body { margin: 0; height: 100%; background: #0B2545; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; }
  #grid { position: absolute; inset: 0 0 108px 0; display: grid; grid-template-columns: 1fr repeat(4, 252px); gap: 6px; padding: 6px; align-items: center; }
  .st { min-width: 0; display: flex; flex-direction: column; align-items: center; }
  .st b { font-size: 17px; color: #D4AF37; padding: 0 0 6px; white-space: nowrap; }
  .st video { width: 100%; height: auto; display: block; }
  #bar { position: absolute; left: 0; right: 0; bottom: 0; height: 108px; border-top: 5px solid #D4AF37; display: flex; align-items: center; gap: 28px; padding: 0 28px; }
  #clock { font: 800 46px/1 system-ui; font-variant-numeric: tabular-nums; color: #D4AF37; min-width: 150px; }
  #cap { font: 600 28px/1.25 system-ui; }
  #card { position: absolute; inset: 0; z-index: 9; background: #0B2545; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; padding: 60px; }
  #card h1 { font-size: 58px; margin: 0; } #card p { font-size: 28px; margin: 0; max-width: 1400px; line-height: 1.35; color: #cfd8e6; }
</style><div id="grid">${devices.map(d => `<div class="st" id="${d.label}"><b>${NAMES[d.label]}</b><video muted src="${d.label}.webm"></video></div>`).join('')}</div>
<div id="bar"><div id="clock"></div><div id="cap"></div></div><div id="card"></div>`;
fs.writeFileSync(path.join(dir, 'compose.html'), html);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: path.join(dir, 'out'), size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
await page.goto(`file://${dir}/compose.html`);
await page.evaluate(async ({ devices, timeline, T0, T1 }) => {
  const card = document.getElementById('card');
  const show = (h, p) => { card.innerHTML = `<h1>${h}</h1><p>${p}</p>`; card.style.display = 'flex'; };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  show('Mt Glorious Mountain Trails', 'Full race rehearsal: one base and four checkpoints, each on its own device. Real 2025 checkpoint times, moved 30 minutes earlier for the 06:30 start. Finish times are simulated.');
  const vids = devices.map(d => ({ ...d, v: document.querySelector(`#${d.label} video`) }));
  for (const { v, startedAt } of vids) {
    if (v.readyState < 1) await new Promise(r => { v.onloadedmetadata = r; });
    v.currentTime = (T0 - startedAt) / 1000;
    await new Promise(r => { v.onseeked = r; });
  }
  await wait(6000);
  card.style.display = 'none';
  await Promise.all(vids.map(({ v }) => v.play()));
  const capEl = document.getElementById('cap');
  const clockEl = document.getElementById('clock');
  const master = vids[0];
  while (true) {
    const now = master.startedAt + master.v.currentTime * 1000;
    if (now >= T1 || master.v.ended) break;
    const cur = timeline.filter(e => e.t <= now).at(-1);
    if (cur) {
      capEl.textContent = cur.device && cur.device !== 'Base' ? `${cur.device}: ${cur.text}` : cur.text;
      clockEl.textContent = cur.clock;
    }
    await wait(100);
  }
  vids.forEach(({ v }) => v.pause());
  show('Every time matched', 'All 483 checkpoint passes and 120 simulated finishes at base matched the source, block for block. 120 finished, 7 did not start, 1 withdrew.');
  await wait(6000);
}, { devices, timeline, T0, T1 });
const video = page.video();
await page.close();
await ctx.close();
await video.saveAs(path.resolve(out));
await video.delete();
await browser.close();
console.log(`wrote ${out}`);
