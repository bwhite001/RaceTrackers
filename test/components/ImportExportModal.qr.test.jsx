/**
 * Tests that the "Scan QR Code" button in ImportExportModal's import tab
 * opens the QRScannerModal, and that scanning a QR populates the import textarea.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ImportExportModal from '../../src/components/ImportExport/ImportExportModal.jsx';

// --- Module-level mocks ---

vi.mock('../../src/modules/race-maintenance/store/raceMaintenanceStore', () => ({
  default: vi.fn(() => ({
    races: [],
    currentRaceId: null,
  })),
}));

vi.mock('../../src/store/useRaceStore.js', () => ({
  useRaceStore: vi.fn(() => ({
    races: [],
    currentRaceId: null,
    checkpoints: [],
  })),
}));

vi.mock('../../src/services/import-export/ExportService.js', () => ({
  ExportService: { exportRace: vi.fn(), downloadExport: vi.fn() },
}));

vi.mock('../../src/services/import-export/ImportService.js', () => ({
  ImportService: { importRace: vi.fn() },
}));

vi.mock('../../src/components/ImportExport/ConflictResolutionDialog.jsx', () => ({
  default: () => null,
}));

// Mock QRScannerModal so we can control onScan in tests
let capturedOnScan = null;
vi.mock('../../src/components/Shared/QRScannerModal.jsx', () => ({
  default: ({ isOpen, onScan, onClose }) => {
    if (!isOpen) return null;
    capturedOnScan = onScan;
    return (
      <div data-testid="qr-scanner-modal">
        <button onClick={onClose}>Close Scanner</button>
      </div>
    );
  },
}));

// ---

describe('ImportExportModal — QR import integration', () => {
  beforeEach(() => {
    capturedOnScan = null;
  });

  function renderModal() {
    return render(
      <ImportExportModal isOpen={true} onClose={vi.fn()} />
    );
  }

  function switchToImportTab() {
    const importTab = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importTab);
  }

  it('shows "Scan QR Code" button on the import tab', () => {
    renderModal();
    switchToImportTab();
    expect(screen.getByRole('button', { name: /scan qr code/i })).toBeDefined();
  });

  it('opens QRScannerModal when "Scan QR Code" is clicked', () => {
    renderModal();
    switchToImportTab();
    fireEvent.click(screen.getByRole('button', { name: /scan qr code/i }));
    expect(screen.getByTestId('qr-scanner-modal')).toBeDefined();
  });

  it('populates the import textarea with scanned QR data', async () => {
    renderModal();
    switchToImportTab();
    fireEvent.click(screen.getByRole('button', { name: /scan qr code/i }));

    expect(capturedOnScan).not.toBeNull();
    const fakeJson = JSON.stringify({ version: '1.0', raceName: 'Test Race' });
    capturedOnScan(fakeJson);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/paste race configuration json/i);
      expect(textarea.value).toBe(fakeJson);
    });
  });

  it('closes QRScannerModal after successful scan', async () => {
    renderModal();
    switchToImportTab();
    fireEvent.click(screen.getByRole('button', { name: /scan qr code/i }));

    capturedOnScan(JSON.stringify({ test: true }));

    await waitFor(() => {
      expect(screen.queryByTestId('qr-scanner-modal')).toBeNull();
    });
  });
});
