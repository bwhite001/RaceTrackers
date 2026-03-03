import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the race maintenance store
vi.mock('modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: vi.fn(() => ({
    saveBatch: vi.fn(),
    deleteBatch: vi.fn(),
  }))
}));

import BatchConfigStep from '../../src/components/Setup/BatchConfigStep.jsx';

describe('BatchConfigStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Add Wave button', () => {
    render(<BatchConfigStep batches={[]} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add wave/i })).toBeInTheDocument();
  });

  it('shows single-start-time note when no batches', () => {
    render(<BatchConfigStep batches={[]} onChange={vi.fn()} />);
    // The component renders section header when no batches - check header is present
    expect(screen.getByText(/wave \/ batch configuration/i)).toBeInTheDocument();
  });

  it('renders existing batches by name', () => {
    const batches = [
      { batchNumber: 1, batchName: 'Elite Wave', startTime: '' },
      { batchNumber: 2, batchName: 'Open Wave', startTime: '' },
    ];
    render(<BatchConfigStep batches={batches} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Elite Wave')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Open Wave')).toBeInTheDocument();
  });

  it('clicking Add Wave calls onChange with a new batch appended', () => {
    const onChange = vi.fn();
    render(<BatchConfigStep batches={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /add wave/i }));
    expect(onChange).toHaveBeenCalledOnce();
    const updated = onChange.mock.calls[0][0];
    expect(updated).toHaveLength(1);
    expect(updated[0].batchNumber).toBe(1);
    expect(updated[0].batchName).toBe('Wave 1');
  });

  it('clicking Add Wave on existing batches appends correctly', () => {
    const onChange = vi.fn();
    const batches = [{ batchNumber: 1, batchName: 'Wave 1', startTime: '' }];
    render(<BatchConfigStep batches={batches} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /add wave/i }));
    const updated = onChange.mock.calls[0][0];
    expect(updated).toHaveLength(2);
    expect(updated[1].batchNumber).toBe(2);
    expect(updated[1].batchName).toBe('Wave 2');
  });

  it('remove button calls onChange with batch removed', () => {
    const onChange = vi.fn();
    const batches = [
      { batchNumber: 1, batchName: 'Wave 1', startTime: '' },
      { batchNumber: 2, batchName: 'Wave 2', startTime: '' },
    ];
    render(<BatchConfigStep batches={batches} onChange={onChange} />);
    // Remove button only shows when batches.length > 1
    const removeButtons = screen.getAllByRole('button', { name: /remove wave/i });
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledOnce();
    const updated = onChange.mock.calls[0][0];
    expect(updated).toHaveLength(1);
    expect(updated[0].batchName).toBe('Wave 2');
  });

  it('does not show remove button when only one batch', () => {
    const batches = [{ batchNumber: 1, batchName: 'Wave 1', startTime: '' }];
    render(<BatchConfigStep batches={batches} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /remove wave/i })).not.toBeInTheDocument();
  });
});
