/**
 * WICEN2 keyboard layer for Base (docs/design-handoff/WICEN2_PARITY.md).
 * One table drives the key handling, the shortcut sheet, the key badges and the
 * user guide, so they can't drift apart. Pure: no React, no DOM.
 */

/**
 * @typedef {object} KeyAction
 * @property {string} id          action id dispatched by Base
 * @property {string} code        KeyboardEvent.code (layout-independent; Option+letter on a Mac types a character)
 * @property {string} letter      shown on badges and the sheet
 * @property {string} wicen2      what the key did in WICEN2
 * @property {string} here        what it does in RaceTracker
 * @property {'receive'|'any'} where  'receive' = only on the Receive tab
 * @property {string} [message]   WICEN2 job with no equivalent: the status line says where it went
 */

/** @type {KeyAction[]} */
export const KEY_ACTIONS = [
  { id: 'focusCp', code: 'KeyC', letter: 'C', wicen2: 'Go to CheckPt', here: 'CheckPt box', where: 'receive' },
  { id: 'focusTime', code: 'KeyT', letter: 'T', wicen2: 'Go to Time', here: 'Time box', where: 'receive' },
  { id: 'focusNumber', code: 'KeyN', letter: 'N', wicen2: 'Go to Number', here: 'Number box', where: 'receive' },
  { id: 'addNumber', code: 'KeyX', letter: 'X', wicen2: 'Next (save entry)', here: 'Add the typed number', where: 'receive' },
  { id: 'complete', code: 'KeyU', letter: 'U', wicen2: 'Update Main', here: 'Complete the call', where: 'receive' },
  { id: 'removeLast', code: 'KeyE', letter: 'E', wicen2: 'Delete Entry', here: 'Remove the last number added (Undo)', where: 'receive' },
  { id: 'withdraw', code: 'KeyW', letter: 'W', wicen2: 'Withdraw', here: 'Quick withdraw line', where: 'any' },
  { id: 'lateEntry', code: 'KeyD', letter: 'D', wicen2: 'Add Number', here: 'Add a late entry to the field', where: 'any' },
  { id: 'missing', code: 'KeyG', letter: 'G', wicen2: 'Missing', here: 'Reports › Missing at a checkpoint', where: 'any' },
  { id: 'outList', code: 'KeyS', letter: 'S', wicen2: 'Show Out List', here: 'Reports › Out of the race', where: 'any' },
  { id: 'reports', code: 'KeyR', letter: 'R', wicen2: 'Reports / Print', here: 'Reports tab', where: 'any' },
  { id: 'backup', code: 'KeyK', letter: 'K', wicen2: 'Backup', here: 'Back up now (file backup)', where: 'any' },
  { id: 'viewCall', code: 'KeyM', letter: 'M', wicen2: 'Sort Normal', here: 'Records, by call', where: 'receive' },
  { id: 'viewNumber', code: 'KeyB', letter: 'B', wicen2: 'Sort Number', here: 'Records, by number', where: 'receive' },
  { id: 'viewCpNumber', code: 'KeyP', letter: 'P', wicen2: 'Sort CP & No', here: 'Records, by number', where: 'receive' },
  { id: 'viewBlock', code: 'KeyI', letter: 'I', wicen2: 'Sort CP & Time', here: 'Records, by block', where: 'receive' },
  { id: 'help', code: 'KeyH', letter: 'H', wicen2: 'Help', here: 'This shortcut sheet', where: 'any' },
  { id: 'about', code: 'KeyA', letter: 'A', wicen2: 'About', here: 'Version', where: 'any' },
  { id: 'unused', code: 'KeyV', letter: 'V', wicen2: 'Vet Out', here: 'Not used', where: 'any', message: "Vet Out isn't used in running events" },
  { id: 'unused', code: 'KeyO', letter: 'O', wicen2: 'Comments', here: 'Not used', where: 'any', message: 'No comments box. Use Withdraw (Alt+W) or Records' },
  { id: 'unused', code: 'KeyL', letter: 'L', wicen2: 'Clear Strapper List', here: 'Not used', where: 'any', message: 'No strapper list in running events' },
  { id: 'unused', code: 'KeyQ', letter: 'Q', wicen2: 'Quit', here: 'Not used', where: 'any', message: 'Close the app window to quit. Your data is saved.' },
];

/** WICEN2 jobs that moved somewhere with no key. Shown in the sheet and the guide. */
export const WHERE_DID_IT_GO = [
  { wicen2: 'Update Main', here: 'Complete on each call (Alt+U)' },
  { wicen2: 'Tally', here: 'Checkpoints board on Receive, and Overview › Checkpoint progress' },
  { wicen2: 'View Dupes', here: 'Reports › Needs attention › Duplicates' },
  { wicen2: 'View Deleted', here: 'Records, with Show history on' },
  { wicen2: 'Reports table', here: 'Reports tab (Alt+R)' },
  { wicen2: 'Crystal Reports', here: 'Print on each report' },
  { wicen2: 'BACK.MDB', here: 'Automatic file backup (chip in the app bar, Alt+K)' },
];

/** Record views opened by the WICEN2 sort keys. */
export const RECORD_VIEW = { viewCall: 'call', viewNumber: 'number', viewCpNumber: 'number', viewBlock: 'block' };

const byCode = new Map(KEY_ACTIONS.map(a => [a.code, a]));

/** The letter for an action, for badges. */
export const keyLetter = (id) => KEY_ACTIONS.find(a => a.id === id)?.letter ?? null;

/**
 * Resolve a keydown to a WICEN2 action.
 * Alt+letter, or Alt+Shift+letter (DECISION K0: the fallback where a browser
 * keeps Alt+letter for itself; accepted on every platform so nobody has to
 * know which one they are on). Ctrl/Meta combos are left to the browser.
 *
 * @param {{ code: string, altKey: boolean, ctrlKey?: boolean, metaKey?: boolean }} event
 * @param {{ enabled: boolean, tab: string, sheetOpen?: boolean }} ctx
 * @returns {{ action: string, message?: string } | null}
 */
export function resolveKey(event, { enabled, tab, sheetOpen = false }) {
  if (!enabled || !event.altKey || event.ctrlKey || event.metaKey) return null;
  const a = byCode.get(event.code);
  if (!a) return null;
  // A sheet owns the keyboard while it is open; only Help still answers
  if (sheetOpen && a.id !== 'help') return null;
  if (a.where === 'receive' && tab !== 'receive') return null;
  return a.message ? { action: a.id, message: a.message } : { action: a.id };
}

/**
 * A checkpoint typed in the CheckPt box: `1`, `CP1`, `cp 1`, `F`, `Finish`, `0`.
 * @param {string} text
 * @param {Array<{ number: number, short: string }>} board
 * @returns {object|null} the board row
 */
export function matchCheckpoint(text, board = []) {
  const t = String(text ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (!t) return null;
  const finish = board.find(b => b.short === 'Finish');
  if (finish && (t === 'f' || t === 'finish')) return finish;
  const m = t.match(/^(?:cp)?(\d+)$/);
  return m ? board.find(b => b.number === Number(m[1])) ?? null : null;
}

/**
 * The quick withdraw line (Alt+W), WICEN2-style:
 *   `28`        number only
 *   `28 2106`   number + time (HHMM / H:MM / HH.MM)
 *   `28 CP2`, `28 2`  number + checkpoint (1–2 digits is a checkpoint, 3–4 a time)
 *   `28 *` / `28*`    put 28 back in the race
 * One bib per line (G1): `28-30`, `28,29` are refused.
 * @returns {{ number: number, reverse?: true, time?: string, cp?: number } | { error: string }}
 */
export function parseWithdrawLine(text) {
  const t = String(text ?? '').trim();
  if (!t) return { error: 'Type a number' };
  if (/[-,;]/.test(t) || /^\d+\s+\d+\s+\d+/.test(t)) return { error: 'One number at a time' };
  const rev = t.match(/^(\d{1,5})\s*\*$/);
  if (rev) return { number: Number(rev[1]), reverse: true };
  const m = t.match(/^(\d{1,5})(?:\s+(\S+))?$/);
  if (!m) return { error: `${t} isn't a number` };
  const number = Number(m[1]);
  if (!number) return { error: 'Invalid number' };
  const arg = m[2];
  if (!arg) return { number };
  const cp = arg.match(/^(?:cp)?(\d{1,2})$/i);
  if (cp && (/^cp/i.test(arg) || arg.length <= 2)) return { number, cp: Number(cp[1]) };
  if (/^(\d{1,2})[:.]?(\d{2})$/.test(arg)) return { number, time: arg };
  return { error: `${arg} isn't a time or checkpoint` };
}

/**
 * True when a keydown can only have come from a physical keyboard: an on-screen
 * keyboard only types into a focused field and has no Alt, Tab, Esc or keypad.
 * Hints, the CheckPt box and the Time box prefill wait for this, so a
 * touch-only tablet looks the same as before.
 */
export function isPhysicalKey(event, targetEditable) {
  if (event.altKey || event.ctrlKey || event.metaKey) return true;
  if (['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return true;
  if (/^Numpad/.test(event.code ?? '') || /^F\d+$/.test(event.key ?? '')) return true;
  return !targetEditable && !!event.code && event.code !== 'Unidentified';
}

/** Numpad navigation keys arrive instead of digits when Num Lock is off. */
export function isNumLockOff(event) {
  return /^Numpad\d$/.test(event.code ?? '') && !/^\d$/.test(event.key ?? '');
}
