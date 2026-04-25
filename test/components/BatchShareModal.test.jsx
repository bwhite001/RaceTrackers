/**
 * Tests for BatchShareModal — the marker's batch share flow.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('modules/checkpoint-operations/services/TransferService', () => ({
  default: {
    getLastShareTimestamp: vi.fn(() => Promise.resolve(null)),
    getPendingBatch: vi.fn(() => Promise.resolve(false)),
    buildPayload: vi.fn(() => Promise.resolve({ count: 5, entries: [], isDelta: true })),
    savePendingBatch: vi.fn(() => Promise.resolve()),
    saveLastShareTimestamp: vi.fn(() => Promise.resolve()),
    clearPendingBatch: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock(
  'modules/checkpoint-operations/components/transfer/QRDisplayFullscreen',
  () => ({
    default: ({ onDone, onCancel }) => (
      <div data-testid="qr-display">
        <button onClick={onDone}>Done QR</button>
        <button onClick={onCancel}>Cancel QR</button>
      </div>
    ),
  })
);

import BatchShareModal from 'modules/checkpoint-operations/components/transfer/BatchShareModal';
import TransferService from 'modules/checkpoint-operations/services/TransferService';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BatchShareModal', () => {
  const defaultProps = {
    isOpen: true,
    raceId: 1,
    checkpointNumber: 3,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TransferService.getLastShareTimestamp.mockResolvedValue(null);
    TransferService.getPendingBatch.mockResolvedValue(false);
    TransferService.buildPayload.mockResolvedValue({ count: 5, entries: [], isDelta: true });
  });

  it('shows entry count in preview phase', async () => {
    render(<BatchShareModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText(/5/)).toBeInTheDocument());
    expect(screen.getByText(/new entr/i)).toBeInTheDocument();
  });

  it('shows "First share this session" when no lastShareTimestamp', async () => {
    render(<BatchShareModal {...defaultProps} />);
    await waitFor(() => screen.getByText(/First share this session/i));
  });

  it('shows retry warning when pending batch is true', async () => {
    TransferService.getPendingBatch.mockResolvedValue(true);
    render(<BatchShareModal {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText(/previous share may not have been received/i)).toBeInTheDocument()
    );
  });

  it('shows "No new entries" when count is 0', async () => {
    TransferService.buildPayload.mockResolvedValue({ count: 0, entries: [], isDelta: true });
    render(<BatchShareModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText(/no new entries/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /generate qr/i })).toBeDisabled();
  });

  it('clicking Generate QR sets pending batch flag and shows QR display', async () => {
    render(<BatchShareModal {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /generate qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate qr/i }));
    });

    expect(TransferService.savePendingBatch).toHaveBeenCalledWith(1, 3);
    expect(screen.getByTestId('qr-display')).toBeInTheDocument();
  });

  it('tapping Done on QR transitions to confirm phase', async () => {
    render(<BatchShareModal {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /generate qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate qr/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Done QR'));
    });

    expect(screen.getByText(/confirm batch sent/i)).toBeInTheDocument();
  });

  it('confirming sent saves timestamp and clears pending flag, then calls onClose', async () => {
    const onClose = vi.fn();
    render(<BatchShareModal {...defaultProps} onClose={onClose} />);
    await waitFor(() => screen.getByRole('button', { name: /generate qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate qr/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Done QR'));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /yes, batch was received/i }));
    });

    expect(TransferService.saveLastShareTimestamp).toHaveBeenCalledWith(1, 3);
    expect(TransferService.clearPendingBatch).toHaveBeenCalledWith(1, 3);
    expect(onClose).toHaveBeenCalled();
  });

  it('cancelling from QR phase calls onClose without saving timestamp', async () => {
    const onClose = vi.fn();
    render(<BatchShareModal {...defaultProps} onClose={onClose} />);
    await waitFor(() => screen.getByRole('button', { name: /generate qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate qr/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel QR'));
    });

    expect(TransferService.saveLastShareTimestamp).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Back to QR from confirm phase shows QR display again', async () => {
    render(<BatchShareModal {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /generate qr/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate qr/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Done QR'));
    });

    expect(screen.getByText(/confirm batch sent/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /show qr again/i }));
    });

    expect(screen.getByTestId('qr-display')).toBeInTheDocument();
  });

  it('cancel from confirm phase calls onClose without saving timestamp', async () => {
    const onClose = vi.fn();
    render(<BatchShareModal {...defaultProps} onClose={onClose} />);
    await waitFor(() => screen.getByRole('button', { name: /generate qr/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /generate qr/i })); });
    await act(async () => { fireEvent.click(screen.getByText('Done QR')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /cancel/i })); });
    expect(TransferService.saveLastShareTimestamp).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('X button in preview phase calls onClose without saving timestamp', async () => {
    const onClose = vi.fn();
    render(<BatchShareModal {...defaultProps} onClose={onClose} />);
    await waitFor(() => screen.getByRole('button', { name: /close/i }));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(TransferService.saveLastShareTimestamp).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
