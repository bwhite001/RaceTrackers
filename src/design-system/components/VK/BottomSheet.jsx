import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Navy 55% scrim + white sheet from the bottom. role="dialog", focus trapped,
 * Escape / scrim tap closes.
 */
const BottomSheet = ({ open, onClose, labelledBy, children }) => {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const sheet = sheetRef.current;
    sheet?.querySelector(FOCUSABLE)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !sheet) return;
      const items = [...sheet.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[rgba(11,45,83,0.55)]">
      <button type="button" aria-label="Close" onClick={onClose} className="flex-1 w-full cursor-default" tabIndex={-1} />
      <section
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="bg-white dark:bg-gray-800 rounded-t-sheet px-5 pt-[18px] pb-6 flex flex-col gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.18)] max-w-lg w-full mx-auto"
      >
        {children}
      </section>
    </div>,
    document.body,
  );
};

export default BottomSheet;
