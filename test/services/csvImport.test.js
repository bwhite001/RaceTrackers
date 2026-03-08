import { describe, it, expect } from 'vitest';
import { parseCSV, validateCSVRows } from '../../src/utils/csvImport.js';

// ---------------------------------------------------------------------------
// parseCSV
// ---------------------------------------------------------------------------
describe('parseCSV', () => {
  it('returns empty result for empty input', () => {
    const { headers, rows } = parseCSV('');
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it('returns empty result when only a header row is present (less than 2 lines)', () => {
    const { headers, rows } = parseCSV('number,firstName,lastName');
    // parseCSV requires at least 2 non-empty lines (header + data)
    expect(headers).toEqual([]);
    expect(rows).toHaveLength(0);
  });

  it('parses comma-delimited CSV', () => {
    const csv = 'number,firstName,lastName\n101,Alice,Smith\n102,Bob,Jones';
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(['number', 'firstName', 'lastName']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ number: '101', firstName: 'Alice', lastName: 'Smith' });
    expect(rows[1]).toEqual({ number: '102', firstName: 'Bob', lastName: 'Jones' });
  });

  it('parses semicolon-delimited CSV', () => {
    const csv = 'number;firstName;lastName\n201;Carol;White\n202;Dan;Black';
    const { rows } = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].firstName).toBe('Carol');
  });

  it('handles CRLF line endings', () => {
    const csv = 'number,firstName\r\n101,Alice\r\n102,Bob';
    const { rows } = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].number).toBe('101');
    expect(rows[1].number).toBe('102');
  });

  it('strips surrounding quotes from values', () => {
    const csv = '"number","firstName"\n"101","Alice"';
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(['number', 'firstName']);
    expect(rows[0]).toEqual({ number: '101', firstName: 'Alice' });
  });

  it('strips surrounding single quotes', () => {
    const csv = "number,firstName\n'101','Alice'";
    const { rows } = parseCSV(csv);
    expect(rows[0]).toEqual({ number: '101', firstName: 'Alice' });
  });

  it('trims whitespace from headers and values', () => {
    const csv = ' number , firstName \n 101 , Alice ';
    const { headers, rows } = parseCSV(csv);
    expect(headers[0]).toBe('number');
    expect(rows[0].number).toBe('101');
    expect(rows[0].firstName).toBe('Alice');
  });
});

// ---------------------------------------------------------------------------
// validateCSVRows
// ---------------------------------------------------------------------------
describe('validateCSVRows', () => {
  it('returns valid runner for a complete row', () => {
    const rows = [{ number: '101', firstName: 'Alice', lastName: 'Smith', gender: 'F', batchNumber: '2' }];
    const { valid, errors } = validateCSVRows(rows);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(1);
    expect(valid[0]).toMatchObject({ number: 101, firstName: 'Alice', lastName: 'Smith', gender: 'F', batchNumber: 2 });
  });

  it('rejects a row with missing bib number', () => {
    const rows = [{ firstName: 'NoNumber' }];
    const { valid, errors } = validateCSVRows(rows);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/skipped.*bib|invalid.*bib/i);
  });

  it('rejects a row with non-numeric bib number', () => {
    const rows = [{ number: 'abc' }];
    const { valid, errors } = validateCSVRows(rows);
    expect(valid).toHaveLength(0);
    expect(errors[0]).toMatch(/skipped.*bib|invalid.*bib/i);
  });

  it('rejects a row with a zero bib number', () => {
    const rows = [{ number: '0' }];
    const { valid, errors } = validateCSVRows(rows);
    expect(valid).toHaveLength(0);
  });

  it('accepts "Bib" column alias for bib number', () => {
    const rows = [{ Bib: '55' }];
    const { valid, errors } = validateCSVRows(rows);
    expect(errors).toHaveLength(0);
    expect(valid[0].number).toBe(55);
  });

  it('accepts "#" column alias for bib number', () => {
    const rows = [{ '#': '77' }];
    const { valid, errors } = validateCSVRows(rows);
    expect(errors).toHaveLength(0);
    expect(valid[0].number).toBe(77);
  });

  it('accepts "bib" lowercase alias for bib number', () => {
    const rows = [{ bib: '33' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].number).toBe(33);
  });

  it('normalises lowercase "f" gender to "F"', () => {
    const rows = [{ number: '10', gender: 'f' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].gender).toBe('F');
  });

  it('normalises lowercase "m" gender to "M"', () => {
    const rows = [{ number: '10', gender: 'm' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].gender).toBe('M');
  });

  it('defaults gender to "X" when empty', () => {
    const rows = [{ number: '10', gender: '' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].gender).toBe('X');
  });

  it('defaults gender to "X" for unrecognised value', () => {
    const rows = [{ number: '10', gender: 'Z' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].gender).toBe('X');
  });

  it('defaults batchNumber to 1 when absent', () => {
    const rows = [{ number: '10' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].batchNumber).toBe(1);
  });

  it('defaults batchNumber to 1 for invalid value', () => {
    const rows = [{ number: '10', batchNumber: 'notanumber' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].batchNumber).toBe(1);
  });

  it('defaults batchNumber to 1 for zero value', () => {
    const rows = [{ number: '10', batchNumber: '0' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].batchNumber).toBe(1);
  });

  it('parses valid batchNumber correctly', () => {
    const rows = [{ number: '10', batchNumber: '3' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].batchNumber).toBe(3);
  });

  it('sets optional fields to null when not provided', () => {
    const rows = [{ number: '42' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].firstName).toBeNull();
    expect(valid[0].lastName).toBeNull();
  });

  it('sets optional fields to null when only whitespace provided', () => {
    const rows = [{ number: '42', firstName: '   ', lastName: '   ' }];
    const { valid } = validateCSVRows(rows);
    expect(valid[0].firstName).toBeNull();
    expect(valid[0].lastName).toBeNull();
  });

  it('processes multiple rows and reports errors per line', () => {
    const rows = [
      { number: '10', firstName: 'Alice' },
      { number: 'bad' },
      { number: '20', firstName: 'Bob' }
    ];
    const { valid, errors } = validateCSVRows(rows);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('3'); // line 3 (1-based + header offset)
  });
});
