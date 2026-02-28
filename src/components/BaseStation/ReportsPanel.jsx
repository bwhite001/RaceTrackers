import React, { useState, useCallback } from 'react';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import useDeviceDetection from '../../shared/hooks/useDeviceDetection';
import { REPORT_TYPES } from '../../utils/reportUtils';
import ReportBuilder from './ReportBuilder';
import LoadingSpinner from '../Layout/LoadingSpinner';
import ErrorMessage from '../Layout/ErrorMessage';

/**
 * ReportsPanel Component
 * Handles report generation and export functionality
 */
const ReportsPanel = () => {
  // Device detection
  const { isDesktop } = useDeviceDetection();

  // Store access
  const {
    generateMissingNumbersReport,
    generateOutListReport,
    generateCheckpointLogReport,
    exportBaseStationData,
    loading,
    error
  } = useBaseOperationsStore();

  // Local state
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reportError, setReportError] = useState(null);

  // Quick reports
  const quickReports = [
    {
      id: REPORT_TYPES.RUNNER_STATUS,
      title: 'Missing Numbers Report',
      description: 'List of expected runners who have not checked in',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      action: generateMissingNumbersReport
    },
    {
      id: REPORT_TYPES.CHECKPOINT_TIMES,
      title: 'Out List',
      description: 'List of runners currently on the course',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      action: generateOutListReport
    },
    {
      id: REPORT_TYPES.DNF_SUMMARY,
      title: 'Checkpoint Log',
      description: 'Detailed log of all checkpoint activity',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      action: generateCheckpointLogReport
    }
  ];

  // Handle quick report generation
  const handleQuickReport = useCallback(async (report) => {
    setActiveReport(report.id);
    setReportError(null);

    try {
      await report.action();
    } catch (error) {
      setReportError(error.message);
    } finally {
      setActiveReport(null);
    }
  }, []);

  // Handle custom report generation
  const handleCustomReport = useCallback(async (config) => {
    try {
      await exportBaseStationData(config);
      setShowReportBuilder(false);
    } catch (error) {
      setReportError(error.message);
    }
  }, [exportBaseStationData]);

  if (loading) {
    return (
      <div role="progressbar" aria-label="Loading reports">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Reports & Exports
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate and download various race reports and data exports
        </p>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickReports.map(report => (
          <div
            key={report.id}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm 
                     overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                  {report.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleQuickReport(report)}
                  disabled={loading || activeReport === report.id}
                  aria-label={`Generate ${report.title}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent 
                           text-sm font-medium rounded-md shadow-sm text-white 
                           bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 
                           disabled:cursor-not-allowed"
                >
                  {activeReport === report.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Report Button */}
      <div className="mt-8">
        <button
          onClick={() => setShowReportBuilder(true)}
          aria-label="Create Custom Report"
          className="inline-flex items-center px-4 py-2 border border-transparent 
                   text-sm font-medium rounded-md shadow-sm text-white 
                   bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Custom Report
        </button>
      </div>

      {/* Report Builder Dialog */}
      {showReportBuilder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
            <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
              <ReportBuilder
                onGenerate={handleCustomReport}
                onCancel={() => setShowReportBuilder(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {(error || reportError) && (
        <div className="mt-4">
          <ErrorMessage message={error || reportError} />
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          About Reports
        </h3>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            Reports are generated in real-time based on current race data. They can be
            downloaded in various formats for use in spreadsheet applications.
          </p>
          {isDesktop && (
            <p>
              Keyboard shortcut: Press R to quickly access the reports panel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
