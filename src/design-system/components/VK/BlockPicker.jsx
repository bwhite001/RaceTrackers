import React from 'react';
import { cn } from '../../utils/classNames';

/**
 * Horizontally scrolling 5-minute block buttons (64×48) plus an "Exact"
 * time input at the end (dashed when unused, navy when set).
 *
 * blocks: [{ key, label: '07:40', sub: 'done'|'next'|'this call'|'', selected, done, has }]
 */
const BlockPicker = ({ blocks, onPick, exactText, onExactChange, exactActive, exactLabel = 'Exact time' }) => (
  <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Common time block">
    {blocks.map(b => (
      <button
        key={b.key}
        type="button"
        onClick={() => onPick(b.key)}
        aria-pressed={b.selected}
        className={cn(
          'shrink-0 min-w-[64px] min-h-[48px] px-2 py-0.5 rounded-btn flex flex-col items-center justify-center',
          b.selected
            ? 'bg-vk-navy text-white'
            : b.done
              ? 'bg-vk-paper text-vk-muted border border-vk-border'
              : b.has
                ? 'bg-white text-vk-ink border-2 border-vk-blue'
                : 'bg-white text-vk-ink border border-vk-border',
        )}
      >
        <span className="font-display font-extrabold text-base tabular-nums">{b.label}</span>
        <span className="text-[10px] font-bold min-h-[12px]">{b.sub}</span>
      </button>
    ))}
    <label className="sr-only" htmlFor="exact-time">{exactLabel}</label>
    <input
      id="exact-time"
      type="text"
      inputMode="numeric"
      placeholder="Exact"
      value={exactText}
      onChange={e => onExactChange(e.target.value)}
      className={cn(
        'shrink-0 w-[84px] min-h-[48px] rounded-btn px-2 py-1 font-display font-extrabold text-[15px] text-center',
        exactActive ? 'bg-vk-navy text-white border-0 placeholder:text-vk-on-navy' : 'bg-white text-vk-ink border border-dashed border-vk-muted',
      )}
    />
  </div>
);

export default BlockPicker;
