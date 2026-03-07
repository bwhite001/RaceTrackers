import { normaliseTemplate } from '../../services/normaliseTemplate.js';
import mtGloriousTemplate from './mt-glorious-mountain-trail.json';
import brisbaneTrailMarathon from './brisbane-trail-marathon.json';
import pinnaclesClassic from './pinnacles-classic.json';
import lakeManchesterTrail from './lake-manchester-trail.json';
import mtGloriousGpx from './gpx/mt-glorious-mountain-trail.gpx?raw';
import brisbaneTrailMarathonGpx from './gpx/brisbane-trail-marathon.gpx?raw';
import pinnaclesClassicGpx from './gpx/pinnacles-classic.gpx?raw';
import lakeManchesterTrailGpx from './gpx/lake-manchester-trail.gpx?raw';

/**
 * All available race templates, normalised to canonical shape.
 * Import via: import RACE_TEMPLATES from '../../data/templates/index';
 *         or: import { getTemplateById } from '../../data/templates/index';
 */
const RACE_TEMPLATES = [
  normaliseTemplate({ ...mtGloriousTemplate, courseGpx: mtGloriousGpx }),
  normaliseTemplate({ ...brisbaneTrailMarathon, courseGpx: brisbaneTrailMarathonGpx }),
  normaliseTemplate({ ...pinnaclesClassic, courseGpx: pinnaclesClassicGpx }),
  normaliseTemplate({ ...lakeManchesterTrail, courseGpx: lakeManchesterTrailGpx }),
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
