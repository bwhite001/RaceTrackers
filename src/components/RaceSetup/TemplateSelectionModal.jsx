import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge, Card } from '../../design-system/components';
import { RaceTemplateService } from '../../services/RaceTemplateService';
import { 
  MapPinIcon, 
  FlagIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

/**
 * TemplateSelectionModal Component
 * 
 * Modal dialog for selecting a race template or creating from scratch.
 * Displays all available templates in a grid layout with search and filter capabilities.
 * 
 * Features:
 * - Grid layout of template cards
 * - Search by name, location, or event type
 * - Filter by event type
 * - Template preview on hover
 * - "Create from Scratch" option
 * - Responsive design (mobile-friendly)
 * - Dark mode support
 * - Accessibility compliant
 * 
 * @component
 * @example
 * <TemplateSelectionModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSelectTemplate={handleTemplateSelect}
 *   onCreateFromScratch={handleCreateFromScratch}
 * />
 */
const TemplateSelectionModal = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateFromScratch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEventType, setFilterEventType] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load all templates
  const allTemplates = useMemo(() => {
    return RaceTemplateService.getAllTemplates();
  }, []);

  // Get unique event types for filter
  const eventTypes = useMemo(() => {
    const types = new Set(allTemplates.map(t => t.eventType));
    return ['all', ...Array.from(types)];
  }, [allTemplates]);

  // Apply search filter
  const searchedTemplates = useMemo(() => {
    if (!searchQuery.trim()) return allTemplates;
    return RaceTemplateService.searchTemplates(searchQuery);
  }, [allTemplates, searchQuery]);

  // Apply event type filter
  const filteredTemplates = useMemo(() => {
    if (filterEventType === 'all') return searchedTemplates;
    return searchedTemplates.filter(t => t.eventType === filterEventType);
  }, [searchedTemplates, filterEventType]);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    handleClose();
  };

  // Handle create from scratch
  const handleCreateFromScratch = () => {
    onCreateFromScratch();
    handleClose();
  };

  // Handle template preview
  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setFilterEventType('all');
    setSelectedTemplate(null);
    setShowPreview(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showPreview}
        onClose={handleClose}
        size="xl"
        closeOnBackdropClick={true}
        closeOnEsc={true}
      >
        <ModalHeader>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Race
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a template to get started quickly, or create from scratch
            </p>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search templates by name, location, or event type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <FilterButton
                  key={type}
                  active={filterEventType === type}
                  onClick={() => setFilterEventType(type)}
                >
                  {type === 'all' ? 'All Templates' : type}
                </FilterButton>
              ))}
            </div>
          </div>

          {/* Template Grid */}
          <div className="space-y-4">
            {/* Create from Scratch Card */}
            <CreateFromScratchCard onClick={handleCreateFromScratch} />

            {/* Template Cards */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FlagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'No templates found matching your search' : 'No templates available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelectTemplate(template)}
                    onPreview={() => handlePreviewTemplate(template)}
                  />
                ))}
              </div>
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

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
          onSelect={() => handleSelectTemplate(selectedTemplate)}
        />
      )}
    </>
  );
};

/**
 * FilterButton Component
 * Internal component for event type filter buttons
 */
const FilterButton = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
        ${active
          ? 'bg-navy-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }
      `}
    >
      {children}
    </button>
  );
};

/**
 * CreateFromScratchCard Component
 * Special card for creating a race from scratch
 */
const CreateFromScratchCard = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-navy-500 dark:hover:border-navy-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-navy-100 dark:bg-navy-900 flex items-center justify-center group-hover:bg-navy-200 dark:group-hover:bg-navy-800 transition-colors">
            <PlusIcon className="w-6 h-6 text-navy-600 dark:text-navy-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-navy-600 dark:group-hover:text-navy-400">
              Create from Scratch
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manually configure all race details and checkpoints
            </p>
          </div>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-navy-600 dark:group-hover:text-navy-400" />
      </div>
    </button>
  );
};

/**
 * TemplateCard Component
 * Card displaying template information
 */
const TemplateCard = ({ template, onSelect, onPreview }) => {
  const stats = RaceTemplateService.getTemplateStatistics(template);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      <div onClick={onSelect} className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-navy-600 dark:group-hover:text-navy-400 mb-1">
              {template.name}
            </h3>
            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {template.eventType}
            </Badge>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-navy-600 dark:group-hover:text-navy-400 flex-shrink-0 ml-2" />
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Statistics */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FlagIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{stats.checkpointCount} Checkpoints</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Runners: {template.defaultRunnerRangeStart}-{template.defaultRunnerRangeEnd}</span>
          </div>
          {template.metadata?.baseLocation && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{template.metadata.baseLocation}</span>
            </div>
          )}
        </div>

        {/* Preview Button */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="text-sm text-navy-600 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300 font-medium"
          >
            View Details →
          </button>
        </div>
      </div>
    </Card>
  );
};

/**
 * TemplatePreviewModal Component
 * Detailed preview of a template
 */
const TemplatePreviewModal = ({ template, onClose, onSelect }) => {
  const preview = RaceTemplateService.getTemplatePreview(template);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      closeOnBackdropClick={true}
      closeOnEsc={true}
    >
      <ModalHeader>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {template.name}
          </h2>
          <Badge className="mt-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {template.eventType}
          </Badge>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Description */}
          {template.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </div>
          )}

          {/* Race Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Race Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Time</p>
                <p className="text-sm text-gray-900 dark:text-white">{preview.startTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Runner Range</p>
                <p className="text-sm text-gray-900 dark:text-white">{preview.runnerRange}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Checkpoints</p>
                <p className="text-sm text-gray-900 dark:text-white">{preview.checkpointCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Organizer</p>
                <p className="text-sm text-gray-900 dark:text-white">{preview.organizer}</p>
              </div>
            </div>
          </div>

          {/* Base Location */}
          {preview.baseLocation && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Base Location
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {preview.baseLocation}
              </p>
            </div>
          )}

          {/* Checkpoints */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Checkpoints ({preview.checkpointCount})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {preview.checkpointNames.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-900 flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-navy-600 dark:text-navy-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Dates */}
          {preview.historicalDates && preview.historicalDates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Previous Events
              </h3>
              <div className="flex flex-wrap gap-2">
                {preview.historicalDates.map((date, index) => (
                  <Badge
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {new Date(date).toLocaleDateString()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button variant="primary" onClick={onSelect}>
            Use This Template
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

// PropTypes
TemplateSelectionModal.propTypes = {
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,

  /** Callback when modal should close */
  onClose: PropTypes.func.isRequired,

  /** Callback when a template is selected */
  onSelectTemplate: PropTypes.func.isRequired,

  /** Callback when "Create from Scratch" is selected */
  onCreateFromScratch: PropTypes.func.isRequired,
};

FilterButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

CreateFromScratchCard.propTypes = {
  onClick: PropTypes.func.isRequired,
};

TemplateCard.propTypes = {
  template: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
};

TemplatePreviewModal.propTypes = {
  template: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default TemplateSelectionModal;
