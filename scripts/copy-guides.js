#!/usr/bin/env node
/**
 * copy-guides.js
 * Copies docs/guides/ → public/guides/ before the Vite build so the
 * user guide HTML, assets, and PDFs are served with the app.
 *
 * No-op if docs/guides/ doesn't exist (e.g. fresh clone before first guide run).
 */
import fs from 'fs';

const SRC = 'docs/guides';
const DEST = 'public/guides';

if (!fs.existsSync(SRC)) {
  console.log(`copy-guides: ${SRC} not found — skipping (run npm run generate:guide first).`);
  process.exit(0);
}

fs.mkdirSync(DEST, { recursive: true });
fs.cpSync(SRC, DEST, { recursive: true });
console.log(`copy-guides: ${SRC} → ${DEST}`);
