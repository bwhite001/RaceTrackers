import React, { useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';

/**
 * ReportsPanel - Generate and export various race reports
 * 
 * Features:
 * - Multiple report types (missing, out list, checkpoint logs)
 * - Export formats (CSV, Excel, HTML)
 * - Report customization options
 * - Print preview
 * - Batch export
 */

const REPORT_TYPES = {
  missing: {
    label: 'Missing Numbers Report',
    description: 'List of runners who haven\'t checked in at checkpoints',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  },
  outList: {
    label: 'Out List Report',
    description: 'Withdrawn, vetted-out, and DNF runners',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
      </svg>
    )
  },
  checkpointLog: {
    label: 'Checkpoint Log Report',
    description: 'Detailed log of all checkpoint crossings',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    )
  },
  summary: {
    label: 'Race Summary Report',
    description: 'Overall race statistics and completion rates',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    )
  }
};

const EXPORT_FORMATS = {
  csv: {
    label: 'CSV',
    description: 'Comma-separated values, best for spreadsheets',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
  },
  excel: {
    label: 'Excel',
    description: 'Microsoft Excel format with formatting',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
      </svg>
    )
  },
  html: {
    label: 'HTML',
    description: 'Web page format with styling',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  }
};

const ReportsPanel = () => {
  const [selectedReport, setSelectedReport] = useState('missing');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [checkpoint, setCheckpoint] = useState(1);
  const [timeRange, setTimeRange] = useState('all');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);

  const {
    generateReport,
    downloadReport,
    previewReport,
    loading
  } = useBaseOperationsStore();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const report = await generateReport(selectedReport, {
        format: selectedFormat,
        checkpoint,
        timeRange,
        includeNotes
      });
      
      if (showPreview) {
        await previewReport(report);
      } else {
        await downloadReport(report);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Generate Reports
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create and export race reports in various formats
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(REPORT_TYPES).map(([type, { label, description, icon }]) => (
          <button
            key={type}
            onClick={() => setSelectedReport(type)}
            className={`p-4 rounded-lg border-2 text-left flex items-start space-x-4 ${
              selectedReport === type
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className={`mt-1 ${
              selectedReport === type
                ? 'text-primary-500'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {icon}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Export Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Export Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(EXPORT_FORMATS).map(([format, { label, description, icon }]) => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={`p-4 rounded-lg border-2 text-left flex items-start space-x-4 ${
                selectedFormat === format
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`mt-1 ${
                selectedFormat === format
                  ? 'text-primary-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {icon}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Options */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Report Options
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {/* Checkpoint Selection */}
          {selectedReport === 'missing' || selectedReport === 'checkpointLog' ? (
            <div>
              <label htmlFor="checkpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Checkpoint
              </label>
              <select
                id="checkpoint"
                value={checkpoint}
                onChange={(e) => setCheckpoint(parseInt(e.target.value))}
                className="form-input w-full"
              >
                {[1, 2, 3, 4, 5].map(cp => (
                  <option key={cp} value={cp}>
                    Checkpoint {cp}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Time Range */}
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Range
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-input w-full"
            >
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="3h">Last 3 Hours</option>
              <option value="6h">Last 6 Hours</option>
              <option value="12h">Last 12 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>

          {/* Include Notes */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeNotes"
              checked={includeNotes}
              onChange={(e) => setIncludeNotes(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="includeNotes" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Include notes and comments
            </label>
          </div>

          {/* Preview Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPreview"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="showPreview" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Show preview before download
            </label>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={handleGenerate}
          disabled={generating || loading}
          className="btn-primary"
        >
          {generating || loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About Reports
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Missing Numbers Report:</strong> Shows runners who haven't checked in</li>
          <li>• <strong>Out List Report:</strong> Lists withdrawn and vetted-out runners</li>
          <li>• <strong>Checkpoint Log:</strong> Detailed log of all checkpoint crossings</li>
          <li>• <strong>Race Summary:</strong> Overall statistics and completion rates</li>
          <li>• Reports can be exported in CSV, Excel, or HTML formats</li>
          <li>• Use preview to check report content before downloading</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportsPanel;
