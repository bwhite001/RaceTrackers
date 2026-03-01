import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, Badge } from '../design-system/components';
import ImportExportModal from '../components/ImportExport/ImportExportModal';
import { useRaceStore } from '../store/useRaceStore';
import useNavigationStore from '../shared/store/navigationStore';
import { useToast } from '../shared/components/ui/Toast';
import {
  formatRaceDate,
  getRaceStatus,
  getRaceStatusColor,
  searchRaces,
  categorizeRaces,
  getRunnerRange,
} from '../utils/raceStatistics';

/**
 * RaceManagementView Component
 * 
 * Comprehensive race management interface.
 * Follows Single Responsibility Principle - manages race CRUD operations.
 * 
 * @component
 */
const RaceManagementView = () => {
  const navigate = useNavigate();
  const { getAllRaces, deleteRace, setSelectedRaceForMode, loadRace } = useRaceStore();
  const { endOperation } = useNavigationStore();
  const { addToast } = useToast();

  const [races, setRaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, name-asc, name-desc
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load races on mount
  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    setIsLoading(true);
    try {
      const allRaces = await getAllRaces();
      setRaces(allRaces || []);
    } catch (error) {
      console.error('Failed to load races:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort races
  const filteredAndSortedRaces = useMemo(() => {
    let result = [...races];

    // Apply search
    result = searchRaces(result, searchQuery);

    // Apply status filter
    if (filterStatus !== 'all') {
      const categorized = categorizeRaces(result);
      if (filterStatus === 'current') result = categorized.current;
      else if (filterStatus === 'upcoming') result = categorized.upcoming;
      else if (filterStatus === 'past') result = result.filter(r => 
        !categorized.current.includes(r) && !categorized.upcoming.includes(r)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [races, searchQuery, filterStatus, sortBy]);

  // Handle race actions
  const handleCreateNew = () => {
    navigate('/race-maintenance/setup');
  };

  const handleEditRace = (race) => {
    setSelectedRaceForMode(race.id);
    navigate('/race-maintenance/setup');
  };

  const handleViewRace = async (race) => {
    setSelectedRaceForMode(race.id);
    await loadRace(race.id);
    navigate('/race-maintenance/overview');
  };

  const handleDuplicateRace = async (race) => {
    const newName = prompt(`Enter name for duplicated race:`, `${race.name} (Copy)`);
    if (!newName) return;

    try {
      // Export the race configuration
      const StorageService = (await import('../services/storage.js')).default;
      const exportData = await StorageService.exportRaceConfig(race.id);
      
      // Modify the export data
      exportData.race.name = newName;
      exportData.race.date = new Date().toISOString().split('T')[0]; // Today's date
      delete exportData.race.id; // Remove ID so a new one is created
      
      // Import as new race
      const newRaceId = await StorageService.importRaceConfig(exportData);
      
      // Reload races
      await loadRaces();
      
      addToast({ variant: "success", message: `Race "${newName}" created successfully!` });
    } catch (error) {
      console.error('Failed to duplicate race:', error);
      addToast({ variant: "error", message: "Failed to duplicate race. Please try again." });
    }
  };

  const handleDeleteRace = (race) => {
    setSelectedRace(race);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedRace) return;

    try {
      await deleteRace(selectedRace.id);
      await loadRaces();
      setShowDeleteConfirm(false);
      setSelectedRace(null);
    } catch (error) {
      console.error('Failed to delete race:', error);
      addToast({ variant: "error", message: "Failed to delete race. Please try again." });
    }
  };

  const handleExportRace = async (race) => {
    try {
      const StorageService = (await import('../services/storage.js')).default;
      const exportData = await StorageService.exportRaceConfig(race.id);
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${race.name.replace(/\s+/g, '_')}_${race.date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export race:', error);
      addToast({ variant: "error", message: "Failed to export race. Please try again." });
    }
  };

  const handleBackToHome = () => {
    endOperation();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading races...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Race Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all your races - create, edit, duplicate, and export
            </p>
          </div>
          <Button variant="secondary" onClick={handleBackToHome}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleCreateNew}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Race
          </Button>
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Import Race
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card variant="elevated" className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search races..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
            </div>

            {/* Filter and Sort */}
            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                <option value="all">All Status</option>
                <option value="current">Current</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Race List */}
      {filteredAndSortedRaces.length === 0 ? (
        <Card variant="elevated">
          <CardBody>
            <div className="text-center py-12">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {searchQuery || filterStatus !== 'all' ? 'No races found' : 'No races yet'}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by creating your first race'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <div className="mt-6">
                  <Button variant="primary" onClick={handleCreateNew}>
                    Create New Race
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedRaces.map((race) => (
            <RaceListItem
              key={race.id}
              race={race}
              onView={() => handleViewRace(race)}
              onEdit={() => handleEditRace(race)}
              onDuplicate={() => handleDuplicateRace(race)}
              onExport={() => handleExportRace(race)}
              onDelete={() => handleDeleteRace(race)}
            />
          ))}
        </div>
      )}

      {/* Import Modal */}
      <ImportExportModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          loadRaces();
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedRace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                Delete Race
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "<strong>{selectedRace.name}</strong>"? 
              This action cannot be undone and will permanently delete all race data including runners, checkpoints, and timing information.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedRace(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                Delete Race
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * RaceListItem Component
 * Internal component for individual race items
 */
const RaceListItem = ({ race, onView, onEdit, onDuplicate, onExport, onDelete }) => {
  const status = getRaceStatus(race);
  const statusColor = getRaceStatusColor(race);
  const runnerRange = getRunnerRange(race);

  return (
    <Card variant="elevated" hoverable>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {race.name}
              </h3>
              <Badge className={statusColor}>
                {status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Runners: {runnerRange}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ml-4 flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={onView}
              className="text-sm"
            >
              View
            </Button>
            <Button
              variant="secondary"
              onClick={onEdit}
              className="text-sm"
            >
              Edit
            </Button>
            
            {/* Dropdown Menu */}
            <div className="relative group">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {/* Dropdown Menu Items */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button
                  onClick={onDuplicate}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                    <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                  </svg>
                  Duplicate
                </button>
                <button
                  onClick={onExport}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export
                </button>
                <button
                  onClick={onDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default RaceManagementView;
