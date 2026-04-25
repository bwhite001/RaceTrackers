/**
 * Tests for RadioOperatorView — scan incoming QR batches then call them in.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('modules/checkpoint-operations/services/TransferService', () => ({
  default: {
    applyToCheckpointRunners: vi.fn(() =>
      Promise.resolve({ imported: 5, updated: 0, skipped: 0 })
    ),
  },
}));

vi.mock('modules/checkpoint-operations/store/checkpointStore', () => ({
  default: vi.fn(() => ({
    loadCheckpointData: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: vi.fn(() => ({
    currentRace: { id: 1, name: 'Test Race' },
  })),
}));

const mockDecodedPacket = {
  checkpointNumber: 3,
  count: 5,
  entries: [{ rn: 101, at: new Date().toISOString(), st: 'passed' }],
  deviceId: 'abc123',
  isDelta: true,
};

vi.mock(
  'modules/checkpoint-operations/components/transfer/QRScannerCamera',
  () => ({
    default: ({ onDecoded, onCancel }) => (
      <div data-testid="qr-scanner">
        <button onClick={() => onDecoded(mockDecodedPacket)}>Simulate Scan</button>
        <button onClick={onCancel}>Cancel Scan</button>
      </div>
    ),
  })
);

vi.mock(
  'modules/checkpoint-operations/components/transfer/TransferSummaryModal',
  () => ({
    default: ({ packet, stats, onImport, onCancel, importing }) =>
      packet ? (
        <div data-testid="transfer-summary-modal">
          <button onClick={onImport} disabled={importing || !stats}>
            Import
          </button>
          <button onClick={onCancel}>Cancel Import</button>
        </div>
      ) : null,
  })
);

vi.mock('components/Checkpoint/CalloutSheet', () => ({
  default: () => <div data-testid="callout-sheet">CalloutSheet</div>,
}));

import RadioOperatorView from 'modules/checkpoint-operations/components/RadioOperatorView';
import TransferService from 'modules/checkpoint-operations/services/TransferService';
import useCheckpointStore from 'modules/checkpoint-operations/store/checkpointStore';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RadioOperatorView', () => {
  const defaultProps = { raceId: 1, checkpointNumber: 3 };

  beforeEach(() => vi.clearAllMocks());

  it('renders Scan QR button and callout sheet', () => {
    render(<RadioOperatorView {...defaultProps} />);
    expect(screen.getByRole('button', { name: /scan qr/i })).toBeInTheDocument();
    expect(screen.getByTestId('callout-sheet')).toBeInTheDocument();
  });

  it('tapping Scan QR shows the scanner', () => {
    render(<RadioOperatorView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));
    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
  });

  it('a successful scan shows the transfer summary modal', async () => {
    render(<RadioOperatorView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByText('Simulate Scan'));
    });

    expect(screen.getByTestId('transfer-summary-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
  });

  it('importing applies runners and reloads checkpoint data', async () => {
    const loadCheckpointData = vi.fn(() => Promise.resolve());
    useCheckpointStore.mockReturnValue({ loadCheckpointData });

    render(<RadioOperatorView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByText('Simulate Scan'));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    });

    expect(TransferService.applyToCheckpointRunners).toHaveBeenCalledWith(
      1,
      mockDecodedPacket
    );
    expect(loadCheckpointData).toHaveBeenCalledWith(1, 3);
  });

  it('shows summary modal with disabled import button when dry-run fails', async () => {
    TransferService.applyToCheckpointRunners
      .mockRejectedValueOnce(new Error('Dry run failed'));

    render(<RadioOperatorView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByText('Simulate Scan'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('transfer-summary-modal')).toBeInTheDocument()
    );

    expect(screen.getByRole('button', { name: /^import$/i })).toBeDisabled();
  });

  it('cancelling scan hides the scanner', () => {
    render(<RadioOperatorView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));
    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel Scan'));
    expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
  });

  it('import error is shown when applyToCheckpointRunners throws', async () => {
    TransferService.applyToCheckpointRunners
      .mockResolvedValueOnce({ imported: 5, updated: 0, skipped: 0 }) // dry-run succeeds
      .mockRejectedValueOnce(new Error('DB write failed'));             // import fails

    render(<RadioOperatorView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByText('Simulate Scan'));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/import failed/i);
    });
  });

  it('reopening the scanner clears a previous import error', async () => {
    TransferService.applyToCheckpointRunners
      .mockResolvedValueOnce({ imported: 5, updated: 0, skipped: 0 }) // dry-run
      .mockRejectedValueOnce(new Error('DB write failed'));            // import fails

    render(<RadioOperatorView {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByText('Simulate Scan'));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^import$/i }));
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/import failed/i);
    });

    // Re-open scanner — error should be cleared
    fireEvent.click(screen.getByRole('button', { name: /scan qr/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
