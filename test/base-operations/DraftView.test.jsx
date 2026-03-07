import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DraftView from 'modules/base-operations/components/DraftView';

const baseProps = {
  runners: [],
  checkpointName: 'CP1 — Start',
  commonTime: '10:00',
  existingRecords: [],
  onRemove: vi.fn(),
  onClear: vi.fn(),
  onRecord: vi.fn(),
  onCancel: vi.fn(),
  onUpdate: vi.fn(),
  editingBatch: null,
  loading: false,
};

describe('DraftView — empty state', () => {
  it('shows empty-state message when no runners', () => {
    render(<DraftView {...baseProps} />);
    expect(screen.getByText(/no runners yet/i)).toBeInTheDocument();
  });

  it('Record button is disabled when runners list is empty', () => {
    render(<DraftView {...baseProps} />);
    expect(screen.getByRole('button', { name: /record/i })).toBeDisabled();
  });
});

describe('DraftView — with runners', () => {
  const runners = [
    { bib: 23, addedAt: '14:00:12' },
    { bib: 45, addedAt: '14:00:15' },
  ];

  it('renders a row for each runner', () => {
    render(<DraftView {...baseProps} runners={runners} />);
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('calls onRemove when × button is clicked', () => {
    const onRemove = vi.fn();
    render(<DraftView {...baseProps} runners={runners} onRemove={onRemove} />);
    fireEvent.click(screen.getAllByRole('button', { name: /remove runner/i })[0]);
    expect(onRemove).toHaveBeenCalledWith(23);
  });

  it('Record button shows count and is enabled', () => {
    render(<DraftView {...baseProps} runners={runners} />);
    expect(screen.getByRole('button', { name: /record 2 runners/i })).toBeEnabled();
  });

  it('calls onRecord when Record button is clicked', () => {
    const onRecord = vi.fn();
    render(<DraftView {...baseProps} runners={runners} onRecord={onRecord} />);
    fireEvent.click(screen.getByRole('button', { name: /record 2 runners/i }));
    expect(onRecord).toHaveBeenCalled();
  });

  it('calls onClear when Clear Draft button is clicked', () => {
    const onClear = vi.fn();
    render(<DraftView {...baseProps} runners={runners} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: /clear draft/i }));
    expect(onClear).toHaveBeenCalled();
  });
});

describe('DraftView — duplicate warning', () => {
  it('shows warning banner for duplicate bib', () => {
    render(
      <DraftView
        {...baseProps}
        runners={[{ bib: 45, addedAt: '14:00:15' }]}
        existingRecords={[45]}
      />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/runner 45.*already/i)).toBeInTheDocument();
  });
});

describe('DraftView — edit mode', () => {
  const editingBatch = { id: 'b1', batchNumber: 2, originalBibs: [23, 45] };
  const runners = [
    { bib: 23, addedAt: '14:00:12', isOriginal: true },
    { bib: 45, addedAt: '14:00:15', isOriginal: true },
    { bib: 89, addedAt: '14:01:00', isOriginal: false },
  ];

  it('shows EDITING BATCH header', () => {
    render(<DraftView {...baseProps} runners={runners} editingBatch={editingBatch} />);
    expect(screen.getByText(/editing batch/i)).toBeInTheDocument();
  });

  it('shows Cancel and Update Batch buttons instead of Clear/Record', () => {
    render(<DraftView {...baseProps} runners={runners} editingBatch={editingBatch} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update batch/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear draft/i })).not.toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<DraftView {...baseProps} runners={runners} editingBatch={editingBatch} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
