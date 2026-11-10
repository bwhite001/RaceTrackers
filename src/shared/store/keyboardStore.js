import { create } from 'zustand';

/**
 * Session-only keyboard state for the WICEN2 layer (not persisted: a reload on
 * a touch-only tablet starts clean).
 * - physical: a physical keyboard has been used this session
 * - altHeld:  Alt / Option held long enough to show the key badges
 * - message:  one-line status for keys that answer without a screen of their own
 */
const useKeyboardStore = create((set) => ({
  physical: false,
  altHeld: false,
  message: '',
  setPhysical: () => set(s => (s.physical ? s : { physical: true })),
  setAltHeld: (altHeld) => set(s => (s.altHeld === altHeld ? s : { altHeld })),
  say: (message) => set({ message }),
}));

export default useKeyboardStore;
