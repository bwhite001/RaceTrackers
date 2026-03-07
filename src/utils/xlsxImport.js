/**
 * xlsx Runner Roster Import utilities.
 * Parses a SheetJS worksheet and maps rows to runner detail objects.
 * Companion to csvImport.js — same return shape.
 */
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_GENDERS = new Set(['M', 'F', 'X']);

/** Ordered field options for the column-mapping dropdown. */
export const FIELD_OPTIONS = [
  { value: 'number',      label: 'Bib # (required)' },
  { value: 'firstName',   label: 'First Name' },
  { value: 'lastName',    label: 'Last Name' },
  { value: 'gender',      label: 'Gender' },
  { value: 'batchNumber', label: 'Wave / Batch' },
  { value: 'ignore',      label: '— ignore —' },
];

/** Fuzzy-match rules: appField → patterns (lowercase, trimmed). */
const FIELD_PATTERNS = {
  number:      ['#', 'bib', 'bib number', 'bib numbers', 'number', 'participant id', 'id'],
  firstName:   ['first', 'first name', 'firstname', 'given', 'given name'],
  lastName:    ['last', 'last name', 'lastname', 'surname', 'family', 'family name'],
  gender:      ['sex', 'gender', 'm/f'],
  batchNumber: ['wave', 'batch', 'batch number', 'batchnumber', 'category', 'sub-event', 'subevent', 'division'],
};

// ---------------------------------------------------------------------------
// detectColumnMappings
// ---------------------------------------------------------------------------

/**
 * Auto-detect which xlsx column maps to which app field.
 * Each app field can only be assigned once (first match wins).
 *
 * @param {string[]} headers - xlsx column header names
 * @returns {{ mappings: Object<string, string>, autoDetected: Set<string> }}
 */
export function detectColumnMappings(headers) {
  const mappings = {};
  const autoDetected = new Set();
  const usedFields = new Set();

  for (const header of headers) {
    const lower = header.trim().toLowerCase();
    let matched = false;

    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      if (!usedFields.has(field) && patterns.includes(lower)) {
        mappings[header] = field;
        autoDetected.add(header);
        usedFields.add(field);
        matched = true;
        break;
      }
    }

    if (!matched) {
      mappings[header] = 'ignore';
    }
  }

  return { mappings, autoDetected };
}

// ---------------------------------------------------------------------------
// applyMappingsToRows
// ---------------------------------------------------------------------------

/**
 * Transform raw xlsx rows using the provided column mappings.
 * Mirrors validateCSVRows() from csvImport.js.
 *
 * @param {Object[]} rows - Raw rows from SheetJS (header: value)
 * @param {Object<string, string>} mappings - { xlsxColumn: appField | 'ignore' }
 * @returns {{ valid: Object[], errors: string[] }}
 */
export function applyMappingsToRows(rows, mappings) {
  const valid = [];
  const errors = [];

  // Build reverse lookup: appField → xlsxColumn
  const fieldToCol = {};
  for (const [col, field] of Object.entries(mappings)) {
    if (field !== 'ignore') fieldToCol[field] = col;
  }

  rows.forEach((row, index) => {
    const lineNum = index + 2;

    // number (required)
    const rawNumber = fieldToCol.number ? row[fieldToCol.number] : undefined;
    const number = parseInt(rawNumber, 10);
    if (!rawNumber || isNaN(number) || number <= 0) {
      errors.push(`Row ${lineNum}: invalid or missing bib number ("${rawNumber ?? ''}")`);
      return;
    }

    // firstName
    const firstName = (fieldToCol.firstName ? (row[fieldToCol.firstName] ?? '') : '').toString().trim() || null;

    // lastName
    const lastName = (fieldToCol.lastName ? (row[fieldToCol.lastName] ?? '') : '').toString().trim() || null;

    // gender
    const rawGender = (fieldToCol.gender ? (row[fieldToCol.gender] ?? '') : '').toString().trim().toUpperCase();
    const gender = ALLOWED_GENDERS.has(rawGender) ? rawGender : 'X';

    // batchNumber
    const rawBatch = fieldToCol.batchNumber ? row[fieldToCol.batchNumber] : '';
    const batchNumber = parseInt(rawBatch, 10);

    valid.push({
      number,
      firstName,
      lastName,
      gender,
      batchNumber: isNaN(batchNumber) || batchNumber <= 0 ? 1 : batchNumber,
    });
  });

  return { valid, errors };
}

// ---------------------------------------------------------------------------
// parseXlsxFile
// ---------------------------------------------------------------------------

/**
 * Parse a File (or ArrayBuffer) with SheetJS.
 * Returns raw headers + rows (no mapping applied).
 *
 * @param {File|ArrayBuffer} source
 * @returns {Promise<{ headers: string[], rows: Object[] }>}
 */
export async function parseXlsxFile(source) {
  const buffer = source instanceof ArrayBuffer
    ? source
    : await source.arrayBuffer();

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in workbook');

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}
