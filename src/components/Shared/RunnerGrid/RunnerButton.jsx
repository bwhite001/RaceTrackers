import React from 'react';
import { PhoneIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/solid';
import { RUNNER_STATUSES } from '../../../types/index.js';
import TimeUtils from '../../../services/timeUtils.js';

const StatusIcon = ({ status }) => {
  switch (status) {
    case RUNNER_STATUSES.CALLED_IN:
      return <PhoneIcon className="w-3.5 h-3.5" />;
    case RUNNER_STATUSES.MARKED_OFF:
      return <CheckIcon className="w-3.5 h-3.5" />;
    case RUNNER_STATUSES.PASSED:
      return <CheckIcon className="w-3.5 h-3.5" />;
    case RUNNER_STATUSES.DNF:
      return <XMarkIcon className="w-3.5 h-3.5" />;
    case RUNNER_STATUSES.NON_STARTER:
      return <XMarkIcon className="w-3.5 h-3.5" />;
    default:
      return <ClockIcon className="w-3.5 h-3.5" />;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case RUNNER_STATUSES.CALLED_IN:  return 'status-called-in';
    case RUNNER_STATUSES.MARKED_OFF: return 'status-marked-off';
    case RUNNER_STATUSES.PASSED:     return 'status-passed';
    case RUNNER_STATUSES.DNF:        return 'status-dnf';
    case RUNNER_STATUSES.NON_STARTER:return 'status-non-starter';
    default:                         return 'status-not-started';
  }
};

const RunnerButton = ({ 
  runner, 
  viewMode, 
  workflowMode, 
  isLoading, 
  onRunnerClick, 
  showMultipleTimes 
}) => {
  const baseClass = [
    'runner-button flex items-center justify-center',
    'text-sm font-medium rounded-lg border-2',
    'focus-visible:focus',
    // outdoor touch targets — 56px on mobile, 44px on sm+
    'min-h-[56px] min-w-[56px] sm:min-h-[44px] sm:min-w-[44px]',
    // tap feedback
    'active:scale-95 transition-transform duration-75',
    isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:opacity-85',
    getStatusClass(runner.status),
    viewMode === 'list' ? 'w-full px-3 py-2' : 'w-full p-1',
  ].filter(Boolean).join(' ');

  const timeDisplay = showMultipleTimes ? (
    <div className="text-xs mt-1 opacity-90 space-y-0.5">
      {runner.callInTime && (
        <div className="flex items-center gap-0.5">
          <PhoneIcon className="w-3 h-3 shrink-0" />
          <span>{TimeUtils.formatTime(runner.callInTime, 'HH:mm')}</span>
        </div>
      )}
      {runner.markOffTime && (
        <div className="flex items-center gap-0.5">
          <CheckIcon className="w-3 h-3 shrink-0" />
          <span>{TimeUtils.formatTime(runner.markOffTime, 'HH:mm')}</span>
        </div>
      )}
    </div>
  ) : (runner.callInTime || runner.markOffTime) ? (
    <div className="text-xs mt-1 opacity-90">
      {TimeUtils.formatTime(runner.callInTime || runner.markOffTime, 'HH:mm')}
    </div>
  ) : null;

  const handleClick = () => {
    if (!isLoading && onRunnerClick) {
      onRunnerClick(runner);
    }
  };

  if (viewMode === 'list') {
    return (
      <button
        className={baseClass}
        onClick={handleClick}
        aria-label={`Runner ${runner.number}, status: ${runner.status}`}
        disabled={isLoading}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-start">
            <span className="font-bold">{runner.number}</span>
            {timeDisplay}
          </div>
          <div className="text-xs opacity-75 ml-2">
            <StatusIcon status={runner.status} />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      className={baseClass}
      onClick={handleClick}
      aria-label={`Runner ${runner.number}, status: ${runner.status}`}
      disabled={isLoading}
    >
      <div className="flex flex-col items-center">
        <span className="font-bold">{runner.number}</span>
        {timeDisplay}
      </div>
    </button>
  );
};

export default RunnerButton;
