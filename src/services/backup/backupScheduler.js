/**
 * When to write the backup file: after `idleMs` with no new changes, but never
 * more than `maxWaitMs` after the first unsaved change (a busy base never goes
 * quiet). One run at a time; a change during a run schedules one more after it.
 * A failed run leaves the changes unsaved and is retried.
 *
 * Uses Date.now for timer arithmetic only — no race timestamps here.
 */
export function createBackupScheduler({ idleMs, maxWaitMs, run }) {
  let idle = idleMs;
  let timer = null;
  let dirtySince = null; // first unsaved change
  let running = null;

  const arm = (ms) => {
    clearTimeout(timer);
    timer = setTimeout(go, Math.max(0, ms));
  };

  async function go() {
    timer = null;
    if (dirtySince == null || running) return;
    dirtySince = null; // changes from here on belong to the next run
    running = Promise.resolve().then(run).catch(() => {
      if (dirtySince == null) dirtySince = Date.now();
    });
    await running;
    running = null;
    if (dirtySince != null) arm(idle);
  }

  return {
    touch() {
      if (dirtySince == null) dirtySince = Date.now();
      if (running) return; // re-armed when the run settles
      arm(Math.min(idle, maxWaitMs - (Date.now() - dirtySince)));
    },
    async flush() {
      if (running) await running;
      if (dirtySince == null) return;
      clearTimeout(timer);
      await go();
    },
    setIdleMs(ms) { idle = ms; },
    cancel() { clearTimeout(timer); timer = null; },
  };
}
