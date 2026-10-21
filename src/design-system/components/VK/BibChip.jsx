import React from 'react';
import { cn } from '../../utils/classNames';

/**
 * Bib number (Montserrat 800) + optional small note. `className` carries the
 * state style from statusStyles (checkClasses / stateClasses). Tap = remove.
 */
const BibChip = ({ number, note, className = '', onClick, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel ?? `Remove ${number}${note ? `, ${note}` : ''}`}
    className={cn('min-h-[44px] px-2.5 py-1 rounded-lg flex flex-col items-start justify-center gap-px', className)}
  >
    <span className="font-display font-extrabold text-lg leading-none tabular-nums">{number}</span>
    {note && <span className="text-[10px] font-bold no-underline">{note}</span>}
  </button>
);

export default BibChip;
