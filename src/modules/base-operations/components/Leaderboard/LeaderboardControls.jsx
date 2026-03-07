import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import TimeUtils from '../../../../services/timeUtils.js';
import { exportAsCSV, exportAsPrint, copyToClipboard, buildQRData } from './export/exportLeaderboard.js';

const GROUP_MODES = [
  { value: 'overall', label: 'Overall' },
  { value: 'gender', label: 'Gender' },
  { value: 'wave', label: 'Wave' },
  { value: 'combined', label: 'Gender × Wave' },
];

/**
 * Controls bar for the leaderboard tab.
 *
 * Props:
 *   groupingMode        {string}   - current mode
 *   onGroupingChange    {fn}       - called with new mode string
 *   showNames           {boolean}
 *   onShowNamesToggle   {fn}
 *   onRefresh           {fn}
 *   lastUpdated         {Date}
 *   entries             {Array}    - current filtered entries (for export)
 *   raceName            {string}
 *   hasData             {boolean}  - disable export when no entries
 */
export default function LeaderboardControls({
  groupingMode,
  onGroupingChange,
  showNames,
  onShowNamesToggle,
  onRefresh,
  lastUpdated,
  entries = [],
  raceName = 'Race',
  hasData = false,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const dropdownRef = useRef(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const handleCopy = async () => {
    await copyToClipboard(entries);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 2000);
    setExportOpen(false);
  };

  const lastUpdatedStr = lastUpdated
    ? TimeUtils.formatTime(lastUpdated.toISOString(), 'HH:mm:ss')
    : '--:--:--';

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Group By */}
      <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        {GROUP_MODES.map(mode => (
          <button
            key={mode.value}
            onClick={() => onGroupingChange(mode.value)}
            className={`px-3 py-2 text-sm font-medium transition-colors min-h-[44px]
              ${groupingMode === mode.value
                ? 'bg-navy-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Show Names toggle */}
      <button
        onClick={onShowNamesToggle}
        className={`px-3 py-2 text-sm font-medium rounded-lg border min-h-[44px] transition-colors
          ${showNames
            ? 'border-navy-400 bg-navy-50 dark:bg-navy-900/30 text-navy-700 dark:text-navy-300'
            : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
      >
        {showNames ? 'Names On' : 'Names Off'}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Last updated */}
      <span
        aria-live="polite"
        className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block"
      >
        Updated: {lastUpdatedStr}
      </span>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        aria-label="Refresh leaderboard"
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px]"
      >
        <ArrowPathIcon className="h-4 w-4" />
      </button>

      {/* Export dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setExportOpen(v => !v)}
          disabled={!hasData}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors min-h-[44px]"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export
        </button>
        {exportOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50">
            <button
              onClick={() => { exportAsCSV(entries, raceName); setExportOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px]"
            >
              Export CSV
            </button>
            <button
              onClick={() => { exportAsPrint(); setExportOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px]"
            >
              Print / Save PDF
            </button>
            <button
              onClick={handleCopy}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px]"
            >
              {copyMsg || 'Copy to Clipboard'}
            </button>
            <button
              onClick={() => { setQrOpen(true); setExportOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px]"
            >
              QR Code (Top 10)
            </button>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setQrOpen(false)}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top 10 Results QR</h2>
            <QRCodeSVG value={buildQRData(entries, raceName)} size={256} />
            <button
              onClick={() => setQrOpen(false)}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

LeaderboardControls.propTypes = {
  groupingMode: PropTypes.string.isRequired,
  onGroupingChange: PropTypes.func.isRequired,
  showNames: PropTypes.bool.isRequired,
  onShowNamesToggle: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  lastUpdated: PropTypes.instanceOf(Date),
  entries: PropTypes.array,
  raceName: PropTypes.string,
  hasData: PropTypes.bool,
};
