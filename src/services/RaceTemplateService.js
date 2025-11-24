/**
 * Race Template Service
 * 
 * Service for managing file-based race templates.
 * Templates are static JavaScript modules that are version-controlled with the codebase.
 * 
 * This service provides methods to:
 * - Access templates
 * - Create races from templates
 * - Export templates for sharing
 * - Validate template structure
 */

import { 
  templates, 
  getTemplateById, 
  getTemplateByName,
  getAllTemplates as getAll,
  getTemplatesByEventType,
  validateTemplate 
} from '../data/templates/index.js';
import StorageService from './storage.js';

export class RaceTemplateService {
  /**
   * Get all available templates
   * @returns {Array<Object>} Array of all templates
   */
  static getAllTemplates() {
    return getAll();
  }

  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {Object|null} Template object or null if not found
   */
  static getTemplateById(id) {
    return getTemplateById(id);
  }

  /**
   * Get template by name
   * @param {string} name - Template name
   * @returns {Object|null} Template object or null if not found
   */
  static getTemplateByName(name) {
    return getTemplateByName(name);
  }

  /**
   * Get templates by event type
   * @param {string} eventType - Event type to filter by
   * @returns {Array<Object>} Array of matching templates
   */
  static getTemplatesByEventType(eventType) {
    return getTemplatesByEventType(eventType);
  }

  /**
   * Create a race from a template
   * @param {Object} template - Template object
   * @param {Object} overrides - Override values for race configuration
   * @param {string} overrides.raceName - Custom race name (defaults to template name + year)
   * @param {string} overrides.raceDate - Race date (YYYY-MM-DD)
   * @param {string} overrides.startTime - Start time (HH:MM:SS)
   * @param {number} overrides.runnerRangeStart - Starting runner number
   * @param {number} overrides.runnerRangeEnd - Ending runner number
   * @param {Array} overrides.checkpointModifications - Array of checkpoint modifications
   * @returns {Promise<number>} Race ID of created race
   */
  static async createRaceFromTemplate(template, overrides = {}) {
    try {
      // Validate template
      const validation = validateTemplate(template);
      if (!validation.isValid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }

      // Build race name with current year if not provided
      const currentYear = new Date().getFullYear();
      const raceName = overrides.raceName || `${template.name} ${currentYear}`;

      // Build race configuration
      const raceConfig = {
        name: raceName,
        date: overrides.raceDate || new Date().toISOString().split('T')[0],
        startTime: overrides.startTime || template.defaultStartTime,
        minRunner: overrides.runnerRangeStart || template.defaultRunnerRangeStart,
        maxRunner: overrides.runnerRangeEnd || template.defaultRunnerRangeEnd,
        runnerRanges: [
          {
            min: overrides.runnerRangeStart || template.defaultRunnerRangeStart,
            max: overrides.runnerRangeEnd || template.defaultRunnerRangeEnd,
            isIndividual: false
          }
        ],
        checkpoints: this._buildCheckpoints(template, overrides.checkpointModifications),
        metadata: {
          ...template.metadata,
          templateId: template.id,
          templateName: template.name,
          templateVersion: template.version,
          createdFromTemplate: true,
          createdAt: new Date().toISOString()
        }
      };

      // Save race using StorageService
      const raceId = await StorageService.saveRace(raceConfig);

      return raceId;
    } catch (error) {
      console.error('Error creating race from template:', error);
      throw new Error(`Failed to create race from template: ${error.message}`);
    }
  }

  /**
   * Build checkpoints array with optional modifications
   * @private
   * @param {Object} template - Template object
   * @param {Array} modifications - Array of checkpoint modifications
   * @returns {Array} Array of checkpoint configurations
   */
  static _buildCheckpoints(template, modifications = []) {
    return template.checkpoints.map((checkpoint, index) => {
      const modification = modifications[index] || {};
      
      return {
        number: checkpoint.number,
        name: modification.name || checkpoint.name,
        location: modification.location || checkpoint.location,
        orderSequence: checkpoint.orderSequence,
        metadata: {
          ...checkpoint.metadata,
          ...modification.metadata
        }
      };
    });
  }

  /**
   * Export template as JSON string
   * @param {Object} template - Template to export
   * @returns {string} JSON string of template
   */
  static exportTemplateAsJSON(template) {
    try {
      return JSON.stringify(template, null, 2);
    } catch (error) {
      console.error('Error exporting template:', error);
      throw new Error('Failed to export template as JSON');
    }
  }

  /**
   * Export template as downloadable file
   * @param {Object} template - Template to export
   * @returns {Object} Object with content, filename, and mimeType
   */
  static exportTemplateAsFile(template) {
    try {
      const json = this.exportTemplateAsJSON(template);
      const filename = `${template.id}-template.json`;
      
      return {
        content: json,
        filename,
        mimeType: 'application/json'
      };
    } catch (error) {
      console.error('Error exporting template as file:', error);
      throw new Error('Failed to export template as file');
    }
  }

  /**
   * Validate template structure
   * @param {Object} template - Template to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateTemplate(template) {
    return validateTemplate(template);
  }

  /**
   * Get template statistics
   * @param {Object} template - Template object
   * @returns {Object} Statistics about the template
   */
  static getTemplateStatistics(template) {
    return {
      id: template.id,
      name: template.name,
      eventType: template.eventType,
      checkpointCount: template.checkpoints.length,
      defaultRunnerCount: template.defaultRunnerRangeEnd - template.defaultRunnerRangeStart + 1,
      hasMetadata: !!template.metadata,
      hasOperators: template.checkpoints.some(cp => cp.metadata?.operators?.length > 0),
      hasGPSCoordinates: template.checkpoints.every(cp => !!cp.location),
      version: template.version,
      lastUpdated: template.lastUpdated
    };
  }

  /**
   * Compare two templates
   * @param {Object} template1 - First template
   * @param {Object} template2 - Second template
   * @returns {Object} Comparison result
   */
  static compareTemplates(template1, template2) {
    return {
      sameName: template1.name === template2.name,
      sameEventType: template1.eventType === template2.eventType,
      sameCheckpointCount: template1.checkpoints.length === template2.checkpoints.length,
      sameRunnerRange: 
        template1.defaultRunnerRangeStart === template2.defaultRunnerRangeStart &&
        template1.defaultRunnerRangeEnd === template2.defaultRunnerRangeEnd,
      checkpointDifferences: this._compareCheckpoints(template1.checkpoints, template2.checkpoints)
    };
  }

  /**
   * Compare checkpoints between templates
   * @private
   * @param {Array} checkpoints1 - First template's checkpoints
   * @param {Array} checkpoints2 - Second template's checkpoints
   * @returns {Array} Array of differences
   */
  static _compareCheckpoints(checkpoints1, checkpoints2) {
    const differences = [];
    const maxLength = Math.max(checkpoints1.length, checkpoints2.length);

    for (let i = 0; i < maxLength; i++) {
      const cp1 = checkpoints1[i];
      const cp2 = checkpoints2[i];

      if (!cp1) {
        differences.push({ index: i, type: 'missing_in_first', checkpoint: cp2 });
      } else if (!cp2) {
        differences.push({ index: i, type: 'missing_in_second', checkpoint: cp1 });
      } else if (cp1.name !== cp2.name || cp1.location !== cp2.location) {
        differences.push({ 
          index: i, 
          type: 'different', 
          checkpoint1: cp1, 
          checkpoint2: cp2 
        });
      }
    }

    return differences;
  }

  /**
   * Get template preview data (for UI display)
   * @param {Object} template - Template object
   * @returns {Object} Preview data
   */
  static getTemplatePreview(template) {
    return {
      id: template.id,
      name: template.name,
      eventType: template.eventType,
      description: template.description,
      checkpointCount: template.checkpoints.length,
      runnerRange: `${template.defaultRunnerRangeStart}-${template.defaultRunnerRangeEnd}`,
      startTime: template.defaultStartTime,
      baseLocation: template.metadata?.baseLocation,
      organizer: template.metadata?.organizer,
      historicalDates: template.metadata?.historicalDates || [],
      checkpointNames: template.checkpoints.map(cp => cp.name)
    };
  }

  /**
   * Search templates by keyword
   * @param {string} keyword - Search keyword
   * @returns {Array<Object>} Array of matching templates
   */
  static searchTemplates(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerKeyword) ||
      template.description?.toLowerCase().includes(lowerKeyword) ||
      template.eventType.toLowerCase().includes(lowerKeyword) ||
      template.metadata?.baseLocation?.toLowerCase().includes(lowerKeyword)
    );
  }
}

export default RaceTemplateService;
