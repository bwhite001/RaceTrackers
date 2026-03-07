/**
 * Leaderboard export utilities.
 * All functions accept (entries, raceName) where entries are ranked leaderboard entries.
 */

/**
 * Download leaderboard as a CSV file.
 */
export function exportAsCSV(entries, raceName = 'race') {
  const headers = ['Rank', 'Bib', 'Name', 'Gender', 'Wave', 'Elapsed'];
  const rows = entries.map(e => [
    e.rank,
    e.number,
    e.displayName,
    e.gender,
    e.batchName,
    e.elapsedFormatted,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const date = new Date().toISOString().slice(0, 10);
  const filename = `${raceName.replace(/\s+/g, '-').toLowerCase()}-leaderboard-${date}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser print dialog for PDF export.
 * The leaderboard container must have class "leaderboard-print-target"
 * and print CSS hides controls.
 */
export function exportAsPrint() {
  window.print();
}

/**
 * Copy leaderboard as tab-separated text to clipboard.
 * Returns a Promise.
 */
export async function copyToClipboard(entries) {
  const headers = ['Rank', 'Bib', 'Name', 'Gender', 'Wave', 'Elapsed'].join('\t');
  const rows = entries.map(e =>
    [e.rank, e.number, e.displayName, e.gender, e.batchName, e.elapsedFormatted].join('\t')
  );
  const text = [headers, ...rows].join('\n');
  await navigator.clipboard.writeText(text);
}

/**
 * Build a compact JSON string of top-N results for QR encoding.
 */
export function buildQRData(entries, raceName, topN = 10) {
  return JSON.stringify({
    race: raceName,
    generated: new Date().toISOString(),
    top: entries.slice(0, topN).map(e => ({
      rank: e.rank,
      bib: e.number,
      name: e.displayName,
      time: e.elapsedFormatted,
    })),
  });
}
