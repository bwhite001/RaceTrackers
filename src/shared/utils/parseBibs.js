/**
 * Parse a comma-separated list of bib numbers and ranges.
 * Accepts: "101, 105-110, 120" → [101, 105, 106, 107, 108, 109, 110, 120]
 * Also handles newlines as separators.
 */
export function parseBibs(raw) {
  const results = [];
  for (const token of raw.replace(/\n/g, ',').split(',')) {
    const t = token.trim();
    const rangeMatch = t.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const lo = parseInt(rangeMatch[1], 10);
      const hi = parseInt(rangeMatch[2], 10);
      for (let i = lo; i <= hi; i++) results.push(i);
    } else {
      const n = parseInt(t, 10);
      if (!isNaN(n) && n > 0) results.push(n);
    }
  }
  return results;
}
