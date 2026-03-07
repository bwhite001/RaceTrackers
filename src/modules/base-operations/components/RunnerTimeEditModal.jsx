import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

function roundDownTo5Min(date) {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return format(d, 'HH:mm');
}

const RunnerTimeEditModal = ({ runnerNumber, checkpointNumber, existingTime, isOpen, isDuplicate, onClose, onSave, onClear }) => {
  const [time, setTime] = useState(existingTime ?? roundDownTo5Min(new Date()));
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-80">
        <h2 className="text-base font-semibold mb-1 dark:text-white">Runner {runnerNumber} — CP{checkpointNumber}</h2>
        {isDuplicate && <p className="text-amber-600 text-sm mb-3">⚠ Already recorded at this checkpoint</p>}
        <label htmlFor="editTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
        <input id="editTime" type="time" value={time} onChange={e => setTime(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm mb-4 dark:bg-gray-700 dark:text-white" />
        <div className="flex gap-3 justify-between">
          {existingTime && onClear ? (
            <button type="button" aria-label="clear time" onClick={() => onClear({ runnerNumber, checkpointNumber })}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
              Clear Time
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button type="button" aria-label="cancel" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400">Cancel</button>
            <button type="button" aria-label="save" onClick={() => onSave({ runnerNumber, time })} disabled={!time}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg disabled:opacity-40 hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

RunnerTimeEditModal.propTypes = {
  runnerNumber:    PropTypes.number.isRequired,
  checkpointNumber: PropTypes.number.isRequired,
  existingTime:    PropTypes.string,
  isOpen:          PropTypes.bool.isRequired,
  isDuplicate:     PropTypes.bool,
  onClose:         PropTypes.func.isRequired,
  onSave:          PropTypes.func.isRequired,
  onClear:         PropTypes.func,
};

export default RunnerTimeEditModal;
