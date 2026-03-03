import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RunnerTimeEditModal from 'modules/base-operations/components/RunnerTimeEditModal';

const base = { runnerNumber: 42, checkpointNumber: 3, existingTime: null, isOpen: true, onClose: vi.fn(), onSave: vi.fn(), isDuplicate: false };

describe('RunnerTimeEditModal', () => {
  it('shows runner and checkpoint', () => {
    render(<RunnerTimeEditModal {...base} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/CP3/i)).toBeInTheDocument();
  });

  it('shows duplicate warning when isDuplicate is true', () => {
    render(<RunnerTimeEditModal {...base} isDuplicate={true} />);
    expect(screen.getByText(/already recorded/i)).toBeInTheDocument();
  });

  it('calls onSave with runner number and time', () => {
    const onSave = vi.fn();
    render(<RunnerTimeEditModal {...base} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '10:30' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith({ runnerNumber: 42, time: '10:30' });
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(<RunnerTimeEditModal {...base} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
