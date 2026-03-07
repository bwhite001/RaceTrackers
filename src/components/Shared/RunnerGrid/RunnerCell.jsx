import React from 'react';
import { RUNNER_STATUSES } from '../../../types/index.js';
import TimeUtils from '../../../services/timeUtils.js';

const STATUS_CLASSES = {
  [RUNNER_STATUSES.CALLED_IN]:   'status-called-in',
  [RUNNER_STATUSES.MARKED_OFF]:  'status-marked-off',
  [RUNNER_STATUSES.PASSED]:      'status-passed',
  [RUNNER_STATUSES.NON_STARTER]: 'status-non-starter',
  [RUNNER_STATUSES.DNF]:         'status-dnf',
  [RUNNER_STATUSES.PENDING]:     'status-pending',
};

const getStatusClass = (status) => STATUS_CLASSES[status] ?? 'status-not-started';

const RunnerCell = ({ runner, isLoading = false, onMark, onUnmark }) => {
  const isLocked = runner.calledIn === true;
  const isDisabled = isLoading || isLocked;

  const handleClick = () => {
    if (!isDisabled && onMark) onMark(runner.number);
  };

  const handleDoubleClick = () => {
    if (!isLocked && onUnmark) onUnmark(runner.number);
  };

  return (
    <button
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      disabled={isDisabled}
      className={[
        'relative flex flex-col items-center justify-center',
        'aspect-square rounded-lg border-2 font-medium',
        'active:scale-95 transition-transform duration-75',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80',
        isLoading && !isLocked ? 'opacity-50 cursor-wait' : '',
        getStatusClass(runner.status),
      ].filter(Boolean).join(' ')}
      title={`Runner ${runner.number} — ${runner.status.replace(/-/g, ' ')}${isLocked ? ' (locked — called in)' : ' — double-click to uncheck'}`}
      aria-label={`Runner ${runner.number}, status: ${runner.status}`}
    >
      {runner.passedPrimary && !isLocked && (
    <span data-testid="cell-passed-primary" className="absolute top-0.5 left-0.5 text-[8px] leading-none" aria-hidden="true" title="Passed linked checkpoint">⭐</span>
  )}
  {isLocked && (
        <span data-testid="cell-locked" className="absolute top-0.5 right-0.5 text-[8px] leading-none opacity-70" aria-hidden="true">
          🔒
        </span>
      )}
      <span className="font-bold text-base leading-none">{runner.number}</span>
      {runner.recordedTime && (
        <span data-testid="cell-time" className="text-[10px] leading-none mt-0.5 opacity-80">
          {TimeUtils.formatTime(runner.recordedTime, 'HH:mm')}
        </span>
      )}
    </button>
  );
};

export default RunnerCell;
