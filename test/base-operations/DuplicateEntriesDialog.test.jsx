import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import DuplicateEntriesDialog from '../../src/modules/base-operations/components/DuplicateEntriesDialog';
import TimeUtils from '../../src/services/timeUtils';

// Mock TimeUtils
vi.mock('../../services/timeUtils');

describe('DuplicateEntriesDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnResolve = vi.fn();

  const mockDuplicates = [
    {
      id: 1,
      number: 101,
      checkpoint: 1,
      timestamp: '2024-01-01T10:00:00Z',
      notes: 'First entry'
    },
    {
      id: 2,
      number: 101,
      checkpoint: 1,
      timestamp: '2024-01-01T10:05:00Z',
      notes: 'Second entry'
    },
    {
      id: 3,
      number: 102,
      checkpoint: 2,
      timestamp: '2024-01-01T11:00:00Z',
      notes: 'First entry'
    },
    {
      id: 4,
      number: 102,
      checkpoint: 2,
      timestamp: '2024-01-01T11:02:00Z',
      notes: 'Second entry'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock TimeUtils
    TimeUtils.formatTime.mockImplementation(time => new Date(time).toLocaleString());
  });

  it('renders correctly when open', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    expect(screen.getByText('Resolve Duplicate Entries')).toBeInTheDocument();
    expect(screen.getByText('2 runners with duplicate entries')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={false}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    expect(screen.queryByText('Resolve Duplicate Entries')).not.toBeInTheDocument();
  });

  it('groups duplicates by runner number', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Should show two groups
    expect(screen.getByText('Runner #101')).toBeInTheDocument();
    expect(screen.getByText('Runner #102')).toBeInTheDocument();
  });

  it('shows time differences between entries', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // First group has 5 minutes difference
    expect(screen.getByText('5m 0s')).toBeInTheDocument();
    // Second group has 2 minutes difference
    expect(screen.getByText('2m 0s')).toBeInTheDocument();
  });

  it('handles keep-first resolution strategy', async () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Select keep-first strategy
    fireEvent.click(screen.getByText('Keep First Entry'));

    // Resolve duplicates
    await act(async () => {
      fireEvent.click(screen.getByText('Resolve Duplicates'));
    });

    expect(mockOnResolve).toHaveBeenCalledWith(mockDuplicates, 'keep-first');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles keep-last resolution strategy', async () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Select keep-last strategy
    fireEvent.click(screen.getByText('Keep Last Entry'));

    // Resolve duplicates
    await act(async () => {
      fireEvent.click(screen.getByText('Resolve Duplicates'));
    });

    expect(mockOnResolve).toHaveBeenCalledWith(mockDuplicates, 'keep-last');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles merge resolution strategy', async () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Select merge strategy
    fireEvent.click(screen.getByText('Merge Entries'));

    // Resolve duplicates
    await act(async () => {
      fireEvent.click(screen.getByText('Resolve Duplicates'));
    });

    expect(mockOnResolve).toHaveBeenCalledWith(mockDuplicates, 'merge');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows resolution strategy descriptions', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    expect(screen.getByText('Keep the earliest entry and delete others')).toBeInTheDocument();
    expect(screen.getByText('Keep the latest entry and delete others')).toBeInTheDocument();
    expect(screen.getByText('Combine information from all entries')).toBeInTheDocument();
  });

  it('handles errors during resolution', async () => {
    mockOnResolve.mockRejectedValue(new Error('Resolution failed'));

    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Select strategy and try to resolve
    fireEvent.click(screen.getByText('Keep First Entry'));
    await act(async () => {
      fireEvent.click(screen.getByText('Resolve Duplicates'));
    });

    expect(screen.getByText('Resolution failed')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows processing state during resolution', async () => {
    // Mock resolve to take some time
    mockOnResolve.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Select strategy and start resolution
    fireEvent.click(screen.getByText('Keep First Entry'));
    fireEvent.click(screen.getByText('Resolve Duplicates'));

    // Should show processing state
    expect(await screen.findByText('Processing...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });

  it('highlights selected entries based on strategy', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Select keep-first strategy
    fireEvent.click(screen.getByText('Keep First Entry'));

    // First entries should be highlighted
    const firstEntries = screen.getAllByText('Entry 1 (Earliest)');
    firstEntries.forEach(entry => {
      expect(entry.closest('div')).toHaveClass('bg-green-50');
    });

    // Select keep-last strategy
    fireEvent.click(screen.getByText('Keep Last Entry'));

    // Last entries should be highlighted
    const lastEntries = screen.getAllByText(/Entry .* \(Latest\)/);
    lastEntries.forEach(entry => {
      expect(entry.closest('div')).toHaveClass('bg-green-50');
    });
  });

  it('requires strategy selection before resolution', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    // Try to resolve without selecting strategy
    fireEvent.click(screen.getByText('Resolve Duplicates'));

    expect(mockOnResolve).not.toHaveBeenCalled();
  });

  it('shows entry details', () => {
    render(
      <DuplicateEntriesDialog
        isOpen={true}
        onClose={mockOnClose}
        duplicates={mockDuplicates}
        onResolve={mockOnResolve}
      />
    );

    mockDuplicates.forEach(entry => {
      expect(screen.getByText(`Checkpoint ${entry.checkpoint}`)).toBeInTheDocument();
      expect(screen.getByText(entry.notes)).toBeInTheDocument();
      expect(screen.getByText(new Date(entry.timestamp).toLocaleString())).toBeInTheDocument();
    });
  });
});
