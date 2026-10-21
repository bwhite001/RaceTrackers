/**
 * Club palette only (spec G-rules, validation C2). Mounted screens must not
 * use Tailwind's green / emerald / teal / yellow / amber / indigo / blue —
 * use the vk-* tokens or the navy / gold scales (re-anchored on the club colours).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const OFF_PALETTE = /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|accent|placeholder|shadow|decoration)-(?:green|emerald|teal|yellow|amber|indigo|blue)-\d{2,3}\b/g;

// Legacy components no screen imports any more (checked from src/main.jsx).
// Remove a file from here when it is mounted again — it must then be restyled.
const LEGACY_UNMOUNTED = new Set([
  'src/components/Layout/Header.jsx',
  'src/components/Layout/StatusStrip.jsx',
  'src/components/Setup/StepIndicator.jsx',
  'src/components/Shared/RunnerOverview.jsx',
  'src/modules/base-operations/components/BackupRestoreDialog.jsx',
  'src/modules/base-operations/components/BatchCard.jsx',
  'src/modules/base-operations/components/BatchEntryLayout.jsx',
  'src/modules/base-operations/components/BibChipInput.jsx',
  'src/modules/base-operations/components/BulkDnsView.jsx',
  'src/modules/base-operations/components/CheckpointGroupingView.jsx',
  'src/modules/base-operations/components/CourseLeadersCard.jsx',
  'src/modules/base-operations/components/DataEntry.jsx',
  'src/modules/base-operations/components/DeletedEntriesView.jsx',
  'src/modules/base-operations/components/DraftView.jsx',
  'src/modules/base-operations/components/DuplicateEntriesDialog.jsx',
  'src/modules/base-operations/components/InputSection.jsx',
  'src/modules/base-operations/components/Leaderboard/CombinedGrid.jsx',
  'src/modules/base-operations/components/Leaderboard/LeaderboardTable.jsx',
  'src/modules/base-operations/components/Leaderboard/LiveLeadersWidget.jsx',
  'src/modules/base-operations/components/LogOperationsPanel.jsx',
  'src/modules/base-operations/components/MissingNumbersList.jsx',
  'src/modules/base-operations/components/OutList.jsx',
  'src/modules/base-operations/components/RaceOverview.jsx',
  'src/modules/base-operations/components/ReportBuilder.jsx',
  'src/modules/base-operations/components/StrapperCallsPanel.jsx',
  'src/modules/base-operations/components/UndoToast.jsx',
  'src/modules/base-operations/components/VetOutDialog.jsx',
]);

const jsxFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? jsxFiles(p) : e.name.endsWith('.jsx') ? [p] : [];
});

describe('club palette', () => {
  it('mounted .jsx files use no off-palette Tailwind colours', () => {
    const offenders = jsxFiles(path.join(ROOT, 'src'))
      .map(f => path.relative(ROOT, f).split(path.sep).join('/'))
      .filter(rel => !LEGACY_UNMOUNTED.has(rel))
      .map(rel => [rel, [...new Set(fs.readFileSync(path.join(ROOT, rel), 'utf8').match(OFF_PALETTE) ?? [])]])
      .filter(([, hits]) => hits.length);
    expect(offenders).toEqual([]);
  });

  it('every allow-listed legacy file still exists', () => {
    expect([...LEGACY_UNMOUNTED].filter(rel => !fs.existsSync(path.join(ROOT, rel)))).toEqual([]);
  });
});
