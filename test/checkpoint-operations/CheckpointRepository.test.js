import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database schema before importing the repository
const mockRunners = [];
const mockCheckpoints = [];
const mockCheckpointRunners = [];

vi.mock('../../src/shared/services/database/schema.js', () => ({
  default: {
    runners: {
      where: () => ({ equals: () => ({ toArray: async () => mockRunners }) }),
    },
    checkpoints: {
      where: () => ({
        equals: () => ({ first: async () => mockCheckpoints[0] ?? null }),
      }),
    },
    checkpoint_runners: {
      where: () => ({
        equals: () => ({ toArray: async () => mockCheckpointRunners }),
      }),
    },
  },
}));

vi.mock('../../src/shared/services/database/BaseRepository', () => ({
  BaseRepository: class {
    constructor(table) { this.table = table; }
    async bulkAdd(rows) { mockCheckpointRunners.push(...rows); return rows; }
  },
}));

vi.mock('../../src/services/timeUtils', () => ({ default: {} }));

import { CheckpointRepository } from '../../src/modules/checkpoint-operations/services/CheckpointRepository';

describe('CheckpointRepository.initializeCheckpoint', () => {
  let repo;

  beforeEach(() => {
    repo = new CheckpointRepository();
    mockRunners.length = 0;
    mockCheckpoints.length = 0;
    mockCheckpointRunners.length = 0;
  });

  it('includes all runners when checkpoint has no allowedBatches', async () => {
    mockRunners.push(
      { number: 1, batchNumber: 1 },
      { number: 2, batchNumber: 2 },
      { number: 3, batchNumber: 1 },
    );
    mockCheckpoints.push({ id: 10, raceId: 1, number: 1, name: 'CP1', allowedBatches: null });

    const result = await repo.initializeCheckpoint(1, 1);
    expect(result).toHaveLength(3);
  });

  it('filters runners by allowedBatches when set', async () => {
    mockRunners.push(
      { number: 1, batchNumber: 1 },
      { number: 2, batchNumber: 2 },
      { number: 3, batchNumber: 1 },
    );
    mockCheckpoints.push({ id: 10, raceId: 1, number: 1, name: 'CP1', allowedBatches: [1] });

    const result = await repo.initializeCheckpoint(1, 1);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.number)).toEqual([1, 3]);
  });

  it('includes all runners when allowedBatches is empty array', async () => {
    mockRunners.push(
      { number: 1, batchNumber: 1 },
      { number: 2, batchNumber: 2 },
    );
    mockCheckpoints.push({ id: 10, raceId: 1, number: 1, name: 'CP1', allowedBatches: [] });

    const result = await repo.initializeCheckpoint(1, 1);
    expect(result).toHaveLength(2);
  });
});
