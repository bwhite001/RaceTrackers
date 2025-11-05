import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../store/baseOperationsStore';

/**
 * MissingNumbersList - Display runners who haven't checked in at a checkpoint
 * 
 * Features:
 * - Real-time list of missing runners
 * - Checkpoint selection
 * - Compact number display with ranges
 * - Print and export functionality
 * - Auto-refresh capability
 */

const MissingNumbersList = ({ checkpoint: initialCheckpoint = 1, autoRefresh = false }) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(initialCheckpoint);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const {
    missingRunners,
    loadMissingRunners,
    generateMissingNumbersReport,
    downloadReport,
    loading
  } = useBaseOperationsStore();

  // Load missing runners on mount and when checkpoint changes
  useEffect(() => {
    loadMissingRunners(selectedCheckpoint);
  }, [selectedCheckpoint, loadMissingRunners]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadMissingRunners(selectedCheckpoint);
      }, 30000); // Refresh every 30 seconds

      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, selectedCheckpoint, loadMissingRunners]);

  const handleRefresh = () => {
    loadMissingRunners(selectedCheckpoint);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      const report = await generateMissingNumbersReport(selectedCheckpoint);
      downloadReport(report);
    } catch (error) {
      console.error('Failed to export missing numbers:', error);
    }
  };

  // Format runner numbers into compact ranges
  const formatRunnerNumbers = (runners) => {
    if (!runners || runners.length === 0) return '';

    const numbers = runners.map(r => r.number).sort((a, b) => a - b);
    const ranges = [];
    let start = numbers[0];
    let end = numbers[0];

    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === end + 1) {
        end = numbers[i];
      } else {
        if (start === end) {
          ranges.push(start.toString());
        } else if (end === start + 1) {
          ranges.push(`${start}, ${end}`);
        } else {
          ranges.push(`${start}-${end}`);
        }
        start = end = numbers[i];
      }
    }

    // Add the last range
    if (start === end) {
      ranges.push(start.toString());
    } else if (end === start + 1) {
      ranges.push(`${start}, ${end}`);
    } else {
      ranges.push(`${start}-${end}`);
    }

    return ranges.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Missing Numbers
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Runners who haven't checked in at checkpoint {selectedCheckpoint}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary"
            title="Refresh list"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Checkpoint Selector */}
      <div className="flex items-center space-x-4">
        <label htmlFor="checkpoint" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Checkpoint:
        </label>
        <select
          id="checkpoint"
          value={selectedCheckpoint}
          onChange={(e) => setSelectedCheckpoint(parseInt(e.target.value))}
          className="form-input"
        >
          {[1, 2, 3, 4, 5].map(cp => (
            <option key={cp} value={cp}>
              Checkpoint {cp}
            </option>
          ))}
        </select>
      </div>

      {/* Missing Count */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Total Missing
            </p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {missingRunners.length}
            </p>
          </div>
          <svg className="w-12 h-12 text-orange-400 dark:text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Missing Numbers Display */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Missing Runner Numbers
          </h4>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : missingRunners.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                All Runners Accounted For!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                No missing runners at checkpoint {selectedCheckpoint}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Compact Format */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compact Format:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-900 dark:text-white break-words">
                  {formatRunnerNumbers(missingRunners)}
                </div>
              </div>

              {/* Individual Numbers */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Individual Numbers:
                </p>
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                  {missingRunners.map(runner => (
                    <div
                      key={runner.number}
                      className="bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 rounded px-2 py-1 text-center text-sm font-medium"
                    >
                      {runner.number}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setRefreshInterval(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="autoRefresh" className="text-sm text-gray-700 dark:text-gray-300">
            Auto-refresh every 30 seconds
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="btn-secondary"
            disabled={missingRunners.length === 0}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleExport}
            className="btn-primary"
            disabled={missingRunners.length === 0 || loading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About Missing Numbers
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Missing runners are those who haven't checked in at the selected checkpoint</li>
          <li>• Excludes non-starters, withdrawn, and vetted-out runners</li>
          <li>• Use this list to identify runners who may need assistance</li>
          <li>• Print or export for field teams and radio operators</li>
          <li>• List updates automatically when runners check in</li>
        </ul>
      </div>
    </div>
  );
};

MissingNumbersList.propTypes = {
  checkpoint: PropTypes.number,
  autoRefresh: PropTypes.bool
};

export default MissingNumbersList;
