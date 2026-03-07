import React, { useRef, useState } from 'react';
import useDualCheckpointStore from '../../modules/checkpoint-operations/store/useDualCheckpointStore';

/**
 * DualQuickEntryBar — numeric quick-entry for dual-checkpoint operations.
 * Marks runners in the currently-active checkpoint tab.
 */
const DualQuickEntryBar = () => {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  const { markRunner, getActiveRunners, activeTab, primaryCpNumber, secondaryCpNumber } = useDualCheckpointStore();
  const runners = getActiveRunners();
  const activeCpLabel = `CP${activeTab === 'primary' ? primaryCpNumber : secondaryCpNumber}`;

  const showFeedback = (type, message) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, message });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const runnerNumber = parseInt(trimmed, 10);
    if (isNaN(runnerNumber) || runnerNumber <= 0) {
      showFeedback('error', `"${trimmed}" is not a valid runner number`);
      setValue('');
      inputRef.current?.focus();
      return;
    }

    const exists = runners.some(r => r.number === runnerNumber);
    if (!exists) {
      showFeedback('error', `Runner ${runnerNumber} not found at ${activeCpLabel}`);
      setValue('');
      inputRef.current?.focus();
      return;
    }

    try {
      await markRunner(runnerNumber);
      showFeedback('success', `Runner ${runnerNumber} marked at ${activeCpLabel}`);
    } catch (err) {
      showFeedback('error', `Failed to mark runner ${runnerNumber}`);
      console.error('DualQuickEntryBar markRunner error:', err);
    }

    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2" aria-label="Quick runner entry">
        <label htmlFor="dual-quick-entry-input" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Quick Entry ({activeCpLabel})
        </label>
        <input
          id="dual-quick-entry-input"
          ref={inputRef}
          type="number"
          min="1"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Runner #"
          autoFocus
          className="w-28 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Runner number"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Mark
        </button>
      </form>

      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={`text-xs font-medium ${
            feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
};

export default DualQuickEntryBar;
