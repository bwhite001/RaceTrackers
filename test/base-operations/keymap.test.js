import { describe, it, expect } from 'vitest';
import {
  KEY_ACTIONS, resolveKey, matchCheckpoint, parseWithdrawLine, isPhysicalKey, isNumLockOff, keyLetter,
} from '../../src/modules/base-operations/services/keymap';
import { parseExactTime, isBlockTime, hhmm } from '../../src/services/blocks.js';
import TimeUtils from '../../src/services/timeUtils.js';

const alt = (code, extra = {}) => ({ code, altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, ...extra });
const on = { enabled: true, tab: 'receive' };
const board = [
  { number: 1, short: 'CP1' }, { number: 2, short: 'CP2' }, { number: 12, short: 'CP12' }, { number: 0, short: 'Finish' },
];

describe('resolveKey', () => {
  it('maps every WICEN2 key on Receive', () => {
    for (const a of KEY_ACTIONS) {
      const r = resolveKey(alt(a.code), on);
      expect(r?.action).toBe(a.id);
      if (a.message) expect(r.message).toBe(a.message);
    }
  });

  it('Alt+Shift+letter is the same key (K0 fallback)', () => {
    expect(resolveKey(alt('KeyU', { shiftKey: true }), on)).toEqual({ action: 'complete' });
  });

  it('matches on code, so Option+letter on a Mac works', () => {
    expect(resolveKey({ ...alt('KeyU'), key: '¨' }, on)).toEqual({ action: 'complete' });
  });

  it('Receive-only keys do nothing on other tabs; the rest still work', () => {
    const ctx = { enabled: true, tab: 'reports' };
    expect(resolveKey(alt('KeyU'), ctx)).toBeNull();
    expect(resolveKey(alt('KeyE'), ctx)).toBeNull();
    expect(resolveKey(alt('KeyW'), ctx)).toEqual({ action: 'withdraw' });
    expect(resolveKey(alt('KeyR'), ctx)).toEqual({ action: 'reports' });
  });

  it('with a sheet open only Help answers', () => {
    const ctx = { ...on, sheetOpen: true };
    expect(resolveKey(alt('KeyU'), ctx)).toBeNull();
    expect(resolveKey(alt('KeyW'), ctx)).toBeNull();
    expect(resolveKey(alt('KeyH'), ctx)).toEqual({ action: 'help' });
  });

  it('keys off, no Alt, Ctrl/Meta combos, unmapped keys → nothing', () => {
    expect(resolveKey(alt('KeyU'), { ...on, enabled: false })).toBeNull();
    expect(resolveKey({ code: 'KeyU', altKey: false }, on)).toBeNull();
    expect(resolveKey(alt('KeyU', { ctrlKey: true }), on)).toBeNull();
    expect(resolveKey(alt('KeyU', { metaKey: true }), on)).toBeNull();
    expect(resolveKey(alt('KeyZ'), on)).toBeNull();
  });

  it('every code is mapped once and has a letter', () => {
    const codes = KEY_ACTIONS.map(a => a.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(keyLetter('complete')).toBe('U');
  });
});

describe('matchCheckpoint', () => {
  it.each([['1', 1], ['CP1', 1], ['cp 2', 2], [' 12 ', 12], ['f', 0], ['Finish', 0], ['0', 0]])('%s', (t, n) => {
    expect(matchCheckpoint(t, board)?.number).toBe(n);
  });
  it('unknown or empty → null', () => {
    expect(matchCheckpoint('7', board)).toBeNull();
    expect(matchCheckpoint('S', board)).toBeNull();
    expect(matchCheckpoint('', board)).toBeNull();
  });
});

describe('parseWithdrawLine', () => {
  it.each([
    ['28', { number: 28 }],
    ['28 2106', { number: 28, time: '2106' }],
    ['28 21:06', { number: 28, time: '21:06' }],
    ['28 815', { number: 28, time: '815' }],
    ['28 CP2', { number: 28, cp: 2 }],
    ['28 cp12', { number: 28, cp: 12 }],
    ['28 2', { number: 28, cp: 2 }],
    ['28 *', { number: 28, reverse: true }],
    ['28*', { number: 28, reverse: true }],
  ])('%s', (t, want) => expect(parseWithdrawLine(t)).toEqual(want));

  it.each(['', '28-30', '28,29', '28 29 30', 'abc', '28 zz', '0'])('refuses %j', (t) => {
    expect(parseWithdrawLine(t).error).toBeTruthy();
  });
});

describe('typed times (Time box)', () => {
  const now = TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', 9, 0);
  it.each(['0815', '815', '08.15', '8.15', '08:15', '8:15'])('%s → 08:15', (t) => {
    expect(hhmm(parseExactTime(t, now))).toBe('08:15');
  });
  it('0815 is a block, 0817 is exact', () => {
    expect(isBlockTime(parseExactTime('0815', now))).toBe(true);
    expect(isBlockTime(parseExactTime('0817', now))).toBe(false);
  });
  it.each(['2460', '0875', '12345', 'ab'])('refuses %s', (t) => expect(parseExactTime(t, now)).toBeNull());
});

describe('physical keyboard detection', () => {
  it('Alt, Tab, Esc, keypad, or a key with nothing focused', () => {
    expect(isPhysicalKey({ key: 'a', code: 'KeyA', altKey: true }, true)).toBe(true);
    expect(isPhysicalKey({ key: 'Tab', code: 'Tab' }, true)).toBe(true);
    expect(isPhysicalKey({ key: '1', code: 'Numpad1' }, true)).toBe(true);
    expect(isPhysicalKey({ key: '1', code: 'Digit1' }, false)).toBe(true);
  });
  it('typing in a field (on-screen keyboard) is not', () => {
    expect(isPhysicalKey({ key: '1', code: 'Digit1' }, true)).toBe(false);
    expect(isPhysicalKey({ key: 'Unidentified', code: '' }, false)).toBe(false);
  });
  it('Num Lock off: keypad sends End instead of 1', () => {
    expect(isNumLockOff({ code: 'Numpad1', key: 'End' })).toBe(true);
    expect(isNumLockOff({ code: 'Numpad1', key: '1' })).toBe(false);
    expect(isNumLockOff({ code: 'NumpadEnter', key: 'Enter' })).toBe(false);
  });
});

describe('own time per runner (Phase 3)', () => {
  const now = TimeUtils.atLocalTime('2026-11-08T00:00:00.000Z', 11, 0);
  it('time of day keeps seconds', () => {
    expect(TimeUtils.formatTime(parseExactTime('101215', now, { seconds: true }), 'HH:mm:ss')).toBe('10:12:15');
    expect(TimeUtils.formatTime(parseExactTime('10:12:15', now, { seconds: true }), 'HH:mm:ss')).toBe('10:12:15');
    expect(TimeUtils.formatTime(parseExactTime('1012', now), 'HH:mm:ss')).toBe('10:12:00');
    expect(parseExactTime('101275', now, { seconds: true })).toBeNull();
  });
  it('elapsed: +1:42:15, +14215, 1:42', async () => {
    const { parseElapsed, formatElapsed } = await import('../../src/services/blocks.js');
    expect(parseElapsed('+1:42:15')).toBe(6135);
    expect(parseElapsed('+14215')).toBe(6135);
    expect(parseElapsed('1:42')).toBe(6120);
    expect(parseElapsed('+142')).toBe(6120);
    expect(parseElapsed('+1:72:00')).toBeNull();
    expect(parseElapsed('abc')).toBeNull();
    expect(formatElapsed(6135)).toBe('1:42:15');
  });
  it('elapsed → clock from the wave start; clock text shows seconds only when there are any', async () => {
    const { clockText } = await import('../../src/services/blocks.js');
    const start = TimeUtils.atLocalTime(now, 8, 30);
    const t = TimeUtils.addSeconds(start, 6135);
    expect(clockText(t)).toBe('10:12:15');
    expect(clockText(TimeUtils.atLocalTime(now, 10, 12))).toBe('10:12');
  });
});
