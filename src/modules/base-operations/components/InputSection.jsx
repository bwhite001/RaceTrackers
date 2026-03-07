import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

function roundDownTo5Min(date) {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return format(d, 'HH:mm');
}

function isInFuture(timeStr) {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const entry = new Date();
  entry.setHours(h, m, 0, 0);
  return entry > now;
}

/** Parse "101, 105-107, 110" → [101, 105, 106, 107, 110] */
function parseBibs(raw) {
  const results = [];
  for (const token of raw.split(',')) {
    const t = token.trim();
    const rangeMatch = t.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const lo = parseInt(rangeMatch[1], 10);
      const hi = parseInt(rangeMatch[2], 10);
      for (let i = lo; i <= hi; i++) results.push(i);
    } else {
      const n = parseInt(t, 10);
      if (!isNaN(n) && n > 0) results.push(n);
    }
  }
  return results;
}

const InputSection = ({
  checkpoints,
  checkpointNumber,
  commonTime,
  locked,
  disabled,
  onCheckpointChange,
  onTimeChange,
  onBibEntered,
  raceStartTime,
}) => {
  const bibRef = useRef(null);
  const ready = checkpointNumber && commonTime;

  // Auto-focus bib input once checkpoint + time are both set
  useEffect(() => {
    if (ready && bibRef.current && document.activeElement !== bibRef.current) {
      bibRef.current.focus();
    }
  }, [ready]);

  const handleTimeFocus = () => {
    if (!commonTime) onTimeChange(roundDownTo5Min(new Date()));
  };

  const handleTimeKeyDown = (e) => {
    if (!commonTime) return;
    const [h, m] = commonTime.split(':').map(Number);
    const d = new Date();
    if (e.key === 'ArrowUp')   { e.preventDefault(); d.setHours(h, m + 5, 0, 0); onTimeChange(format(d, 'HH:mm')); }
    if (e.key === 'ArrowDown') { e.preventDefault(); d.setHours(h, m - 5, 0, 0); onTimeChange(format(d, 'HH:mm')); }
  };

  const handleBibKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const raw = e.target.value.trim();
      if (!raw) return;
      const bibs = parseBibs(raw);
      if (bibs.length > 0) {
        onBibEntered(bibs);
        e.target.value = '';
      }
    }
  };

  const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Checkpoint */}
      <div>
        <label htmlFor="is-cp-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Checkpoint
        </label>
        <select
          id="is-cp-select"
          aria-label="Checkpoint"
          value={checkpointNumber ?? ''}
          onChange={e => onCheckpointChange(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled || locked}
          className={inputCls}
        >
          <option value="">Select checkpoint…</option>
          {checkpoints.map(cp => (
            <option key={cp.number} value={cp.number}>CP{cp.number} — {cp.name}</option>
          ))}
        </select>
      </div>

      {/* Common Time */}
      <div>
        <label htmlFor="is-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Common Time
        </label>
        <div className="flex gap-2">
          <input
            id="is-time"
            aria-label="Common Time"
            type="time"
            value={commonTime ?? ''}
            onFocus={handleTimeFocus}
            onChange={e => onTimeChange(e.target.value)}
            onKeyDown={handleTimeKeyDown}
            disabled={disabled || locked}
            className={`flex-1 ${inputCls}`}
          />
          {!locked && (
            <>
              <button
                type="button"
                onClick={() => onTimeChange(format(new Date(), 'HH:mm'))}
                disabled={disabled}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
              >
                Now
              </button>
              {raceStartTime && (
                <button
                  type="button"
                  onClick={() => onTimeChange(raceStartTime)}
                  disabled={disabled}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                >
                  Start
                </button>
              )}
            </>
          )}
        </div>
        {isInFuture(commonTime) && (
          <p className="mt-1 text-xs text-amber-600">⚠ Time is in the future</p>
        )}
        <p className="mt-1 text-xs text-gray-400">↑↓ keys nudge by 5 minutes</p>
      </div>

      {/* Bib Numbers */}
      <div>
        <label htmlFor="is-bib" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bib Numbers
        </label>
        <input
          id="is-bib"
          aria-label="Bib Numbers"
          ref={bibRef}
          type="text"
          placeholder={ready ? 'Enter bib, press Enter…' : 'Set checkpoint and time first'}
          onKeyDown={handleBibKeyDown}
          disabled={disabled || !ready}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-gray-400">Formats: 101, 105-107, 110</p>
      </div>
    </div>
  );
};

InputSection.propTypes = {
  checkpoints:        PropTypes.array.isRequired,
  checkpointNumber:   PropTypes.number,
  commonTime:         PropTypes.string,
  locked:             PropTypes.bool,
  disabled:           PropTypes.bool,
  onCheckpointChange: PropTypes.func.isRequired,
  onTimeChange:       PropTypes.func.isRequired,
  onBibEntered:       PropTypes.func.isRequired,
  raceStartTime:      PropTypes.string,
};

InputSection.defaultProps = { locked: false, disabled: false };

export default InputSection;
