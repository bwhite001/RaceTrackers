import { describe, it, expect } from 'vitest';
import * as cef from '../../../src/services/cef/index';

/**
 * Smoke test for the barrel — the documented public API of the CEF module.
 * Nothing in src/ imports this yet, so a stale or misspelled re-export would
 * otherwise go unnoticed until the first real consumer lands. This doubles as
 * documentation of the intended export surface: keep it in sync with index.js.
 */
describe('cef barrel exports', () => {
  it('exports exactly the intended public API', () => {
    expect(Object.keys(cef).sort()).toEqual(
      [
        'EVENT_TYPES',
        'STOP_EVENTS',
        'REASON_RE',
        'validateRecord',
        'naturalKey',
        'mergeRecords',
        'encodeJson',
        'decodeJson',
        'APRS_MAX_LENGTH',
        'APRS_LINE_RE',
        'VERBS',
        'encodeTime',
        'decodeTime',
        'encodeAprs',
        'decodeAprs',
        'eventToStatus',
        'statusToEvent',
        'resolveSite',
      ].sort()
    );
  });

  it('exports functions where the API is behaviour', () => {
    const functions = [
      'validateRecord', 'naturalKey', 'mergeRecords', 'encodeJson', 'decodeJson',
      'encodeTime', 'decodeTime', 'encodeAprs', 'decodeAprs',
      'eventToStatus', 'statusToEvent', 'resolveSite',
    ];
    for (const name of functions) expect(typeof cef[name]).toBe('function');
  });

  it('exports plain objects/constants where the API is data', () => {
    expect(typeof cef.EVENT_TYPES).toBe('object');
    expect(typeof cef.VERBS).toBe('object');
    expect(Array.isArray(cef.STOP_EVENTS)).toBe(true);
    expect(cef.APRS_LINE_RE).toBeInstanceOf(RegExp);
    expect(cef.REASON_RE).toBeInstanceOf(RegExp);
    expect(typeof cef.APRS_MAX_LENGTH).toBe('number');
  });

  it('REASON_RE matches the grammar enforced elsewhere in the module', () => {
    expect(cef.REASON_RE.test('LAME')).toBe(true);
    expect(cef.REASON_RE.test('lame')).toBe(false);
  });
});
