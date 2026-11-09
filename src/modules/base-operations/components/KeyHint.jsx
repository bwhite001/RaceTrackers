import React from 'react';
import useKeyboardStore from '../../../shared/store/keyboardStore';
import { useRaceStore } from '../../../store/useRaceStore.js';
import { keyLetter } from '../services/keymap';

/**
 * Windows-style key badge, shown while Alt is held (after a physical keyboard
 * has been used). Absolutely positioned: the parent needs `relative`, and
 * the layout never moves.
 */
const KeyHint = ({ action }) => {
  const show = useKeyboardStore(s => s.altHeld && s.physical);
  const on = useRaceStore(s => s.settings?.wicen2Keys) !== false;
  const letter = keyLetter(action);
  if (!show || !on || !letter) return null;
  return (
    <span aria-hidden="true" data-testid="key-hint"
      className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 min-w-[20px] h-5 px-1 rounded bg-vk-ink text-white text-[11px] font-extrabold leading-5 text-center shadow">
      {letter}
    </span>
  );
};

export default KeyHint;
