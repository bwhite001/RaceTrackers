import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import BaseStatusView from '../../src/modules/base-operations/components/BaseStatusView';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

describe('DNF / DNS bulk add', () => {
  it('keeps numbers typed while a mark is still saving', async () => {
    let finish;
    const store = {
      currentRace: { date: '2026-11-08', startTime: '06:30' },
      checkpoints: [{ number: 1, name: 'CP1' }], runners: [], outList: [], raceRunnerNumbers: [101, 130],
      applyOutStatus: vi.fn(() => new Promise(res => { finish = () => res([]); })),
      undoOutStatus: vi.fn(), clearOutStatus: vi.fn(), restoreOutStatus: vi.fn(),
    };
    useBaseOperationsStore.mockImplementation(() => store);
    render(<BaseStatusView />);
    const type = (v) => { fireEvent.change(screen.getByLabelText('Bib numbers'), { target: { value: v } }); fireEvent.submit(screen.getByLabelText('Bib numbers').closest('form')); };

    type('130');
    fireEvent.click(screen.getByRole('button', { name: 'Mark 1 as DNF' }));
    type('101'); // typed while the first mark is saving
    await act(async () => { finish(); });

    await waitFor(() => expect(screen.getByRole('button', { name: /^Remove 101/ })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /^Remove 130/ })).toBeNull();
    expect(store.applyOutStatus).toHaveBeenCalledWith(expect.objectContaining({ numbers: [130] }));
  });
});
