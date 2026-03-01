/**
 * Playwright Custom Reporter — Single-File Progressive Screenshot Report
 *
 * Generates a self-contained, non-interactive HTML file that shows:
 *  - Run summary (pass/fail counts, duration, timestamp)
 *  - One section per customer journey (grouped by spec file)
 *  - Each test: plain-English description + filmstrip of progressive screenshots
 *  - Failed tests: error message and stack trace in a collapsible block
 *
 * All screenshots are embedded as Base64 so the file is fully portable.
 *
 * Configured in playwright.config.js as:
 *   ['./test/e2e/playwright/reporter.js', { outputFile: 'playwright-report/journey-report.html' }]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JOURNEY_DESCRIPTIONS } from './descriptions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class ProgressiveHTMLReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile ?? 'playwright-report/journey-report.html';
    this.results = [];
    this.startTime = null;
  }

  onBegin(_config, _suite) {
    this.startTime = Date.now();
  }

  onTestEnd(test, result) {
    this.results.push({ test, result });
  }

  async onEnd(_runResult) {
    const duration = Date.now() - this.startTime;

    // Group tests by journey file
    const suites = new Map();
    for (const { test, result } of this.results) {
      const filename = path.basename(test.location.file);
      const journeyTitle = this._journeyTitle(filename);
      if (!suites.has(journeyTitle)) suites.set(journeyTitle, { filename, tests: [] });
      suites.get(journeyTitle).tests.push({ test, result });
    }

    const passed  = this.results.filter(r => r.result.status === 'passed').length;
    const failed  = this.results.filter(r => ['failed', 'timedOut'].includes(r.result.status)).length;
    const skipped = this.results.filter(r => r.result.status === 'skipped').length;
    const total   = this.results.length;

    const html = this._buildPage({
      passed, failed, skipped, total, duration,
      suitesHTML: [...suites.entries()]
        .map(([title, { tests }]) => this._suiteHTML(title, tests))
        .join('\n'),
    });

    const outDir = path.dirname(path.resolve(this.outputFile));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(this.outputFile, html, 'utf-8');

    const rel = path.relative(process.cwd(), this.outputFile);
    console.log(`\n  📋  Journey report →  ${rel}\n`);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _journeyTitle(filename) {
    return filename
      .replace(/\.journey\.spec\.[jt]s$/, '')
      .replace(/^\d+-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _suiteHTML(journeyTitle, tests) {
    const pass = tests.filter((t) => t.result.status === 'passed').length;
    const fail = tests.length - pass;
    const id   = journeyTitle.toLowerCase().replace(/\s+/g, '-');

    return `
<section class="suite" id="${id}">
  <div class="suite-header">
    <h2>${esc(journeyTitle)}</h2>
    <div class="suite-badges">
      <span class="badge badge-pass">${pass} passed</span>
      ${fail > 0 ? `<span class="badge badge-fail">${fail} failed</span>` : ''}
    </div>
  </div>
  ${tests.map(({ test, result }) => this._testHTML(test, result)).join('\n')}
</section>`;
  }

  _testHTML(test, result) {
    const status     = statusClass(result.status);
    const icon       = statusIcon(result.status);
    const duration   = (result.duration / 1000).toFixed(1) + 's';
    const description = JOURNEY_DESCRIPTIONS[test.title] ?? '';
    const screenshots = this._screenshots(result.attachments);

    const filmstrip = screenshots.length > 0
      ? `<div class="filmstrip" role="img" aria-label="Test screenshots">
          ${screenshots.map(({ label, b64 }) => `
          <figure class="frame">
            <img src="data:image/png;base64,${b64}" alt="${esc(label)}" />
            <figcaption>${esc(label)}</figcaption>
          </figure>`).join('')}
        </div>`
      : '<p class="no-screenshots">No screenshots captured for this test.</p>';

    const errorBlock = result.error
      ? `<details class="error-block" open>
          <summary>Error details</summary>
          <pre>${esc(result.error.message ?? '')}</pre>
          ${result.error.stack
            ? `<pre class="stack">${esc(result.error.stack)}</pre>`
            : ''}
        </details>`
      : '';

    return `
<article class="test ${status}">
  <div class="test-header">
    <span class="test-icon" aria-hidden="true">${icon}</span>
    <div class="test-meta">
      <h3 class="test-title">${esc(test.title)}</h3>
      ${description
        ? `<p class="test-description">${esc(description)}</p>`
        : ''}
    </div>
    <span class="test-duration">${duration}</span>
    <span class="badge badge-${status}">${result.status}</span>
  </div>
  ${filmstrip}
  ${errorBlock}
</article>`;
  }

  _screenshots(attachments) {
    return attachments
      .filter((a) => a.contentType === 'image/png')
      .map((a) => {
        const b64 = this._toBase64(a);
        if (!b64) return null;
        return { label: a.name, b64 };
      })
      .filter(Boolean);
  }

  _toBase64(attachment) {
    try {
      if (attachment.body) return attachment.body.toString('base64');
      if (attachment.path && fs.existsSync(attachment.path)) {
        return fs.readFileSync(attachment.path).toString('base64');
      }
    } catch {}
    return null;
  }

  // ── HTML page assembly ─────────────────────────────────────────────────────

  _buildPage({ passed, failed, skipped, total, duration, suitesHTML }) {
    const allPassed  = failed === 0 && skipped === 0;
    const mins       = Math.floor(duration / 60000);
    const secs       = Math.round((duration % 60000) / 1000);
    const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const runDate    = new Date().toLocaleString('en-AU', {
      dateStyle: 'long', timeStyle: 'short',
    });

    const tocItems = [
      ['Race Director – Race Setup',                    'race-director-race-setup'],
      ['Checkpoint Volunteer – Mark-Off Journey',       'checkpoint-volunteer-mark-off-journey'],
      ['Base Station Operator – Full Operations Journey','base-station-operator-full-operations-journey'],
      ['Race Management Journey',                       'race-management-journey'],
      ['Navigation Protection Journey',                 'navigation-protection-journey'],
      ['Settings &amp; Preferences Journey',            'settings-preferences-journey'],
      ['Import / Export Journey',                       'import-export-journey'],
    ].map(([label, id]) => `    <li><a href="#${id}">${label}</a></li>`).join('\n');

    const failedStatHTML = failed > 0
      ? `<div class="stat stat-fail"><span class="stat-value">${failed}</span><span class="stat-label">Failed</span></div>`
      : '';
    const skippedStatHTML = skipped > 0
      ? `<div class="stat stat-skip"><span class="stat-value">${skipped}</span><span class="stat-label">Skipped</span></div>`
      : '';
    const runStatusClass = allPassed ? 'run-pass' : 'run-fail';
    const runStatusText  = allPassed
      ? '&#x2705; All tests passed'
      : `&#x274C; ${failed} test${failed !== 1 ? 's' : ''} failed`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>RaceTracker Pro — Journey Test Report</title>
<style>
${CSS}
</style>
</head>
<body>

<header class="page-header">
  <div class="header-inner">
    <div class="brand">
      <span class="brand-icon" aria-hidden="true">&#x26A1;</span>
      <div>
        <h1>RaceTracker Pro</h1>
        <p class="brand-sub">Customer Journey Test Report</p>
      </div>
    </div>
    <div class="run-summary">
      <div class="stat stat-total">
        <span class="stat-value">${total}</span>
        <span class="stat-label">Tests</span>
      </div>
      <div class="stat stat-pass">
        <span class="stat-value">${passed}</span>
        <span class="stat-label">Passed</span>
      </div>
      ${failedStatHTML}
      ${skippedStatHTML}
      <div class="stat stat-time">
        <span class="stat-value">${durationStr}</span>
        <span class="stat-label">Duration</span>
      </div>
    </div>
    <p class="run-date">${esc(runDate)}</p>
    <p class="run-status ${runStatusClass}">${runStatusText}</p>
  </div>
</header>

<nav class="toc" aria-label="Journey index">
  <h2>Journeys</h2>
  <ol>
${tocItems}
  </ol>
</nav>

<main class="main">
${suitesHTML}
</main>

<footer class="page-footer">
  <p>Generated by Playwright &nbsp;&middot;&nbsp; RaceTracker Pro Customer Journey Tests &nbsp;&middot;&nbsp; ${esc(runDate)}</p>
</footer>

</body>
</html>`;
  }
}

// ── Utility functions ──────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusClass(status) {
  if (status === 'passed')  return 'pass';
  if (status === 'skipped') return 'skip';
  return 'fail';
}

function statusIcon(status) {
  if (status === 'passed')  return '✅';
  if (status === 'skipped') return '⏭️';
  if (status === 'timedOut') return '⏱️';
  return '❌';
}

// ── Inline CSS ────────────────────────────────────────────────────────────

const CSS = `
/* Reset & base */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 15px; scroll-behavior: smooth; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f0f2f5;
  color: #1a202c;
  line-height: 1.55;
}

/* ── Header ── */
.page-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
  color: #fff;
  padding: 28px 0 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,.25);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.brand-icon {
  font-size: 2rem;
  background: rgba(255,255,255,.15);
  padding: 10px;
  border-radius: 10px;
  line-height: 1;
}
.brand h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -.3px; }
.brand-sub { font-size: .85rem; opacity: .75; margin-top: 2px; }

.run-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.stat {
  background: rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 10px 18px;
  text-align: center;
  min-width: 80px;
}
.stat-value  { display: block; font-size: 1.6rem; font-weight: 700; line-height: 1; }
.stat-label  { display: block; font-size: .72rem; opacity: .8; margin-top: 3px; text-transform: uppercase; letter-spacing: .05em; }
.stat-pass   { background: rgba(52, 211, 153, .2); }
.stat-fail   { background: rgba(248,  82,  82, .25); }
.stat-skip   { background: rgba(251, 191,  36, .2); }

.run-date   { font-size: .8rem; opacity: .65; margin-bottom: 6px; }
.run-status { font-size: 1rem; font-weight: 600; }
.run-pass   { color: #6ee7b7; }
.run-fail   { color: #fca5a5; }

/* ── Table of contents ── */
.toc {
  max-width: 1200px;
  margin: 24px auto 8px;
  padding: 0 24px;
}
.toc h2 { font-size: .75rem; text-transform: uppercase; letter-spacing: .1em; color: #718096; margin-bottom: 8px; }
.toc ol {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  list-style: none;
  padding: 0;
}
.toc a {
  font-size: .82rem;
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}
.toc a:hover { border-bottom-color: #3b82f6; }

/* ── Main content ── */
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 24px 48px;
}

/* ── Suite (journey) section ── */
.suite {
  margin-top: 36px;
}
.suite-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #2d5a8e;
  padding-bottom: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.suite-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e3a5f;
}
.suite-badges { display: flex; gap: 8px; }

/* ── Badges ── */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: .72rem;
  font-weight: 600;
  letter-spacing: .03em;
  text-transform: uppercase;
}
.badge-pass { background: #d1fae5; color: #065f46; }
.badge-fail { background: #fee2e2; color: #7f1d1d; }
.badge-skip { background: #fef3c7; color: #78350f; }

/* ── Test article ── */
.test {
  background: #fff;
  border-radius: 10px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.08);
  border-left: 4px solid #e2e8f0;
}
.test.pass { border-left-color: #10b981; }
.test.fail { border-left-color: #ef4444; }
.test.skip { border-left-color: #f59e0b; }

.test-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px 10px;
  flex-wrap: wrap;
}
.test-icon { font-size: 1.1rem; margin-top: 2px; flex-shrink: 0; }
.test-meta { flex: 1 1 0; min-width: 0; }
.test-title {
  font-size: .95rem;
  font-weight: 600;
  color: #1a202c;
  line-height: 1.3;
}
.test-description {
  font-size: .82rem;
  color: #64748b;
  margin-top: 5px;
  line-height: 1.5;
  font-style: italic;
}
.test-duration {
  font-size: .75rem;
  color: #94a3b8;
  margin-top: 3px;
  flex-shrink: 0;
  align-self: flex-start;
}

/* ── Screenshot filmstrip ── */
.filmstrip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 18px 14px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.filmstrip::-webkit-scrollbar { height: 5px; }
.filmstrip::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.frame {
  flex: 0 0 auto;
  width: 240px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.frame:first-child { margin-left: 0; }

.frame img {
  width: 100%;
  aspect-ratio: 16/10;
  object-fit: cover;
  object-position: top;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  display: block;
}
.frame figcaption {
  font-size: .68rem;
  color: #94a3b8;
  margin-top: 4px;
  text-align: center;
  word-break: break-word;
  line-height: 1.3;
}

.no-screenshots {
  padding: 0 18px 14px;
  font-size: .8rem;
  color: #94a3b8;
  font-style: italic;
}

/* ── Error block ── */
.error-block {
  margin: 0 18px 14px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fff5f5;
  overflow: hidden;
}
.error-block summary {
  padding: 8px 12px;
  font-size: .8rem;
  font-weight: 600;
  color: #b91c1c;
  cursor: default;
  background: #fee2e2;
}
.error-block pre {
  padding: 10px 12px;
  font-size: .75rem;
  color: #7f1d1d;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  line-height: 1.5;
}
.error-block pre.stack {
  color: #9f1239;
  background: #fff1f2;
  border-top: 1px solid #fecaca;
}

/* ── Footer ── */
.page-footer {
  text-align: center;
  padding: 20px;
  font-size: .75rem;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  margin-top: 32px;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .run-summary { gap: 8px; }
  .stat { padding: 8px 12px; }
  .stat-value { font-size: 1.25rem; }
  .frame { width: 180px; }
}
`;
