import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SessionHistoryPane from 'modules/base-operations/components/SessionHistoryPane';

const checkpoints = [{ number: 1, name: 'Start' }, { number: 3, name: 'Ridgeline' }];
const batches = [
  { id: 'b1', checkpointNumber: 3, commonTime: '10:30', bibs: [42, 7], submittedAt: '2026-03-03T10:31:00.000Z', voided: false },
  { id: 'b2', checkpointNumber: 1, commonTime: '09:15', bibs: [1, 2], submittedAt: '2026-03-03T09:16:00.000Z', voided: false },
];

describe('SessionHistoryPane', () => {
  it('renders all submitted batches', () => {
    render(<SessionHistoryPane batches={batches} checkpoints={checkpoints} activeBib={null} onVoid={vi.fn()} />);
    expect(screen.getByText('Ridgeline')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText(/10:30/)).toBeInTheDocument();
  });

  it('shows empty state when no batches', () => {
    render(<SessionHistoryPane batches={[]} checkpoints={checkpoints} activeBib={null} onVoid={vi.fn()} />);
    expect(screen.getByText(/no batches/i)).toBeInTheDocument();
  });

  it('calls onVoid when void button triggered from expanded card', () => {
    const onVoid = vi.fn();
    render(<SessionHistoryPane batches={batches} checkpoints={checkpoints} activeBib={null} onVoid={onVoid} />);
    fireEvent.click(screen.getAllByRole('button', { name: /expand/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /void batch/i }));
    expect(onVoid).toHaveBeenCalledWith('b1');
  });

  it('highlights card containing activeBib', () => {
    const { container } = render(
      <SessionHistoryPane batches={batches} checkpoints={checkpoints} activeBib={42} onVoid={vi.fn()} />
    );
    const cards = container.querySelectorAll('[data-testid="batch-card"]');
    expect(cards[0].className).toMatch(/ring|pulse/);
  });
});
