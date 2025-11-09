import { describe, test, expect } from 'vitest';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_TEMPLATES,
  COLUMN_DEFINITIONS,
  formatCellValue,
  generateCSV,
  generateJSON,
  filterData,
  sortData,
  validateReportConfig
} from '../../../utils/reportUtils';

describe('Report Utilities', () => {
  const mockData = [
    {
      number: 1,
      status: 'finished',
      startTime: '2023-01-01T10:00:00Z',
      finishTime: '2023-01-01T12:00:00Z',
      checkpoints: {
        1: '2023-01-01T10:30:00Z',
        2: '2023-01-01T11:00:00Z'
      },
      notes: 'Test note 1'
    },
    {
      number: 2,
      status: 'dnf',
      startTime: '2023-01-01T10:00:00Z',
      finishTime: null,
      checkpoints: {
        1: '2023-01-01T10:35:00Z'
      },
      notes: 'Test note 2',
      reason: 'Injury'
    }
  ];

  describe('formatCellValue', () => {
    test('formats datetime values', () => {
      const date = '2023-01-01T12:00:00Z';
      expect(formatCellValue(date, 'datetime')).toMatch(/2023/);
    });

    test('formats status values', () => {
      expect(formatCellValue('finished', 'status')).toBe('FINISHED');
    });

    test('formats checkpoint values', () => {
      const checkpoints = {
        1: '2023-01-01T10:30:00Z',
        2: '2023-01-01T11:00:00Z'
      };
      const formatted = formatCellValue(checkpoints, 'checkpoints');
      expect(formatted).toContain('CP1:');
      expect(formatted).toContain('CP2:');
    });

    test('handles null/undefined values', () => {
      expect(formatCellValue(null, 'any')).toBe('-');
      expect(formatCellValue(undefined, 'any')).toBe('-');
    });
  });

  describe('generateCSV', () => {
    test('generates CSV with headers', () => {
      const columns = ['number', 'status'];
      const csv = generateCSV(mockData, columns);
      const lines = csv.split('\n');
      
      expect(lines[0]).toContain('Runner Number');
      expect(lines[0]).toContain('Status');
      expect(lines.length).toBe(3); // header + 2 data rows
    });

    test('formats values correctly in CSV', () => {
      const columns = ['number', 'status', 'finishTime'];
      const csv = generateCSV(mockData, columns);
      
      expect(csv).toContain('1,FINISHED');
      expect(csv).toContain('2,DNF');
    });
  });

  describe('generateJSON', () => {
    test('generates JSON with selected columns', () => {
      const columns = ['number', 'status'];
      const json = generateJSON(mockData, columns);
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toHaveProperty('number', 1);
      expect(parsed[0]).toHaveProperty('status', 'finished');
    });

    test('excludes non-selected columns', () => {
      const columns = ['number'];
      const json = generateJSON(mockData, columns);
      const parsed = JSON.parse(json);
      
      expect(parsed[0]).not.toHaveProperty('status');
      expect(parsed[0]).not.toHaveProperty('notes');
    });
  });

  describe('filterData', () => {
    test('filters by exact match', () => {
      const filtered = filterData(mockData, { status: 'finished' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].number).toBe(1);
    });

    test('filters by partial text match', () => {
      const filtered = filterData(mockData, { notes: 'note' });
      expect(filtered).toHaveLength(2);
    });

    test('filters by multiple criteria', () => {
      const filtered = filterData(mockData, {
        status: 'dnf',
        notes: 'test'
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].number).toBe(2);
    });

    test('handles empty filters', () => {
      const filtered = filterData(mockData, {});
      expect(filtered).toEqual(mockData);
    });
  });

  describe('sortData', () => {
    test('sorts by number ascending', () => {
      const sorted = sortData(mockData, { column: 'number', direction: 'asc' });
      expect(sorted[0].number).toBe(1);
      expect(sorted[1].number).toBe(2);
    });

    test('sorts by number descending', () => {
      const sorted = sortData(mockData, { column: 'number', direction: 'desc' });
      expect(sorted[0].number).toBe(2);
      expect(sorted[1].number).toBe(1);
    });

    test('sorts by status', () => {
      const sorted = sortData(mockData, { column: 'status', direction: 'asc' });
      expect(sorted[0].status).toBe('dnf');
      expect(sorted[1].status).toBe('finished');
    });

    test('handles invalid sort column', () => {
      const sorted = sortData(mockData, { column: 'invalid' });
      expect(sorted).toEqual(mockData);
    });

    test('handles null values in sort', () => {
      const sorted = sortData(mockData, { column: 'finishTime', direction: 'asc' });
      expect(sorted[0].finishTime).toBeNull();
    });
  });

  describe('validateReportConfig', () => {
    test('validates required fields', () => {
      const config = {
        name: '',
        columns: [],
        format: 'invalid'
      };
      
      const { isValid, errors } = validateReportConfig(config);
      
      expect(isValid).toBe(false);
      expect(errors).toHaveProperty('name');
      expect(errors).toHaveProperty('columns');
      expect(errors).toHaveProperty('format');
    });

    test('accepts valid config', () => {
      const config = {
        name: 'Test Report',
        columns: ['number', 'status'],
        format: REPORT_FORMATS.CSV
      };
      
      const { isValid, errors } = validateReportConfig(config);
      
      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });
  });

  describe('Constants', () => {
    test('defines report types', () => {
      expect(REPORT_TYPES).toHaveProperty('RUNNER_STATUS');
      expect(REPORT_TYPES).toHaveProperty('CHECKPOINT_TIMES');
      expect(REPORT_TYPES).toHaveProperty('CUSTOM');
    });

    test('defines report formats', () => {
      expect(REPORT_FORMATS).toHaveProperty('CSV');
      expect(REPORT_FORMATS).toHaveProperty('JSON');
      expect(REPORT_FORMATS).toHaveProperty('PDF');
    });

    test('defines report templates', () => {
      expect(REPORT_TEMPLATES).toHaveProperty('BASIC');
      expect(REPORT_TEMPLATES).toHaveProperty('DETAILED');
      expect(REPORT_TEMPLATES.BASIC).toHaveProperty('columns');
    });

    test('defines column definitions', () => {
      expect(COLUMN_DEFINITIONS).toHaveProperty('number');
      expect(COLUMN_DEFINITIONS).toHaveProperty('status');
      expect(COLUMN_DEFINITIONS.number).toHaveProperty('sortable');
    });
  });
});
