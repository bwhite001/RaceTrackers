import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawalDialog from '../../src/modules/base-operations/components/WithdrawalDialog';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

describe('WithdrawalDialog', () => {
  const mockStore = {
    currentRace: { date: '2026-11-08', startTime: '06:30' },
    checkpoints: [{ number: 1, name: 'Northbrook' }, { number: 2, name: 'England Creek' }],
    outList: [],
    applyOutStatus: vi.fn().mockResolvedValue([{ num: 105, mode: 'dnf', before: null }]),
    undoOutStatus: vi.fn().mockResolvedValue(undefined),
    reverseWithdrawal: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  const props = { isOpen: true, onClose: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
  });

  const typeNumber = async (value) => {
    const input = screen.getByLabelText(/Runner number/i);
    await userEvent.clear(input);
    await userEvent.type(input, value);
  };

  test('renders as a dialog with where, 24-hour time, the five reasons and comments', () => {
    render(<WithdrawalDialog {...props} />);
    expect(screen.getByRole('dialog', { name: 'Withdraw runner' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Where' })).toHaveTextContent('CP1CP2On course');
    expect(screen.getByRole('group', { name: 'Reason' })).toHaveTextContent('InjurySelf-withdrewCut-offMedicalOther');
    expect(screen.getByLabelText('5 minutes earlier')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\b(AM|PM)\b/);
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
    expect(screen.getByLabelText(/Comments/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\*/);
  });

  test('does not render when closed', () => {
    render(<WithdrawalDialog {...props} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('requires a runner number', async () => {
    render(<WithdrawalDialog {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw runner' }));
    expect(await screen.findByText(/runner number is required/i)).toBeInTheDocument();
    expect(mockStore.applyOutStatus).not.toHaveBeenCalled();
  });

  test('withdraws through the bulk DNF path and offers an exact Undo', async () => {
    const onClose = vi.fn();
    const onDone = vi.fn();
    render(<WithdrawalDialog {...props} onClose={onClose} onDone={onDone} />);
    await typeNumber('105');
    fireEvent.click(screen.getByRole('button', { name: 'CP2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Medical' }));
    await userEvent.type(screen.getByLabelText(/Comments/i), 'Rolled ankle');
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw runner' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockStore.applyOutStatus).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'dnf', numbers: [105], where: 2, reason: 'Medical', comments: 'Rolled ankle',
    }));
    expect(onDone).toHaveBeenCalledWith('105 withdrawn', expect.any(Function));
    await onDone.mock.calls[0][1]();
    expect(mockStore.undoOutStatus).toHaveBeenCalledWith([{ num: 105, mode: 'dnf', before: null }]);
  });

  test('shows a store error and stays open', async () => {
    mockStore.applyOutStatus.mockRejectedValueOnce(new Error('Runner not found'));
    const onClose = vi.fn();
    render(<WithdrawalDialog {...props} onClose={onClose} />);
    await typeNumber('999');
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw runner' }));
    expect(await screen.findByText('Runner not found')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('"105*" still reverses a withdrawal (kept for existing users, not advertised)', async () => {
    render(<WithdrawalDialog {...props} />);
    await typeNumber('105*');
    fireEvent.click(screen.getByRole('button', { name: 'Put back in the race' }));
    await waitFor(() => expect(mockStore.reverseWithdrawal).toHaveBeenCalledWith(105));
  });

  test('Cancel closes; the initial number comes from the prop and has focus', () => {
    const onClose = vi.fn();
    render(<WithdrawalDialog {...props} onClose={onClose} runnerNumber="42" />);
    const input = screen.getByLabelText(/Runner number/i);
    expect(input).toHaveValue('42');
    expect(input).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
