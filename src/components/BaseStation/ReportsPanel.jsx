import React, { memo, useState, useCallback } from 'react';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import useDeviceDetection from '../../shared/hooks/useDeviceDetection';
import { HOTKEYS } from '../../types';
import LoadingSpinner from '../Layout/LoadingSpinner';

/**
 * ReportsPanel Component
 * Handles generation and export of various race reports
 */
const ReportsPanel = memo(() => {
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
  const [activeReport, setActiveReport] = useState(null);
  const [reportError, setReportError] = useState(null);

  // Report types
  const reportTypes = [
    {
      id: 'missing',
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
      id: 'out',
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
      id: 'checkpoint',
      title: 'Checkpoint Log',
      description: 'Detailed log of all checkpoint activity',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      action: generateCheckpointLogReport
    },
    {
      id: 'export',
      title: 'Export All Data',
      description: 'Export complete race data in CSV format',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: exportBaseStationData
    }
  ];

  // Handle report generation
  const handleGenerateReport = useCallback(async (reportType) => {
    setActiveReport(reportType.id);
    setReportError(null);

    try {
      await reportType.action();
    } catch (error) {
      setReportError(error.message);
    } finally {
      setActiveReport(null);
    }
  }, []);

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

      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map(reportType => (
          <div
            key={reportType.id}
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm 
                     overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                  {reportType.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {reportType.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {reportType.description}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleGenerateReport(reportType)}
                  disabled={loading || activeReport === reportType.id}
                  className="inline-flex items-center px-4 py-2 border border-transparent 
                           text-sm font-medium rounded-md shadow-sm text-white 
                           bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 
                           disabled:cursor-not-allowed"
                >
                  {activeReport === reportType.id ? (
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

      {/* Error Message */}
      {(error || reportError) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error || reportError}
          </p>
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
            downloaded in CSV format for use in spreadsheet applications.
          </p>
          {isDesktop && (
            <p>
              Keyboard shortcut: Press {HOTKEYS.REPORTS} to quickly access the reports panel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
ReportsPanel.displayName = 'ReportsPanel';

export default ReportsPanel;
