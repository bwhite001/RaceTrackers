import React from 'react';
import TimeUtils from '../../../services/timeUtils.js';
import { clampTime, hhmm } from '../../../services/blocks.js';
import { cn } from '../../utils/classNames';

const STEPS = [
  { d: -5, label: '−5', aria: '5 minutes earlier' },
  { d: -1, label: '−1', aria: '1 minute earlier' },
  { d: 1, label: '+1', aria: '1 minute later' },
  { d: 5, label: '+5', aria: '5 minutes later' },
];

/**
 * −5 / −1 / big time / +1 / +5, clamped to [min, max] (race start, now).
 * `steps` limits the buttons, e.g. [-5, 5] for the DNF time.
 */
const TimeStepper = ({ value, onChange, min, max, size = 'lg', steps = [-5, -1, 1, 5], className = '' }) => {
  const nudge = (d) => {
    const next = clampTime(TimeUtils.addMinutes(value, d), min, max);
    if (next !== value) onChange(next);
  };
  const shown = STEPS.filter(s => steps.includes(s.d));
  const btn = size === 'lg'
    ? 'w-[52px] min-h-[52px] bg-vk-paper'
    : 'w-[46px] min-h-[44px] bg-white';
  const button = (s) => (
    <button
      key={s.d}
      type="button"
      onClick={() => nudge(s.d)}
      aria-label={s.aria}
      className={cn(btn, 'rounded-btn border border-vk-border font-bold text-sm text-vk-ink dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600')}
    >
      {s.label}
    </button>
  );
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {shown.filter(s => s.d < 0).map(button)}
      <div
        className={cn(
          'flex-1 text-center font-display font-extrabold text-vk-navy dark:text-white tabular-nums',
          size === 'lg' ? 'text-4xl' : 'text-[22px]',
        )}
        aria-live="polite"
      >
        {hhmm(value)}
      </div>
      {shown.filter(s => s.d > 0).map(button)}
    </div>
  );
};

export default TimeStepper;
