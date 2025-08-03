import React from 'react';
import { RUNNER_STATUSES } from '../../../types/index.js';
import TimeUtils from '../../../services/timeUtils.js';

const RunnerButton = ({ 
  runner, 
  viewMode, 
  workflowMode, 
  isLoading, 
  onRunnerClick, 
  showMultipleTimes 
}) => {
  const getRunnerButtonClass = (runner) => {
    const baseClass = 'runner-button flex items-center justify-center text-sm font-medium rounded-lg border-2 focus-visible:focus';
    switch (runner.status) {
      case RUNNER_STATUSES.CALLED_IN:
        return `${baseClass} status-called-in cursor-pointer hover:opacity-80`;
      case RUNNER_STATUSES.MARKED_OFF:
        return `${baseClass} status-marked-off cursor-pointer hover:opacity-80`;
      // ...existing status classes...
    }
  };

  const getRunnerContent = () => {
    const content = (
      <>
        <span className="font-bold">{runner.number}</span>
        {showMultipleTimes && (
          <div className="text-xs mt-1 opacity-90 space-y-0.5">
            {runner.callInTime && (
              <div>📞 {TimeUtils.formatTime(runner.callInTime, 'HH:mm')}</div>
            )}
            {runner.markOffTime && (
              <div>✓ {TimeUtils.formatTime(runner.markOffTime, 'HH:mm')}</div>
            )}
          </div>
        )}
        {/* ...existing time display logic... */}
      </>
    );

    return viewMode === 'list' ? (
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col">{content}</div>
        <div className="text-xs opacity-75">
          {getStatusIcon(runner.status)}
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center">{content}</div>
    );
  };

  // ...rest of the component implementation...
};

export default RunnerButton;
