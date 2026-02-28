# Epic 6: Race Setup & Configuration Module

**Epic Owner:** UX/Frontend Team Lead  
**Priority:** P1 (High)  
**Estimated Effort:** 1.5 Sprints (3 weeks)  
**Dependencies:** Epic 1 (Database Foundation)

## Epic Description

Implement comprehensive race setup and configuration functionality including runner import from CSV/Excel, race templates, checkpoint configuration, and validation. This epic streamlines the initial race setup process for coordinators.

---

## User Stories

### Story 6.1: CSV/Excel Runner Import

**As a** race coordinator  
**I want** to import runner lists from CSV or Excel files  
**So that** I can quickly set up races without manual entry

**Story Points:** 13  
**Sprint:** Sprint 8

#### Acceptance Criteria

- [ ] Support CSV file upload (.csv)
- [ ] Support Excel file upload (.xlsx)
- [ ] Parse standard formats (Number, Name, Gender, Wave)
- [ ] Validate data before import (required fields, duplicates)
- [ ] Preview import data with error highlighting
- [ ] Map columns flexibly (handle different column orders)
- [ ] Handle name splitting (First Name/Last Name)
- [ ] Show import summary (success/failed counts)
- [ ] Rollback option if errors detected

#### Technical Implementation

**File:** `src/features/raceSetup/services/RunnerImportService.ts`

```typescript
import * as XLSX from 'xlsx';
import { runnerDAL } from '../../../database/dal/RunnerDAL';
import { z } from 'zod';

// Schema validation for runner import
const RunnerImportSchema = z.object({
  number: z.number().int().positive(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.enum(['M', 'F', 'X']),
  wave: z.number().int().positive()
});

export type RunnerImportRow = z.infer<typeof RunnerImportSchema>;

// SOLID: Single Responsibility - Handles runner import only
export class RunnerImportService {
  
  /**
   * Parse CSV file
   */
  async parseCSV(file: File): Promise<ParseResult> {
    try {
      const text = await file.text();
      const rows = this.parseCSVText(text);
      return this.validateAndMap(rows);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CSV parse error'
      };
    }
  }

  /**
   * Parse Excel file
   */
  async parseExcel(file: File): Promise<ParseResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Use first sheet
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet);
      
      return this.validateAndMap(rows);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Excel parse error'
      };
    }
  }

  /**
   * Parse CSV text into rows
   */
  private parseCSVText(text: string): any[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have header and at least one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse single CSV line (handles quoted values)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  /**
   * Validate and map imported data
   */
  private validateAndMap(rows: any[]): ParseResult {
    const validRows: RunnerImportRow[] = [];
    const errors: ImportError[] = [];

    // Detect column mapping
    const mapping = this.detectColumnMapping(rows[0]);

    rows.forEach((row, index) => {
      try {
        const mapped = this.mapRow(row, mapping);
        const validated = RunnerImportSchema.parse(mapped);
        validRows.push(validated);
      } catch (error) {
        errors.push({
          row: index + 2, // +2 for header and 0-index
          data: row,
          error: error instanceof Error ? error.message : 'Validation error'
        });
      }
    });

    return {
      success: errors.length === 0,
      validRows,
      errors,
      summary: {
        total: rows.length,
        valid: validRows.length,
        invalid: errors.length
      }
    };
  }

  /**
   * Detect column mapping from headers
   */
  private detectColumnMapping(sampleRow: any): ColumnMapping {
    const keys = Object.keys(sampleRow).map(k => k.toLowerCase());

    // Common variations for each field
    const numberPatterns = ['number', 'bib', 'bib number', 'runner number', 'no'];
    const firstNamePatterns = ['first name', 'firstname', 'first', 'given name'];
    const lastNamePatterns = ['last name', 'lastname', 'last', 'surname', 'family name'];
    const genderPatterns = ['gender', 'sex', 'm/f'];
    const wavePatterns = ['wave', 'batch', 'wave batch', 'start wave'];

    const findColumn = (patterns: string[]) => {
      for (const key of keys) {
        if (patterns.some(p => key.includes(p))) {
          return Object.keys(sampleRow)[keys.indexOf(key)];
        }
      }
      return null;
    };

    return {
      number: findColumn(numberPatterns),
      firstName: findColumn(firstNamePatterns),
      lastName: findColumn(lastNamePatterns),
      gender: findColumn(genderPatterns),
      wave: findColumn(wavePatterns)
    };
  }

  /**
   * Map row using detected column mapping
   */
  private mapRow(row: any, mapping: ColumnMapping): any {
    const mapped: any = {};

    if (mapping.number) {
      mapped.number = parseInt(row[mapping.number], 10);
    }

    if (mapping.firstName) {
      mapped.firstName = row[mapping.firstName];
    }

    if (mapping.lastName) {
      mapped.lastName = row[mapping.lastName];
    }

    // Handle gender normalization
    if (mapping.gender) {
      const gender = row[mapping.gender].toUpperCase();
      mapped.gender = gender === 'MALE' ? 'M' : gender === 'FEMALE' ? 'F' : gender;
    }

    if (mapping.wave) {
      mapped.wave = parseInt(row[mapping.wave], 10);
    }

    return mapped;
  }

  /**
   * Import runners into database
   */
  async importRunners(
    raceId: string,
    runners: RunnerImportRow[]
  ): Promise<ImportResult> {
    try {
      const runnersData = runners.map(r => ({
        race_id: raceId,
        runner_number: r.number,
        first_name: r.firstName,
        last_name: r.lastName,
        gender: r.gender,
        wave_batch: r.wave,
        status: 'not_started' as const
      }));

      const created = await runnerDAL.bulkCreate(runnersData);

      return {
        success: true,
        imported: created.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      };
    }
  }

  /**
   * Download sample CSV template
   */
  downloadTemplate(): void {
    const template = `Bib Numbers,First Name,Last Name,Sex,Wave
1,John,Doe,M,1
2,Jane,Smith,F,1
3,Mike,Johnson,M,2`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runner-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export interface ColumnMapping {
  number: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  wave: string | null;
}

export interface ParseResult {
  success: boolean;
  validRows?: RunnerImportRow[];
  errors?: ImportError[];
  summary?: ImportSummary;
  error?: string;
}

export interface ImportError {
  row: number;
  data: any;
  error: string;
}

export interface ImportSummary {
  total: number;
  valid: number;
  invalid: number;
}

export interface ImportResult {
  success: boolean;
  imported?: number;
  error?: string;
}

export const runnerImportService = new RunnerImportService();
```

#### React Component

**File:** `src/features/raceSetup/components/RunnerImportDialog.tsx`

```typescript
import React, { useState } from 'react';
import { runnerImportService, ParseResult } from '../services/RunnerImportService';

interface Props {
  raceId: string;
  onImportComplete: (count: number) => void;
  onClose: () => void;
}

export const RunnerImportDialog: React.FC<Props> = ({ raceId, onImportComplete, onClose }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    let result: ParseResult;
    if (extension === 'csv') {
      result = await runnerImportService.parseCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      result = await runnerImportService.parseExcel(file);
    } else {
      alert('Unsupported file format. Please use CSV or Excel files.');
      return;
    }

    setParseResult(result);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!parseResult?.validRows) return;

    setImporting(true);
    const result = await runnerImportService.importRunners(raceId, parseResult.validRows);

    if (result.success && result.imported) {
      onImportComplete(result.imported);
    } else {
      alert(result.error || 'Import failed');
    }
    setImporting(false);
  };

  const handleDownloadTemplate = () => {
    runnerImportService.downloadTemplate();
  };

  return (
    <div className="import-dialog">
      <div className="dialog-header">
        <h2>Import Runners</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      {step === 'upload' && (
        <div className="upload-step">
          <p>Upload a CSV or Excel file with runner information.</p>
          
          <div className="upload-area">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              id="file-upload"
            />
            <label htmlFor="file-upload" className="upload-label">
              Choose File
            </label>
          </div>

          <button onClick={handleDownloadTemplate} className="btn btn--secondary">
            Download Template
          </button>

          <div className="format-info">
            <h3>Expected Format</h3>
            <table>
              <thead>
                <tr>
                  <th>Bib Numbers</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Sex</th>
                  <th>Wave</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>John</td>
                  <td>Doe</td>
                  <td>M</td>
                  <td>1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'preview' && parseResult && (
        <div className="preview-step">
          <div className="summary">
            <h3>Import Summary</h3>
            <div className="stats">
              <span>Total: {parseResult.summary?.total}</span>
              <span className="success">Valid: {parseResult.summary?.valid}</span>
              <span className="error">Invalid: {parseResult.summary?.invalid}</span>
            </div>
          </div>

          {parseResult.errors && parseResult.errors.length > 0 && (
            <div className="errors">
              <h4>Errors ({parseResult.errors.length})</h4>
              <div className="error-list">
                {parseResult.errors.slice(0, 10).map(err => (
                  <div key={err.row} className="error-item">
                    <span>Row {err.row}:</span>
                    <span>{err.error}</span>
                  </div>
                ))}
                {parseResult.errors.length > 10 && (
                  <p>...and {parseResult.errors.length - 10} more errors</p>
                )}
              </div>
            </div>
          )}

          {parseResult.validRows && parseResult.validRows.length > 0 && (
            <div className="preview-table">
              <h4>Preview ({parseResult.validRows.length} runners)</h4>
              <table>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Wave</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.validRows.slice(0, 10).map(runner => (
                    <tr key={runner.number}>
                      <td>{runner.number}</td>
                      <td>{runner.firstName} {runner.lastName}</td>
                      <td>{runner.gender}</td>
                      <td>{runner.wave}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parseResult.validRows.length > 10 && (
                <p>...and {parseResult.validRows.length - 10} more runners</p>
              )}
            </div>
          )}

          <div className="actions">
            <button onClick={() => setStep('upload')} className="btn btn--secondary">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={!parseResult.validRows || parseResult.validRows.length === 0 || importing}
              className="btn btn--primary"
            >
              {importing ? 'Importing...' : `Import ${parseResult.validRows?.length || 0} Runners`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### Testing Strategy

**File:** `src/features/raceSetup/services/__tests__/RunnerImportService.test.ts`

```typescript
import { runnerImportService } from '../RunnerImportService';

describe('RunnerImportService', () => {
  describe('parseCSVText', () => {
    test('parses standard CSV format', async () => {
      const csv = `Bib Numbers,First Name,Last Name,Sex,Wave
1,John,Doe,M,1
2,Jane,Smith,F,2`;

      const file = new File([csv], 'runners.csv', { type: 'text/csv' });
      const result = await runnerImportService.parseCSV(file);

      expect(result.success).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.validRows?.[0]).toEqual({
        number: 1,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
        wave: 1
      });
    });

    test('handles quoted values with commas', async () => {
      const csv = `Number,Name,Gender,Wave
1,"Doe, John",M,1`;

      const file = new File([csv], 'runners.csv', { type: 'text/csv' });
      const result = await runnerImportService.parseCSV(file);

      expect(result.success).toBe(true);
    });

    test('detects column mapping variations', async () => {
      const csv = `Bib,Given Name,Surname,M/F,Start Wave
1,John,Doe,Male,1`;

      const file = new File([csv], 'runners.csv', { type: 'text/csv' });
      const result = await runnerImportService.parseCSV(file);

      expect(result.success).toBe(true);
      expect(result.validRows?.[0].gender).toBe('M');
    });

    test('validates required fields', async () => {
      const csv = `Number,Name,Gender
1,John,M`;

      const file = new File([csv], 'runners.csv', { type: 'text/csv' });
      const result = await runnerImportService.parseCSV(file);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].error).toContain('wave');
    });

    test('detects duplicate runner numbers', async () => {
      const csv = `Number,First Name,Last Name,Gender,Wave
1,John,Doe,M,1
1,Jane,Smith,F,1`;

      const file = new File([csv], 'runners.csv', { type: 'text/csv' });
      const result = await runnerImportService.parseCSV(file);

      // Import would succeed parsing, but DB layer would catch duplicates
      expect(result.validRows).toHaveLength(2);
    });
  });
});
```

---

### Story 6.2: Checkpoint Configuration

**As a** race coordinator  
**I want** to configure multiple checkpoints with names and locations  
**So that** I can track runner progress throughout the race

**Story Points:** 8  
**Sprint:** Sprint 8

#### Acceptance Criteria

- [ ] Add/edit/delete checkpoints for a race
- [ ] Assign checkpoint number and name
- [ ] Set checkpoint order sequence
- [ ] Optional location/description field
- [ ] Validation: at least one checkpoint required
- [ ] Reorder checkpoints via drag-and-drop
- [ ] Mark checkpoint as "finish line"
- [ ] Preview checkpoint flow before saving

#### Technical Implementation

**File:** `src/features/raceSetup/services/CheckpointConfigService.ts`

```typescript
import { db } from '../../../database/schema';
import { checkpointDAL } from '../../../database/dal/CheckpointDAL';
import type { Checkpoint } from '../../../database/schema';

export class CheckpointConfigService {
  
  /**
   * Create checkpoint
   */
  async createCheckpoint(
    raceId: string,
    config: CheckpointConfig
  ): Promise<Checkpoint> {
    // Get current checkpoint count
    const existing = await checkpointDAL.getByRace(raceId);
    const sequence = config.sequence ?? existing.length + 1;

    return await checkpointDAL.create({
      race_id: raceId,
      checkpoint_number: config.number,
      checkpoint_name: config.name,
      location: config.location,
      order_sequence: sequence
    });
  }

  /**
   * Reorder checkpoints
   */
  async reorderCheckpoints(
    raceId: string,
    orderedIds: string[]
  ): Promise<void> {
    await db.transaction('rw', db.checkpoints, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await checkpointDAL.update(orderedIds[i], {
          order_sequence: i + 1
        });
      }
    });
  }

  /**
   * Validate checkpoint configuration
   */
  async validateConfig(raceId: string): Promise<ValidationResult> {
    const checkpoints = await checkpointDAL.getByRace(raceId);
    const errors: string[] = [];

    if (checkpoints.length === 0) {
      errors.push('At least one checkpoint is required');
    }

    // Check for duplicate checkpoint numbers
    const numbers = checkpoints.map(c => c.checkpoint_number);
    const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate checkpoint numbers: ${duplicates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export interface CheckpointConfig {
  number: number;
  name: string;
  location?: string;
  sequence?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const checkpointConfigService = new CheckpointConfigService();
```

---

## Sprint Planning

### Sprint 8: Race Setup Enhancement (Weeks 15-17)

**Goal:** Streamline race configuration with import and checkpoint setup

**Stories:**
- Story 6.1: CSV/Excel Runner Import (13 points)
- Story 6.2: Checkpoint Configuration (8 points)

**Total Story Points:** 21

**Definition of Done:**
- [ ] CSV/Excel import functional
- [ ] Error handling comprehensive
- [ ] Checkpoint drag-and-drop working
- [ ] Validation prevents invalid configurations
- [ ] Unit tests >85% coverage
- [ ] Integration tests passing
- [ ] User documentation updated

---

Continue to next epic...
