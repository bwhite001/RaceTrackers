import React, { useRef, useState } from 'react';
import { Button } from '../../design-system/components';

/**
 * Quick entry: type one or more bib numbers (commas or spaces) and Mark.
 * Enter submits. Parsing and marking belong to the caller (`onMark(text)`).
 */
const QuickEntryBar = ({ onMark }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    await onMark(value);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="flex gap-2" aria-label="Quick runner entry">
      <label htmlFor="quick-entry-input" className="sr-only">Bib numbers</label>
      <input
        id="quick-entry-input"
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Bib numbers, e.g. 157, 161"
        className="flex-1 min-w-0 font-display font-bold text-lg text-vk-ink bg-white border-2 border-vk-blue rounded-btn px-3 py-2.5 min-h-[52px] focus:outline-none focus:ring-2 focus:ring-vk-blue/30 dark:bg-gray-800 dark:text-white"
      />
      <Button type="submit" variant="gold" size="primary" disabled={!value.trim()}>
        Mark
      </Button>
    </form>
  );
};

export default QuickEntryBar;
