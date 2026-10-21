import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import QuickEntryBar from 'components/Checkpoint/QuickEntryBar.jsx';

// The VK4WIP redesign (spec §4.5.6) made the quick entry accept several
// numbers at once ("157, 161 163"). Parsing, validation and marking moved to
// Mark off (RunnerGrid) — QuickEntryBar just collects the text.

const getInput = () => screen.getByLabelText('Bib numbers');
const getMark = () => screen.getByRole('button', { name: 'Mark' });

describe('QuickEntryBar', () => {
  it('renders a bib numbers input and a Mark button', () => {
    render(<QuickEntryBar onMark={vi.fn()} />);
    expect(getInput()).toHaveAttribute('id', 'quick-entry-input');
    expect(getInput()).toHaveAttribute('inputmode', 'numeric');
    expect(getMark()).toBeDefined();
  });

  it('Mark is disabled until something is typed', () => {
    render(<QuickEntryBar onMark={vi.fn()} />);
    expect(getMark()).toHaveProperty('disabled', true);
    fireEvent.change(getInput(), { target: { value: '101' } });
    expect(getMark()).toHaveProperty('disabled', false);
  });

  it('passes the whole entry (several numbers) to onMark and clears', async () => {
    const onMark = vi.fn().mockResolvedValue(undefined);
    render(<QuickEntryBar onMark={onMark} />);
    fireEvent.change(getInput(), { target: { value: '157, 161 163' } });
    fireEvent.submit(getInput().closest('form'));
    await waitFor(() => expect(onMark).toHaveBeenCalledWith('157, 161 163'));
    await waitFor(() => expect(getInput().value).toBe(''));
  });

  it('Enter in the input submits', async () => {
    const onMark = vi.fn().mockResolvedValue(undefined);
    render(<QuickEntryBar onMark={onMark} />);
    fireEvent.change(getInput(), { target: { value: '101' } });
    fireEvent.click(getMark());
    await waitFor(() => expect(onMark).toHaveBeenCalledWith('101'));
  });

  it('ignores a blank entry', () => {
    const onMark = vi.fn();
    render(<QuickEntryBar onMark={onMark} />);
    fireEvent.change(getInput(), { target: { value: '   ' } });
    fireEvent.submit(getInput().closest('form'));
    expect(onMark).not.toHaveBeenCalled();
  });
});
