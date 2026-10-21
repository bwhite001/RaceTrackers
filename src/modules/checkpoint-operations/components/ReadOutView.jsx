import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import useCheckpointStore from '../store/checkpointStore';
import CheckpointRepository from '../services/CheckpointRepository';
import { pendingRunners, groupByBlock } from '../services/checkpointStats';
import { buildOvers } from '../services/readout';
import TimeUtils from '../../../services/timeUtils.js';
import { hhmm, BLOCK_MINUTES } from '../../../services/blocks.js';
import { AppBar } from '../../../design-system/components/VK';
import { Button } from '../../../design-system/components';
import useCheckpointContext from '../../../components/Checkpoint/useCheckpointContext';

const rangeText = (from, to) => `${hhmm(from)}–${hhmm(TimeUtils.addMinutes(to, BLOCK_MINUTES))}`;

/**
 * Read-out mode for busy blocks (spec §4.7). Numbers are split into overs of
 * up to `overSize`; each bib is its own row with a checkbox. "Base copied —
 * next" unlocks only when every number in the over is ticked. Progress is
 * saved so an interrupted read resumes at the same over.
 */
const ReadOutView = ({ onClose }) => {
  const { runners = [], currentRaceId, checkpointNumber, setCalledIn } = useCheckpointStore();
  const ctx = useCheckpointContext();

  // Freeze the list at open so runners marked meanwhile don't shift the overs
  const [blocks] = useState(() => groupByBlock(pendingRunners(runners))
    .map(g => ({ block: g.block, numbers: g.runners.map(r => r.number) })));
  const overs = useMemo(() => buildOvers(blocks, ctx.overSize), [blocks, ctx.overSize]);
  const allNumbers = useMemo(() => overs.flatMap(o => o.numbers), [overs]);
  const sessionKey = blocks[0]?.block ?? null;

  const [idx, setIdx] = useState(0);
  const [ticked, setTicked] = useState(() => new Set());
  const [flash, setFlash] = useState('');
  const [done, setDone] = useState(false);
  const [restored, setRestored] = useState(false);
  const finishing = useRef(false);

  // Resume an interrupted read
  useEffect(() => {
    if (!sessionKey || !currentRaceId) { setRestored(true); return; }
    CheckpointRepository.getReadout(currentRaceId, checkpointNumber, sessionKey).then(saved => {
      if (saved) {
        const known = new Set(allNumbers);
        setTicked(new Set((saved.tickedNumbers ?? []).filter(n => known.has(n))));
        setIdx(Math.min(saved.overIndex ?? 0, Math.max(0, overs.length - 1)));
        if (saved.overIndex) setFlash(`Resumed at over ${Math.min(saved.overIndex, overs.length - 1) + 1}`);
      }
      setRestored(true);
    }).catch(() => setRestored(true));
  }, [sessionKey, currentRaceId, checkpointNumber, allNumbers, overs.length]);

  // Save progress after every tick or over change
  useEffect(() => {
    if (!restored || done || !sessionKey || !currentRaceId) return;
    CheckpointRepository.saveReadout(currentRaceId, checkpointNumber, sessionKey, {
      tickedNumbers: [...ticked], overIndex: idx,
    }).catch(() => {});
  }, [ticked, idx, restored, done, sessionKey, currentRaceId, checkpointNumber]);

  const total = allNumbers.length;
  const over = overs[idx];
  const sent = overs.slice(0, idx).reduce((n, o) => n + o.numbers.length, 0);
  const readCount = over ? over.numbers.filter(n => ticked.has(n)).length : 0;
  const allRead = !!over && readCount === over.numbers.length;
  const firstUnread = over?.numbers.find(n => !ticked.has(n));
  const subtitle = blocks.length
    ? `${ctx.shortName} · block ${rangeText(blocks[0].block, blocks[blocks.length - 1].block)} · ${total} competitor${total === 1 ? '' : 's'}`
    : ctx.shortName;

  const toggle = (n) => {
    setFlash('');
    setTicked(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  };

  const next = async () => {
    if (!allRead || finishing.current) return;
    if (idx < overs.length - 1) {
      setIdx(idx + 1);
      setFlash('');
      return;
    }
    finishing.current = true;
    await setCalledIn(allNumbers, true);
    await CheckpointRepository.clearReadout(currentRaceId, checkpointNumber, sessionKey).catch(() => {});
    setDone(true);
  };

  const reset = () => {
    setTicked(prev => {
      const n = new Set(prev);
      over?.numbers.forEach(x => n.delete(x));
      return n;
    });
    setFlash('Ticks cleared for this over');
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-vk-paper dark:bg-gray-900">
      <AppBar title="Read-out" subtitle={subtitle} onBack={onClose} backLabel="Back to callout sheet" right={null}>
        {overs.length > 0 && (
          <div className="px-2 flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px] text-vk-on-navy">
              <span>{done ? total : sent} of {total} copied by base</span>
              <span>{done ? 'Done' : `Over ${idx + 1} of ${overs.length}`}</span>
            </div>
            <div className="flex gap-1" aria-hidden="true">
              {overs.map((o, k) => (
                <div key={k} className={`flex-1 h-2 rounded-full ${done || k < idx ? 'bg-vk-gold' : k === idx ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        )}
      </AppBar>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 max-w-xl w-full mx-auto" data-screenshot-target>
        {overs.length === 0 && (
          <div className="bg-white border border-vk-border rounded-sheet p-6 text-center">
            <div className="font-display font-bold text-vk-navy">Nothing to read out</div>
            <Button variant="plain" size="action" className="mt-3" onClick={onClose}>Back to callout</Button>
          </div>
        )}

        {over && !done && (
          <>
            <section aria-live="polite" className="bg-white dark:bg-gray-800 border-2 border-vk-gold rounded-sheet p-[18px] flex flex-col gap-3.5 shadow-sheet">
              <div className="text-[15px] font-bold text-vk-blue">
                {over.first ? 'Common time' : 'Continuing'} {hhmm(over.block)}
              </div>
              <div className="flex flex-col gap-1.5">
                {over.numbers.map(n => {
                  const on = ticked.has(n);
                  const isNext = n === firstUnread;
                  return (
                    <label key={n}
                      className={`flex items-center gap-3.5 min-h-[56px] px-2.5 py-1 rounded-btn cursor-pointer border-2 ${isNext
                        ? 'bg-vk-band border-vk-blue dark:bg-gray-700'
                        : 'border-transparent border-b-vk-border'}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(n)} aria-label={`Read out ${n}`}
                        className="w-7 h-7 m-0 shrink-0 accent-vk-blue cursor-pointer" />
                      <span className={`font-display font-extrabold text-[34px] leading-tight tabular-nums ${on ? 'text-vk-muted line-through' : 'text-vk-ink dark:text-white'}`}>{n}</span>
                      {isNext && <span className="ml-auto text-xs font-bold text-vk-blue">Read next</span>}
                    </label>
                  );
                })}
              </div>
            </section>

            <Button
              variant={allRead ? 'gold' : 'locked'}
              size="primary"
              fullWidth
              disabled={!allRead}
              onClick={next}
              className={`min-h-[60px] ${allRead ? '!text-[15px]' : '!text-[13px]'}`}
            >
              {allRead ? 'Base copied — next' : `Tick each number as you read · ${readCount} of ${over.numbers.length}`}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="blueOutline" size="action" onClick={reset}>Reset</Button>
              <Button variant="plain" size="action" className="!normal-case !font-sans !font-bold !tracking-normal !border-vk-border"
                disabled={idx === 0} onClick={() => { setIdx(idx - 1); setFlash(''); }}>
                Previous over
              </Button>
            </div>
            <div className="text-[13px] font-semibold text-vk-blue min-h-[18px] text-center" aria-live="polite">{flash}</div>
          </>
        )}

        {done && (
          <section className="bg-white dark:bg-gray-800 border border-vk-border rounded-sheet px-[18px] py-6 flex flex-col items-center gap-3 text-center">
            <span className="w-14 h-14 rounded-full bg-vk-navy flex items-center justify-center">
              <CheckIcon className="w-7 h-7 text-vk-gold stroke-[3]" aria-hidden="true" />
            </span>
            <div className="font-display font-extrabold text-xl text-vk-navy dark:text-white">All {total} copied</div>
            <div className="text-sm text-vk-muted">
              Block {rangeText(blocks[0].block, blocks[blocks.length - 1].block)} marked as sent.
            </div>
            <Button variant="gold" size="action" onClick={onClose}>Back to callout</Button>
          </section>
        )}

        <div className="mt-auto bg-vk-band dark:bg-gray-800 rounded-card px-3.5 py-3 flex flex-col gap-1.5 text-[13px] leading-normal">
          <div><strong>Short overs.</strong> Up to {ctx.overSize} numbers each, so base can confirm or ask for a repeat without losing the rest.</div>
          <div><strong>One number at a time.</strong> Every bib is read in full, never as a range.</div>
        </div>
      </main>
    </div>
  );
};

export default ReadOutView;
