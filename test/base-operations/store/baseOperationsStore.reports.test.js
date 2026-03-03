import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to get the actual store state (not a hook) for unit testing actions
// Import the raw store — getState() works outside React
let useBaseOperationsStore;

beforeEach(async () => {
  vi.resetModules();
  // Fresh import each test to avoid stale state
  const mod = await import('../../../src/modules/base-operations/store/baseOperationsStore.js');
  useBaseOperationsStore = mod.default;
  useBaseOperationsStore.setState({ currentRaceId: 1 });
});

describe('baseOperationsStore report methods', () => {
  it('exposes generateReport as a function', () => {
    const { generateReport } = useBaseOperationsStore.getState();
    expect(typeof generateReport).toBe('function');
  });

  it('exposes downloadReport as a function', () => {
    const { downloadReport } = useBaseOperationsStore.getState();
    expect(typeof downloadReport).toBe('function');
  });

  it('exposes previewReport as a function', () => {
    const { previewReport } = useBaseOperationsStore.getState();
    expect(typeof previewReport).toBe('function');
  });

  it('exposes generateMissingNumbersReport as a function', () => {
    const { generateMissingNumbersReport } = useBaseOperationsStore.getState();
    expect(typeof generateMissingNumbersReport).toBe('function');
  });

  it('generateReport throws when no active race', async () => {
    useBaseOperationsStore.setState({ currentRaceId: null });
    const { generateReport } = useBaseOperationsStore.getState();
    await expect(generateReport('missing', {})).rejects.toThrow('No active race');
  });

  it('downloadReport does nothing when report has no content', () => {
    const { downloadReport } = useBaseOperationsStore.getState();
    // Should not throw
    expect(() => downloadReport(null)).not.toThrow();
    expect(() => downloadReport({ content: null, filename: 'test.csv' })).not.toThrow();
  });
});
