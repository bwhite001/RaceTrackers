import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BatchCard from 'modules/base-operations/components/BatchCard';

const batch = {
  id: 'b1',
  checkpointNumber: 1,
  commonTime: '10:00',
  bibs: [23, 45, 66],
  submittedAt: new Date().toISOString(),
  voided: false,
  editedFrom: null,
  editedAt: null,
};

describe('BatchCard — collapsed', () => {
  it('shows checkpoint name, common time, and runner count', () => {
    render(<BatchCard batch={batch} checkpointName="CP1 — Start" batchNumber={1} onEdit={vi.fn()} onVoid={vi.fn()} />);
    expect(screen.getByText(/CP1 — Start/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/3 runner/i)).toBeInTheDocument();
  });

  it('shows Edit Batch button', () => {
    render(<BatchCard batch={batch} checkpointName="CP1" batchNumber={1} onEdit={vi.fn()} onVoid={vi.fn()} />);
    expect(screen.getByRole('button', { name: /edit batch/i })).toBeInTheDocument();
  });

  it('calls onEdit when Edit Batch is clicked', () => {
    const onEdit = vi.fn();
    render(<BatchCard batch={batch} checkpointName="CP1" batchNumber={1} onEdit={onEdit} onVoid={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /edit batch/i }));
    expect(onEdit).toHaveBeenCalledWith(batch);
  });
});

describe('BatchCard — expanded', () => {
  it('expands to show runner pills when expand button is clicked', () => {
    render(<BatchCard batch={batch} checkpointName="CP1" batchNumber={1} onEdit={vi.fn()} onVoid={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /expand/i }));
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('66')).toBeInTheDocument();
  });

  it('shows Void batch button when expanded', () => {
    render(<BatchCard batch={batch} checkpointName="CP1" batchNumber={1} onEdit={vi.fn()} onVoid={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /expand/i }));
    expect(screen.getByRole('button', { name: /void batch/i })).toBeInTheDocument();
  });

  it('calls onVoid when void batch is clicked', () => {
    const onVoid = vi.fn();
    render(<BatchCard batch={batch} checkpointName="CP1" batchNumber={1} onEdit={vi.fn()} onVoid={onVoid} />);
    fireEvent.click(screen.getByRole('button', { name: /expand/i }));
    fireEvent.click(screen.getByRole('button', { name: /void batch/i }));
    expect(onVoid).toHaveBeenCalledWith('b1');
  });
});

describe('BatchCard — edited indicator', () => {
  it('shows edit indicator when editedFrom is set', () => {
    const editedBatch = { ...batch, editedFrom: 'b-old', editedAt: new Date().toISOString() };
    render(<BatchCard batch={editedBatch} checkpointName="CP1" batchNumber={2} onEdit={vi.fn()} onVoid={vi.fn()} />);
    expect(screen.getByTitle(/edited/i)).toBeInTheDocument();
  });
});

describe('BatchCard — voided', () => {
  it('hides Edit Batch button when voided', () => {
    const voided = { ...batch, voided: true };
    render(<BatchCard batch={voided} checkpointName="CP1" batchNumber={1} onEdit={vi.fn()} onVoid={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /edit batch/i })).not.toBeInTheDocument();
  });
});
