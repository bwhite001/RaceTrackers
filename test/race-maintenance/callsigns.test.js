import { describe, it, expect } from 'vitest';
import { parseCallsigns } from '../../src/modules/race-maintenance/services/callsigns.js';

describe('parseCallsigns', () => {
  it('parses a typed list', () => {
    expect(parseCallsigns('vk4mud, VK4MKD  vk4ear,vk4mud')).toEqual(['VK4MUD', 'VK4MKD', 'VK4EAR']);
    expect(parseCallsigns('  ')).toEqual([]);
  });
});
