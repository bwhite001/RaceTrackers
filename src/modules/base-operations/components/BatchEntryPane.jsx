import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import BibChipInput from './BibChipInput';

function roundDownTo5Min(date) {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return format(d, 'HH:mm');
}

function isInFuture(timeStr) {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const entry = new Date();
  entry.setHours(h, m, 0, 0);
  return entry > now;
}

const BatchEntryPane = ({ checkpoints, knownRunners, existingRecords, statusWarnings, onSubmit, onCheckpointChange, loading }) => {
  const [checkpointNumber, setCheckpointNumber] = useState('');
  const [commonTime, setCommonTime] = useState('');
  const [chips, setChips] = useState([]);

  const handleCpChange = (e) => {
    setCheckpointNumber(e.target.value);
    onCheckpointChange?.(e.target.value ? Number(e.target.value) : null);
  };

  const handleTimeFocus = useCallback(() => {
    if (!commonTime) setCommonTime(roundDownTo5Min(new Date()));
  }, [commonTime]);

  const handleTimeKeyDown = useCallback((e) => {
    if (!commonTime) return;
    const [h, m] = commonTime.split(':').map(Number);
    if (e.key === 'ArrowUp') { e.preventDefault(); const d = new Date(); d.setHours(h, m + 5, 0, 0); setCommonTime(format(d, 'HH:mm')); }
    if (e.key === 'ArrowDown') { e.preventDefault(); const d = new Date(); d.setHours(h, m - 5, 0, 0); setCommonTime(format(d, 'HH:mm')); }
  }, [commonTime]);

  const handleAddChip = useCallback((chip) => setChips(prev => prev.some(c => c.bib === chip.bib) ? prev : [...prev, chip]), []);
  const handleRemoveChip = useCallback((bib) => setChips(prev => prev.filter(c => c.bib !== bib)), []);

  const canSubmit = checkpointNumber && commonTime && chips.length > 0 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onSubmit({ checkpointNumber: Number(checkpointNumber), commonTime, bibs: chips });
    setChips([]);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div>
        <label htmlFor="cpSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Checkpoint</label>
        <select id="cpSelect" aria-label="Checkpoint" value={checkpointNumber} onChange={handleCpChange} disabled={loading}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          <option value="">Select checkpoint…</option>
          {checkpoints.map(cp => (
            <option key={cp.number} value={cp.number}>CP{cp.number} — {cp.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="commonTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Common Time</label>
        <input id="commonTime" type="time" value={commonTime}
          onFocus={handleTimeFocus} onChange={e => setCommonTime(e.target.value)} onKeyDown={handleTimeKeyDown}
          disabled={loading}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
        {isInFuture(commonTime) && <p className="mt-1 text-xs text-amber-600">⚠ Time is in the future</p>}
        <p className="mt-1 text-xs text-gray-400">↑↓ keys nudge by 5 minutes</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bib Numbers</label>
        <BibChipInput chips={chips} onAdd={handleAddChip} onRemove={handleRemoveChip}
          knownRunners={knownRunners} existingRecords={existingRecords} statusWarnings={statusWarnings} disabled={loading} />
        <p className="mt-1 text-xs text-gray-400">Enter bib, press Enter or Tab to add</p>
      </div>
      <button type="submit" disabled={!canSubmit}
        className="mt-2 w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors">
        {loading ? 'Recording…' : 'Record Batch'}
      </button>
    </form>
  );
};

BatchEntryPane.propTypes = {
  checkpoints:        PropTypes.array.isRequired,
  knownRunners:       PropTypes.arrayOf(PropTypes.number).isRequired,
  existingRecords:    PropTypes.arrayOf(PropTypes.number).isRequired,
  statusWarnings:     PropTypes.arrayOf(PropTypes.shape({ number: PropTypes.number, status: PropTypes.string })),
  onSubmit:           PropTypes.func.isRequired,
  onCheckpointChange: PropTypes.func,
  loading:            PropTypes.bool,
};

BatchEntryPane.defaultProps = { statusWarnings: [], loading: false };

export default BatchEntryPane;
