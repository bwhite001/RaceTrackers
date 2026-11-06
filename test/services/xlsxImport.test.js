import { describe, it, expect } from 'vitest';
import { detectColumnMappings, applyMappingsToRows, FIELD_OPTIONS } from '../../src/utils/xlsxImport.js';

// ---------------------------------------------------------------------------
// detectColumnMappings
// ---------------------------------------------------------------------------
describe('detectColumnMappings', () => {
  it('maps exact field names', () => {
    const result = detectColumnMappings(['number', 'firstName', 'lastName', 'gender', 'batchNumber']);
    expect(result.mappings).toEqual({
      number: 'number',
      firstName: 'firstName',
      lastName: 'lastName',
      gender: 'gender',
      batchNumber: 'batchNumber',
    });
  });

  it('maps "Bib Numbers" → number (case-insensitive)', () => {
    const { mappings } = detectColumnMappings(['Bib Numbers']);
    expect(mappings['Bib Numbers']).toBe('number');
  });

  it('maps "Sex" → gender', () => {
    const { mappings } = detectColumnMappings(['Sex']);
    expect(mappings['Sex']).toBe('gender');
  });

  it('maps "Sub-event" → batchNumber', () => {
    const { mappings } = detectColumnMappings(['Sub-event']);
    expect(mappings['Sub-event']).toBe('batchNumber');
  });

  it('maps "Participant ID" → number', () => {
    const { mappings } = detectColumnMappings(['Participant ID']);
    expect(mappings['Participant ID']).toBe('number');
  });

  it('sets unrecognised columns to "ignore"', () => {
    const { mappings } = detectColumnMappings(['Running Club', 'Team Name']);
    expect(mappings['Running Club']).toBe('ignore');
    expect(mappings['Team Name']).toBe('ignore');
  });

  it('marks auto-detected columns in the autoDetected set', () => {
    const { autoDetected } = detectColumnMappings(['Bib Numbers', 'Running Club']);
    expect(autoDetected.has('Bib Numbers')).toBe(true);
    expect(autoDetected.has('Running Club')).toBe(false);
  });

  it('prefers "Bib Numbers" over "Participant ID" for number field (first match wins)', () => {
    const { mappings } = detectColumnMappings(['Participant ID', 'Bib Numbers']);
    // Both could map to number; only the first encountered wins
    const numberCols = Object.entries(mappings).filter(([, v]) => v === 'number').map(([k]) => k);
    expect(numberCols).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// applyMappingsToRows
// ---------------------------------------------------------------------------
describe('applyMappingsToRows', () => {
  const mappings = {
    'Bib Numbers': 'number',
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Sex': 'gender',
    'Sub-event': 'batchNumber',
    'Age': 'ignore',
  };

  const rows = [
    { 'Bib Numbers': '101', 'First Name': 'Alice', 'Last Name': 'Smith', 'Sex': 'F', 'Sub-event': '1', 'Age': '32' },
    { 'Bib Numbers': '102', 'First Name': 'Bob',   'Last Name': 'Jones', 'Sex': 'M', 'Sub-event': '2', 'Age': '28' },
  ];

  it('maps rows using provided column mappings', () => {
    const { valid, errors } = applyMappingsToRows(rows, mappings);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(2);
    expect(valid[0]).toEqual({ number: 101, firstName: 'Alice', lastName: 'Smith', gender: 'F', batchNumber: 1 });
    expect(valid[1]).toEqual({ number: 102, firstName: 'Bob',   lastName: 'Jones', gender: 'M', batchNumber: 2 });
  });

  it('rejects rows with missing/invalid bib number', () => {
    const badRows = [{ 'Bib Numbers': '', 'First Name': 'Ghost', 'Last Name': 'Runner', 'Sex': 'M', 'Sub-event': '1' }];
    const { valid, errors } = applyMappingsToRows(badRows, mappings);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/bib/i);
  });

  it('normalises gender to uppercase; unknown gender becomes X', () => {
    const r = [{ 'Bib Numbers': '200', 'First Name': 'Sam', 'Last Name': 'Lee', 'Sex': 'x', 'Sub-event': '1' }];
    const { valid } = applyMappingsToRows(r, mappings);
    expect(valid[0].gender).toBe('X');
  });

  it('defaults batchNumber to 1 when blank', () => {
    const r = [{ 'Bib Numbers': '300', 'First Name': 'Jo', 'Last Name': 'Doe', 'Sex': 'F', 'Sub-event': '' }];
    const { valid } = applyMappingsToRows(r, mappings);
    expect(valid[0].batchNumber).toBe(1);
  });

  it('auto-numbers text wave labels in order of first appearance', () => {
    const waveMappings = { 'Bib': 'number', 'Wave': 'batchNumber' };
    const waveRows = [
      { Bib: 1, Wave: 'Classic' },
      { Bib: 2, Wave: 'Double'  },
      { Bib: 3, Wave: 'Classic' },
      { Bib: 4, Wave: 'Double'  },
    ];
    const { valid, errors } = applyMappingsToRows(waveRows, waveMappings);
    expect(errors).toHaveLength(0);
    expect(valid[0].batchNumber).toBe(1); // Classic → 1
    expect(valid[1].batchNumber).toBe(2); // Double  → 2
    expect(valid[2].batchNumber).toBe(1); // Classic → 1 again
    expect(valid[3].batchNumber).toBe(2); // Double  → 2 again
  });

  it('sets firstName/lastName to null when column is ignored or blank', () => {
    const noNameMappings = { 'Bib Numbers': 'number', 'Sex': 'gender', 'Sub-event': 'batchNumber' };
    const r = [{ 'Bib Numbers': '400', 'Sex': 'M', 'Sub-event': '1' }];
    const { valid } = applyMappingsToRows(r, noNameMappings);
    expect(valid[0].firstName).toBeNull();
    expect(valid[0].lastName).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// FIELD_OPTIONS export
// ---------------------------------------------------------------------------
describe('FIELD_OPTIONS', () => {
  it('exports an array of field options including "ignore"', () => {
    expect(FIELD_OPTIONS).toContainEqual(expect.objectContaining({ value: 'ignore' }));
    expect(FIELD_OPTIONS).toContainEqual(expect.objectContaining({ value: 'number' }));
    expect(FIELD_OPTIONS).toContainEqual(expect.objectContaining({ value: 'firstName' }));
  });
});

// ---------------------------------------------------------------------------
// Race-office entry lists (Mt Glorious 2026 layout, synthetic names)
// ---------------------------------------------------------------------------
describe('entry list with Race No, Name, Category and Wave', () => {
  const headers = ['Event', 'Name', 'Race No', 'Category', 'Gender', 'Age', 'Team', 'Wave'];

  it('detects Race No as the bib, Name as full name, and Wave (not Category) as the wave', () => {
    const { mappings } = detectColumnMappings(headers);
    expect(mappings['Race No']).toBe('number');
    expect(mappings['Name']).toBe('fullName');
    expect(mappings['Wave']).toBe('batchNumber');
    expect(mappings['Category']).toBe('ignore');
    expect(mappings['Event']).toBe('ignore');
  });

  it('Category is still the wave when there is no Wave column', () => {
    const { mappings } = detectColumnMappings(['Bib', 'Category']);
    expect(mappings['Category']).toBe('batchNumber');
  });

  it('splits a single Name column into first and last', () => {
    const { mappings } = detectColumnMappings(['Race No', 'Name']);
    const { valid } = applyMappingsToRows([
      { 'Race No': '1', Name: 'Jane Smith' },
      { 'Race No': '2', Name: 'VAN DER BERG, Pieter' },
      { 'Race No': '3', Name: 'Mary Anne  de Silva' },
      { 'Race No': '4', Name: 'Cher' },
    ], mappings);
    expect(valid.map(r => [r.firstName, r.lastName])).toEqual([
      ['Jane', 'Smith'], ['Pieter', 'VAN DER BERG'], ['Mary Anne de', 'Silva'], ['Cher', null],
    ]);
  });

  it('separate first / last columns win over a full name', () => {
    const { valid } = applyMappingsToRows(
      [{ n: '5', f: 'Ann', l: 'Lee', full: 'Someone Else' }],
      { n: 'number', f: 'firstName', l: 'lastName', full: 'fullName' },
    );
    expect([valid[0].firstName, valid[0].lastName]).toEqual(['Ann', 'Lee']);
  });

  it('wave labels number in order of first appearance', () => {
    const { mappings } = detectColumnMappings(headers);
    const { valid } = applyMappingsToRows([
      { 'Race No': '1', Wave: 'Championship' }, { 'Race No': '60', Wave: 'Community' }, { 'Race No': '150', Wave: 'Wave 1' },
    ], mappings);
    expect(valid.map(r => r.batchNumber)).toEqual([1, 2, 3]);
  });
});
