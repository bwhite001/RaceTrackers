import React, { useState } from 'react';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { BottomSheet } from '../../../design-system/components/VK';
import { Button } from '../../../design-system/components';

/** Alt+D — WICEN2 "Add Number": a bib joins the field as a late entry (Undo from the host). */
const LateEntrySheet = ({ open, onClose, onDone }) => {
  const { raceRunnerNumbers = [], addLateEntries, cancelLateEntries } = useBaseOperationsStore();
  const [num, setNum] = useState('');
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const n = Number(num);
  const problem = !num ? '' : !n ? 'Invalid number' : raceRunnerNumbers.includes(n) ? `${n} is already in the field` : '';
  const close = () => { setNum(''); onClose(); };
  const add = async (e) => {
    e.preventDefault();
    if (!n || problem || busy) return;
    setBusy(true);
    try {
      const ids = await addLateEntries([n]);
      onDone?.(`${n} added to the field`, () => cancelLateEntries(ids));
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open onClose={close} labelledBy="late-hd">
      <form onSubmit={add} className="flex flex-col gap-3" aria-label="Add late entry">
        <h2 id="late-hd" className="font-display font-bold text-xl text-vk-navy dark:text-white">Add a late entry</h2>
        <label htmlFor="late-num" className="text-xs font-bold text-vk-muted uppercase tracking-[0.8px]">Runner number</label>
        <input id="late-num" type="text" inputMode="numeric" autoComplete="off" value={num}
          onChange={e => setNum(e.target.value.replace(/\D/g, '').slice(0, 5))}
          className="font-display font-extrabold text-[26px] text-vk-ink bg-white border-2 border-vk-blue rounded-btn px-3 py-1 min-h-[52px] dark:bg-gray-900 dark:text-white" />
        <div className="min-h-[20px] text-[13px] font-semibold text-vk-red" role="status">{problem}</div>
        <Button type="submit" variant="gold" size="primary" fullWidth disabled={!n || !!problem || busy}>Add to the field</Button>
        <Button type="button" variant="plain" size="action" fullWidth onClick={close}>Cancel</Button>
      </form>
    </BottomSheet>
  );
};

export default LateEntrySheet;
