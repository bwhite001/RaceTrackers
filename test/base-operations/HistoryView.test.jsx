import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HistoryView from 'modules/base-operations/components/HistoryView';

const checkpoints = [{ number: 1, name: 'Start' }, { number: 3, name: 'Ridgeline' }];

const makeBatch = (id, cp, bibs) => ({
  id, checkpointNumber: cp, commonTime: '10:00', bibs,
  submittedAt: new Date().toISOString(), voided: false,
  editedFrom: null, editedAt: null,
});

describe('HistoryView', () => {
  it('shows empty state when no batches', () => {
    render(<HistoryView batches={[]} checkpoints={checkpoints} onEdit={vi.fn()} onVoid={vi.fn()} />);
    expect(screen.getByText(/no batches yet/i)).toBeInTheDocument();
  });

  it('shows batch count and total runner count in summary', () => {
    const batches = [makeBatch('b1', 1, [1, 2, 3]), makeBatch('b2', 3, [4, 5])];
    render(<HistoryView batches={batches} checkpoints={checkpoints} onEdit={vi.fn()} onVoid={vi.fn()} />);
    expect(screen.getByText(/2 batches/i)).toBeInTheDocument();
    expect(screen.getByText(/5 runners/i)).toBeInTheDocument();
  });

  it('renders an Edit Batch button for each non-voided batch', () => {
    const batches = [makeBatch('b1', 1, [1, 2]), makeBatch('b2', 1, [3])];
    render(<HistoryView batches={batches} checkpoints={checkpoints} onEdit={vi.fn()} onVoid={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /edit batch/i })).toHaveLength(2);
  });

  it('shows Print Session button', () => {
    render(
      <HistoryView batches={[makeBatch('b1', 1, [1])]} checkpoints={checkpoints} onEdit={vi.fn()} onVoid={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /print session/i })).toBeInTheDocument();
  });

  it('calls onEdit when Edit Batch is clicked', () => {
    const onEdit = vi.fn();
    const batch = makeBatch('b1', 1, [42]);
    render(<HistoryView batches={[batch]} checkpoints={checkpoints} onEdit={onEdit} onVoid={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /edit batch/i }));
    expect(onEdit).toHaveBeenCalledWith(batch);
  });
});
