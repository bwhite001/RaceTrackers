import { normaliseTemplate } from '../../services/normaliseTemplate.js';
import { mtGloriousTemplate } from './mtGloriousTemplate.js';
import { brisbaneTrailMarathon } from './brisbaneTrailMarathon.js';
import { pinnaclesClassic } from './pinnaclesClassic.js';
import { lakeManchesterTrail } from './lakeManchesterTrail.js';

/**
 * All available race templates, normalised to canonical shape.
 * Import via: import RACE_TEMPLATES from '../../data/templates/index';
 *         or: import { getTemplateById } from '../../data/templates/index';
 */
const RACE_TEMPLATES = [
  normaliseTemplate(mtGloriousTemplate),
  normaliseTemplate(brisbaneTrailMarathon),
  normaliseTemplate(pinnaclesClassic),
  normaliseTemplate(lakeManchesterTrail)
];

export default RACE_TEMPLATES;

export function getTemplateById(id) {
  return RACE_TEMPLATES.find(t => t.id === id) || null;
}

export function getTemplateByName(name) {
  return RACE_TEMPLATES.find(t => t.name === name) || null;
}

export function getAllTemplates() {
  return RACE_TEMPLATES;
}

export function validateTemplate(template) {
  const required = ['id', 'name', 'checkpoints', 'runnerRanges'];
  return required.every(key => template[key] != null);
}

export { RACE_TEMPLATES as templates };
