/**
 * Runner state styles — single source of truth (spec §3.3).
 *
 * States differ by lightness, border and label, not hue alone, so they read
 * in sunlight and for colour-blind volunteers. Passed / called-in / DNS / DNF
 * colours come from the --color-status-* CSS variables so the Settings
 * recolour option keeps working.
 */

export const RUNNER_STATE = {
  NONE: 'none',             // not passed
  PASSED: 'passed',         // passed, not called in
  CALLED: 'called',         // called in to base
  RESTORABLE: 'restorable', // unmarked earlier, can be restored
  DNS: 'dns',
  DNF: 'dnf',
};

export const CHECK_KIND = {
  OK: 'ok',
  INFO: 'info',
  WARN: 'warn',
  BAD: 'bad',
};

const PASSED_BG = 'bg-[rgb(var(--color-status-passed))] text-white border-0';
const CALLED_BG = 'bg-[rgb(var(--color-status-called-in))] text-white border-0';

const STATE_CLASSES = {
  [RUNNER_STATE.NONE]: 'bg-white text-vk-ink border border-vk-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
  [RUNNER_STATE.PASSED]: PASSED_BG,
  [RUNNER_STATE.CALLED]: CALLED_BG,
  [RUNNER_STATE.RESTORABLE]: 'bg-white text-vk-ink border-2 border-dashed border-vk-blue dark:bg-gray-800 dark:text-gray-100',
  [RUNNER_STATE.DNS]: 'bg-vk-paper text-vk-muted border border-dashed border-[rgb(var(--color-status-non-starter))] dark:bg-gray-900 dark:text-gray-400',
  [RUNNER_STATE.DNF]: 'bg-[rgb(var(--color-status-dnf)/0.1)] text-[rgb(var(--color-status-dnf))] border-2 border-[rgb(var(--color-status-dnf))]',
};

/** Classes for a tile / chip in the given runner state. */
export function stateClasses(state) {
  return STATE_CLASSES[state] ?? STATE_CLASSES[RUNNER_STATE.NONE];
}

/** DNS numbers are struck through; everything else is plain. */
export function numberClasses(state) {
  return state === RUNNER_STATE.DNS ? 'line-through' : '';
}

/**
 * Short label shown under a bib.
 * @param {string} state
 * @param {{ time?: string, correction?: boolean, wasTime?: string }} info  HH:MM strings
 */
export function stateLabel(state, { time = '', correction = false, wasTime = '' } = {}) {
  switch (state) {
    case RUNNER_STATE.PASSED: return `${correction ? '✎ ' : ''}${time}`;
    case RUNNER_STATE.CALLED: return `✓ ${time}`;
    case RUNNER_STATE.RESTORABLE: return wasTime ? `was ${wasTime}` : '';
    case RUNNER_STATE.DNS: return 'DNS';
    case RUNNER_STATE.DNF: return 'DNF';
    default: return '';
  }
}

/** Human name for the state, used in chips and aria labels. */
export const STATE_NAMES = {
  [RUNNER_STATE.NONE]: 'To come',
  [RUNNER_STATE.PASSED]: 'Passed',
  [RUNNER_STATE.CALLED]: 'Called in',
  [RUNNER_STATE.RESTORABLE]: 'Unmarked earlier',
  [RUNNER_STATE.DNS]: 'DNS',
  [RUNNER_STATE.DNF]: 'DNF',
};

const CHECK_CLASSES = {
  [CHECK_KIND.OK]: PASSED_BG,
  [CHECK_KIND.INFO]: 'bg-[rgb(var(--color-status-passed))] text-white border-2 border-vk-navy',
  [CHECK_KIND.WARN]: 'bg-white text-vk-ink border-2 border-vk-gold',
  [CHECK_KIND.BAD]: 'bg-white text-vk-red border-2 border-vk-red line-through',
};

/** Locked / disabled button (spec §3.4) for raw <button>s; the design-system Button applies it itself. */
export const LOCKED = 'bg-white text-vk-muted border-2 border-dashed border-vk-border cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';

/** Classes for a base-station check chip (receive / bulk DNF). */
export function checkClasses(kind) {
  return CHECK_CLASSES[kind] ?? CHECK_CLASSES[CHECK_KIND.OK];
}

/**
 * Derive the display state of a checkpoint_runners record.
 * Legacy statuses ('called-in', 'marked-off') count as passed.
 */
export function checkpointRunnerState(runner) {
  if (!runner) return RUNNER_STATE.NONE;
  const s = runner.status;
  if (s === 'dnf') return RUNNER_STATE.DNF;
  if (s === 'non-starter' || s === 'dns') return RUNNER_STATE.DNS;
  if (s === 'passed' || s === 'called-in' || s === 'marked-off') {
    return runner.calledIn ? RUNNER_STATE.CALLED : RUNNER_STATE.PASSED;
  }
  return runner.unmarkedTime ? RUNNER_STATE.RESTORABLE : RUNNER_STATE.NONE;
}
