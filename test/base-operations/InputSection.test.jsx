import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InputSection from 'modules/base-operations/components/InputSection';

const checkpoints = [
  { number: 1, name: 'Start' },
  { number: 3, name: 'Ridgeline' },
];

describe('InputSection', () => {
  it('renders checkpoint dropdown, time input, and bib input', () => {
    render(
      <InputSection
        checkpoints={checkpoints}
        onCheckpointChange={vi.fn()}
        onTimeChange={vi.fn()}
        onBibEntered={vi.fn()}
        disabled={false}
      />
    );
    expect(screen.getByRole('combobox', { name: /checkpoint/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/common time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bib numbers/i)).toBeInTheDocument();
  });

  it('calls onCheckpointChange when checkpoint is selected', () => {
    const onCheckpointChange = vi.fn();
    render(
      <InputSection
        checkpoints={checkpoints}
        onCheckpointChange={onCheckpointChange}
        onTimeChange={vi.fn()}
        onBibEntered={vi.fn()}
        disabled={false}
      />
    );
    fireEvent.change(screen.getByRole('combobox', { name: /checkpoint/i }), {
      target: { value: '3' },
    });
    expect(onCheckpointChange).toHaveBeenCalledWith(3);
  });

  it('calls onBibEntered with parsed bibs when Enter is pressed', () => {
    const onBibEntered = vi.fn();
    render(
      <InputSection
        checkpoints={checkpoints}
        checkpointNumber={1}
        commonTime="10:00"
        onCheckpointChange={vi.fn()}
        onTimeChange={vi.fn()}
        onBibEntered={onBibEntered}
        disabled={false}
      />
    );
    const bibInput = screen.getByLabelText(/bib numbers/i);
    fireEvent.change(bibInput, { target: { value: '42' } });
    fireEvent.keyDown(bibInput, { key: 'Enter' });
    expect(onBibEntered).toHaveBeenCalledWith([42]);
  });

  it('parses ranges: "101, 105-107" → [101, 105, 106, 107]', () => {
    const onBibEntered = vi.fn();
    render(
      <InputSection
        checkpoints={checkpoints}
        checkpointNumber={1}
        commonTime="10:00"
        onCheckpointChange={vi.fn()}
        onTimeChange={vi.fn()}
        onBibEntered={onBibEntered}
        disabled={false}
      />
    );
    const bibInput = screen.getByLabelText(/bib numbers/i);
    fireEvent.change(bibInput, { target: { value: '101, 105-107' } });
    fireEvent.keyDown(bibInput, { key: 'Enter' });
    expect(onBibEntered).toHaveBeenCalledWith([101, 105, 106, 107]);
  });

  it('shows future-time warning when time is ahead of now', () => {
    render(
      <InputSection
        checkpoints={checkpoints}
        commonTime="23:59"
        onCheckpointChange={vi.fn()}
        onTimeChange={vi.fn()}
        onBibEntered={vi.fn()}
        disabled={false}
      />
    );
    expect(screen.getByText(/time is in the future/i)).toBeInTheDocument();
  });

  it('locks fields when locked prop is true (edit mode)', () => {
    render(
      <InputSection
        checkpoints={checkpoints}
        checkpointNumber={1}
        commonTime="10:00"
        locked={true}
        onCheckpointChange={vi.fn()}
        onTimeChange={vi.fn()}
        onBibEntered={vi.fn()}
        disabled={false}
      />
    );
    expect(screen.getByRole('combobox', { name: /checkpoint/i })).toBeDisabled();
    expect(screen.getByLabelText(/common time/i)).toBeDisabled();
  });
});
