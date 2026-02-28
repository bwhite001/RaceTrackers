/**
 * CSV Runner Roster Import utilities.
 * Parses a CSV file and maps rows to runner detail objects.
 * Expected columns: number (required), firstName, lastName, gender (M/F/X), batchNumber
 */

const REQUIRED_COLUMNS = ['number'];
const ALLOWED_GENDERS = new Set(['M', 'F', 'X', 'm', 'f', 'x']);

/**
 * Parse raw CSV text into an array of objects.
 * Supports comma and semicolon delimiters.
 * @param {string} csvText - Raw CSV string
 * @returns {{ headers: string[], rows: Object[] }}
 */
export function parseCSV(csvText) {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (nonEmpty.length < 2) return { headers: [], rows: [] };

  // Auto-detect delimiter
  const firstLine = nonEmpty[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

  const rows = nonEmpty.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] !== undefined ? values[i] : '';
    });
    return obj;
  });

  return { headers, rows };
}

/**
 * Validate and transform parsed CSV rows into runner detail objects.
 * @param {Object[]} rows - Raw CSV rows
 * @returns {{ valid: Object[], errors: string[] }}
 */
export function validateCSVRows(rows) {
  const valid = [];
  const errors = [];

  rows.forEach((row, index) => {
    const lineNum = index + 2; // +2 for 1-based + header row

    // Required: number
    const rawNumber = row.number ?? row.Number ?? row.bib ?? row.Bib ?? row['#'];
    const number = parseInt(rawNumber, 10);
    if (!rawNumber || isNaN(number) || number <= 0) {
      errors.push(`Line ${lineNum}: invalid or missing bib number ("${rawNumber}")`);
      return;
    }

    // Optional: firstName
    const firstName = (row.firstName ?? row.first_name ?? row.FirstName ?? row.first ?? '').trim() || null;

    // Optional: lastName
    const lastName = (row.lastName ?? row.last_name ?? row.LastName ?? row.last ?? row.surname ?? '').trim() || null;

    // Optional: gender (M/F/X)
    const rawGender = (row.gender ?? row.Gender ?? row.sex ?? '').trim().toUpperCase();
    const gender = ALLOWED_GENDERS.has(rawGender) ? rawGender.toUpperCase() : 'X';

    // Optional: batchNumber
    const rawBatch = row.batchNumber ?? row.batch_number ?? row.batch ?? row.wave ?? row.Wave ?? '';
    const batchNumber = parseInt(rawBatch, 10);

    valid.push({
      number,
      firstName,
      lastName,
      gender: gender || 'X',
      batchNumber: isNaN(batchNumber) || batchNumber <= 0 ? 1 : batchNumber
    });
  });

  return { valid, errors };
}

/**
 * Full pipeline: read File → parse CSV → validate → return result.
 * @param {File} file
 * @returns {Promise<{ valid: Object[], errors: string[], headers: string[] }>}
 */
export async function importCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { headers, rows } = parseCSV(e.target.result);
        const { valid, errors } = validateCSVRows(rows);
        resolve({ valid, errors, headers });
      } catch (err) {
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
