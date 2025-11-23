import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge } from '../../design-system/components';
import { 
  categorizeRaces, 
  searchRaces, 
  formatRaceDate,
  getRaceStatus,
  getRaceStatusColor 
} from '../../utils/raceStatistics';

/**
 * RaceSelectionModal Component
 * 
 * Modal dialog for selecting a race before entering a module.
 * Follows Single Responsibility Principle - only handles race selection.
 * Provides search and filtering capabilities.
 * 
 * @component
 * @example
 * <RaceSelectionModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   races={allRaces}
 *   onSelectRace={handleRaceSelect}
 *   moduleType="checkpoint"
 * />
 */
const RaceSelectionModal = ({
  isOpen,
  onClose,
  races = [],
  onSelectRace,
  moduleType = 'module',
  title,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'current', 'upcoming', 'past'

  // Categorize races
  const categorized = useMemo(() => categorizeRaces(races || []), [races]);

  // Apply search filter
  const searchedRaces = useMemo(() => {
    return searchRaces(categorized.all || [], searchQuery);
  }, [categorized.all, searchQuery]);

  // Apply status filter
  const filteredRaces = useMemo(() => {
    if (filterStatus === 'all') return searchedRaces;
    if (filterStatus === 'current') return searchedRaces.filter(r => (categorized.current || []).includes(r));
    if (filterStatus === 'upcoming') return searchedRaces.filter(r => (categorized.upcoming || []).includes(r));
    if (filterStatus === 'past') return searchedRaces.filter(r => (categorized.past || []).includes(r));
    return searchedRaces;
  }, [searchedRaces, filterStatus, categorized]);

  // Handle race selection
  const handleSelect = (race) => {
    onSelectRace(race);
    onClose();
  };

  // Reset filters when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setFilterStatus('all');
    onClose();
  };

  // Get module display name
  const getModuleName = () => {
    const names = {
      checkpoint: 'Checkpoint Operations',
      base_station: 'Base Station Operations',
      race_maintenance: 'Race Maintenance',
    };
    return names[moduleType] || 'Module';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnBackdropClick={true}
      closeOnEsc={true}
    >
      <ModalHeader>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title || `Select Race for ${getModuleName()}`}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose a race to work with in {getModuleName()}
          </p>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Search and Filter Controls */}
        <div className="mb-4 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search races by name or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <FilterButton
              active={filterStatus === 'all'}
              onClick={() => setFilterStatus('all')}
              count={(categorized.all || []).length}
            >
              All Races
            </FilterButton>
            <FilterButton
              active={filterStatus === 'current'}
              onClick={() => setFilterStatus('current')}
              count={(categorized.current || []).length}
              variant="green"
            >
              Current
            </FilterButton>
            <FilterButton
              active={filterStatus === 'upcoming'}
              onClick={() => setFilterStatus('upcoming')}
              count={(categorized.upcoming || []).length}
              variant="blue"
            >
              Upcoming
            </FilterButton>
            <FilterButton
              active={filterStatus === 'past'}
              onClick={() => setFilterStatus('past')}
              count={(categorized.past || []).length}
              variant="gray"
            >
              Past
            </FilterButton>
          </div>
        </div>

        {/* Race List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredRaces.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No races found matching your search' : 'No races available'}
              </p>
            </div>
          ) : (
            filteredRaces.map((race) => (
              <RaceListItem
                key={race.id}
                race={race}
                onSelect={() => handleSelect(race)}
              />
            ))
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

/**
 * FilterButton Component
 * Internal component for filter buttons
 */
const FilterButton = ({ active, onClick, count, variant = 'default', children }) => {
  const variantStyles = {
    default: active 
      ? 'bg-navy-600 text-white' 
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
    green: active
      ? 'bg-green-600 text-white'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
    blue: active
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
    gray: active
      ? 'bg-gray-600 text-white'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200
        ${variantStyles[variant]}
      `}
    >
      {children}
      {count !== undefined && (
        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
          {count}
        </span>
      )}
    </button>
  );
};

/**
 * RaceListItem Component
 * Internal component for individual race items in the list
 */
const RaceListItem = ({ race, onSelect }) => {
  const status = getRaceStatus(race);
  const statusColor = getRaceStatusColor(race);

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-navy-500 dark:hover:border-navy-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-navy-600 dark:group-hover:text-navy-400">
              {race.name}
            </h3>
            <Badge className={statusColor}>
              {status}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
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
        </div>
        <div className="ml-4 flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-navy-600 dark:group-hover:text-navy-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </button>
  );
};

RaceSelectionModal.propTypes = {
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,

  /** Callback when modal should close */
  onClose: PropTypes.func.isRequired,

  /** Array of race objects to display */
  races: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      startTime: PropTypes.string,
    })
  ).isRequired,

  /** Callback when a race is selected */
  onSelectRace: PropTypes.func.isRequired,

  /** Type of module requesting race selection */
  moduleType: PropTypes.oneOf(['checkpoint', 'base-station', 'race-maintenance']),

  /** Optional custom title */
  title: PropTypes.string,
};

FilterButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  count: PropTypes.number,
  variant: PropTypes.oneOf(['default', 'green', 'blue', 'gray']),
  children: PropTypes.node.isRequired,
};

RaceListItem.propTypes = {
  race: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    startTime: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default RaceSelectionModal;
