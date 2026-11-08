import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBackupScheduler } from '../../src/services/backup/backupScheduler.js';

const IDLE = 30000;
const MAX = 300000;
const flushPromises = () => vi.advanceTimersByTimeAsync(0);

describe('backup scheduler', () => {
  let run;
  let s;
  beforeEach(() => {
    vi.useFakeTimers();
    run = vi.fn().mockResolvedValue();
    s = createBackupScheduler({ idleMs: IDLE, maxWaitMs: MAX, run });
  });
  afterEach(() => { s.cancel(); vi.useRealTimers(); });

  it('runs once after idleMs with no further touches', async () => {
    s.touch();
    await vi.advanceTimersByTimeAsync(IDLE - 1);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(IDLE * 3);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('restarts the idle timer on every touch', async () => {
    s.touch();
    await vi.advanceTimersByTimeAsync(20000); s.touch();
    await vi.advanceTimersByTimeAsync(20000); s.touch();
    await vi.advanceTimersByTimeAsync(29999);
    expect(run).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('forces a backup after maxWait', async () => {
    for (let t = 0; t < 360000; t += 20000) {
      s.touch();
      await vi.advanceTimersByTimeAsync(20000);
      if (t + 20000 >= MAX) break;
    }
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('serialises runs', async () => {
    let finish;
    run.mockImplementationOnce(() => new Promise(r => { finish = r; }));
    s.touch();
    await vi.advanceTimersByTimeAsync(IDLE);
    expect(run).toHaveBeenCalledTimes(1);
    s.touch();
    await vi.advanceTimersByTimeAsync(IDLE);
    expect(run).toHaveBeenCalledTimes(1);
    finish();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(IDLE);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('failed run stays dirty and retries on the next touch', async () => {
    run.mockRejectedValueOnce(new Error('disk full'));
    s.touch();
    await vi.advanceTimersByTimeAsync(IDLE);
    expect(run).toHaveBeenCalledTimes(1);
    s.touch();
    await vi.advanceTimersByTimeAsync(IDLE);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('flush runs now only when dirty', async () => {
    await s.flush();
    expect(run).not.toHaveBeenCalled();
    s.touch();
    await s.flush();
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(IDLE);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('setIdleMs changes the delay for the next touch', async () => {
    s.setIdleMs(10000);
    s.touch();
    await vi.advanceTimersByTimeAsync(10000);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
