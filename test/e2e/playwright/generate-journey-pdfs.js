#!/usr/bin/env node
/**
 * generate-journey-pdfs.js
 * Converts the three role-based journey HTML docs to standalone PDFs.
 *
 *   docs/guides/journey-race-director.pdf
 *   docs/guides/journey-checkpoint-volunteer.pdf
 *   docs/guides/journey-base-station.pdf
 *
 * Usage:
 *   node test/e2e/playwright/generate-journey-pdfs.js
 *   npm run generate:journey:pdfs       (same thing)
 *   make journey-pdfs                   (same thing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '../../..');
const OUT_DIR   = path.join(ROOT, 'docs', 'guides');
const ASSETS    = path.join(OUT_DIR, 'assets');

const JOURNEYS = [
  { html: 'journey-race-director.html',        pdf: 'journey-race-director.pdf',        title: 'Race Director Journey' },
  { html: 'journey-checkpoint-volunteer.html', pdf: 'journey-checkpoint-volunteer.pdf', title: 'Checkpoint Volunteer Journey' },
  { html: 'journey-base-station.html',         pdf: 'journey-base-station.pdf',         title: 'Base Station Operator Journey' },
];

/** Inline all src="assets/..." images as base64 data URIs so PDFs are self-contained */
function inlineImages(html) {
  return html.replace(/src="assets\/([^"]+)"/g, (match, filename) => {
    const imgPath = path.join(ASSETS, filename);
    if (!fs.existsSync(imgPath)) return match;
    const ext  = path.extname(filename).slice(1).toLowerCase();
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
               : ext === 'svg' ? 'image/svg+xml'
               : 'image/png';
    const data = fs.readFileSync(imgPath).toString('base64');
    return `src="data:${mime};base64,${data}"`;
  });
}

/** Add PDF-specific style overrides to suppress navigation links */
function preparePdfHtml(html) {
  const pdfOverrides = `
<style>
  nav.toc { display: none !important; }
  .other-guides { display: none !important; }
  body { background: #fff; }
  .step img { page-break-inside: avoid; }
  .test-block { page-break-inside: avoid; }
  .phase-header { page-break-after: avoid; }
</style>`;
  return html.replace('</head>', `${pdfOverrides}\n</head>`);
}

async function main() {
  const missing = JOURNEYS.filter(j => !fs.existsSync(path.join(OUT_DIR, j.html)));
  if (missing.length > 0) {
    console.error(`ERROR: Missing journey HTML files:\n${missing.map(j => `  docs/guides/${j.html}`).join('\n')}`);
    console.error('Run: npm run generate:journeys first.');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  for (const { html: htmlFile, pdf: pdfFile, title } of JOURNEYS) {
    const srcPath = path.join(OUT_DIR, htmlFile);
    const outPath = path.join(OUT_DIR, pdfFile);

    let html = fs.readFileSync(srcPath, 'utf8');
    html = inlineImages(html);
    html = preparePdfHtml(html);

    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '16mm', right: '16mm' },
    });

    console.log(`Written: docs/guides/${pdfFile}`);
  }

  await browser.close();
  console.log('\nDone! Journey PDFs written to docs/guides/');
}

main().catch(err => { console.error(err); process.exit(1); });
