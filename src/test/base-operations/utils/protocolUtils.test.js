import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  TIME_BLOCKS,
  PROTOCOL_TYPES,
  PRIORITY_LEVELS,
  getNextTimeBlock,
  formatTimeBlock,
  isWithinTimeBlock,
  createLogEntry,
  validateMessage,
  sortLogEntries,
  groupEntriesByTimeBlock,
  generateBlockSummary
} from '../../../utils/protocolUtils';

describe('Protocol Utilities', () => {
  describe('getNextTimeBlock', () => {
    test('rounds up to next 5-minute block', () => {
      const time = new Date('2023-01-01T10:03:00Z');
      const nextBlock = getNextTimeBlock(time, TIME_BLOCKS.STANDARD);
      
      expect(nextBlock.getMinutes()).toBe(5);
      expect(nextBlock.getSeconds()).toBe(0);
    });

    test('handles exact block boundaries', () => {
      const time = new Date('2023-01-01T10:05:00Z');
      const nextBlock = getNextTimeBlock(time, TIME_BLOCKS.STANDARD);
      
      expect(nextBlock.getMinutes()).toBe(5);
    });

    test('handles different block sizes', () => {
      const time = new Date('2023-01-01T10:03:00Z');
      
      // 10-minute blocks
      const block10 = getNextTimeBlock(time, TIME_BLOCKS.EXTENDED);
      expect(block10.getMinutes()).toBe(10);

      // 2-minute blocks
      const block2 = getNextTimeBlock(time, TIME_BLOCKS.URGENT);
      expect(block2.getMinutes()).toBe(4);
    });
  });

  describe('formatTimeBlock', () => {
    test('formats time correctly', () => {
      const time = new Date('2023-01-01T10:05:00Z');
      expect(formatTimeBlock(time)).toBe('10:05');
    });

    test('pads single digits', () => {
      const time = new Date('2023-01-01T09:05:00Z');
      expect(formatTimeBlock(time)).toBe('09:05');
    });
  });

  describe('isWithinTimeBlock', () => {
    test('detects time within block', () => {
      const blockStart = new Date('2023-01-01T10:00:00Z');
      const time = new Date('2023-01-01T10:03:00Z');
      
      expect(isWithinTimeBlock(time, blockStart, TIME_BLOCKS.STANDARD)).toBe(true);
    });

    test('detects time outside block', () => {
      const blockStart = new Date('2023-01-01T10:00:00Z');
      const time = new Date('2023-01-01T10:06:00Z');
      
      expect(isWithinTimeBlock(time, blockStart, TIME_BLOCKS.STANDARD)).toBe(false);
    });

    test('handles block boundaries', () => {
      const blockStart = new Date('2023-01-01T10:00:00Z');
      const blockEnd = new Date('2023-01-01T10:05:00Z');
      
      expect(isWithinTimeBlock(blockStart, blockStart, TIME_BLOCKS.STANDARD)).toBe(true);
      expect(isWithinTimeBlock(blockEnd, blockStart, TIME_BLOCKS.STANDARD)).toBe(false);
    });
  });

  describe('createLogEntry', () => {
    test('creates log entry with required fields', () => {
      const entry = createLogEntry({
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Test message'
      });

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('type', PROTOCOL_TYPES.CHECK_IN);
      expect(entry).toHaveProperty('message', 'Test message');
      expect(entry).toHaveProperty('priority', PRIORITY_LEVELS.ROUTINE);
      expect(entry).toHaveProperty('runners', []);
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('timeBlock');
      expect(entry).toHaveProperty('acknowledged', false);
      expect(entry).toHaveProperty('resolved', false);
    });

    test('creates log entry with optional fields', () => {
      const timestamp = new Date('2023-01-01T10:00:00Z');
      const entry = createLogEntry({
        type: PROTOCOL_TYPES.EMERGENCY,
        message: 'Emergency message',
        priority: PRIORITY_LEVELS.EMERGENCY,
        runners: [1, 2, 3],
        timestamp
      });

      expect(entry.priority).toBe(PRIORITY_LEVELS.EMERGENCY);
      expect(entry.runners).toEqual([1, 2, 3]);
      expect(entry.timestamp).toBe(timestamp);
    });

    test('generates unique IDs', () => {
      const entry1 = createLogEntry({
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Message 1'
      });
      const entry2 = createLogEntry({
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Message 2'
      });

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('validateMessage', () => {
    test('validates required fields', () => {
      const message = {
        type: '',
        message: '',
        priority: ''
      };

      const { isValid, errors } = validateMessage(message);

      expect(isValid).toBe(false);
      expect(errors).toHaveProperty('type');
      expect(errors).toHaveProperty('message');
      expect(errors).toHaveProperty('priority');
    });

    test('accepts valid message', () => {
      const message = {
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Test message',
        priority: PRIORITY_LEVELS.ROUTINE,
        runners: [1, 2, 3]
      };

      const { isValid, errors } = validateMessage(message);

      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });

    test('validates protocol type', () => {
      const message = {
        type: 'invalid_type',
        message: 'Test message',
        priority: PRIORITY_LEVELS.ROUTINE
      };

      const { isValid, errors } = validateMessage(message);

      expect(isValid).toBe(false);
      expect(errors).toHaveProperty('type', 'Invalid protocol type');
    });

    test('validates priority level', () => {
      const message = {
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Test message',
        priority: 'invalid_priority'
      };

      const { isValid, errors } = validateMessage(message);

      expect(isValid).toBe(false);
      expect(errors).toHaveProperty('priority', 'Invalid priority level');
    });

    test('validates runners array', () => {
      const message = {
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Test message',
        priority: PRIORITY_LEVELS.ROUTINE,
        runners: 'not an array'
      };

      const { isValid, errors } = validateMessage(message);

      expect(isValid).toBe(false);
      expect(errors).toHaveProperty('runners', 'Runners must be an array');
    });
  });

  describe('sortLogEntries', () => {
    const entries = [
      createLogEntry({
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Routine 1',
        priority: PRIORITY_LEVELS.ROUTINE,
        timestamp: new Date('2023-01-01T10:00:00Z')
      }),
      createLogEntry({
        type: PROTOCOL_TYPES.EMERGENCY,
        message: 'Emergency 1',
        priority: PRIORITY_LEVELS.EMERGENCY,
        timestamp: new Date('2023-01-01T10:05:00Z')
      }),
      createLogEntry({
        type: PROTOCOL_TYPES.CHECK_IN,
        message: 'Urgent 1',
        priority: PRIORITY_LEVELS.URGENT,
        timestamp: new Date('2023-01-01T10:03:00Z')
      })
    ];

    test('sorts by priority first', () => {
      const sorted = sortLogEntries(entries);
      
      expect(sorted[0].priority).toBe(PRIORITY_LEVELS.EMERGENCY);
      expect(sorted[1].priority).toBe(PRIORITY_LEVELS.URGENT);
      expect(sorted[2].priority).toBe(PRIORITY_LEVELS.ROUTINE);
    });

    test('sorts by timestamp within same priority', () => {
      const samePriority = [
        createLogEntry({
          type: PROTOCOL_TYPES.CHECK_IN,
          message: 'Message 1',
          priority: PRIORITY_LEVELS.ROUTINE,
          timestamp: new Date('2023-01-01T10:00:00Z')
        }),
        createLogEntry({
          type: PROTOCOL_TYPES.CHECK_IN,
          message: 'Message 2',
          priority: PRIORITY_LEVELS.ROUTINE,
          timestamp: new Date('2023-01-01T10:05:00Z')
        })
      ];

      const sorted = sortLogEntries(samePriority);
      
      expect(sorted[0].timestamp.getTime()).toBeGreaterThan(sorted[1].timestamp.getTime());
    });
  });

  describe('groupEntriesByTimeBlock', () => {
    test('groups entries by time block', () => {
      const entries = [
        createLogEntry({
          type: PROTOCOL_TYPES.CHECK_IN,
          message: 'Message 1',
          timestamp: new Date('2023-01-01T10:03:00Z')
        }),
        createLogEntry({
          type: PROTOCOL_TYPES.CHECK_IN,
          message: 'Message 2',
          timestamp: new Date('2023-01-01T10:04:00Z')
        }),
        createLogEntry({
          type: PROTOCOL_TYPES.CHECK_IN,
          message: 'Message 3',
          timestamp: new Date('2023-01-01T10:08:00Z')
        })
      ];

      const grouped = groupEntriesByTimeBlock(entries);
      
      expect(Object.keys(grouped).length).toBe(2); // Two time blocks
      expect(grouped['10:05']).toHaveLength(2); // First two messages
      expect(grouped['10:10']).toHaveLength(1); // Third message
    });

    test('handles empty array', () => {
      const grouped = groupEntriesByTimeBlock([]);
      expect(grouped).toEqual({});
    });
  });

  describe('generateBlockSummary', () => {
    test('generates summary for time block', () => {
      const entries = [
        createLogEntry({
          type: PROTOCOL_TYPES.CHECK_IN,
          message: 'Message 1',
          runners: [1, 2]
        }),
        createLogEntry({
          type: PROTOCOL_TYPES.CHECK_IN,
          message: 'Message 2',
          runners: [2, 3]
        })
      ];

      const summary = generateBlockSummary(entries);
      
      expect(summary).toContain('2 communications');
      expect(summary).toContain('3 runners affected'); // Unique runners: 1, 2, 3
    });

    test('handles empty entries', () => {
      const summary = generateBlockSummary([]);
      expect(summary).toContain('0 communications');
      expect(summary).toContain('0 runners affected');
    });
  });

  describe('Constants', () => {
    test('defines time blocks', () => {
      expect(TIME_BLOCKS).toHaveProperty('STANDARD', 5);
      expect(TIME_BLOCKS).toHaveProperty('EXTENDED', 10);
      expect(TIME_BLOCKS).toHaveProperty('URGENT', 2);
    });

    test('defines protocol types', () => {
      expect(PROTOCOL_TYPES).toHaveProperty('CHECK_IN');
      expect(PROTOCOL_TYPES).toHaveProperty('EMERGENCY');
      expect(PROTOCOL_TYPES).toHaveProperty('WITHDRAWAL');
    });

    test('defines priority levels', () => {
      expect(PRIORITY_LEVELS).toHaveProperty('ROUTINE');
      expect(PRIORITY_LEVELS).toHaveProperty('URGENT');
      expect(PRIORITY_LEVELS).toHaveProperty('EMERGENCY');
    });
  });
});
