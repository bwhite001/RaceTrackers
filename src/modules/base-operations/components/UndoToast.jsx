import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const DURATION_MS = 10_000;

const UndoToast = ({ count, onUndo, onDismiss }) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 100 >= DURATION_MS) {
          clearInterval(intervalRef.current);
          onDismiss();
          return DURATION_MS;
        }
        return prev + 100;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [onDismiss]);

  const pct = Math.min(100, (elapsed / DURATION_MS) * 100);

  return (
    <div
      role="status"
      className="relative flex items-center justify-between gap-3 px-4 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg shadow-lg text-sm overflow-hidden"
    >
      <span>Batch submitted ({count} runner{count === 1 ? '' : 's'})</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          className="px-3 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded transition-colors"
        >
          Undo
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="text-gray-400 hover:text-white leading-none"
        >
          ×
        </button>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-amber-400 rounded-b-lg"
        style={{ width: `${100 - pct}%` }}
      />
    </div>
  );
};

UndoToast.propTypes = {
  count:     PropTypes.number.isRequired,
  onUndo:    PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default UndoToast;
