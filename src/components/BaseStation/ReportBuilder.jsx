import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_TEMPLATES,
  COLUMN_DEFINITIONS,
  validateReportConfig
} from '../../utils/reportUtils';

/**
 * ReportBuilder Component
 * Allows users to create custom reports with configurable columns and formats
 */
const ReportBuilder = ({ onGenerate, onCancel }) => {
  // Local state
  const [reportConfig, setReportConfig] = useState({
    name: '',
    type: REPORT_TYPES.CUSTOM,
    format: REPORT_FORMATS.CSV,
    template: '',
    columns: [],
    filters: {}
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Available columns based on selected template
  const availableColumns = useMemo(() => {
    if (reportConfig.template && REPORT_TEMPLATES[reportConfig.template]) {
      return REPORT_TEMPLATES[reportConfig.template].columns;
    }
    return Object.keys(COLUMN_DEFINITIONS);
  }, [reportConfig.template]);

  // Handle template selection
  const handleTemplateChange = useCallback((e) => {
    const template = e.target.value;
    setReportConfig(prev => ({
      ...prev,
      template,
      columns: template ? REPORT_TEMPLATES[template].columns : []
    }));
    setValidationErrors({});
  }, []);

  // Handle column selection
  const handleColumnToggle = useCallback((column) => {
    setReportConfig(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }));
    setValidationErrors({});
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const { isValid, errors } = validateReportConfig(reportConfig);
    if (!isValid) {
      setValidationErrors(errors);
      return;
    }

    onGenerate(reportConfig);
  }, [reportConfig, onGenerate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Create Custom Report
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure your report settings and select the data to include
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Name */}
        <div>
          <label
            htmlFor="reportName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Report Name
          </label>
          <input
            type="text"
            id="reportName"
            value={reportConfig.name}
            onChange={e => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
            className={`mt-1 block w-full rounded-md shadow-sm 
              ${validationErrors.name 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } 
              dark:bg-gray-800 dark:border-gray-600`}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.name}
            </p>
          )}
        </div>

        {/* Template Selection */}
        <div>
          <label
            htmlFor="template"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Report Template
          </label>
          <select
            id="template"
            value={reportConfig.template}
            onChange={handleTemplateChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500 
                     dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="">Custom Report</option>
            {Object.entries(REPORT_TEMPLATES).map(([id, template]) => (
              <option key={id} value={id}>
                {template.name}
              </option>
            ))}
          </select>
          {reportConfig.template && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {REPORT_TEMPLATES[reportConfig.template].description}
            </p>
          )}
        </div>

        {/* Column Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Columns
          </label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            {availableColumns.map(column => (
              <label
                key={column}
                className="relative flex items-start py-2"
              >
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {COLUMN_DEFINITIONS[column].label}
                  </div>
                  {COLUMN_DEFINITIONS[column].sortable && (
                    <p className="text-xs text-gray-500">Sortable</p>
                  )}
                </div>
                <div className="ml-3 flex h-5 items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.columns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 
                             focus:ring-blue-500 dark:border-gray-600"
                  />
                </div>
              </label>
            ))}
          </div>
          {validationErrors.columns && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.columns}
            </p>
          )}
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Export Format
          </label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(REPORT_FORMATS).map(([format, value]) => (
              <label
                key={format}
                className={`relative flex cursor-pointer rounded-lg border p-4 
                  ${reportConfig.format === value
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={value}
                  checked={reportConfig.format === value}
                  onChange={e => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
                  className="sr-only"
                />
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">
                      {format}
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>
          {validationErrors.format && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.format}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                     rounded-md text-sm font-medium transition-colors"
          >
            Generate Report
          </button>
        </div>
      </form>
    </div>
  );
};

ReportBuilder.propTypes = {
  onGenerate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ReportBuilder;
