import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import BackupRestoreDialog from '../../modules/base-operations/components/BackupRestoreDialog';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../services/timeUtils';

// Mock the store and TimeUtils
vi.mock('../../modules/base-operations/store/baseOperationsStore');
vi.mock('../../services/timeUtils');

describe('BackupRestoreDialog', () => {
  const mockCreateBackup = vi.fn();
  const mockRestoreBackup = vi.fn();
  const mockVerifyBackup = vi.fn();
  const mockExportBackup = vi.fn();
  const mockDeleteBackup = vi.fn();
  const mockOnClose = vi.fn();

  const mockBackups = [
    {
      id: 1,
      createdAt: '2024-01-01T10:00:00Z',
      location: 'local',
      size: 1024 * 50, // 50KB
      note: 'Pre-race backup'
    },
    {
      id: 2,
      createdAt: '2024-01-01T11:00:00Z',
      location: 'external',
      size: 1024 * 75, // 75KB
      note: 'Mid-race backup'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      backups: mockBackups,
      createBackup: mockCreateBackup,
      restoreBackup: mockRestoreBackup,
      verifyBackup: mockVerifyBackup,
      exportBackup: mockExportBackup,
      deleteBackup: mockDeleteBackup,
      loading: false
    }));

    // Mock TimeUtils
    TimeUtils.formatTime.mockImplementation(time => new Date(time).toLocaleString());
  });

  it('renders correctly when open', () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Backup & Restore')).toBeInTheDocument();
    expect(screen.getByText(/Manage race data backups/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <BackupRestoreDialog
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Backup & Restore')).not.toBeInTheDocument();
  });

  it('creates local backup', async () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Select local storage
    fireEvent.click(screen.getByLabelText(/Local Storage/i));

    // Add note
    fireEvent.change(screen.getByLabelText(/Backup Note/i), {
      target: { value: 'Test backup' }
    });

    // Create backup
    await act(async () => {
      fireEvent.click(screen.getByText('Create Backup'));
    });

    expect(mockCreateBackup).toHaveBeenCalledWith({
      location: 'local',
      note: 'Test backup'
    });
  });

  it('creates external backup', async () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Select external storage
    fireEvent.click(screen.getByLabelText(/External Storage/i));

    // Create backup
    await act(async () => {
      fireEvent.click(screen.getByText('Create Backup'));
    });

    expect(mockCreateBackup).toHaveBeenCalledWith({
      location: 'external',
      note: null
    });

    // Should trigger export for external backups
    expect(mockExportBackup).toHaveBeenCalled();
  });

  it('restores from backup', async () => {
    // Mock verify to succeed
    mockVerifyBackup.mockResolvedValue(true);

    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Select a backup
    fireEvent.click(screen.getByText('Pre-race backup'));

    // Confirm restore
    window.confirm = vi.fn(() => true);
    await act(async () => {
      fireEvent.click(screen.getByText('Restore Selected Backup'));
    });

    expect(mockVerifyBackup).toHaveBeenCalledWith(1);
    expect(mockRestoreBackup).toHaveBeenCalledWith(1);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents restore if verification fails', async () => {
    // Mock verify to fail
    mockVerifyBackup.mockResolvedValue(false);

    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Select a backup
    fireEvent.click(screen.getByText('Pre-race backup'));

    // Try to restore
    window.confirm = vi.fn(() => true);
    await act(async () => {
      fireEvent.click(screen.getByText('Restore Selected Backup'));
    });

    expect(mockVerifyBackup).toHaveBeenCalledWith(1);
    expect(mockRestoreBackup).not.toHaveBeenCalled();
    expect(screen.getByText(/Backup verification failed/i)).toBeInTheDocument();
  });

  it('handles backup deletion', async () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    // Delete a backup
    const deleteButtons = screen.getAllByTitle('Delete backup');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockDeleteBackup).toHaveBeenCalledWith(1);
  });

  it('exports existing backup', async () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Export a backup
    const exportButtons = screen.getAllByTitle('Export backup');
    await act(async () => {
      fireEvent.click(exportButtons[0]);
    });

    expect(mockExportBackup).toHaveBeenCalledWith(1);
  });

  it('shows loading state during operations', async () => {
    // Mock backup creation to take time
    mockCreateBackup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Start backup creation
    fireEvent.click(screen.getByText('Create Backup'));

    // Should show loading state
    expect(await screen.findByText('Creating...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
    });
  });

  it('shows backup details', () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    mockBackups.forEach(backup => {
      expect(screen.getByText(new Date(backup.createdAt).toLocaleString())).toBeInTheDocument();
      expect(screen.getByText(backup.note)).toBeInTheDocument();
      expect(screen.getByText(`${(backup.size / 1024).toFixed(1)} KB`)).toBeInTheDocument();
    });
  });

  it('handles errors during backup creation', async () => {
    mockCreateBackup.mockRejectedValue(new Error('Backup failed'));

    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Try to create backup
    await act(async () => {
      fireEvent.click(screen.getByText('Create Backup'));
    });

    expect(screen.getByText('Failed to create backup')).toBeInTheDocument();
  });

  it('handles errors during restore', async () => {
    mockRestoreBackup.mockRejectedValue(new Error('Restore failed'));
    mockVerifyBackup.mockResolvedValue(true);

    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Select a backup
    fireEvent.click(screen.getByText('Pre-race backup'));

    // Try to restore
    window.confirm = vi.fn(() => true);
    await act(async () => {
      fireEvent.click(screen.getByText('Restore Selected Backup'));
    });

    expect(screen.getByText('Failed to restore from backup')).toBeInTheDocument();
  });

  it('requires backup selection for restore', () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Try to restore without selection
    fireEvent.click(screen.getByText('Restore Selected Backup'));

    expect(mockRestoreBackup).not.toHaveBeenCalled();
  });

  it('shows appropriate warning messages', () => {
    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Restoring will overwrite current data/i)).toBeInTheDocument();
    expect(screen.getByText(/All backups are verified before restore/i)).toBeInTheDocument();
  });

  it('disables buttons during loading', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      backups: mockBackups,
      createBackup: mockCreateBackup,
      loading: true
    }));

    render(
      <BackupRestoreDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Create Backup')).toBeDisabled();
    expect(screen.getByText('Restore Selected Backup')).toBeDisabled();
  });
});
