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

describe('InputSection — unresolved button', () => {
  it('renders "?" button when checkpoint and time are set', () => {
    render(
      <InputSection
        checkpoints={checkpoints}
        checkpointNumber={1}
        commonTime="10:00"
        onCheckpointChange={vi.fn()}
        onTimeChange={vi.fn()}
        onBibEntered={vi.fn()}
        onUnresolvedAdded={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /unresolved/i })).toBeInTheDocument();
  });

  it('calls onUnresolvedAdded when "?" button is clicked', () => {
    const onUnresolvedAdded = vi.fn();
    render(
      <InputSection
        checkpoints={checkpoints}
        checkpointNumber={1}
        commonTime="10:00"
        onCheckpointChange={vi.fn()}
        onTimeChange={vi.fn()}
        onBibEntered={vi.fn()}
        onUnresolvedAdded={onUnresolvedAdded}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /unresolved/i }));
    expect(onUnresolvedAdded).toHaveBeenCalledTimes(1);
  });
});

describe('InputSection — Quick Entry panel', () => {
  const readyProps = {
    checkpoints: [{ number: 1, name: 'Start' }],
    checkpointNumber: 1,
    commonTime: '10:00',
    onCheckpointChange: vi.fn(),
    onTimeChange: vi.fn(),
    onBibEntered: vi.fn(),
  };

  it('is collapsed by default — textarea not visible', () => {
    render(<InputSection {...readyProps} />);
    expect(screen.queryByPlaceholderText(/one bib per line/i)).not.toBeInTheDocument();
  });

  it('toggle button reveals the textarea and numpad', () => {
    render(<InputSection {...readyProps} />);
    fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
    expect(screen.getByPlaceholderText(/one bib per line/i)).toBeInTheDocument();
    expect(screen.getByTestId('numpad-display')).toBeInTheDocument();
  });

  it('"Add" button calls onBibEntered with parsed bibs from textarea', () => {
    const onBibEntered = vi.fn();
    render(<InputSection {...readyProps} onBibEntered={onBibEntered} />);
    fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
    const textarea = screen.getByPlaceholderText(/one bib per line/i);
    fireEvent.change(textarea, { target: { value: '112\n205\n43' } });
    fireEvent.click(screen.getByRole('button', { name: /add 3 bibs/i }));
    expect(onBibEntered).toHaveBeenCalledWith([112, 205, 43]);
  });

  it('clears textarea after Add', () => {
    render(<InputSection {...readyProps} />);
    fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
    const textarea = screen.getByPlaceholderText(/one bib per line/i);
    fireEvent.change(textarea, { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: /add 1 bib/i }));
    expect(textarea).toHaveValue('');
  });

  it('Add button is disabled when textarea has no parseable bibs', () => {
    render(<InputSection {...readyProps} />);
    fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
    expect(screen.getByRole('button', { name: /add 0 bibs/i })).toBeDisabled();
  });

  it('textarea is disabled when not ready (no checkpoint)', () => {
    render(<InputSection {...readyProps} checkpointNumber={null} />);
    fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
    expect(screen.getByPlaceholderText(/one bib per line/i)).toBeDisabled();
  });

  describe('Numpad', () => {
    it('renders digit buttons 0-9 when open', () => {
      render(<InputSection {...readyProps} />);
      fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
      for (let d = 0; d <= 9; d++) {
        expect(screen.getByRole('button', { name: `Digit ${d}` })).toBeInTheDocument();
      }
    });

    it('pressing digits composes a number in the display', () => {
      render(<InputSection {...readyProps} />);
      fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 2' }));
      expect(screen.getByTestId('numpad-display')).toHaveTextContent('112');
    });

    it('backspace removes last digit', () => {
      render(<InputSection {...readyProps} />);
      fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 2' }));
      fireEvent.click(screen.getByRole('button', { name: /backspace/i }));
      expect(screen.getByTestId('numpad-display')).toHaveTextContent('1');
    });

    it('confirm calls onBibEntered with composed number and clears display', () => {
      const onBibEntered = vi.fn();
      render(<InputSection {...readyProps} onBibEntered={onBibEntered} />);
      fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 4' }));
      fireEvent.click(screen.getByRole('button', { name: 'Digit 2' }));
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
      expect(onBibEntered).toHaveBeenCalledWith([42]);
      expect(screen.getByTestId('numpad-display')).toHaveTextContent('—');
    });

    it('confirm is disabled when display is empty', () => {
      render(<InputSection {...readyProps} />);
      fireEvent.click(screen.getByRole('button', { name: /quick entry/i }));
      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });
  });
});

describe('InputSection — time nudge buttons', () => {
  function renderWithTime(time) {
    const onTimeChange = vi.fn();
    render(
      <InputSection
        checkpoints={checkpoints}
        checkpointNumber={1}
        commonTime={time}
        onCheckpointChange={vi.fn()}
        onTimeChange={onTimeChange}
        onBibEntered={vi.fn()}
      />
    );
    return onTimeChange;
  }

  it('renders four nudge buttons when time is set', () => {
    renderWithTime('10:00');
    expect(screen.getByRole('button', { name: '−1m' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '−30s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+30s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+1m' })).toBeInTheDocument();
  });

  it('+30s nudges time forward by 30 seconds', () => {
    const onTimeChange = renderWithTime('10:00');
    fireEvent.click(screen.getByRole('button', { name: '+30s' }));
    expect(onTimeChange).toHaveBeenCalledWith('10:00:30');
  });

  it('−30s nudges time back by 30 seconds', () => {
    const onTimeChange = renderWithTime('10:01:00');
    fireEvent.click(screen.getByRole('button', { name: '−30s' }));
    expect(onTimeChange).toHaveBeenCalledWith('10:00:30');
  });

  it('+1m nudges time forward by 60 seconds', () => {
    const onTimeChange = renderWithTime('10:00');
    fireEvent.click(screen.getByRole('button', { name: '+1m' }));
    expect(onTimeChange).toHaveBeenCalledWith('10:01:00');
  });

  it('−1m nudges time back by 60 seconds', () => {
    const onTimeChange = renderWithTime('10:05');
    fireEvent.click(screen.getByRole('button', { name: '−1m' }));
    expect(onTimeChange).toHaveBeenCalledWith('10:04:00');
  });

  it('nudge buttons are disabled when time field is empty', () => {
    renderWithTime('');
    expect(screen.getByRole('button', { name: '+30s' })).toBeDisabled();
  });
});
