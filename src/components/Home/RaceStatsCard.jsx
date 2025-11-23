import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, Button, Badge } from '../../design-system/components';
import { 
  formatRaceDate, 
  getRaceStatus, 
  getRaceStatusColor,
  getRunnerRange,
  getRaceProgress 
} from '../../utils/raceStatistics';

/**
 * RaceStatsCard Component
 * 
 * Displays race information and statistics in a card format.
 * Follows Single Responsibility Principle - only displays race data.
 * Reusable across different contexts (current, upcoming, past races).
 * 
 * @component
 * @example
 * <RaceStatsCard
 *   race={raceObject}
 *   runners={runnersArray}
 *   variant="current"
 *   onSelect={() => handleSelect(race.id)}
 *   onManage={() => handleManage(race.id)}
 * />
 */
const RaceStatsCard = ({
  race,
  runners = [],
  variant = 'default',
  onSelect,
  onManage,
  showActions = true,
  showProgress = true,
  className = '',
}) => {
  if (!race) return null;

  const status = getRaceStatus(race);
  const statusColor = getRaceStatusColor(race);
  const progress = getRaceProgress(race, runners);
  const runnerRange = getRunnerRange(race);

  // Variant-specific styling
  const variantStyles = {
    current: 'border-l-4 border-green-500',
    upcoming: 'border-l-4 border-blue-500',
    past: 'border-l-4 border-gray-400',
    default: '',
  };

  const variantIcons = {
    current: (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    upcoming: (
      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    past: (
      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    default: null,
  };

  return (
    <Card
      variant="elevated"
      hoverable={showActions}
      className={`${variantStyles[variant]} ${className}`}
    >
      <CardHeader
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {variantIcons[variant]}
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {race.name}
              </span>
            </div>
            <Badge className={statusColor}>
              {status}
            </Badge>
          </div>
        }
        subtitle={
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {formatRaceDate(race.date, { includeDay: true })}
            </span>
            {race.startTime && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {race.startTime}
              </span>
            )}
          </div>
        }
      />

      <CardBody>
        {/* Runner Information */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Runner Range
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {runnerRange}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Total Runners
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {progress.total}
            </div>
          </div>
        </div>

        {/* Progress Bar (only for current/active races) */}
        {showProgress && progress.total > 0 && variant === 'current' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {progress.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>{progress.completed} completed</span>
              <span>{progress.active} active</span>
              <span>{progress.notStarted} not started</span>
            </div>
          </div>
        )}

        {/* Statistics Grid (for past races) */}
        {variant === 'past' && progress.total > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400">Finished</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {runners.filter(r => r.status === 'finished').length}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400">DNF</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {runners.filter(r => r.status === 'dnf').length}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
              <div className="text-xs text-gray-600 dark:text-gray-400">DNS</div>
              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {runners.filter(r => r.status === 'dns').length}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-2">
            {onSelect && (
              <Button
                variant="primary"
                onClick={() => onSelect(race)}
                className="flex-1"
              >
                {variant === 'current' ? 'Continue Race' : 'Select Race'}
              </Button>
            )}
            {onManage && (
              <Button
                variant="secondary"
                onClick={() => onManage(race)}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

RaceStatsCard.propTypes = {
  /** Race object with id, name, date, startTime, etc. */
  race: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    startTime: PropTypes.string,
    minRunner: PropTypes.number,
    maxRunner: PropTypes.number,
    runnerRanges: PropTypes.array,
  }).isRequired,

  /** Array of runner objects for progress calculation */
  runners: PropTypes.arrayOf(
    PropTypes.shape({
      number: PropTypes.number,
      status: PropTypes.string,
    })
  ),

  /** Visual variant of the card */
  variant: PropTypes.oneOf(['current', 'upcoming', 'past', 'default']),

  /** Callback when select button is clicked */
  onSelect: PropTypes.func,

  /** Callback when manage button is clicked */
  onManage: PropTypes.func,

  /** Whether to show action buttons */
  showActions: PropTypes.bool,

  /** Whether to show progress information */
  showProgress: PropTypes.bool,

  /** Additional CSS classes */
  className: PropTypes.string,
};

export default RaceStatsCard;
