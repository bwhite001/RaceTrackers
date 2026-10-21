import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';

const BADGE_SRC = `${import.meta.env.BASE_URL}pwa-512x512.png`;

/** Gold dot + "Saved" — data is written straight to IndexedDB. */
export const SavedIndicator = ({ label = 'Saved', compact = false }) => (
  <span className="flex items-center gap-1.5 text-xs font-semibold text-vk-on-navy whitespace-nowrap">
    <span className="w-2 h-2 rounded-full bg-vk-gold" aria-hidden="true" />
    <span className={compact ? 'sr-only sm:not-sr-only' : ''}>{label}</span>
  </span>
);

/** Club badge in a white circle. Never redraw it — always the PWA icon. */
export const ClubBadge = ({ size = 32 }) => (
  <span
    className="rounded-full bg-white flex items-center justify-center shrink-0"
    style={{ width: size, height: size }}
  >
    <img
      src={BADGE_SRC}
      alt="Ipswich & District Radio Club VK4WIP badge"
      style={{ width: size * 0.84, height: size * 0.84 }}
      className="object-contain"
    />
  </span>
);

/**
 * Phone app bar: navy, back button, title + subtitle, right slot.
 * `children` render under the title row (stat tiles, progress, banners).
 */
const AppBar = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  right = <SavedIndicator />,
  children,
  className = '',
}) => (
  <header className={cn('bg-vk-navy text-white px-3 pt-3 pb-3.5 flex flex-col gap-3', className)}>
    <div className="flex items-center gap-1.5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="w-11 h-11 flex items-center justify-center rounded-btn hover:bg-white/10 shrink-0"
        >
          <ChevronLeftIcon className="w-[22px] h-[22px]" aria-hidden="true" />
        </button>
      )}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <h1 className="font-display font-bold text-lg leading-tight truncate">{title}</h1>
        {/* Two lines rather than an ellipsis: callsigns and frequencies must stay readable */}
        {subtitle && <div className="text-xs text-vk-on-navy line-clamp-2 break-words">{subtitle}</div>}
      </div>
      {right && <div className="pr-1.5 flex items-center gap-1">{right}</div>}
    </div>
    {children}
  </header>
);

export default AppBar;
