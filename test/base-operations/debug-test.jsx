import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import DeletedEntriesView from '../../src/modules/base-operations/components/DeletedEntriesView';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../src/services/timeUtils';

vi.mock('../../src/modules/base-operations/store/baseOperationsStore');
vi.mock('../../src/services/timeUtils');

describe('debug', () => {
  it('shows what expanded details look like', () => {
    const mockLoadDeletedEntries = vi.fn();
    const mockRestoreEntry = vi.fn();
    const mockDeletedEntries = [
      {
        id: 1,
        originalEntry: { id: 10, number: 101, checkpoint: 1, timestamp: '2024-01-01T10:00:00Z', notes: 'Original entry' },
        deletedAt: '2024-01-01T10:30:00Z',
        deletedBy: 'operator1',
        deletionReason: 'Error correction',
      },
      {
        id: 2,
        originalEntry: { id: 20, number: 102, checkpoint: 2, timestamp: '2024-01-01T11:00:00Z', notes: 'Another entry' },
        deletedAt: '2024-01-01T11:30:00Z',
        deletedBy: 'operator2',
        deletionReason: 'Duplicate entry',
      }
    ];
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    useBaseOperationsStore.mockImplementation(() => ({
      deletedEntries: mockDeletedEntries, loadDeletedEntries: mockLoadDeletedEntries,
      restoreEntry: mockRestoreEntry, loading: false
    }));
    TimeUtils.formatTime.mockImplementation(time => new Date(time).toLocaleString());
    TimeUtils.formatRelative.mockImplementation(() => '30 minutes ago');

    render(<DeletedEntriesView />);
    
    // Open details for the FIRST row shown (which is entry 2 due to sort)
    fireEvent.click(screen.getAllByText('Show Details')[0]);
    
    // Log what's in the body
    console.log('Body HTML after expanding first row:');
    const rows = document.querySelectorAll('tr');
    rows.forEach((row, i) => {
      console.log(`Row ${i}:`, row.textContent.trim().substring(0, 100));
    });
    
    // Check which restore button calls which ID
    mockRestoreEntry.mockResolvedValue(undefined);
    fireEvent.click(screen.getAllByText('Restore')[0]);
    console.log('restoreEntry called with:', mockRestoreEntry.mock.calls);
  });
});
