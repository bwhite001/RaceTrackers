#!/usr/bin/env node
/**
 * generate-journey-docs.js
 *
 * Reads playwright-report/journey-report.html and generates three
 * role-focused annotated journey HTML documents:
 *
 *   docs/guides/journey-race-director.html
 *   docs/guides/journey-checkpoint-volunteer.html
 *   docs/guides/journey-base-station.html
 *
 * Each step is paired with annotation metadata from annotations.js so
 * the reader can see exactly what to click/fill and why.
 *
 * Usage:
 *   node test/e2e/playwright/generate-journey-docs.js
 *   npm run generate:journeys            (same thing)
 *   make generate-journeys               (same thing)
 *
 * This is automatically called as part of make guide (after the test run).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STEP_ANNOTATIONS } from './annotations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, '../../..');
const REPORT     = path.join(ROOT, 'playwright-report', 'journey-report.html');
const OUT_DIR    = path.join(ROOT, 'docs', 'guides');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');

// ── Journey definitions ────────────────────────────────────────────────────

const JOURNEYS = [
  {
    file:    'journey-race-director.html',
    role:    'Race Director',
    badge:   '#f59e0b',
    badgeText: '#1e293b',
    title:   'Setting Up &amp; Managing a Race',
    intro:   'Everything a race director does — from first opening the app to launching checkpoint and base station modules for volunteers.',
    persona: {
      name: 'Alex',
      desc: 'Alex is a race director preparing for a trail running event with 15 runners and 3 checkpoints. Alex sets up the race the day before, then on race morning opens the app to confirm everything is in order before handing devices to the volunteer teams.',
    },
    phases: [
      {
        id: 'open-app',
        title: 'Open the App',
        tests: ['home page module cards are all accessible when no operation is active'],
      },
      {
        id: 'settings',
        title: 'Configure Settings',
        tests: [
          'opens and closes the Settings modal',
          'toggles dark mode on and off',
          'settings persist after closing and reopening the modal',
        ],
      },
      {
        id: 'create-race',
        title: 'Create a Race',
        tests: [
          'creates a new race from scratch and verifies the overview',
          'step indicator advances correctly through setup wizard',
          'back button on step 2 returns to race details with data preserved',
        ],
      },
      {
        id: 'manage-races',
        title: 'Manage Races',
        tests: [
          'race management page lists created races',
          'clicking a race opens its overview',
          'creates a second race from the management page',
          'race overview shows correct runner and checkpoint counts',
        ],
      },
      {
        id: 'launch-modules',
        title: 'Launch Checkpoint &amp; Base Station Modules',
        tests: [
          'navigates from race overview to a checkpoint',
          'navigates from race overview to base station',
        ],
      },
    ],
  },
  {
    file:    'journey-checkpoint-volunteer.html',
    role:    'Checkpoint Volunteer',
    badge:   '#3b82f6',
    badgeText: '#ffffff',
    title:   'Running a Checkpoint',
    intro:   'Everything a checkpoint volunteer does on race day — from opening the app to marking off runners and calling in numbers to base station.',
    persona: {
      name: 'Sam',
      desc: 'Sam is a checkpoint volunteer stationed at Checkpoint 1. Sam arrives before the first runner, opens RaceTracker Pro on a tablet, and is responsible for recording every runner who passes through and calling in missing numbers to the base station operator.',
    },
    phases: [
      {
        id: 'open-checkpoint',
        title: 'Open the Checkpoint Screen',
        tests: ['navigates to checkpoint and sees runner grid'],
      },
      {
        id: 'mark-off',
        title: 'Mark Off Runners',
        tests: [
          'marks off a single runner via the runner grid',
          'marks off multiple runners via Quick Entry',
        ],
      },
      {
        id: 'callout-overview',
        title: 'Call Out Missing Runners',
        tests: [
          'switches to Callout Sheet tab',
          'switches to Overview tab and shows runner counts',
        ],
      },
      {
        id: 'export',
        title: 'Export Results',
        tests: ['can export checkpoint results'],
      },
    ],
  },
  {
    file:    'journey-base-station.html',
    role:    'Base Station Operator',
    badge:   '#8b5cf6',
    badgeText: '#ffffff',
    title:   'Operating the Base Station',
    intro:   'Everything the base station operator does — receiving call-ins from checkpoints, recording finish times, and managing the overall race picture.',
    persona: {
      name: 'Jordan',
      desc: 'Jordan is the base station operator stationed at the finish line. Jordan receives radio call-ins from each checkpoint volunteer, records finish times for runners crossing the line, and keeps the race director informed of the overall race status.',
    },
    phases: [
      {
        id: 'open-base-station',
        title: 'Open the Base Station',
        tests: ['navigates from race overview to base station'],
      },
    ],
  },
];

// ── HTML helpers ───────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unesc(s) {
  return String(s ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const ACTION_META = {
  'click':      { icon: '🖱',  label: 'Click',       color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'fill':       { icon: '✏️',  label: 'Fill in',     color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  'select':     { icon: '☰',  label: 'Select',      color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff' },
  'type+enter': { icon: '⌨',  label: 'Type + Enter',color: '#9a3412', bg: '#fff7ed', border: '#fed7aa' },
  'observe':    { icon: '👁',  label: 'Observe',     color: '#374151', bg: '#f9fafb', border: '#e5e7eb' },
};

function annotationHTML(annotation) {
  if (!annotation) return '';
  const m = ACTION_META[annotation.action] ?? ACTION_META['observe'];
  const valueRow = annotation.value
    ? `<div class="ann-row ann-value"><span class="ann-key">Enter:</span> <span class="ann-val-text">${esc(annotation.value)}</span></div>`
    : '';
  return `
<div class="annotation" style="--ann-color:${m.color};--ann-bg:${m.bg};--ann-border:${m.border};">
  <div class="ann-action">
    <span class="ann-icon" aria-hidden="true">${m.icon}</span>
    <span class="ann-action-label">${m.label}</span>
  </div>
  <div class="ann-body">
    <div class="ann-row ann-target"><span class="ann-key">Where:</span> <span>${esc(annotation.target)}</span></div>
    ${valueRow}
    <div class="ann-row ann-why"><span class="ann-key">Why:</span> <span>${esc(annotation.why)}</span></div>
  </div>
</div>`;
}

// ── Screenshot extraction ──────────────────────────────────────────────────

function extractPassingTests(reportHtml) {
  const tests = new Map();
  const articleRe = /<article class="test pass">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = articleRe.exec(reportHtml)) !== null) {
    const block      = m[1];
    const titleMatch = block.match(/class="test-title">([^<]+)<\/h3>/);
    const descMatch  = block.match(/class="test-description">([^<]+)<\/p>/);
    if (!titleMatch) continue;

    const title = unesc(titleMatch[1].trim());

    // Screenshots are named "NN-B label" (B = after-action state)
    const figRe = /<img src="(data:image\/png;base64,[^"]+)" alt="([^"]+)"/g;
    const shots = [];
    let im;
    while ((im = figRe.exec(block)) !== null) {
      const label = unesc(im[2]);
      if (/^\d{2}-B /.test(label)) {
        shots.push({ label: label.replace(/^\d{2}-B /, ''), dataUri: im[1] });
      }
    }

    tests.set(title, {
      title,
      description: descMatch ? unesc(descMatch[1].trim()) : '',
      shots,
    });
  }
  return tests;
}

function saveAsset(dataUri, filename) {
  const base64 = dataUri.replace(/^data:image\/png;base64,/, '');
  const dest = path.join(ASSETS_DIR, filename);
  fs.writeFileSync(dest, Buffer.from(base64, 'base64'));
  return `assets/${filename}`;
}

// ── Document builder ───────────────────────────────────────────────────────

function buildJourneyHTML(journey, allTests) {
  const navLinks = journey.phases
    .map(p => `<a href="#${p.id}">${p.title}</a>`)
    .join('\n  ');

  const otherLinks = JOURNEYS
    .filter(j => j.file !== journey.file)
    .map(j => `<a href="${j.file}">${j.role}</a>`)
    .join(' · ');

  let phasesHTML = '';
  let phaseNum = 0;

  for (const phase of journey.phases) {
    phaseNum++;
    let stepsHTML = '';

    for (const testTitle of phase.tests) {
      const testData = allTests.get(testTitle.toLowerCase())
                    ?? allTests.get(testTitle);
      if (!testData) {
        stepsHTML += `<p class="missing-test">⚠ Screenshot data not found for test: "${esc(testTitle)}" — run <code>make test-e2e</code> first.</p>\n`;
        continue;
      }

      const testAnnotations = STEP_ANNOTATIONS[testTitle] ?? {};
      stepsHTML += `<div class="test-block">\n`;
      stepsHTML += `<h3 class="test-title">${esc(testData.title)}</h3>\n`;
      if (testData.description) {
        stepsHTML += `<p class="test-desc">${esc(testData.description)}</p>\n`;
      }

      for (const shot of testData.shots) {
        const filename = `${slugify(testTitle)}-${slugify(shot.label)}.png`;
        let imgPath;
        // Reuse existing asset if already saved, otherwise save from data URI
        const existingPath = path.join(ASSETS_DIR, filename);
        if (fs.existsSync(existingPath)) {
          imgPath = `assets/${filename}`;
        } else {
          imgPath = saveAsset(shot.dataUri, filename);
        }

        const annotation = testAnnotations[shot.label];
        stepsHTML += `
<div class="step">
  <p class="step-label">${esc(shot.label)}</p>
  <img src="${imgPath}" alt="${esc(shot.label)}" loading="lazy">
  ${annotationHTML(annotation)}
</div>\n`;
      }

      stepsHTML += `</div>\n`;
    }

    phasesHTML += `
<section class="phase" id="${phase.id}">
  <div class="phase-header">
    <div class="phase-number">${phaseNum}</div>
    <h2>${phase.title}</h2>
  </div>
  <div class="phase-steps">
    ${stepsHTML}
  </div>
</section>\n`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(journey.role)} Journey — RaceTracker Pro</title>
<style>${STYLES}</style>
</head>
<body>

<header class="page-header">
  <div class="role-badge" style="background:${journey.badge};color:${journey.badgeText};">${esc(journey.role)}</div>
  <h1>${journey.title}</h1>
  <p>${journey.intro}</p>
</header>

<nav class="toc">
  ${navLinks}
  <span class="other-guides">Other journeys: ${otherLinks} · <a href="user-guide.html">Full Guide</a></span>
</nav>

<main>
  <div class="persona-card">
    <h2>👤 About this journey</h2>
    <p><strong>${esc(journey.persona.name)}</strong> — ${esc(journey.persona.desc)}</p>
  </div>

  ${phasesHTML}
</main>

<footer class="page-footer">
  RaceTracker Pro — ${esc(journey.role)} Journey &bull; Auto-generated from Playwright journey tests &bull; Regenerate with <code>make generate-journeys</code>
</footer>
</body>
</html>`;
}

// ── CSS ───────────────────────────────────────────────────────────────────

const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }

.page-header { background: #1e3a5f; color: #fff; padding: 28px 32px; }
.role-badge { display: inline-block; font-size: .75rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 3px 10px; border-radius: 99px; margin-bottom: 10px; }
.page-header h1 { font-size: 1.6rem; font-weight: 700; }
.page-header p { font-size: .95rem; opacity: .85; margin-top: 6px; max-width: 640px; }

nav.toc { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 12px 32px; display: flex; gap: 6px 20px; flex-wrap: wrap; align-items: center; }
nav.toc a { color: #1e3a5f; text-decoration: none; font-size: .9rem; font-weight: 500; }
nav.toc a:hover { text-decoration: underline; }
.other-guides { margin-left: auto; color: #64748b; font-size: .85rem; }
.other-guides a { color: #64748b; font-weight: 400; }

main { max-width: 860px; margin: 0 auto; padding: 40px 24px 60px; }

.persona-card { background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px 24px; margin-bottom: 40px; }
.persona-card h2 { font-size: .9rem; color: #92400e; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
.persona-card p { font-size: .9rem; color: #475569; }

.phase { margin-bottom: 56px; }
.phase-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
.phase-number { width: 34px; height: 34px; background: #1e3a5f; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .9rem; flex-shrink: 0; }
.phase-header h2 { font-size: 1.1rem; color: #1e3a5f; font-weight: 700; }

.test-block { margin-bottom: 32px; }
.test-title { font-size: 1rem; color: #0f172a; margin-bottom: 6px; font-weight: 600; }
.test-desc { font-size: .85rem; color: #64748b; margin-bottom: 20px; font-style: italic; line-height: 1.5; }

.step { margin-bottom: 28px; }
.step-label { font-weight: 600; font-size: .95rem; color: #1e293b; margin-bottom: 10px; }
.step img { max-width: 100%; width: 720px; border-radius: 8px; border: 1px solid #e2e8f0; display: block; box-shadow: 0 1px 6px rgba(0,0,0,.07); margin-bottom: 12px; }

/* Annotation callout */
.annotation {
  display: flex;
  gap: 12px;
  background: var(--ann-bg);
  border: 1px solid var(--ann-border);
  border-radius: 8px;
  padding: 12px 16px;
  max-width: 720px;
}
.ann-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  min-width: 56px;
  padding-top: 2px;
}
.ann-icon { font-size: 1.3rem; line-height: 1; }
.ann-action-label {
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--ann-color);
  white-space: nowrap;
}
.ann-body { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.ann-row { font-size: .875rem; color: #1e293b; display: flex; gap: 6px; align-items: baseline; }
.ann-key { font-weight: 700; color: var(--ann-color); flex-shrink: 0; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
.ann-val-text { font-family: ui-monospace, monospace; font-size: .8rem; background: rgba(0,0,0,.05); padding: 1px 6px; border-radius: 4px; color: #374151; }
.ann-why .ann-key { color: #64748b; }
.ann-why span:last-child { color: #475569; font-style: italic; }

.missing-test { color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; font-size: .85rem; margin-bottom: 16px; }
.missing-test code { font-family: ui-monospace, monospace; }

.page-footer { text-align: center; padding: 24px; font-size: .75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 40px; }
.page-footer code { font-family: ui-monospace, monospace; }

@media (max-width: 640px) {
  .step img { width: 100%; }
  main { padding: 16px; }
  .annotation { flex-direction: column; gap: 8px; }
  .ann-action { flex-direction: row; min-width: auto; }
}
`;

// ── Entry point ────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(REPORT)) {
    console.error(`\nERROR: ${REPORT} not found.`);
    console.error('Run the Playwright tests first:\n  make test-e2e\n');
    process.exit(1);
  }

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const reportHtml = fs.readFileSync(REPORT, 'utf8');
  const allTests   = extractPassingTests(reportHtml);

  // Normalise keys to lowercase for case-insensitive lookup
  const normalisedTests = new Map(
    [...allTests.entries()].map(([k, v]) => [k.toLowerCase(), v])
  );

  console.log(`\nFound ${normalisedTests.size} passing tests in report.`);

  for (const journey of JOURNEYS) {
    const html    = buildJourneyHTML(journey, normalisedTests);
    const outPath = path.join(OUT_DIR, journey.file);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`Written: docs/guides/${journey.file}`);
  }

  console.log('\n✅ Journey docs generated. Open docs/guides/ in a browser.\n');
}

main();
