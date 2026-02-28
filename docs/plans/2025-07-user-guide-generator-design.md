# Design: User Guide Generator

## Problem

RaceTracker Pro has no end-user documentation. The Playwright journey tests already encode the correct workflows in plain English (`descriptions.js`) and produce real screenshots of the UI. We can use these artefacts to auto-generate a user guide on demand.

## Proposed Solution

A standalone Node script (`test/e2e/playwright/generate-guide.js`) that reads the last `playwright-report/journey-report.html`, extracts tests/descriptions/screenshots, and writes a task-based user guide.

Run via: `npm run generate:guide`

## Outputs

| File | Purpose |
|------|---------|
| `docs/guides/user-guide.md` | Source of truth — Markdown with relative `assets/` image links |
| `docs/guides/user-guide.html` | Self-contained HTML with base64-embedded images for portability |
| `docs/guides/assets/*.png` | Screenshot PNGs, named `{test-slug}-step-{n}.png` |

## Guide Structure (Task-based)

1. **Setting Up a Race** — race creation wizard, runner ranges, checkpoint config, race overview
2. **Running a Checkpoint** — opening a checkpoint, mark-off via runner grid, Quick Entry bulk mark-off, overview tab
3. **Exporting & Sharing Data** — exporting race results from checkpoint and base station views

Skipped tests (base station operations — not yet integrated) are **omitted entirely** from the guide.

## Script Architecture

1. Parse `playwright-report/journey-report.html` using regex/string extraction (no external parser)
2. Map each test title → chapter using a `SECTION_MAP` constant in the script
3. For each passing test, extract:
   - Description paragraph
   - Array of embedded base64 PNG screenshots
4. Save screenshots as `docs/guides/assets/{test-slug}-step-{n}.png`
5. Write `docs/guides/user-guide.md` with relative image references
6. Write `docs/guides/user-guide.html` with inline base64 images and minimal CSS

## package.json

```json
"generate:guide": "node test/e2e/playwright/generate-guide.js"
```

## Decisions

- Screenshots separate files in `docs/guides/assets/` (not embedded in Markdown) for readability
- HTML embeds images as base64 for single-file portability
- Script is decoupled from test runner — regenerate on demand after any test run
- Audience: all roles (race directors + checkpoint & base station operators) in one guide
