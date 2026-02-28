#!/usr/bin/env node
/**
 * generate-guide.js
 * Reads playwright-report/journey-report.html, extracts passing tests,
 * and writes docs/guides/user-guide.md + docs/guides/user-guide.html
 * + docs/guides/assets/*.png
 *
 * Usage: node test/e2e/playwright/generate-guide.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const REPORT_PATH = path.join(ROOT, 'playwright-report', 'journey-report.html');
const OUT_DIR = path.join(ROOT, 'docs', 'guides');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');

const SECTION_MAP = {
  'creates a new race from scratch and verifies the overview':           'setup',
  'step indicator advances correctly through setup wizard':              'setup',
  'back button on step 2 returns to race details with data preserved':   'setup',
  'race management page lists created races':                            'setup',
  'clicking a race opens its overview':                                  'setup',
  'creates a second race from the management page':                      'setup',
  'race overview shows correct runner and checkpoint counts':            'setup',
  'navigates to checkpoint and sees runner grid':                        'checkpoint',
  'marks off a single runner via the runner grid':                       'checkpoint',
  'marks off multiple runners via Quick Entry':                          'checkpoint',
  'switches to Overview tab and shows runner counts':                    'checkpoint',
  'can export checkpoint results':                                       'checkpoint',
  'navigates from race overview to a checkpoint':                        'checkpoint',
  'home page landing shows the race management module card':             'navigation',
  'home page module cards are all accessible when no operation is active': 'navigation',
  'unknown routes redirect to home':                                     'navigation',
  'navigates from race overview to base station':                        'navigation',
  'shows protection modal when leaving active checkpoint operation':     'navigation',
  'allows navigation after confirming exit from active operation':       'navigation',
  'opens and closes the Settings modal':                                 'settings',
  'toggles dark mode on and off':                                        'settings',
  'settings persist after closing and reopening the modal':              'settings',
};

const CHAPTERS = [
  { key: 'setup',      title: 'Setting Up a Race',    intro: 'Use these steps to create and manage races. This section covers the full setup wizard, runner ranges, checkpoints, and the race overview.' },
  { key: 'checkpoint', title: 'Running a Checkpoint', intro: 'Steps for checkpoint volunteers. Covers opening a checkpoint, marking off runners individually and in bulk, reviewing counts, and exporting data.' },
  { key: 'navigation', title: 'Navigating the App',   intro: 'How to move between modules, what to expect on the home screen, and how the app protects active operations from accidental navigation.' },
  { key: 'settings',   title: 'Settings',             intro: 'Personalise the app. Toggle dark mode and understand how preferences are saved.' },
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function unescapeHtml(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function extractPassingTests(html) {
  const tests = [];
  const re = /<article class="test pass">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const block = m[1];
    const titleMatch = block.match(/class="test-title">([^<]+)<\/h3>/);
    const descMatch  = block.match(/class="test-description">([^<]+)<\/p>/);
    const imgRe = /src="(data:image\/png;base64,[^"]+)"/g;
    const screenshots = [];
    let im;
    while ((im = imgRe.exec(block)) !== null) screenshots.push(im[1]);
    if (titleMatch) {
      tests.push({
        title: titleMatch[1].trim(),
        description: descMatch ? descMatch[1].trim() : '',
        screenshots,
      });
    }
  }
  return tests;
}

function saveScreenshot(dataUri, filename) {
  const base64 = dataUri.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(ASSETS_DIR, filename), Buffer.from(base64, 'base64'));
  return `assets/${filename}`;
}

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(`ERROR: ${REPORT_PATH} not found.\nRun: npm run test:e2e first.`);
    process.exit(1);
  }

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const html = fs.readFileSync(REPORT_PATH, 'utf8');
  const tests = extractPassingTests(html);
  console.log(`Found ${tests.length} passing tests.`);

  const chapters = {};
  for (const ch of CHAPTERS) chapters[ch.key] = [];

  for (const test of tests) {
    const chapter = SECTION_MAP[test.title];
    if (!chapter) {
      console.warn(`  WARN: no chapter mapping for "${test.title}" — skipping`);
      continue;
    }
    const screenshotPaths = test.screenshots.map((dataUri, i) => {
      const filename = `${slugify(test.title)}-step-${String(i + 1).padStart(2, '0')}.png`;
      return saveScreenshot(dataUri, filename);
    });
    chapters[chapter].push({ ...test, screenshotPaths });
  }

  // ── Markdown ──────────────────────────────────────────────────────────
  const mdLines = [
    '# RaceTracker Pro — User Guide',
    '',
    '> This guide is auto-generated from the Playwright journey tests.',
    '> Screenshots show the actual app at each key step.',
    '> Regenerate with: `npm run generate:guide`',
    '',
  ];

  for (const ch of CHAPTERS) {
    const items = chapters[ch.key];
    if (!items.length) continue;
    mdLines.push(`## ${ch.title}`, '', ch.intro, '');
    for (const test of items) {
      mdLines.push(`### ${toTitleCase(test.title)}`, '', unescapeHtml(test.description), '');
      for (let i = 0; i < test.screenshotPaths.length; i++) {
        mdLines.push(`![Step ${i + 1}](${test.screenshotPaths[i]})`, '');
      }
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'user-guide.md'), mdLines.join('\n'), 'utf8');
  console.log('Written: docs/guides/user-guide.md');

  // ── HTML ──────────────────────────────────────────────────────────────
  const chapterBlocks = [];
  for (const ch of CHAPTERS) {
    const items = chapters[ch.key];
    if (!items.length) continue;
    let block = `<div id="${ch.key}">\n<h2>${ch.title}</h2>\n<p class="chapter-intro">${ch.intro}</p>\n`;
    for (const test of items) {
      const desc = unescapeHtml(test.description);
      block += `<section class="task">\n<h3>${toTitleCase(test.title)}</h3>\n<p class="description">${desc}</p>\n<div class="filmstrip">\n`;
      for (let i = 0; i < test.screenshots.length; i++) {
        block += `<figure><img src="${test.screenshots[i]}" alt="Step ${i + 1}" loading="lazy"><figcaption>Step ${i + 1}</figcaption></figure>\n`;
      }
      block += `</div>\n</section>\n`;
    }
    block += `</div>`;
    chapterBlocks.push(block);
  }

  const tocLinks = CHAPTERS
    .filter(ch => chapters[ch.key].length)
    .map(ch => `  <a href="#${ch.key}">${ch.title}</a>`)
    .join('\n');

  const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RaceTracker Pro — User Guide</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
  .page-header { background: #1e3a5f; color: #fff; padding: 24px 32px; }
  .page-header h1 { font-size: 1.5rem; }
  .page-header p { font-size: .9rem; opacity: .8; margin-top: 4px; }
  nav.toc { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 12px 32px; }
  nav.toc a { color: #1e3a5f; text-decoration: none; margin-right: 20px; font-size: .9rem; font-weight: 500; }
  nav.toc a:hover { text-decoration: underline; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
  h2 { font-size: 1.3rem; color: #1e3a5f; margin: 40px 0 8px; border-bottom: 2px solid #1e3a5f; padding-bottom: 6px; }
  .chapter-intro { color: #475569; margin-bottom: 24px; font-size: .95rem; }
  .task { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px; }
  .task h3 { font-size: 1rem; color: #0f172a; margin-bottom: 10px; }
  .task .description { color: #475569; font-size: .9rem; margin-bottom: 16px; }
  .filmstrip { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
  .filmstrip figure { flex: 0 0 auto; text-align: center; }
  .filmstrip img { width: 260px; border-radius: 6px; border: 1px solid #e2e8f0; display: block; }
  .filmstrip figcaption { font-size: .75rem; color: #94a3b8; margin-top: 4px; }
  .page-footer { text-align: center; padding: 24px; font-size: .75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 40px; }
  @media (max-width: 640px) { .filmstrip img { width: 200px; } main { padding: 16px; } }
</style>
</head>
<body>
<header class="page-header">
  <h1>&#x26A1; RaceTracker Pro — User Guide</h1>
  <p>Auto-generated from Playwright journey tests &bull; All roles combined</p>
</header>
<nav class="toc">
${tocLinks}
</nav>
<main>
${chapterBlocks.join('\n')}
</main>
<footer class="page-footer">Generated by generate-guide.js &bull; Regenerate with <code>npm run generate:guide</code></footer>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, 'user-guide.html'), finalHtml, 'utf8');
  console.log('Written: docs/guides/user-guide.html');

  const pngCount = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.png')).length;
  console.log(`Written: ${pngCount} screenshots to docs/guides/assets/`);
  console.log('\nDone! Open docs/guides/user-guide.html in a browser.');
}

main();
