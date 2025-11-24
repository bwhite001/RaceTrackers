/**
 * Race Templates Index
 * 
 * Central export for all race templates.
 * Templates are file-based and version-controlled with the codebase.
 * 
 * Usage:
 *   import { templates, getTemplateById, getTemplateByName } from '@/data/templates';
 */

import { mtGloriousTemplate } from './mtGloriousTemplate.js';
import { brisbaneTrailMarathon } from './brisbaneTrailMarathon.js';
import { pinnaclesClassic } from './pinnaclesClassic.js';
import { lakeManchesterTrail } from './lakeManchesterTrail.js';

/**
 * All available race templates
 * @type {Array<Object>}
 */
export const templates = [
  mtGloriousTemplate,
  brisbaneTrailMarathon,
  pinnaclesClassic,
  lakeManchesterTrail
];

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplateById(id) {
  return templates.find(template => template.id === id) || null;
}

/**
 * Get template by name
 * @param {string} name - Template name
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplateByName(name) {
  return templates.find(template => template.name === name) || null;
}

/**
 * Get all templates
 * @returns {Array<Object>} Array of all templates
 */
export function getAllTemplates() {
  return [...templates];
}

/**
 * Get templates by event type
 * @param {string} eventType - Event type to filter by
 * @returns {Array<Object>} Array of matching templates
 */
export function getTemplatesByEventType(eventType) {
  return templates.filter(template => template.eventType === eventType);
}

/**
 * Validate template structure
 * @param {Object} template - Template to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTemplate(template) {
  const errors = [];
  
  // Required fields
  if (!template.id) errors.push('Template ID is required');
  if (!template.name) errors.push('Template name is required');
  if (!template.eventType) errors.push('Event type is required');
  if (!template.defaultStartTime) errors.push('Default start time is required');
  if (typeof template.defaultRunnerRangeStart !== 'number') errors.push('Default runner range start must be a number');
  if (typeof template.defaultRunnerRangeEnd !== 'number') errors.push('Default runner range end must be a number');
  
  // Checkpoints validation
  if (!Array.isArray(template.checkpoints) || template.checkpoints.length === 0) {
    errors.push('Template must have at least one checkpoint');
  } else {
    template.checkpoints.forEach((checkpoint, index) => {
      if (typeof checkpoint.number !== 'number') {
        errors.push(`Checkpoint ${index + 1}: number must be a number`);
      }
      if (!checkpoint.name) {
        errors.push(`Checkpoint ${index + 1}: name is required`);
      }
      if (typeof checkpoint.orderSequence !== 'number') {
        errors.push(`Checkpoint ${index + 1}: orderSequence must be a number`);
      }
    });
  }
  
  // Metadata validation
  if (!template.metadata) {
    errors.push('Template metadata is required');
  } else {
    if (!template.metadata.organizer) errors.push('Organizer is required in metadata');
    if (!template.metadata.baseLocation) errors.push('Base location is required in metadata');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export individual templates for direct import
export {
  mtGloriousTemplate,
  brisbaneTrailMarathon,
  pinnaclesClassic,
  lakeManchesterTrail
};

// Default export
export default {
  templates,
  getTemplateById,
  getTemplateByName,
  getAllTemplates,
  getTemplatesByEventType,
  validateTemplate
};
