/**
 * Report Generation Utilities
 */

/**
 * Report Types
 */
export const REPORT_TYPES = {
  RUNNER_STATUS: 'runner_status',
  CHECKPOINT_TIMES: 'checkpoint_times',
  DNF_SUMMARY: 'dnf_summary',
  DNS_SUMMARY: 'dns_summary',
  CUSTOM: 'custom'
};

/**
 * Report Formats
 */
export const REPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  PDF: 'pdf',
  EXCEL: 'xlsx'
};

/**
 * Report Templates
 */
export const REPORT_TEMPLATES = {
  BASIC: {
    id: 'basic',
    name: 'Basic Report',
    description: 'Simple tabular report with basic runner information',
    columns: ['number', 'status', 'finishTime']
  },
  DETAILED: {
    id: 'detailed',
    name: 'Detailed Report',
    description: 'Comprehensive report with all runner data',
    columns: ['number', 'status', 'startTime', 'finishTime', 'checkpoints', 'notes']
  },
  CHECKPOINT: {
    id: 'checkpoint',
    name: 'Checkpoint Times',
    description: 'Focus on checkpoint timing data',
    columns: ['number', 'checkpoints']
  },
  WITHDRAWALS: {
    id: 'withdrawals',
    name: 'Withdrawals Report',
    description: 'Summary of DNF/DNS runners with reasons',
    columns: ['number', 'status', 'reason', 'timestamp']
  }
};

/**
 * Column Definitions
 */
export const COLUMN_DEFINITIONS = {
  number: {
    id: 'number',
    label: 'Runner Number',
    type: 'number',
    sortable: true,
    width: 100
  },
  status: {
    id: 'status',
    label: 'Status',
    type: 'status',
    sortable: true,
    width: 120
  },
  startTime: {
    id: 'startTime',
    label: 'Start Time',
    type: 'datetime',
    sortable: true,
    width: 160
  },
  finishTime: {
    id: 'finishTime',
    label: 'Finish Time',
    type: 'datetime',
    sortable: true,
    width: 160
  },
  checkpoints: {
    id: 'checkpoints',
    label: 'Checkpoint Times',
    type: 'checkpoints',
    sortable: false,
    width: 200
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    type: 'text',
    sortable: false,
    width: 200
  },
  reason: {
    id: 'reason',
    label: 'Reason',
    type: 'text',
    sortable: false,
    width: 200
  },
  timestamp: {
    id: 'timestamp',
    label: 'Timestamp',
    type: 'datetime',
    sortable: true,
    width: 160
  }
};

/**
 * Format cell value based on column type
 */
export const formatCellValue = (value, type) => {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'status':
      return value.toUpperCase();
    case 'checkpoints':
      return Object.entries(value)
        .map(([cp, time]) => `CP${cp}: ${new Date(time).toLocaleTimeString()}`)
        .join(', ');
    default:
      return String(value);
  }
};

/**
 * Generate CSV content from data
 */
export const generateCSV = (data, columns) => {
  const header = columns.map(col => COLUMN_DEFINITIONS[col].label).join(',');
  const rows = data.map(row => 
    columns.map(col => 
      formatCellValue(row[col], COLUMN_DEFINITIONS[col].type)
    ).join(',')
  );
  return [header, ...rows].join('\n');
};

/**
 * Generate JSON content from data
 */
export const generateJSON = (data, columns) => {
  return JSON.stringify(
    data.map(row => 
      columns.reduce((acc, col) => ({
        ...acc,
        [col]: row[col]
      }), {})
    ),
    null,
    2
  );
};

/**
 * Filter data based on criteria
 */
export const filterData = (data, filters) => {
  return data.filter(row => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const rowValue = row[key];
      if (Array.isArray(value)) {
        return value.includes(rowValue);
      }
      if (typeof value === 'string') {
        return rowValue?.toString().toLowerCase().includes(value.toLowerCase());
      }
      return rowValue === value;
    });
  });
};

/**
 * Sort data based on column and direction
 */
export const sortData = (data, { column, direction = 'asc' }) => {
  if (!column) return data;

  const columnDef = COLUMN_DEFINITIONS[column];
  if (!columnDef?.sortable) return data;

  return [...data].sort((a, b) => {
    const aVal = a[column] ?? '';
    const bVal = b[column] ?? '';
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Validate report configuration
 */
export const validateReportConfig = (config) => {
  const errors = {};

  if (!config.name?.trim()) {
    errors.name = 'Report name is required';
  }

  if (!config.columns?.length) {
    errors.columns = 'At least one column must be selected';
  }

  if (!Object.values(REPORT_FORMATS).includes(config.format)) {
    errors.format = 'Invalid report format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
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
};
