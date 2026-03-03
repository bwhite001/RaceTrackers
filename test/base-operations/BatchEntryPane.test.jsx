import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BatchEntryPane from 'modules/base-operations/components/BatchEntryPane';

const checkpoints = [{ number: 1, name: 'Start' }, { number: 3, name: 'Ridgeline' }];
const knownRunners = [1, 42, 100];

describe('BatchEntryPane', () => {
  it('renders checkpoint selector, time input, bib input', () => {
    render(<BatchEntryPane checkpoints={checkpoints} knownRunners={knownRunners} existingRecords={[]} onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByRole('combobox', { name: /checkpoint/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bib number input/i)).toBeInTheDocument();
  });

  it('submit button disabled until checkpoint + time + bib present', () => {
    render(<BatchEntryPane checkpoints={checkpoints} knownRunners={knownRunners} existingRecords={[]} onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByRole('button', { name: /record batch/i })).toBeDisabled();
  });

  it('shows future-time warning when time is ahead of now', () => {
    render(<BatchEntryPane checkpoints={checkpoints} knownRunners={knownRunners} existingRecords={[]} onSubmit={vi.fn()} loading={false} />);
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '23:59' } });
    expect(screen.getByText(/time is in the future/i)).toBeInTheDocument();
  });

  it('calls onSubmit with checkpointNumber, time, bibs', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<BatchEntryPane checkpoints={checkpoints} knownRunners={knownRunners} existingRecords={[]} onSubmit={onSubmit} loading={false} />);
    fireEvent.change(screen.getByRole('combobox', { name: /checkpoint/i }), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '10:30' } });
    const bibInput = screen.getByLabelText(/bib number input/i);
    fireEvent.change(bibInput, { target: { value: '42' } });
    fireEvent.keyDown(bibInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /record batch/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ checkpointNumber: 3, commonTime: '10:30', bibs: [{ bib: 42, status: 'valid' }] });
    });
  });

  it('retains checkpoint and time after submit but clears chips', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<BatchEntryPane checkpoints={checkpoints} knownRunners={knownRunners} existingRecords={[]} onSubmit={onSubmit} loading={false} />);
    fireEvent.change(screen.getByRole('combobox', { name: /checkpoint/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '09:15' } });
    const bibInput = screen.getByLabelText(/bib number input/i);
    fireEvent.change(bibInput, { target: { value: '1' } });
    fireEvent.keyDown(bibInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /record batch/i }));
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /checkpoint/i })).toHaveValue('1');
      expect(screen.getByLabelText(/time/i)).toHaveValue('09:15');
    });
  });
});
