import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DistributeRaceModal from 'modules/race-maintenance/components/DistributeRaceModal';

// Mock StorageService
vi.mock('services/storage', () => ({
  default: {
    exportRaceConfig: vi.fn().mockResolvedValue({
      schemaVersion: 8,
      raceConfig: {
        name: 'Test Race',
        date: '2026-03-02',
        checkpoints: [{ number: 1, name: 'CP1' }],
        minRunner: 1,
        maxRunner: 100,
      },
      runners: [{ number: 1, status: 'not-started' }],
      checkpointRunners: [],
      exportedAt: '2026-03-02T00:00:00Z',
      version: '3.0.0',
      exportType: 'full-race-data',
    }),
  },
}));

describe('DistributeRaceModal', () => {
  const defaultProps = {
    isOpen: true,
    raceId: 1,
    raceName: 'Test Race',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL and anchor for download
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it('renders modal title', () => {
    render(<DistributeRaceModal {...defaultProps} />);
    expect(screen.getByText(/Distribute Race Setup/i)).toBeInTheDocument();
  });

  it('shows the race name in the modal', () => {
    render(<DistributeRaceModal {...defaultProps} />);
    expect(screen.getByText(/Test Race/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<DistributeRaceModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows Download, Copy, and Email buttons after loading', async () => {
    render(<DistributeRaceModal {...defaultProps} />);
    expect(await screen.findByRole('button', { name: /download/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /email/i })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<DistributeRaceModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Distribute Race Setup/i)).not.toBeInTheDocument();
  });

  it('clicking Download triggers URL.createObjectURL', async () => {
    render(<DistributeRaceModal {...defaultProps} />);
    const downloadBtn = await screen.findByRole('button', { name: /download/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalled());
  });
});
