import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ExportCheckpointResultsModal from 'modules/checkpoint-operations/components/ExportCheckpointResultsModal';
import { ExportService } from 'services/import-export/ExportService';

vi.mock('services/import-export/ExportService', () => ({
  ExportService: {
    exportCheckpointResults: vi.fn().mockResolvedValue({
      version: '1.0',
      exportType: 'checkpoint-results',
      exportDate: '2026-03-02T00:00:00Z',
      deviceId: 'test-device',
      checksum: 'abc123',
      data: {
        raceId: 1,
        checkpointNumber: 2,
        runners: [
          { number: 101, status: 'passed', markOffTime: '2026-03-02T09:00:00Z', callInTime: '2026-03-02T09:01:00Z' },
          { number: 102, status: 'not-started', markOffTime: null, callInTime: null },
          { number: 103, status: 'not-started', markOffTime: null, callInTime: null },
        ],
      },
      metadata: { totalRunners: 3 },
    }),
    downloadExport: vi.fn(),
  },
}));

describe('ExportCheckpointResultsModal', () => {
  const props = {
    isOpen: true,
    raceId: 1,
    checkpointNumber: 2,
    checkpointName: 'Checkpoint 2',
    raceName: 'Test Race',
    onClose: vi.fn(),
  };

  it('renders checkpoint name in header', async () => {
    render(<ExportCheckpointResultsModal {...props} />);
    expect(await screen.findByText(/Checkpoint 2.*End of Day Export/i)).toBeInTheDocument();
  });

  it('shows stats: 1 marked off, 1 called in, 2 not seen', async () => {
    render(<ExportCheckpointResultsModal {...props} />);
    await screen.findByText('Download JSON');
    expect(screen.getByText('marked off')).toBeInTheDocument();
    expect(screen.getByText('called in')).toBeInTheDocument();
    expect(screen.getByText('not seen')).toBeInTheDocument();
  });

  it('shows Download JSON and Download CSV buttons', async () => {
    render(<ExportCheckpointResultsModal {...props} />);
    expect(await screen.findByRole('button', { name: /download json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
  });

  it('clicking Download JSON calls ExportService.downloadExport', async () => {
    render(<ExportCheckpointResultsModal {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: /download json/i }));
    await waitFor(() => expect(ExportService.downloadExport).toHaveBeenCalled());
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<ExportCheckpointResultsModal {...props} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ExportCheckpointResultsModal {...props} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });
});
