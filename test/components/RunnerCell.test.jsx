import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RunnerCell from 'components/Shared/RunnerGrid/RunnerCell';
import { RUNNER_STATUSES } from 'types/index.js';

const baseRunner = {
  number: 42,
  status: RUNNER_STATUSES.NOT_STARTED,
  recordedTime: null,
  calledIn: false,
};

describe('RunnerCell', () => {
  it('renders bib number', () => {
    render(<RunnerCell runner={baseRunner} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('does not show timestamp when recordedTime is null', () => {
    render(<RunnerCell runner={baseRunner} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.queryByTestId('cell-time')).not.toBeInTheDocument();
  });

  it('shows cell-time when recordedTime is set', () => {
    const runner = { ...baseRunner, recordedTime: '2024-01-01T10:30:00.000Z' };
    render(<RunnerCell runner={runner} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.getByTestId('cell-time')).toBeInTheDocument();
  });

  it('calls onMark with runner.number on click', () => {
    const onMark = vi.fn();
    render(<RunnerCell runner={baseRunner} onMark={onMark} onUnmark={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onMark).toHaveBeenCalledWith(42);
  });

  it('calls onUnmark with runner.number on double-click when calledIn is false', () => {
    const onUnmark = vi.fn();
    render(<RunnerCell runner={baseRunner} onMark={vi.fn()} onUnmark={onUnmark} />);
    fireEvent.dblClick(screen.getByRole('button'));
    expect(onUnmark).toHaveBeenCalledWith(42);
  });

  it('does NOT call onUnmark on double-click when calledIn is true', () => {
    const onUnmark = vi.fn();
    const runner = { ...baseRunner, calledIn: true };
    render(<RunnerCell runner={runner} onMark={vi.fn()} onUnmark={onUnmark} />);
    fireEvent.dblClick(screen.getByRole('button'));
    expect(onUnmark).not.toHaveBeenCalled();
  });

  it('button is disabled when isLoading is true', () => {
    render(<RunnerCell runner={baseRunner} isLoading={true} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('button is disabled when calledIn is true', () => {
    const runner = { ...baseRunner, calledIn: true };
    render(<RunnerCell runner={runner} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows cell-locked indicator when calledIn is true', () => {
    const runner = { ...baseRunner, calledIn: true };
    render(<RunnerCell runner={runner} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.getByTestId('cell-locked')).toBeInTheDocument();
  });

  it('applies status-passed class for PASSED status', () => {
    const runner = { ...baseRunner, status: RUNNER_STATUSES.PASSED };
    render(<RunnerCell runner={runner} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.getByRole('button').className).toContain('status-passed');
  });

  it('applies status-not-started class for NOT_STARTED status', () => {
    render(<RunnerCell runner={baseRunner} onMark={vi.fn()} onUnmark={vi.fn()} />);
    expect(screen.getByRole('button').className).toContain('status-not-started');
  });
});
