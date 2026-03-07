import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LinkCheckpointsStep from '../../src/components/Setup/LinkCheckpointsStep.jsx';

const checkpoints = [
  { number: 1, name: 'Mile 5 Out' },
  { number: 2, name: 'Water Station' },
  { number: 4, name: 'Mile 15 Back' },
];

describe('LinkCheckpointsStep', () => {
  it('renders a tile for each checkpoint', () => {
    render(<LinkCheckpointsStep checkpoints={checkpoints} onNext={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('CP1')).toBeInTheDocument();
    expect(screen.getByText('CP2')).toBeInTheDocument();
    expect(screen.getByText('CP4')).toBeInTheDocument();
  });

  it('links two checkpoints when both are clicked', () => {
    render(<LinkCheckpointsStep checkpoints={checkpoints} onNext={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('cp-tile-1'));
    fireEvent.click(screen.getByTestId('cp-tile-4'));
    expect(screen.getByTestId('unlink-1-4')).toBeInTheDocument();
  });

  it('unlinks a pair when the unlink button is clicked', () => {
    render(<LinkCheckpointsStep checkpoints={checkpoints} onNext={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('cp-tile-1'));
    fireEvent.click(screen.getByTestId('cp-tile-4'));
    fireEvent.click(screen.getByTestId('unlink-1-4'));
    expect(screen.queryByTestId('unlink-1-4')).not.toBeInTheDocument();
  });

  it('calls onNext with updated checkpoints including linkedCheckpointNumber', () => {
    const onNext = vi.fn();
    render(<LinkCheckpointsStep checkpoints={checkpoints} onNext={onNext} onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('cp-tile-1'));
    fireEvent.click(screen.getByTestId('cp-tile-4'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onNext).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ number: 1, linkedCheckpointNumber: 4 }),
        expect.objectContaining({ number: 4, linkedCheckpointNumber: 1 }),
      ])
    );
  });

  it('a checkpoint cannot link to itself', () => {
    render(<LinkCheckpointsStep checkpoints={checkpoints} onNext={vi.fn()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('cp-tile-1'));
    fireEvent.click(screen.getByTestId('cp-tile-1')); // second click = deselect, not self-link
    expect(screen.queryByTestId('unlink-1-1')).not.toBeInTheDocument();
  });
});
