import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/classNames';

export const UNDO_TIMEOUT_MS = 6000;

/**
 * Single-level undo per screen (spec §6): the next action replaces the
 * snapshot, and it auto-dismisses after ~6 s.
 *
 *   const undo = useUndo();
 *   undo.offer('142 unmarked', async () => restore());
 *   <UndoBar {...undo.bar} />
 */
export function useUndo(timeout = UNDO_TIMEOUT_MS) {
  const [entry, setEntry] = useState(null);
  const timer = useRef(null);

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setEntry(null);
  }, []);

  const offer = useCallback((text, run) => {
    clearTimeout(timer.current);
    setEntry({ text, run });
    if (timeout) timer.current = setTimeout(() => setEntry(null), timeout);
  }, [timeout]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const undo = useCallback(async () => {
    if (!entry) return;
    clearTimeout(timer.current);
    setEntry(null);
    await entry.run();
  }, [entry]);

  return { entry, offer, clear, undo, bar: { text: entry?.text, onUndo: entry ? undo : null } };
}

/**
 * Dark ink pill with an Undo button, floating above the tab bar.
 * `inline` renders the compact status-line form used on base screens.
 */
const UndoBar = ({ text, onUndo, inline = false, className = '' }) => {
  if (!text || !onUndo) return null;
  if (inline) {
    return (
      <button
        type="button"
        onClick={onUndo}
        className={cn('min-h-[32px] px-3 rounded-lg bg-vk-ink text-white text-xs font-bold', className)}
      >
        Undo
      </button>
    );
  }
  return (
    <div
      role="status"
      className={cn(
        'bg-vk-ink text-white rounded-card py-2 pr-2 pl-4 flex items-center gap-3 shadow-sheet',
        className,
      )}
    >
      <span className="flex-1 text-sm font-semibold">{text}</span>
      <button
        type="button"
        onClick={onUndo}
        className="min-h-[44px] px-4 rounded-lg bg-vk-gold text-vk-ink font-display font-extrabold text-[13px] tracking-[0.6px] uppercase"
      >
        Undo
      </button>
    </div>
  );
};

export default UndoBar;
