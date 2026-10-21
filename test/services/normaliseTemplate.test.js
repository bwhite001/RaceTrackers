import { describe, it, expect } from 'vitest';
import { normaliseTemplate } from '../../src/services/normaliseTemplate.js';

const richTemplate = {
  id: 'mt-glorious-mountain-trail',
  name: 'Mt Glorious Mountain Trail',
  eventType: 'Mountain Trail Run',
  description: 'Mountain trail race.',
  defaultStartTime: '07:00:00',
  defaultRunnerRangeStart: 1,
  defaultRunnerRangeEnd: 128,
  checkpoints: [
    { number: 1, name: 'CP1 - Northbrook', location: '-27.32, 152.71', orderSequence: 1, metadata: { operators: ['VK4SIR'] } },
    { number: 5, name: 'Finish - Maiala', location: '-27.32, 152.75', orderSequence: 5, metadata: { operators: [] } }
  ],
  metadata: { baseLocation: 'Maiala Picnic Area, Mt Glorious', frequencies: [] }
};

const jsonTemplate = {
  id: 'mountain-trail-100k',
  name: 'Mountain Trail 100K',
  description: 'Annual 100km trail race.',
  checkpoints: [
    { number: 1, name: 'Aid Station 1 – Valley' },
    { number: 5, name: 'Aid Station 5 – Finish' }
  ],
  runnerRanges: [{ min: 100, max: 349 }],
  defaultBatches: [
    { batchNumber: 1, batchName: 'Elite Wave', defaultStartOffsetMinutes: 0 },
    { batchNumber: 2, batchName: 'Wave A', defaultStartOffsetMinutes: 15 }
  ]
};

describe('normaliseTemplate', () => {
  describe('rich JS format', () => {
    it('produces canonical shape', () => {
      const n = normaliseTemplate(richTemplate);
      expect(n.id).toBe('mt-glorious-mountain-trail');
      expect(n.name).toBe('Mt Glorious Mountain Trail');
      expect(n.eventType).toBe('Mountain Trail Run');
      expect(n.defaultStartTime).toBe('07:00:00');
      expect(n.defaultRunnerRangeStart).toBe(1);
      expect(n.defaultRunnerRangeEnd).toBe(128);
    });

    it('extracts baseLocation from metadata', () => {
      const n = normaliseTemplate(richTemplate);
      expect(n.baseLocation).toBe('Maiala Picnic Area, Mt Glorious');
    });

    it('derives runnerRanges from defaultRunnerRangeStart/End', () => {
      const n = normaliseTemplate(richTemplate);
      expect(n.runnerRanges).toEqual([{ min: 1, max: 128 }]);
    });

    it('strips GPS but keeps operator callsigns', () => {
      const n = normaliseTemplate(richTemplate);
      expect(n.checkpoints[0]).toEqual({ number: 1, name: 'CP1 - Northbrook', orderSequence: 1, operatorCallsigns: ['VK4SIR'] });
      expect(n.checkpoints[1].operatorCallsigns).toBeUndefined();
      expect(n.checkpoints[0].location).toBeUndefined();
      expect(n.checkpoints[0].metadata).toBeUndefined();
    });

    it('the shipped Mt Glorious template matches the WICEN brief (spec §10); bib range unchanged', async () => {
      const raw = (await import('../../src/data/templates/mt-glorious-mountain-trail.json')).default;
      const n = normaliseTemplate(raw);
      expect(n.defaultStartTime).toBe('06:30:00');
      expect(n.runnerRanges).toEqual([{ min: 1, max: 128 }]);
      expect(n.checkpoints.map(c => [c.distanceKm, c.operatorCallsigns])).toEqual([
        [5, ['VK4MUD', 'VK4MKD', 'VK4EAR']],
        [11, ['VK4IE', 'VK4TBA']],
        [14.5, ['VK4PMC', 'VK4JBX']],
        [17.5, ['VK4AJG', 'VK4DTB']],
      ]);
      expect(n.checkpoints[2].locationName).toBe('England Creek Rd & Joyners Ridge Rd');
      expect(n.raceDefaults).toEqual({ baseCallsign: 'VK4WIP', frequency: '147.225', distanceKm: 22 });
    });

    it('defaults defaultBatches to empty array', () => {
      const n = normaliseTemplate(richTemplate);
      expect(n.defaultBatches).toEqual([]);
    });
  });

  describe('simple JSON format', () => {
    it('preserves runnerRanges', () => {
      const n = normaliseTemplate(jsonTemplate);
      expect(n.runnerRanges).toEqual([{ min: 100, max: 349 }]);
    });

    it('derives defaultRunnerRangeStart/End from runnerRanges', () => {
      const n = normaliseTemplate(jsonTemplate);
      expect(n.defaultRunnerRangeStart).toBe(100);
      expect(n.defaultRunnerRangeEnd).toBe(349);
    });

    it('preserves defaultBatches', () => {
      const n = normaliseTemplate(jsonTemplate);
      expect(n.defaultBatches).toHaveLength(2);
      expect(n.defaultBatches[0].batchName).toBe('Elite Wave');
    });

    it('defaults baseLocation to empty string', () => {
      const n = normaliseTemplate(jsonTemplate);
      expect(n.baseLocation).toBe('');
    });

    it('defaults eventType to Trail Run', () => {
      const n = normaliseTemplate(jsonTemplate);
      expect(n.eventType).toBe('Trail Run');
    });
  });

  describe('defaults', () => {
    it('defaults defaultStartTime to 07:00:00 when missing', () => {
      const n = normaliseTemplate({ ...jsonTemplate, defaultStartTime: undefined });
      expect(n.defaultStartTime).toBe('07:00:00');
    });
  });
});
