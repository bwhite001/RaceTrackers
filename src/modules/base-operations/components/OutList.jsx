import React, { useEffect, useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';

/**
 * OutList - Display all runners who are out of the race
 * 
 * Features:
 * - Shows withdrawn, vetted-out, DNF, and non-starter runners
 * - Displays timestamps, reasons, and comments
 * - Filter by status type
 * - Print and export functionality
 * - Real-time updates
 */

const OutList = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    outList,
    loadOutList,
    generateOutListReport,
    downloadReport,
    loading
  } = useBaseOperationsStore();

  // Load out list on mount
  useEffect(() => {
    loadOutList();
  }, [loadOutList]);

  const handleRefresh = () => {
    loadOutList();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      const report = await generateOutListReport();
      downloadReport(report);
    } catch (error) {
      console.error('Failed to export out list:', error);
    }
  };

  // Filter runners by status and search term
  const filteredRunners = outList.filter(runner => {
    // Filter by status
    if (filterStatus !== 'all' && runner.status !== filterStatus) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        runner.number.toString().includes(term) ||
        runner.status.toLowerCase().includes(term) ||
        (runner.withdrawalDetails?.reason || '').toLowerCase().includes(term) ||
        (runner.withdrawalDetails?.comments || '').toLowerCase().includes(term) ||
        (runner.vetOutDetails?.reason || '').toLowerCase().includes(term) ||
        (runner.vetOutDetails?.medicalNotes || '').toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Count by status
  const statusCounts = {
    withdrawn: outList.filter(r => r.status === 'withdrawn').length,
    'vet-out': outList.filter(r => r.status === 'vet-out').length,
    dnf: outList.filter(r => r.status === 'dnf').length,
    'non-starter': outList.filter(r => r.status === 'non-starter').length
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'withdrawn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'vet-out':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'dnf':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'non-starter':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'withdrawn':
        return (
          <svg role="img" aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        );
      case 'vet-out':
        return (
          <svg role="img" aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'dnf':
        return (
          <svg role="img" aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'non-starter':
        return (
          <svg role="img" aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Out List
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Runners who are out of the race
          </p>
        </div>
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

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Withdrawn</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.withdrawn}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Vet Out</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statusCounts['vet-out']}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm font-medium text-red-900 dark:text-red-100">DNF</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.dnf}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Non-Starter</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{statusCounts['non-starter']}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by number, reason, or comments..."
            className="form-input w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input"
        >
          <option value="all">All Status ({outList.length})</option>
          <option value="withdrawn">Withdrawn ({statusCounts.withdrawn})</option>
          <option value="vet-out">Vet Out ({statusCounts['vet-out']})</option>
          <option value="dnf">DNF ({statusCounts.dnf})</option>
          <option value="non-starter">Non-Starter ({statusCounts['non-starter']})</option>
        </select>
      </div>

      {/* Out List Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div role="status" aria-label="Loading" className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRunners.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {searchTerm || filterStatus !== 'all' ? 'No matching runners' : 'No runners out'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'All runners are still in the race'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Runner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason / Comments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRunners.map((runner) => {
                  const time = runner.withdrawalDetails?.withdrawalTime || 
                               runner.vetOutDetails?.vetOutTime || 
                               runner.recordedTime;
                  const reason = runner.withdrawalDetails?.reason || 
                                runner.vetOutDetails?.reason || 
                                runner.status;
                  const comments = runner.withdrawalDetails?.comments || 
                                  runner.vetOutDetails?.medicalNotes || 
                                  runner.notes || 
                                  '';

                  return (
                    <tr key={runner.number} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(runner.status)}
                          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                            {runner.number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(runner.status)}`}>
                          {runner.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {time ? TimeUtils.formatTime(time) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>
                          <p className="font-medium">{reason}</p>
                          {comments && (
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                              {comments}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredRunners.length} of {outList.length} runners
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="btn-secondary"
            disabled={filteredRunners.length === 0}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleExport}
            className="btn-primary"
            disabled={filteredRunners.length === 0 || loading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          About Out List
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Withdrawn:</strong> Runner voluntarily withdrew from the race</li>
          <li>• <strong>Vet Out:</strong> Runner failed veterinary check for safety reasons</li>
          <li>• <strong>DNF:</strong> Did Not Finish - runner unable to complete the race</li>
          <li>• <strong>Non-Starter:</strong> Runner registered but did not start the race</li>
          <li>• Use this list for official records and incident reports</li>
        </ul>
      </div>
    </div>
  );
};

export default OutList;
