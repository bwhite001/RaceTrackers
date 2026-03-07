import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('modules/base-operations/store/baseOperationsStore');
vi.mock('store/useRaceStore', () => ({
  useRaceStore: vi.fn(),
}));

import useBaseOperationsStore from 'modules/base-operations/store/baseOperationsStore';
import { useRaceStore } from 'store/useRaceStore';
import BatchEntryLayout from 'modules/base-operations/components/BatchEntryLayout';

const defaultStore = {
  runners: [],
  sessionBatches: [],
  submitRadioBatch: vi.fn().mockResolvedValue(),
  voidSessionBatch: vi.fn(),
  editSessionBatch: vi.fn().mockResolvedValue(),
  loading: false,
};

beforeEach(() => {
  useBaseOperationsStore.mockReturnValue(defaultStore);
  useRaceStore.mockReturnValue({
    checkpoints: [{ number: 1, name: 'Start' }, { number: 3, name: 'Ridgeline' }],
    runners: [{ number: 1 }, { number: 42 }, { number: 100 }],
    currentRace: null,
  });
});

describe('BatchEntryLayout', () => {
  it('renders checkpoint selector and tabs', () => {
    render(<BatchEntryLayout onUnsavedChanges={vi.fn()} />, { wrapper: MemoryRouter });
    expect(screen.getByRole('combobox', { name: /checkpoint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
  });

  it('shows empty draft state initially', () => {
    render(<BatchEntryLayout onUnsavedChanges={vi.fn()} />, { wrapper: MemoryRouter });
    expect(screen.getByText(/no runners yet/i)).toBeInTheDocument();
  });

  it('switches to history tab when History is clicked', () => {
    render(<BatchEntryLayout onUnsavedChanges={vi.fn()} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText(/no batches yet/i)).toBeInTheDocument();
  });

  it('adds a runner to the draft when bib is entered', () => {
    render(<BatchEntryLayout onUnsavedChanges={vi.fn()} />, { wrapper: MemoryRouter });
    fireEvent.change(screen.getByRole('combobox', { name: /checkpoint/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/common time/i), { target: { value: '10:00' } });
    const bibInput = screen.getByLabelText(/bib numbers/i);
    fireEvent.change(bibInput, { target: { value: '42' } });
    fireEvent.keyDown(bibInput, { key: 'Enter' });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calls submitRadioBatch when Record is clicked', async () => {
    const submitRadioBatch = vi.fn().mockResolvedValue();
    useBaseOperationsStore.mockReturnValue({ ...defaultStore, submitRadioBatch });
    render(<BatchEntryLayout onUnsavedChanges={vi.fn()} />, { wrapper: MemoryRouter });
    fireEvent.change(screen.getByRole('combobox', { name: /checkpoint/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/common time/i), { target: { value: '10:00' } });
    const bibInput = screen.getByLabelText(/bib numbers/i);
    fireEvent.change(bibInput, { target: { value: '42' } });
    fireEvent.keyDown(bibInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /record 1 runner/i }));
    await waitFor(() => expect(submitRadioBatch).toHaveBeenCalledWith([42], '10:00', 1, {}));
  });
});
