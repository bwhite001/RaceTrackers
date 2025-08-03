import React, { useState, useMemo } from 'react';
import { useRaceStore } from '../../store/useRaceStore.js';
import TimeUtils from '../../services/timeUtils.js';
import { SEGMENT_DURATION_MINUTES } from '../../types/index.js';

const CalloutSheet = () => {
  const { 
    getTimeSegments, 
    markSegmentCalled, 
    isLoading,
    raceConfig 
  } = useRaceStore();

  const [callingSegment, setCallingSegment] = useState(null);

  const segments = useMemo(() => {
    return getTimeSegments();
  }, [getTimeSegments]);

  const handleMarkCalled = async (segment) => {
    if (segment.called || callingSegment === segment.startTime) return;

    setCallingSegment(segment.startTime);
    try {
      await markSegmentCalled(segment.startTime, segment.endTime);
    } catch (error) {
      console.error('Failed to mark segment as called:', error);
    } finally {
      setCallingSegment(null);
    }
  };

  const getSegmentLabel = (startTime, endTime) => {
    const start = TimeUtils.formatTime(startTime, 'HH:mm');
    const end = TimeUtils.formatTime(endTime, 'HH:mm');
    return `${start} - ${end}`;
  };

  const getRaceElapsedTime = (timestamp) => {
    if (!raceConfig) return '';
    
    const raceStart = TimeUtils.createRaceTimestamp(raceConfig.date, raceConfig.startTime);
    return TimeUtils.formatDuration(raceStart, timestamp);
  };

  const getSegmentStats = (segment) => {
    const runnerCount = segment.runners.length;
    const runnerNumbers = segment.runners
      .map(r => r.number)
      .sort((a, b) => a - b);
    
    return { runnerCount, runnerNumbers };
  };

  const formatRunnerList = (runners) => {
    const numbers = runners.map(r => r.number).sort((a, b) => a - b);
    
    // Group consecutive numbers for compact display
    const groups = [];
    let start = numbers[0];
    let end = numbers[0];
    
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === end + 1) {
        end = numbers[i];
      } else {
        if (start === end) {
          groups.push(start.toString());
        } else if (end === start + 1) {
          groups.push(`${start}, ${end}`);
        } else {
          groups.push(`${start}-${end}`);
        }
        start = end = numbers[i];
      }
    }
    
    // Add the last group
    if (numbers.length > 0) {
      if (start === end) {
        groups.push(start.toString());
      } else if (end === start + 1) {
        groups.push(`${start}, ${end}`);
      } else {
        groups.push(`${start}-${end}`);
      }
    }
    
    return groups.join(', ');
  };

  const uncalledSegments = segments.filter(segment => !segment.called);
  const calledSegments = segments.filter(segment => segment.called);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Callout Sheet
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {SEGMENT_DURATION_MINUTES}-minute segments
        </div>
      </div>

      {/* Uncalled Segments */}
      {uncalledSegments.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Pending Callouts ({uncalledSegments.length})
          </h4>
          
          <div className="space-y-3">
            {uncalledSegments.map((segment) => {
              const stats = getSegmentStats(segment);
              const isProcessing = callingSegment === segment.startTime;
              
              return (
                <div 
                  key={`${segment.startTime}/${segment.endTime}`}
                  className="card p-4 border-l-4 border-l-orange-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Time Range */}
                      <div className="flex items-center space-x-4 mb-2">
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {getSegmentLabel(segment.startTime, segment.endTime)}
                        </h5>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          +{getRaceElapsedTime(segment.startTime)}
                        </span>
                      </div>
                      
                      {/* Runner Count */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {stats.runnerCount} runner{stats.runnerCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Runner Numbers */}
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Runners: </span>
                        {formatRunnerList(segment.runners)}
                      </div>
                    </div>
                    
                    {/* Call Button */}
                    <button
                      onClick={() => handleMarkCalled(segment)}
                      disabled={isLoading || isProcessing}
                      className="ml-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 spinner"></div>
                          <span>Calling...</span>
                        </div>
                      ) : (
                        'Mark Called'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium mb-2">No pending callouts</p>
            <p className="text-sm">
              Segments will appear here as runners pass through the checkpoint
            </p>
          </div>
        </div>
      )}

      {/* Called Segments History */}
      {calledSegments.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Called Segments ({calledSegments.length})
          </h4>
          
          <div className="space-y-2">
            {calledSegments.map((segment) => {
              const stats = getSegmentStats(segment);
              
              return (
                <div 
                  key={`${segment.startTime}/${segment.endTime}`}
                  className="card p-3 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getSegmentLabel(segment.startTime, segment.endTime)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          +{getRaceElapsedTime(segment.startTime)}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                          {stats.runnerCount} runner{stats.runnerCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {formatRunnerList(segment.runners)}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Callout Instructions
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Segments are automatically created as runners pass through</li>
          <li>• Each segment represents a {SEGMENT_DURATION_MINUTES}-minute time window</li>
          <li>• Click "Mark Called" after reporting the segment to race control</li>
          <li>• Called segments move to the history section below</li>
          <li>• Times shown are both clock time and elapsed race time</li>
        </ul>
      </div>
    </div>
  );
};

export default CalloutSheet;
