import mountainTrail100k from './mountain-trail-100k.json';
import communityFunRun10k from './community-fun-run-10k.json';
import ultraMarathon50k from './ultra-marathon-50k.json';

/**
 * Static race templates committed to the codebase.
 * Available offline to all users — no database records needed.
 * Each template carries: checkpoints, runnerRanges, defaultBatches.
 * Does NOT carry: runner personal data, statuses, or historic results.
 */
const RACE_TEMPLATES = [
  mountainTrail100k,
  communityFunRun10k,
  ultraMarathon50k
];

export default RACE_TEMPLATES;
