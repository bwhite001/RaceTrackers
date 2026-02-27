import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QRScannerModal from '../../src/components/Shared/QRScannerModal.jsx';

// Mock jsQR
vi.mock('jsqr', () => ({ default: vi.fn() }));

const mockGetUserMedia = vi.fn();

beforeEach(() => {
  mockGetUserMedia.mockReset();
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('QRScannerModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <QRScannerModal isOpen={false} onScan={vi.fn()} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when isOpen is true', async () => {
    // Block camera so we get the requesting state
    mockGetUserMedia.mockReturnValue(new Promise(() => {}));
    render(<QRScannerModal isOpen={true} onScan={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Scan QR Code')).toBeDefined();
  });

  it('calls onClose when the close button is clicked', async () => {
    mockGetUserMedia.mockReturnValue(new Promise(() => {}));
    const onClose = vi.fn();
    render(<QRScannerModal isOpen={true} onScan={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close scanner'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows error message when camera is denied', async () => {
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    mockGetUserMedia.mockRejectedValue(err);
    render(<QRScannerModal isOpen={true} onScan={vi.fn()} onClose={vi.fn()} />);
    // Wait for the rejected promise to settle
    await vi.waitFor(() => {
      expect(screen.getByText(/Camera permission denied/)).toBeDefined();
    });
  });

  it('shows error message when no camera is found', async () => {
    const err = Object.assign(new Error('no camera'), { name: 'NotFoundError' });
    mockGetUserMedia.mockRejectedValue(err);
    render(<QRScannerModal isOpen={true} onScan={vi.fn()} onClose={vi.fn()} />);
    await vi.waitFor(() => {
      expect(screen.getByText(/No camera found/)).toBeDefined();
    });
  });

  it('shows "Try Again" button after an error', async () => {
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    mockGetUserMedia.mockRejectedValue(err);
    render(<QRScannerModal isOpen={true} onScan={vi.fn()} onClose={vi.fn()} />);
    await vi.waitFor(() => {
      expect(screen.getByText('Try Again')).toBeDefined();
    });
  });

  it('stops camera (getTracks.stop) when modal closes while streaming', async () => {
    const stopFn = vi.fn();
    const fakeStream = {
      getTracks: () => [{ stop: stopFn }],
    };
    mockGetUserMedia.mockResolvedValue(fakeStream);

    const { rerender } = render(
      <QRScannerModal isOpen={true} onScan={vi.fn()} onClose={vi.fn()} />
    );

    // Wait for getUserMedia to resolve
    await vi.waitFor(() => expect(mockGetUserMedia).toHaveBeenCalled());

    rerender(<QRScannerModal isOpen={false} onScan={vi.fn()} onClose={vi.fn()} />);

    expect(stopFn).toHaveBeenCalled();
  });
});
