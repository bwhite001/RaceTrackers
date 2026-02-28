import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockImportCheckpointResults = vi.fn();

vi.mock('modules/base-operations/store/baseOperationsStore', () => ({
  default: vi.fn(() => ({
    currentRaceId: 'race-1',
  })),
}));

vi.mock('services/import-export/ImportService', () => ({
  ImportService: {
    importCheckpointResults: (...args) => mockImportCheckpointResults(...args),
  },
}));

import CheckpointImportPanel from 'components/BaseStation/CheckpointImportPanel.jsx';

function renderPanel() {
  return render(<CheckpointImportPanel />);
}

const GOOD_PKG = JSON.stringify({
  version: '1.0',
  exportType: 'checkpoint-results',
  data: { raceId: 'race-1', checkpointNumber: 3, runners: [] },
});

function makeFile(content, name = 'cp3.json') {
  const file = new File([content], name, { type: 'application/json' });
  // jsdom File doesn't implement .text() — polyfill it
  file.text = () => Promise.resolve(content);
  return file;
}

describe('CheckpointImportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Select Checkpoint File" button', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /select checkpoint file/i })).toBeDefined();
  });

  it('shows success message after a successful import', async () => {
    mockImportCheckpointResults.mockResolvedValue({
      success: true,
      checkpointNumber: 3,
      totalRunners: 5,
    });
    renderPanel();
    const input = screen.getByLabelText('Select checkpoint results file');
    fireEvent.change(input, { target: { files: [makeFile(GOOD_PKG)] } });

    await waitFor(() =>
      expect(screen.getByText(/checkpoint 3 imported — 5 runners/i)).toBeDefined()
    );
  });

  it('shows error message when import fails', async () => {
    mockImportCheckpointResults.mockResolvedValue({
      success: false,
      error: 'Race ID mismatch',
    });
    renderPanel();
    const input = screen.getByLabelText('Select checkpoint results file');
    fireEvent.change(input, { target: { files: [makeFile(GOOD_PKG)] } });

    await waitFor(() =>
      expect(screen.getByText(/race id mismatch/i)).toBeDefined()
    );
  });

  it('shows error message when file is invalid JSON', async () => {
    renderPanel();
    const input = screen.getByLabelText('Select checkpoint results file');
    fireEvent.change(input, { target: { files: [makeFile('not-json', 'bad.json')] } });

    await waitFor(() =>
      expect(screen.getByText(/could not read file/i)).toBeDefined()
    );
  });

  it('calls ImportService.importCheckpointResults with the parsed package', async () => {
    mockImportCheckpointResults.mockResolvedValue({
      success: true,
      checkpointNumber: 3,
      totalRunners: 0,
    });
    renderPanel();
    const input = screen.getByLabelText('Select checkpoint results file');
    fireEvent.change(input, { target: { files: [makeFile(GOOD_PKG)] } });

    await waitFor(() => expect(mockImportCheckpointResults).toHaveBeenCalledOnce());
    expect(mockImportCheckpointResults.mock.calls[0][1]).toBe('race-1');
  });
});
