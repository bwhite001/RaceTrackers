import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TimeUtils from '../../src/services/timeUtils.js';
import {
  checkpointRunnerState, stateLabel, RUNNER_STATE, checkClasses, CHECK_KIND,
} from '../../src/design-system/statusStyles.js';
import {
  TimeStepper, BottomSheet, UndoBar, useUndo, CheckpointTabBar, NumberPad,
} from '../../src/design-system/components/VK';

const at = (h, m) => TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', h, m);

describe('statusStyles', () => {
  it('derives checkpoint runner states', () => {
    expect(checkpointRunnerState({ status: 'not-started' })).toBe(RUNNER_STATE.NONE);
    expect(checkpointRunnerState({ status: 'not-started', unmarkedTime: at(7, 37) })).toBe(RUNNER_STATE.RESTORABLE);
    expect(checkpointRunnerState({ status: 'passed', calledIn: false })).toBe(RUNNER_STATE.PASSED);
    expect(checkpointRunnerState({ status: 'passed', calledIn: true })).toBe(RUNNER_STATE.CALLED);
    expect(checkpointRunnerState({ status: 'non-starter' })).toBe(RUNNER_STATE.DNS);
    expect(checkpointRunnerState({ status: 'dnf' })).toBe(RUNNER_STATE.DNF);
  });

  it('labels states, including corrections and restorable times', () => {
    expect(stateLabel(RUNNER_STATE.PASSED, { time: '07:44' })).toBe('07:44');
    expect(stateLabel(RUNNER_STATE.PASSED, { time: '07:44', correction: true })).toBe('✎ 07:44');
    expect(stateLabel(RUNNER_STATE.CALLED, { time: '07:31' })).toBe('✓ 07:31');
    expect(stateLabel(RUNNER_STATE.RESTORABLE, { wasTime: '07:37' })).toBe('was 07:37');
  });

  it('rejected chips are struck through, not colour alone', () => {
    expect(checkClasses(CHECK_KIND.BAD)).toContain('line-through');
    expect(checkClasses(CHECK_KIND.INFO)).toContain('border-vk-navy');
  });
});

describe('TimeStepper', () => {
  it('clamps to [min, max]', () => {
    const onChange = vi.fn();
    render(<TimeStepper value={at(7, 45)} onChange={onChange} min={at(6, 30)} max={at(7, 47)} />);
    fireEvent.click(screen.getByLabelText('5 minutes later'));
    expect(onChange).toHaveBeenCalledWith(at(7, 47));
    fireEvent.click(screen.getByLabelText('5 minutes earlier'));
    expect(onChange).toHaveBeenLastCalledWith(at(7, 40));
  });

  it('does nothing at the limit', () => {
    const onChange = vi.fn();
    render(<TimeStepper value={at(7, 47)} onChange={onChange} min={at(6, 30)} max={at(7, 47)} />);
    fireEvent.click(screen.getByLabelText('1 minute later'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('BottomSheet', () => {
  it('is a labelled dialog and closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} labelledBy="hd">
        <h2 id="hd">142</h2>
        <button type="button">Save</button>
      </BottomSheet>,
    );
    expect(screen.getByRole('dialog', { name: '142' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('useUndo + UndoBar', () => {
  const Harness = ({ run }) => {
    const undo = useUndo(0);
    return (
      <>
        <button type="button" onClick={() => undo.offer('142 unmarked', run)}>act</button>
        <UndoBar {...undo.bar} />
      </>
    );
  };

  it('offers a single undo that runs once and disappears', async () => {
    const run = vi.fn();
    render(<Harness run={run} />);
    fireEvent.click(screen.getByText('act'));
    expect(screen.getByRole('status')).toHaveTextContent('142 unmarked');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Undo' })); });
    expect(run).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('CheckpointTabBar', () => {
  it('marks the active tab and shows the callout badge', () => {
    const Wrap = () => {
      const [tab, setTab] = useState('mark-off');
      return <CheckpointTabBar active={tab} onChange={setTab} calloutCount={9} />;
    };
    render(<Wrap />);
    expect(screen.getByRole('button', { name: /mark off/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByLabelText('9 to call in')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /overview/i }));
    expect(screen.getByRole('button', { name: /overview/i })).toHaveAttribute('aria-current', 'page');
  });
});

describe('NumberPad', () => {
  it('sends digits, backspace and add', () => {
    const onDigit = vi.fn(); const onBackspace = vi.fn(); const onAdd = vi.fn();
    render(<NumberPad onDigit={onDigit} onBackspace={onBackspace} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete digit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add number' }));
    expect(onDigit).toHaveBeenCalledWith('7');
    expect(onBackspace).toHaveBeenCalled();
    expect(onAdd).toHaveBeenCalled();
  });
});

describe('upgradeStatusColors', () => {
  it('replaces untouched legacy defaults, keeps customised colours', async () => {
    const { upgradeStatusColors, DEFAULT_STATUS_COLORS } = await import('../../src/types/index.js');
    const legacy = { 'not-started': '#9CA3AF', passed: '#10b981', 'non-starter': '#ef4444', dnf: '#f59e0b' };
    expect(upgradeStatusColors(legacy)).toEqual(DEFAULT_STATUS_COLORS);
    const custom = { ...legacy, passed: '#123456' };
    expect(upgradeStatusColors(custom).passed).toBe('#123456');
    expect(upgradeStatusColors(custom)['called-in']).toBe(DEFAULT_STATUS_COLORS['called-in']);
    expect(upgradeStatusColors(undefined)).toEqual(DEFAULT_STATUS_COLORS);
  });
});
