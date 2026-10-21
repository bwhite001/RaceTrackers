import React from 'react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'Add'];

/**
 * 3×4 keypad: 1–9, ⌫, 0, Add. Always paired with a real numeric <input>
 * that also takes keyboard + Enter.
 */
const NumberPad = ({ onDigit, onBackspace, onAdd }) => (
  <div className="grid grid-cols-3 auto-rows-[46px] gap-1.5" role="group" aria-label="Number pad">
    {KEYS.map(k => {
      if (k === 'Add') {
        return (
          <button key={k} type="button" onClick={onAdd} aria-label="Add number"
            className="rounded-btn bg-vk-blue text-white font-display font-extrabold text-sm">
            Add
          </button>
        );
      }
      const back = k === '⌫';
      return (
        <button
          key={k}
          type="button"
          onClick={() => (back ? onBackspace() : onDigit(k))}
          aria-label={back ? 'Delete digit' : k}
          className="rounded-btn border border-vk-border bg-vk-paper font-display font-extrabold text-xl text-vk-ink dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          {k}
        </button>
      );
    })}
  </div>
);

export default NumberPad;
