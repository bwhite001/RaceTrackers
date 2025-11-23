import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictResolutionDialog } from '../../components/ImportExport/ConflictResolutionDialog';

describe('ConflictResolutionDialog', () => {
  const mockConflicts = [
    {
      id: 1,
      type: 'race',
      existing: {
        name: 'Old Race Name',
        status: 'active',
      },
      incoming: {
        name: 'New Race Name',
        status: 'active',
      },
      existingValue: '2024-01-01T10:00:00Z',
      incomingValue: '2024-01-02T10:00:00Z',
    },
    {
      id: 2,
      type: 'runner',
      existing: {
        name: 'John Doe',
        status: 'registered',
      },
      incoming: {
        name: 'John Doe',
        status: 'started',
      },
      existingValue: '2024-01-01T10:00:00Z',
      incomingValue: '2024-01-02T10:00:00Z',
    },
  ];

  it('renders conflict count correctly', () => {
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/2 conflicts detected/i)).toBeInTheDocument();
  });

  it('displays all conflicts', () => {
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('race')).toBeInTheDocument();
    expect(screen.getByText('runner')).toBeInTheDocument();
  });

  it('allows selecting existing version', () => {
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const existingButtons = screen.getAllByText('Keep Existing');
    fireEvent.click(existingButtons[0]);

    // Text is split across elements, so use a function matcher
    expect(screen.getByText((content, element) => {
      return element?.textContent === '1 of 2 conflicts resolved';
    })).toBeInTheDocument();
  });

  it('disables submit until all conflicts resolved', () => {
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const submitButton = screen.getByRole('button', { name: /import \(0\/2 resolved\)/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit when all conflicts resolved', () => {
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const existingButtons = screen.getAllByText('Keep Existing');
    existingButtons.forEach(button => fireEvent.click(button));

    const submitButton = screen.getByRole('button', { name: /import \(2\/2 resolved\)/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onResolve with resolutions when submitted', () => {
    const onResolve = vi.fn();
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={onResolve}
        onCancel={vi.fn()}
      />
    );

    const existingButtons = screen.getAllByText('Keep Existing');
    existingButtons.forEach(button => fireEvent.click(button));

    const submitButton = screen.getByRole('button', { name: /import \(2\/2 resolved\)/i });
    fireEvent.click(submitButton);

    expect(onResolve).toHaveBeenCalledWith({
      1: 'existing',
      2: 'existing',
    });
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={vi.fn()}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('allows mixing existing and incoming selections', () => {
    const onResolve = vi.fn();
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={onResolve}
        onCancel={vi.fn()}
      />
    );

    const existingButtons = screen.getAllByText('Keep Existing');
    const incomingButtons = screen.getAllByText('Use Incoming');

    // Select existing for first conflict
    fireEvent.click(existingButtons[0]);
    // Select incoming for second conflict
    fireEvent.click(incomingButtons[1]);

    const submitButton = screen.getByRole('button', { name: /import \(2\/2 resolved\)/i });
    fireEvent.click(submitButton);

    expect(onResolve).toHaveBeenCalledWith({
      1: 'existing',
      2: 'incoming',
    });
  });

  it('shows resolution status for each conflict', () => {
    render(
      <ConflictResolutionDialog
        conflicts={mockConflicts}
        onResolve={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const existingButtons = screen.getAllByText('Keep Existing');
    fireEvent.click(existingButtons[0]);

    // Text is split across elements (strong tag), so use a function matcher
    expect(screen.getByText((content, element) => {
      return element?.textContent === '✓ Resolved: Will keep existing version';
    })).toBeInTheDocument();
  });
});
