import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import useCheckpointStore from '../../modules/checkpoint-operations/store/checkpointStore';
import { pendingRunners, groupByBlock, calledBlocks, correctionRows } from '../../modules/checkpoint-operations/services/checkpointStats';
import TimeUtils from '../../services/timeUtils.js';
import { hhmm, BLOCK_MINUTES } from '../../services/blocks.js';
import { UndoBar, useUndo } from '../../design-system/components/VK';
import { Button } from '../../design-system/components';

const blockRange = (block) => `${hhmm(block)} – ${hhmm(TimeUtils.addMinutes(block, BLOCK_MINUTES))}`;
const RECENT_CALLED = 2;

/**
 * Checkpoint — Callout sheet (spec §4.6). Every bib is listed on its own,
 * never as a range. No radio phrases on screen (they live in the user guide).
 */
const CalloutSheet = ({ onReadOut }) => {
  const { runners = [], setCalledIn, sendCorrections, snapshot, restoreSnapshot } = useCheckpointStore();
  const undo = useUndo();
  const [showAllCalled, setShowAllCalled] = useState(false);
  const [message, setMessage] = useState('');

  const pending = pendingRunners(runners);
  const corrections = correctionRows(runners);
  const blocks = groupByBlock(pending);
  const called = calledBlocks(runners);
  const shownCalled = showAllCalled ? called : called.slice(-RECENT_CALLED);

  const markSent = async () => {
    const numbers = pending.map(r => r.number);
    if (!numbers.length) return;
    const snap = await snapshot(numbers);
    await setCalledIn(numbers, true);
    setMessage(`${numbers.length} marked as copied by base`);
    undo.offer(`${numbers.length} marked sent`, async () => {
      await restoreSnapshot(snap);
      setMessage('Back on the callout sheet');
    });
  };

  const markCorrectionsSent = async () => {
    const numbers = corrections.map(c => c.r.number);
    if (!numbers.length) return;
    const snap = await snapshot(numbers);
    await sendCorrections(numbers);
    setMessage(`${numbers.length} correction${numbers.length === 1 ? '' : 's'} copied by base`);
    undo.offer(`${numbers.length} correction${numbers.length === 1 ? '' : 's'} marked sent`, async () => {
      await restoreSnapshot(snap);
      setMessage('Back on the corrections card');
    });
  };

  return (
    <div className="px-4 pt-3.5 pb-28 flex flex-col gap-3">
      {called.length > RECENT_CALLED && (
        <button type="button" onClick={() => setShowAllCalled(v => !v)}
          className="self-start text-[13px] font-semibold text-vk-blue min-h-[32px]">
          {showAllCalled ? 'Hide earlier calls' : `Show ${called.length - RECENT_CALLED} earlier call${called.length - RECENT_CALLED === 1 ? '' : 's'}`}
        </button>
      )}
      {shownCalled.map(g => (
        <div key={g.block} className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card px-3.5 py-2.5 flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-vk-navy flex items-center justify-center shrink-0">
            <CheckIcon className="w-3.5 h-3.5 text-vk-gold stroke-[3]" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-px flex-1 min-w-0">
            <div className="font-bold text-sm">{blockRange(g.block)} · {g.runners.length}</div>
            <div className="text-[13px] text-vk-muted break-words">{g.runners.map(r => r.number).join(', ')}</div>
          </div>
          {g.sentAt && <div className="text-xs font-semibold text-vk-muted whitespace-nowrap">Sent {hhmm(g.sentAt)}</div>}
        </div>
      ))}

      {corrections.length > 0 && (
        <section aria-labelledby="corrections-hd" className="bg-white dark:bg-gray-800 border-2 border-vk-gold rounded-card p-3.5 flex flex-col gap-2.5" data-testid="corrections-card">
          <div className="flex items-center justify-between gap-2">
            <h2 id="corrections-hd" className="font-display font-extrabold text-lg text-vk-navy dark:text-white">Corrections</h2>
            <span className="text-xs font-bold text-vk-muted">One call per runner</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {corrections.map(c => (
              <li key={c.r.number} className="bg-vk-gold-tint rounded-btn px-3 py-2 flex items-baseline gap-2 flex-wrap" data-testid="correction-row">
                <span className="font-display font-extrabold text-[22px] tabular-nums">{c.r.number}</span>
                <span className="text-sm font-semibold">
                  {[
                    c.kind === 'not-passed' ? 'not passed' : c.kind === 'missed' ? 'missed' : null,
                    c.now ? `now ${hhmm(c.now)}` : null,
                    c.was ? `was ${hhmm(c.was)}` : null,
                  ].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
          <Button variant={blocks.length ? 'blueOutline' : 'gold'} size="primary" className="!text-[13px]" onClick={markCorrectionsSent}>
            Base copied — correction{corrections.length === 1 ? '' : 's'} sent
          </Button>
        </section>
      )}

      {blocks.length > 0 ? (
        <section aria-labelledby="next-call-hd" className="bg-vk-gold-tint border-2 border-vk-gold rounded-card p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="next-call-hd" className="font-display font-extrabold text-lg text-vk-navy dark:text-white">
              Next call · {blocks.length} block{blocks.length === 1 ? '' : 's'}
            </h2>
            <span className="bg-vk-gold text-vk-ink rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap">
              {pending.length} competitor{pending.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {blocks.map(g => (
              <div key={g.block} className="bg-white dark:bg-gray-800 rounded-btn p-3 flex flex-col gap-1.5" data-testid="pending-block">
                <div className="text-[13px] font-bold text-vk-blue">Common time {hhmm(g.block)} · {g.runners.length}</div>
                <div className="font-display font-extrabold text-[22px] tracking-[0.5px] flex flex-wrap items-center gap-x-1.5 gap-y-1 tabular-nums">
                  {g.runners.map((r, i) => (
                    <React.Fragment key={r.number}>
                      {i > 0 && <span className="text-vk-muted" aria-hidden="true">·</span>}
                      <span>{r.number}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="blueOutline" size="primary" className="flex-1 !text-[13px]" onClick={onReadOut}>Read out</Button>
            <Button variant="gold" size="primary" className="flex-[2] !text-[13px]" onClick={markSent}>Base copied — mark sent</Button>
          </div>
        </section>
      ) : corrections.length ? null : (
        <div className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-card p-5 text-center">
          <div className="font-display font-bold text-vk-navy dark:text-white">Nothing to call in</div>
          <div className="text-[13px] text-vk-muted mt-1">Runners appear here as you mark them off.</div>
        </div>
      )}

      <div className="min-h-[18px] text-[13px] font-semibold text-vk-blue text-center" aria-live="polite">{message}</div>

      <div className="text-xs text-vk-muted text-center">Send every 5–10 competitors, no more than ~5 min late</div>

      <UndoBar {...undo.bar} className="fixed left-4 right-4 bottom-[84px] z-40 max-w-xl mx-auto" />
    </div>
  );
};

export default CalloutSheet;
