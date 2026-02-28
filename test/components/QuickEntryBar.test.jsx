import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuickEntryBar from 'components/Checkpoint/QuickEntryBar.jsx';

// ─── Mock checkpointStore ─────────────────────────────────────────────────────

const mockMarkRunner = vi.fn();
let mockRunners = [
  { number: 101, status: 'NOT_STARTED' },
  { number: 102, status: 'NOT_STARTED' },
];

vi.mock('modules/checkpoint-operations/store/checkpointStore', () => ({
  default: vi.fn(() => ({
    markRunner: mockMarkRunner,
    runners: mockRunners,
  })),
}));

import useCheckpointStore from 'modules/checkpoint-operations/store/checkpointStore';

beforeEach(() => {
  vi.clearAllMocks();
  mockMarkRunner.mockResolvedValue(undefined);
  useCheckpointStore.mockImplementation(() => ({
    markRunner: mockMarkRunner,
    runners: mockRunners,
  }));
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderBar() {
  return render(<QuickEntryBar />);
}

function getInput() {
  return screen.getByLabelText('Runner number');
}

function getMarkButton() {
  return screen.getByRole('button', { name: 'Mark' });
}

async function typeAndSubmit(value) {
  const input = getInput();
  fireEvent.change(input, { target: { value } });
  fireEvent.submit(input.closest('form'));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuickEntryBar', () => {
  it('renders an auto-focused input and a Mark button', () => {
    renderBar();
    expect(getInput()).toBeDefined();
    expect(getMarkButton()).toBeDefined();
  });

  it('Mark button is disabled when input is empty', () => {
    renderBar();
    expect(getMarkButton()).toHaveProperty('disabled', true);
  });

  it('Mark button is enabled when input has a value', () => {
    renderBar();
    fireEvent.change(getInput(), { target: { value: '101' } });
    expect(getMarkButton()).toHaveProperty('disabled', false);
  });

  it('calls markRunner with the entered number on submit', async () => {
    renderBar();
    await typeAndSubmit('101');
    expect(mockMarkRunner).toHaveBeenCalledWith(101);
  });

  it('clears the input after a successful mark', async () => {
    renderBar();
    fireEvent.change(getInput(), { target: { value: '101' } });
    fireEvent.click(getMarkButton());
    await waitFor(() => expect(getInput().value).toBe(''));
  });

  it('shows success feedback after marking', async () => {
    renderBar();
    await typeAndSubmit('101');
    await waitFor(() => expect(screen.getByText('Runner 101 marked')).toBeDefined());
  });

  it('shows error feedback for a zero/negative input', async () => {
    renderBar();
    await typeAndSubmit('0');
    await waitFor(() =>
      expect(screen.getByText(/"0" is not a valid runner number/)).toBeDefined()
    );
    expect(mockMarkRunner).not.toHaveBeenCalled();
  });

  it('shows error feedback when runner is not in the checkpoint list', async () => {
    renderBar();
    await typeAndSubmit('999');
    await waitFor(() =>
      expect(screen.getByText(/Runner 999 not found/)).toBeDefined()
    );
    expect(mockMarkRunner).not.toHaveBeenCalled();
  });

  it('shows error feedback when markRunner throws', async () => {
    mockMarkRunner.mockRejectedValue(new Error('DB error'));
    renderBar();
    await typeAndSubmit('101');
    await waitFor(() =>
      expect(screen.getByText(/Failed to mark runner 101/)).toBeDefined()
    );
  });
});
