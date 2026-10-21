import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { boardCheckpoints } from '../services/receive';
import { outRecords, REASONS } from '../services/statusValidation';
import TimeUtils from '../../../services/timeUtils';
import { earliestTime } from '../../../services/blocks.js';
import { BottomSheet, TimeStepper } from '../../../design-system/components/VK';
import { Button } from '../../../design-system/components';
import useNow from '../../../shared/hooks/useNow';

const pillCls = (on) => `min-h-[40px] px-3 rounded-full text-[13px] font-bold ${on
  ? 'bg-vk-navy text-white'
  : 'bg-white text-vk-ink border border-vk-border dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600'}`;

const Label = ({ htmlFor, children }) => {
  const cls = 'text-xs font-bold text-vk-muted uppercase tracking-[0.8px]';
  return htmlFor ? <label htmlFor={htmlFor} className={cls}>{children}</label> : <span className={cls}>{children}</span>;
};

/**
 * Base — withdraw one runner with details (spec §3.5, §4.11): where, 24-hour
 * time, reason and comments. Recorded through the same path as bulk DNF, so
 * Undo (offered by the host via onDone) restores exactly what was there.
 * "105*" still reverses a withdrawal for operators used to it, but isn't
 * advertised — the out list's Clear does that now.
 */
const WithdrawalDialog = ({ isOpen, onClose, runnerNumber: initialRunnerNumber = '', onDone }) => {
  const { currentRace, checkpoints = [], outList = [], applyOutStatus, undoOutStatus, reverseWithdrawal, loading } = useBaseOperationsStore();
  const now = useNow();
  const [runnerNumber, setRunnerNumber] = useState(String(initialRunnerNumber ?? ''));
  const [where, setWhere] = useState(null);
  const [time, setTime] = useState(null); // null = follow the clock
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRunnerNumber(String(initialRunnerNumber ?? ''));
    setWhere(null); setTime(null); setReason(''); setComments(''); setError('');
  }, [isOpen, initialRunnerNumber]);

  const raceCps = useMemo(() => boardCheckpoints(checkpoints).filter(cp => cp.short !== 'Finish'), [checkpoints]);
  if (!isOpen) return null;

  const raceStart = currentRace?.date && currentRace?.startTime
    ? TimeUtils.createRaceTimestamp(currentRace.date, currentRace.startTime.slice(0, 5))
    : null;
  const at = time ?? now;
  const isReversal = runnerNumber.trim().endsWith('*');

  const submit = async (e) => {
    e.preventDefault();
    const num = parseInt(runnerNumber, 10);
    if (!runnerNumber.trim()) { setError('Runner number is required'); return; }
    if (Number.isNaN(num) || num <= 0) { setError('Invalid runner number'); return; }
    setBusy(true);
    try {
      if (isReversal) {
        await reverseWithdrawal(num);
        onClose();
        return;
      }
      const prev = new Map(outRecords(outList).map(r => [r.number, r]));
      const ops = await applyOutStatus({ mode: 'dnf', numbers: [num], where, reason, comments: comments.trim(), time: at, prev });
      onClose();
      onDone?.(`${num} withdrawn`, () => undoOutStatus(ops));
    } catch (err) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} labelledBy="withdraw-hd">
      <form onSubmit={submit} className="flex flex-col gap-3.5" aria-label="Withdraw runner">
        <h2 id="withdraw-hd" className="font-display font-bold text-xl text-vk-navy dark:text-white">Withdraw runner</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="runnerNumber">Runner number</Label>
          <input id="runnerNumber" type="text" inputMode="numeric" autoComplete="off" value={runnerNumber}
            onChange={e => { setRunnerNumber(e.target.value.replace(/[^\d*]/g, '')); setError(''); }}
            aria-invalid={!!error || undefined}
            className={`font-display font-extrabold text-[26px] text-vk-ink bg-white border-2 rounded-btn px-3 py-1 min-h-[52px] dark:bg-gray-900 dark:text-white ${error ? 'border-vk-red' : 'border-vk-blue'}`} />
        </div>

        {!isReversal && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Where</Label>
              <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Where">
                {raceCps.map(cp => (
                  <button key={cp.number} type="button" aria-pressed={where === cp.number} onClick={() => setWhere(cp.number)} className={pillCls(where === cp.number)}>{cp.short}</button>
                ))}
                <button type="button" aria-pressed={where === null} onClick={() => setWhere(null)} className={pillCls(where === null)}>On course</button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <Label>Time</Label>
                <span className="text-xs text-vk-muted" data-testid="withdraw-date">{TimeUtils.formatTime(at, 'EEE d MMM yyyy')}</span>
              </div>
              <TimeStepper size="md" value={at} min={earliestTime(raceStart, now)} max={now} onChange={setTime} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Reason</Label>
              <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Reason">
                {REASONS.map(r => (
                  <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(reason === r ? '' : r)} className={pillCls(reason === r)}>{r}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comments">Comments{reason === 'Medical' ? ' / vet notes' : ''}</Label>
              <textarea id="comments" rows={2} value={comments} onChange={e => setComments(e.target.value)}
                className="text-[15px] text-vk-ink bg-white border border-vk-border rounded-btn px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-600" />
            </div>
          </>
        )}

        {error && <p className="text-[13px] font-semibold text-vk-red" role="alert">{error}</p>}

        <Button type="submit" variant={isReversal ? 'blue' : 'red'} size="primary" fullWidth disabled={busy || loading}>
          {busy ? 'Saving…' : isReversal ? 'Put back in the race' : 'Withdraw runner'}
        </Button>
        <Button type="button" variant="plain" size="action" fullWidth onClick={onClose}>Cancel</Button>
      </form>
    </BottomSheet>
  );
};

WithdrawalDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  runnerNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  type: PropTypes.string,
  onDone: PropTypes.func,
};

export default WithdrawalDialog;
