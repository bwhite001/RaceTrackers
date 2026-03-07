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

/** "HH:mm" or "HH:mm:ss" → seconds since midnight */
function timeToSecs(str) {
  const parts = str.split(':').map(Number);
  return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
}

/** Seconds since midnight → "HH:mm:ss" (wraps within 24h) */
function secsToTime(s) {
  const total = ((s % 86400) + 86400) % 86400;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
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
  onUnresolvedAdded,
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

  const handleNudge = (deltaSecs) => {
    if (!commonTime) return;
    onTimeChange(secsToTime(timeToSecs(commonTime) + deltaSecs));
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
        <p className="mt-1 text-xs text-gray-400">↑↓ keys nudge ±5 min • buttons nudge ±30s/1m</p>

        {/* Time nudge buttons */}
        {!locked && (
          <div className="flex gap-1 mt-1">
            {[
              { label: '−1m', delta: -60 },
              { label: '−30s', delta: -30 },
              { label: '+30s', delta: 30 },
              { label: '+1m', delta: 60 },
            ].map(({ label, delta }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => handleNudge(delta)}
                disabled={disabled || !commonTime}
                className="flex-1 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bib Numbers */}
      <div>
        <label htmlFor="is-bib" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bib Numbers
        </label>
        <div className="flex gap-2">
          <input
            id="is-bib"
            aria-label="Bib Numbers"
            ref={bibRef}
            type="text"
            placeholder={ready ? 'Enter bib, press Enter…' : 'Set checkpoint and time first'}
            onKeyDown={handleBibKeyDown}
            disabled={disabled || !ready}
            className={`flex-1 ${inputCls}`}
          />
          {ready && !locked && (
            <button
              type="button"
              aria-label="Add unresolved call"
              title="Garbled call — record placeholder"
              onClick={onUnresolvedAdded}
              disabled={disabled}
              className="px-3 py-2 text-sm font-bold border border-amber-400 text-amber-700 dark:text-amber-400 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-40"
            >
              ?
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">Formats: 101, 105-107, 110 — or ? for unclear calls</p>
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
  onUnresolvedAdded:  PropTypes.func,
  raceStartTime:      PropTypes.string,
};

InputSection.defaultProps = { locked: false, disabled: false };

export default InputSection;
