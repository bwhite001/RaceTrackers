import React from 'react';
import { Squares2X2Icon, SignalIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';
import { ClubBadge, SavedIndicator } from './AppBar';

const CHECKPOINT_TABS = [
  { id: 'mark-off', label: 'Mark off', Icon: Squares2X2Icon },
  { id: 'callout', label: 'Callout', Icon: SignalIcon },
  { id: 'overview', label: 'Overview', Icon: ChartBarIcon },
];

/**
 * Checkpoint bottom nav (72px). Active tab = navy text + 3px gold top border.
 * Callout shows a gold badge with the number passed but not called in.
 */
export const CheckpointTabBar = ({ active, onChange, calloutCount = 0, className = '' }) => (
  <nav
    aria-label="Checkpoint tabs"
    className={cn('bg-white dark:bg-gray-800 border-t border-vk-border dark:border-gray-700 grid grid-cols-3 h-[72px]', className)}
  >
    {CHECKPOINT_TABS.map(({ id, label, Icon }) => {
      const on = active === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={on ? 'page' : undefined}
          className={cn(
            'relative flex flex-col items-center justify-center gap-1 text-xs border-t-[3px]',
            on ? 'text-vk-navy dark:text-white font-bold border-vk-gold' : 'text-vk-muted dark:text-gray-400 font-semibold border-transparent',
          )}
        >
          <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
          {label}
          {id === 'callout' && calloutCount > 0 && (
            <span
              className="absolute top-2.5 left-[calc(50%+8px)] bg-vk-gold text-vk-ink rounded-full min-w-[20px] h-5 px-1 text-[11px] font-extrabold flex items-center justify-center"
              aria-label={`${calloutCount} to call in`}
            >
              {calloutCount}
            </span>
          )}
        </button>
      );
    })}
  </nav>
);

export const BASE_TABS = [
  { id: 'receive', label: 'Receive' },
  { id: 'overview', label: 'Overview' },
  { id: 'status', label: 'DNF / DNS' },
  { id: 'reports', label: 'Reports' },
];

/**
 * Base station header: badge, "Base · VK4WIP", frequency + clock, inline tabs.
 * Single row on tablet; tabs scroll horizontally on phone.
 */
export const BaseAppBar = ({
  baseCallsign = 'VK4WIP',
  frequency,
  nowText,
  active,
  onChange,
  onHome,
  right,
  tabs = BASE_TABS,
}) => (
  <header className="bg-vk-navy text-white">
    <div className="max-w-[1280px] mx-auto px-3 flex flex-wrap items-center gap-x-4">
      <button
        type="button"
        onClick={onHome}
        className="flex items-center gap-2 min-h-[52px] text-left"
        aria-label="Leave base station"
      >
        <ClubBadge size={32} />
        <span className="flex flex-col">
          <span className="font-display font-extrabold text-[15px] leading-tight">Base · {baseCallsign}</span>
          <span className="text-[11px] text-vk-on-navy">
            {[frequency, nowText && `now ${nowText}`].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
      <nav aria-label="Base station tabs" className="flex gap-0.5 self-stretch overflow-x-auto max-w-full">
        <div role="tablist" className="flex">
          {tabs.map(tab => {
            const on = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={tab.label}
                aria-current={on ? 'page' : undefined}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'flex items-center px-3 min-h-[44px] text-sm whitespace-nowrap border-b-[3px]',
                  on ? 'text-white font-bold border-vk-gold' : 'text-vk-on-navy font-semibold border-transparent hover:text-white',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {right}
        <SavedIndicator />
      </div>
    </div>
  </header>
);
