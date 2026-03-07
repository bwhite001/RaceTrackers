import React, { useRef, useEffect, useState } from 'react';
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
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [textareaValue, setTextareaValue] = useState('');
  const [numpadValue, setNumpadValue] = useState('');
  const [nudgesOpen, setNudgesOpen] = useState(false);

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

  const parsedListBibs = parseBibs(textareaValue.replace(/\n/g, ','));

  return (
    <>
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
        <p className="mt-1 text-xs text-gray-400">↑↓ keys nudge ±5 min</p>

        {/* Time nudge buttons */}
        {!locked && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setNudgesOpen(o => !o)}
              disabled={disabled || !commonTime}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
            >
              {nudgesOpen ? '▲ Hide nudges' : '▼ Adjust time'}
            </button>
            {nudgesOpen && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex gap-1">
                  {[
                    { label: '+1h', delta: 3600 },
                    { label: '+15m', delta: 900 },
                    { label: '+5m', delta: 300 },
                    { label: '+1m', delta: 60 },
                  ].map(({ label, delta }) => (
                    <button
                      key={label}
                      type="button"
                      aria-label={label}
                      onClick={() => handleNudge(delta)}
                      disabled={disabled || !commonTime}
                      className="flex-1 px-1 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {[
                    { label: '−1m', delta: -60 },
                    { label: '−5m', delta: -300 },
                    { label: '−15m', delta: -900 },
                    { label: '−1h', delta: -3600 },
                  ].map(({ label, delta }) => (
                    <button
                      key={label}
                      type="button"
                      aria-label={label}
                      onClick={() => handleNudge(delta)}
                      disabled={disabled || !commonTime}
                      className="flex-1 px-1 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

      {/* Quick Entry — modal trigger */}
      {ready && !locked && (
        <button
          type="button"
          aria-label="Quick Entry"
          onClick={() => setQuickEntryOpen(true)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
        >
          ⌨ Quick Entry
        </button>
      )}
    </div>

    {/* Quick Entry modal */}
    {quickEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm flex flex-col gap-5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold dark:text-white">Quick Entry</h2>
              <button
                type="button"
                aria-label="Close Quick Entry"
                onClick={() => { setQuickEntryOpen(false); setTextareaValue(''); setNumpadValue(''); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Multi-line list input */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                List — one bib per line or comma-separated
              </label>
              <textarea
                rows={5}
                placeholder="One bib per line…"
                value={textareaValue}
                onChange={e => setTextareaValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.ctrlKey && parsedListBibs.length > 0) {
                    e.preventDefault();
                    onBibEntered(parsedListBibs);
                    setTextareaValue('');
                    setQuickEntryOpen(false);
                  }
                }}
                className={`w-full font-mono resize-none ${inputCls}`}
              />
              <button
                type="button"
                aria-label={`Add ${parsedListBibs.length} bib${parsedListBibs.length === 1 ? '' : 's'}`}
                onClick={() => { onBibEntered(parsedListBibs); setTextareaValue(''); setQuickEntryOpen(false); }}
                disabled={parsedListBibs.length === 0}
                className="mt-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add {parsedListBibs.length} bib{parsedListBibs.length === 1 ? '' : 's'}
              </button>
            </div>

            {/* On-screen numpad */}
            <div>
              <div
                data-testid="numpad-display"
                className="mb-3 h-10 flex items-center justify-end px-4 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-xl font-bold dark:text-white tracking-widest"
              >
                {numpadValue || <span className="text-gray-400 font-normal">—</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6,7,8,9].map(d => (
                  <button
                    key={d}
                    type="button"
                    aria-label={`Digit ${d}`}
                    onClick={() => setNumpadValue(v => v.length < 6 ? v + d : v)}
                    className="py-4 text-xl font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-transform"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Backspace"
                  onClick={() => setNumpadValue(v => v.slice(0, -1))}
                  disabled={!numpadValue}
                  className="py-4 text-xl font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 active:scale-95 transition-transform"
                >
                  ⌫
                </button>
                <button
                  type="button"
                  aria-label="Digit 0"
                  onClick={() => setNumpadValue(v => v.length < 6 ? v + '0' : v)}
                  className="py-4 text-xl font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-transform"
                >
                  0
                </button>
                <button
                  type="button"
                  aria-label="Confirm"
                  onClick={() => {
                    if (!numpadValue) return;
                    const n = parseInt(numpadValue, 10);
                    if (!isNaN(n) && n > 0) {
                      onBibEntered([n]);
                      navigator.vibrate?.(30);
                    }
                    setNumpadValue('');
                  }}
                  disabled={!numpadValue}
                  className="py-4 text-xl font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 active:scale-95 transition-transform"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        </div>
    )}
    </>
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
