// One-off developer script: extract a course track from an AllTrails custom route
// and save it as a GPX file for use in race templates.
//
// Usage: node scripts/extract-alltrails-gpx.js <alltrails-url> [output-slug]
// Example: node scripts/extract-alltrails-gpx.js https://www.alltrails.com/explore/custom-routes/pinnacles-loop-d3b1fb0 pinnacles-classic

import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_BASE = join(__dirname, '..', 'src', 'data', 'templates', 'gpx');
const TIMEOUT_MS = 15_000;

function decodePolyline(encoded) {
  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

function buildGpx(routeName, points) {
  const trkpts = points
    .map(([lat, lon]) => `    <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RaceTracker Pro" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${routeName}</name></metadata>
  <trk>
    <name>${routeName}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function slugFromUrl(url) {
  const match = url.match(/custom-routes\/([^/?#]+)/);
  return match ? match[1] : 'route';
}

async function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout waiting for ${label}`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function main() {
  const [, , url, outputArg] = process.argv;

  if (!url) {
    console.error('Usage: node scripts/extract-alltrails-gpx.js <alltrails-url> [output-slug]');
    process.exit(1);
  }

  const slug = outputArg ?? slugFromUrl(url);
  const outputPath = join(OUTPUT_BASE, `${slug}.gpx`);

  console.log('Opening AllTrails in browser...');
  console.log('Please log in if prompted');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let routeName = slug;
  let allPoints = [];

  let resolveDetails;
  let resolveRouting;

  const detailsPromise = new Promise((res) => { resolveDetails = res; });
  const routingPromise = new Promise((res) => { resolveRouting = res; });

  page.on('response', async (response) => {
    const reqUrl = response.url();

    if (reqUrl.includes('custom_route_details')) {
      try {
        const json = await response.json();
        routeName = json?.name ?? json?.data?.name ?? slug;
        resolveDetails(routeName);
      } catch {
        resolveDetails(slug);
      }
    }

    if (reqUrl.includes('routing/metadata')) {
      try {
        const json = await response.json();
        const paths = json?.paths ?? [];
        if (paths.length === 0) {
          console.warn('⚠️  routing/metadata response had no paths. Raw response:');
          console.warn(JSON.stringify(json, null, 2));
          resolveRouting([]);
          return;
        }
        const points = paths.flatMap((p) => decodePolyline(p.polyline ?? ''));
        resolveRouting(points);
      } catch (err) {
        console.warn('⚠️  Failed to parse routing/metadata response:', err.message);
        resolveRouting([]);
      }
    }
  });

  await page.goto(url);
  console.log('Waiting for route data...');

  try {
    await withTimeout(detailsPromise, TIMEOUT_MS, 'custom_route_details');
  } catch {
    console.warn('⚠️  custom_route_details not received within timeout — using slug as name');
  }

  try {
    allPoints = await withTimeout(routingPromise, TIMEOUT_MS, 'routing/metadata');
  } catch {
    console.warn('⚠️  routing/metadata not received within timeout — saving metadata only (no track points)');
  }

  await browser.close();

  if (allPoints.length === 0) {
    console.error('❌ No polyline data found. Cannot generate a useful GPX file.');
    process.exit(1);
  }

  mkdirSync(OUTPUT_BASE, { recursive: true });
  writeFileSync(outputPath, buildGpx(routeName, allPoints), 'utf8');
  console.log(`✅ Saved to ${outputPath} (${allPoints.length} track points)`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
