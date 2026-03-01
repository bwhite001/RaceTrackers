#!/usr/bin/env node
/**
 * generate-guide-pdfs.js
 * Generates one PDF per journey section from docs/guides/user-guide.html.
 *
 * Usage: node test/e2e/playwright/generate-guide-pdfs.js
 *   Or:  npm run generate:guide:pdfs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const GUIDE_HTML = path.join(ROOT, 'docs', 'guides', 'user-guide.html');
const OUT_DIR = path.join(ROOT, 'docs', 'guides');

const CHAPTERS = [
  { key: 'setup',      title: 'Setting Up a Race' },
  { key: 'checkpoint', title: 'Running a Checkpoint' },
  { key: 'navigation', title: 'Navigating the App' },
  { key: 'settings',   title: 'Settings' },
];

/**
 * Extracts a <div id="key">...</div> block from html.
 * Handles nested elements by tracking open/close div tags.
 */
function extractSection(html, id) {
  const startTag = `<div id="${id}">`;
  const start = html.indexOf(startTag);
  if (start === -1) return null;

  let depth = 0;
  let i = start;
  while (i < html.length) {
    if (html.startsWith('<div', i)) depth++;
    else if (html.startsWith('</div>', i)) {
      depth--;
      if (depth === 0) return html.slice(start, i + 6); // include </div>
    }
    i++;
  }
  return null;
}

/** Extract the <style> block from the guide HTML */
function extractStyles(html) {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1] : '';
}

/** Build a standalone HTML document for a single section */
function buildSectionHtml(chapterTitle, sectionContent, styles, assetsDir) {
  // Make image paths absolute so Playwright can resolve them from a data URL context
  const absoluteContent = sectionContent.replace(
    /src="assets\//g,
    `src="${assetsDir}/`
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RaceTracker Pro — ${chapterTitle}</title>
<style>
${styles}
  /* PDF-specific overrides */
  body { background: #fff; }
  nav.toc { display: none; }
  .page-header p { opacity: 0.7; }
  h2 { margin-top: 8px; }
  .step img { page-break-inside: avoid; }
  .task { page-break-inside: avoid; }
</style>
</head>
<body>
<header class="page-header">
  <h1>&#x26A1; RaceTracker Pro — User Guide</h1>
  <p>${chapterTitle}</p>
</header>
<main>
${absoluteContent}
</main>
<footer class="page-footer">RaceTracker Pro &bull; ${chapterTitle}</footer>
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(GUIDE_HTML)) {
    console.error(`ERROR: ${GUIDE_HTML} not found.\nRun: npm run generate:guide first.`);
    process.exit(1);
  }

  const html = fs.readFileSync(GUIDE_HTML, 'utf8');
  const styles = extractStyles(html);
  const assetsDir = path.join(OUT_DIR, 'assets');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const { key, title } of CHAPTERS) {
    const section = extractSection(html, key);
    if (!section) {
      console.warn(`  WARN: section "#${key}" not found — skipping`);
      continue;
    }

    const sectionHtml = buildSectionHtml(title, section, styles, assetsDir);
    await page.setContent(sectionHtml, { waitUntil: 'networkidle' });

    // Wait for images to load
    await page.evaluate(() =>
      Promise.all(
        [...document.querySelectorAll('img')].map(img =>
          img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
        )
      )
    );

    const outFile = path.join(OUT_DIR, `user-guide-${key}.pdf`);
    await page.pdf({
      path: outFile,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '16mm', right: '16mm' },
    });

    console.log(`Written: docs/guides/user-guide-${key}.pdf`);
  }

  await browser.close();
  console.log('\nDone! PDFs written to docs/guides/');
}

main().catch(err => { console.error(err); process.exit(1); });
