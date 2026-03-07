#!/usr/bin/env node
/**
 * generate-gpx-guide.js
 * Generates docs/guides/alltrails-gpx-extraction.html and .pdf
 * from scripts/gpx-guide-config.json.
 *
 * Usage:
 *   node scripts/generate-gpx-guide.js
 *   node scripts/generate-gpx-guide.js --config path/to/custom-config.json
 *
 * Add to package.json: "generate:gpx-guide": "node scripts/generate-gpx-guide.js"
 * Add to Makefile:     generate-gpx-guide: npm run generate:gpx-guide
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'guides');

// ── Config ────────────────────────────────────────────────────────────────────

const configArg = process.argv.includes('--config')
  ? process.argv[process.argv.indexOf('--config') + 1]
  : path.join(__dirname, 'gpx-guide-config.json');

const cfg = JSON.parse(fs.readFileSync(configArg, 'utf8'));

// ── HTML builder ──────────────────────────────────────────────────────────────

function raceRows(races) {
  return races.map((r, i) => {
    const urlCell = r.alltrailsUrl
      ? `<a href="${r.alltrailsUrl}" class="url-link">${r.alltrailsUrl}</a>`
      : `<span class="url-missing">⚠ URL not yet found — see notes below</span>`;
    const status = r.alltrailsUrl ? 'status-ready' : 'status-pending';
    const statusLabel = r.alltrailsUrl ? 'Ready' : 'URL needed';
    return `
      <tr>
        <td><strong>${i + 1}. ${r.name}</strong></td>
        <td><code>${r.slug}</code></td>
        <td>${urlCell}</td>
        <td>${r.checkpoints}</td>
        <td><span class="status-badge ${status}">${statusLabel}</span></td>
      </tr>`;
  }).join('\n');
}

function raceSteps(races) {
  return races.map((r, i) => {
    const cmd = r.alltrailsUrl
      ? `node scripts/extract-alltrails-gpx.js \\
  ${r.alltrailsUrl} \\
  ${r.slug}`
      : `# First find the AllTrails URL for "${r.name}", then run:
node scripts/extract-alltrails-gpx.js \\
  &lt;alltrails-url&gt; \\
  ${r.slug}`;

    const urlNote = r.alltrailsUrl
      ? `<p class="step-note">URL confirmed: <a href="${r.alltrailsUrl}">${r.alltrailsUrl}</a></p>`
      : `<div class="callout callout-warning">
          <strong>⚠ URL needed:</strong> ${r.notes}
          <br>Go to <a href="https://www.alltrails.com">alltrails.com</a>, find the custom route, copy the URL from your browser, and paste it into <code>scripts/gpx-guide-config.json</code>.
        </div>`;

    return `
    <div class="race-step" id="race-${r.slug}">
      <h3><span class="step-num">${i + 1}</span> ${r.name}</h3>
      <p>${r.checkpoints} checkpoint${r.checkpoints !== 1 ? 's' : ''} &bull; Output: <code>src/data/templates/gpx/${r.slug}.gpx</code></p>
      ${urlNote}
      <div class="code-block"><pre>${cmd}</pre></div>
      <p class="step-note">A Chromium browser will open. Log in to AllTrails if prompted, then wait for the route to load. The script will close the browser and save the GPX file automatically.</p>
    </div>`;
  }).join('\n');
}

function prereqList(items) {
  return items.map(item => `<li>${item}</li>`).join('\n');
}

function buildHtml(cfg) {
  const now = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cfg.guideTitle} — ${cfg.organizationName}</title>
<style>
  /* ── CSS custom properties — edit to rebrand ── */
  :root {
    --primary:      ${cfg.primaryColor};
    --accent:       ${cfg.accentColor};
    --bg:           #f8fafc;
    --surface:      #ffffff;
    --border:       #e2e8f0;
    --text:         #1e293b;
    --text-muted:   #64748b;
    --code-bg:      #0f172a;
    --code-text:    #e2e8f0;
    --warn-bg:      #fffbeb;
    --warn-border:  #f59e0b;
    --success-bg:   #f0fdf4;
    --success-border: #22c55e;
    --radius:       8px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; font-size: 15px; }

  /* Header */
  .page-header { background: var(--primary); color: #fff; padding: 28px 40px; }
  .page-header h1 { font-size: 1.6rem; font-weight: 700; }
  .page-header p  { font-size: .9rem; opacity: .8; margin-top: 6px; }
  .header-meta { display: flex; gap: 20px; margin-top: 12px; font-size: .8rem; opacity: .7; }

  /* Navigation */
  nav.toc { background: var(--surface); border-bottom: 1px solid var(--border); padding: 10px 40px; display: flex; gap: 4px; flex-wrap: wrap; }
  nav.toc a { color: var(--primary); text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: .85rem; font-weight: 500; }
  nav.toc a:hover { background: var(--bg); }

  /* Layout */
  main { max-width: 900px; margin: 0 auto; padding: 36px 24px 60px; }

  /* Section headings */
  h2 { font-size: 1.25rem; color: var(--primary); margin: 44px 0 10px; padding-bottom: 8px; border-bottom: 2px solid var(--primary); display: flex; align-items: center; gap: 10px; }
  h2 .section-icon { font-size: 1.1rem; }
  h3 { font-size: 1.05rem; color: var(--text); margin: 24px 0 8px; display: flex; align-items: center; gap: 10px; }
  .step-num { background: var(--accent); color: #fff; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; flex-shrink: 0; }

  /* Cards */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 24px; margin-bottom: 16px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: .88rem; }
  th { background: var(--primary); color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: var(--bg); }

  /* Status badges */
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: .75rem; font-weight: 600; }
  .status-ready   { background: var(--success-bg); color: #15803d; border: 1px solid var(--success-border); }
  .status-pending { background: var(--warn-bg); color: #92400e; border: 1px solid var(--warn-border); }

  /* Callouts */
  .callout { padding: 12px 16px; border-radius: var(--radius); margin: 12px 0; font-size: .9rem; border-left: 4px solid; }
  .callout-warning { background: var(--warn-bg); border-color: var(--warn-border); }
  .callout-success { background: var(--success-bg); border-color: var(--success-border); }
  .callout-info    { background: #eff6ff; border-color: var(--accent); }

  /* Code blocks */
  .code-block { background: var(--code-bg); border-radius: var(--radius); padding: 16px 20px; margin: 12px 0; overflow-x: auto; }
  .code-block pre { color: var(--code-text); font-family: 'Menlo', 'Consolas', monospace; font-size: .85rem; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
  code { background: #e2e8f0; color: var(--primary); padding: 1px 5px; border-radius: 3px; font-size: .88em; font-family: 'Menlo', 'Consolas', monospace; }
  .code-block pre code { background: none; color: inherit; padding: 0; }

  /* Race steps */
  .race-step { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 24px; margin-bottom: 20px; }
  .race-step p { margin: 8px 0; color: var(--text-muted); font-size: .9rem; }
  .step-note { color: var(--text-muted) !important; font-style: italic; font-size: .85rem !important; }
  .url-link { color: var(--accent); word-break: break-all; font-size: .85rem; }
  .url-missing { color: #92400e; font-size: .85rem; }

  /* Prerequisites */
  .prereq-list { list-style: none; padding: 0; margin: 12px 0; }
  .prereq-list li { padding: 6px 0 6px 28px; position: relative; border-bottom: 1px solid var(--border); font-size: .92rem; }
  .prereq-list li:last-child { border-bottom: none; }
  .prereq-list li::before { content: "✓"; position: absolute; left: 6px; color: #22c55e; font-weight: 700; }

  /* Intro summary boxes */
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
  .summary-box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; text-align: center; }
  .summary-box .number { font-size: 1.8rem; font-weight: 700; color: var(--accent); }
  .summary-box .label { font-size: .8rem; color: var(--text-muted); margin-top: 2px; }

  /* Output file tree */
  .file-tree { background: var(--code-bg); border-radius: var(--radius); padding: 16px 20px; font-family: 'Menlo', 'Consolas', monospace; font-size: .85rem; color: var(--code-text); line-height: 1.8; }
  .file-tree .new { color: #86efac; }
  .file-tree .existing { color: #94a3b8; }

  /* Footer */
  .page-footer { text-align: center; padding: 24px; font-size: .78rem; color: var(--text-muted); border-top: 1px solid var(--border); margin-top: 48px; }

  /* Print / PDF */
  @media print {
    nav.toc { display: none; }
    .page-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h2, h3 { page-break-after: avoid; }
    .race-step { page-break-inside: avoid; }
    table { page-break-inside: avoid; }
    .code-block { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<header class="page-header">
  <h1>⚡ ${cfg.guideTitle}</h1>
  <p>${cfg.guideSubtitle}</p>
  <div class="header-meta">
    <span>📅 Generated: ${now}</span>
    <span>🏃 ${cfg.organizationName}</span>
    <span>🗺 ${cfg.races.length} race courses</span>
  </div>
</header>

<nav class="toc">
  <a href="#overview">Overview</a>
  <a href="#prerequisites">Prerequisites</a>
  <a href="#races-table">Race URLs</a>
  <a href="#extraction">Extract Each Race</a>
  <a href="#verify">Verify Output</a>
  <a href="#next-steps">Next Steps</a>
</nav>

<main>

  <!-- ── Overview ───────────────────────────────────────────────── -->
  <div id="overview">
    <h2 id="overview-heading"><span class="section-icon">📖</span> Overview</h2>
    <div class="card">
      <p>This guide walks you through extracting GPX course data from AllTrails custom routes and embedding it in RaceTracker Pro race templates. Once done, race setup will automatically display the course map without requiring any GPX import step.</p>
    </div>

    <div class="summary-grid">
      <div class="summary-box">
        <div class="number">${cfg.races.length}</div>
        <div class="label">Race templates to update</div>
      </div>
      <div class="summary-box">
        <div class="number">~5<span style="font-size:1rem">min</span></div>
        <div class="label">Per race (once URLs are found)</div>
      </div>
      <div class="summary-box">
        <div class="number">1×</div>
        <div class="label">One-off task, not repeated</div>
      </div>
    </div>

    <div class="callout callout-info">
      <strong>How it works:</strong> The script opens AllTrails in your browser, intercepts the route API response, decodes the GPS track, and saves a <code>.gpx</code> file. Your existing login session is used — no credentials are stored in the script.
    </div>
  </div>

  <!-- ── Prerequisites ──────────────────────────────────────────── -->
  <div id="prerequisites">
    <h2><span class="section-icon">✅</span> Prerequisites</h2>
    <div class="card">
      <ul class="prereq-list">
        ${prereqList(cfg.prerequisites)}
      </ul>
    </div>
    <div class="callout callout-warning">
      <strong>Playwright browsers:</strong> If you haven't run Playwright before, install the Chromium browser first:
      <div class="code-block" style="margin-top:8px"><pre>npx playwright install chromium</pre></div>
    </div>
  </div>

  <!-- ── Race URLs table ────────────────────────────────────────── -->
  <div id="races-table">
    <h2><span class="section-icon">🗺</span> Race Courses &amp; AllTrails URLs</h2>
    <p style="color:var(--text-muted);margin-bottom:12px;font-size:.9rem">Find each custom route on AllTrails and paste the URL into <code>scripts/gpx-guide-config.json</code> before running extraction. The Pinnacles Classic URL is already confirmed.</p>
    <table>
      <thead>
        <tr>
          <th>Race</th>
          <th>Template slug</th>
          <th>AllTrails URL</th>
          <th>CPs</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${raceRows(cfg.races)}
      </tbody>
    </table>
  </div>

  <!-- ── Extraction steps ───────────────────────────────────────── -->
  <div id="extraction">
    <h2><span class="section-icon">⬇</span> Extract Each Race Course</h2>
    <p style="color:var(--text-muted);margin-bottom:20px;font-size:.9rem">Run the following command once per race. A headed Chromium browser will open — log in to AllTrails if prompted, then wait. The browser closes automatically when the GPX is saved.</p>

    ${raceSteps(cfg.races)}
  </div>

  <!-- ── Verify output ──────────────────────────────────────────── -->
  <div id="verify">
    <h2><span class="section-icon">🔍</span> Verify the Output</h2>
    <p style="color:var(--text-muted);margin-bottom:12px;font-size:.9rem">After running all ${cfg.races.length} extractions, confirm the files exist:</p>

    <div class="file-tree">
src/data/templates/gpx/
${cfg.races.map(r => `├── <span class="new">${r.slug}.gpx</span>  ← replace placeholder`).join('\n')}
    </div>

    <div class="callout callout-success" style="margin-top:16px">
      <strong>Quick sanity check</strong> — open any <code>.gpx</code> file and look for <code>&lt;trkpt&gt;</code> elements. A real course should have hundreds of track points, not just 3–4.
    </div>

    <h3>Check the first &amp; last coordinates</h3>
    <p style="color:var(--text-muted);font-size:.9rem;margin-bottom:8px">The script prints the track point count on success. Verify the coordinates are in South-East Queensland (roughly lat <code>-27.x</code>, lon <code>152.x–153.x</code>).</p>
    <div class="code-block"><pre># Example successful output:
✅ Saved to src/data/templates/gpx/pinnacles-classic.gpx (847 track points)</pre></div>
  </div>

  <!-- ── Next steps ─────────────────────────────────────────────── -->
  <div id="next-steps">
    <h2><span class="section-icon">🚀</span> Next Steps</h2>
    <div class="card">
      <p>Once all GPX files are extracted and saved, the templates automatically pick them up — no code changes needed. The <code>src/data/templates/index.js</code> already imports the files and injects <code>courseGpx</code> into each template.</p>
    </div>

    <h3>Commit the GPX files</h3>
    <div class="code-block"><pre>git add src/data/templates/gpx/
git commit -m "Add real AllTrails course GPX data for all 4 race templates"</pre></div>

    <h3>Regenerate this guide (if config changes)</h3>
    <div class="code-block"><pre>node scripts/generate-gpx-guide.js
# or
make generate-gpx-guide</pre></div>

    <h3>Customise the guide branding</h3>
    <p style="color:var(--text-muted);font-size:.9rem;margin:8px 0 12px">Edit <code>scripts/gpx-guide-config.json</code> to change:</p>
    <ul style="margin-left:20px;font-size:.9rem;color:var(--text-muted);line-height:2">
      <li><code>organizationName</code> — appears in the header and footer</li>
      <li><code>primaryColor</code> — nav bar and heading colour (hex)</li>
      <li><code>accentColor</code> — step numbers and links (hex)</li>
      <li><code>races[].alltrailsUrl</code> — fill in missing URLs as you find them</li>
    </ul>
  </div>

</main>

<footer class="page-footer">
  ${cfg.footerText} &bull; Generated by <code>scripts/generate-gpx-guide.js</code> &bull; ${now}
</footer>

</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const html = buildHtml(cfg);
  const htmlPath = path.join(OUT_DIR, 'alltrails-gpx-extraction.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`✅ HTML → ${htmlPath}`);

  // Generate PDF via Playwright
  const pdfPath = path.join(OUT_DIR, 'alltrails-gpx-extraction.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    printBackground: true,
  });
  await browser.close();
  console.log(`✅ PDF  → ${pdfPath}`);
}

main().catch((err) => {
  console.error('Error generating guide:', err);
  process.exit(1);
});
