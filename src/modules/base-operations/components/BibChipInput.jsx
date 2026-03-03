import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const CHIP_STYLES = {
  valid:         'bg-green-100 text-green-800 border-green-300',
  duplicate:     'bg-amber-100 text-amber-800 border-amber-300',
  'status-warn': 'bg-amber-100 text-amber-800 border-amber-300',
  unknown:       'bg-red-100 text-red-800 border-red-300',
};

const STATUS_WARN_LABELS = {
  dnf:           '⚠ DNF',
  'non-starter': '⚠ DNS',
};

function classifyBib(bib, knownRunners, existingRecords, statusWarnings) {
  if (!knownRunners.includes(bib)) return 'unknown';
  if (existingRecords.includes(bib)) return 'duplicate';
  if (statusWarnings.some(w => w.number === bib)) return 'status-warn';
  return 'valid';
}

const BibChipInput = ({ chips, onAdd, onRemove, knownRunners, existingRecords, statusWarnings, disabled }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const commit = () => {
    const raw = value.trim();
    if (!raw) return;
    const bib = parseInt(raw, 10);
    if (!isNaN(bib) && bib > 0) {
      onAdd({ bib, status: classifyBib(bib, knownRunners, existingRecords, statusWarnings) });
    }
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Tab')   { e.preventDefault(); commit(); }
  };

  const chipLabel = ({ bib, status }) => {
    if (status === 'duplicate') return `${bib} ⚠ Dup`;
    if (status === 'status-warn') {
      const warn = statusWarnings.find(w => w.number === bib);
      return `${bib} ${STATUS_WARN_LABELS[warn?.status] ?? '⚠'}`;
    }
    return bib;
  };

  return (
    <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
      {chips.map(({ bib, status }) => (
        <span key={bib} className={`inline-flex items-center gap-1 px-2 py-0.5 text-sm font-medium border rounded-full ${CHIP_STYLES[status]}`}>
          {chipLabel({ bib, status })}
          <button type="button" aria-label={`Remove bib ${bib}`}
            onClick={() => onRemove(bib)} disabled={disabled}
            className="ml-1 leading-none hover:opacity-70">×</button>
        </span>
      ))}
      <input ref={inputRef} type="text" inputMode="numeric" pattern="[0-9]*"
        value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown}
        placeholder={chips.length === 0 ? 'Enter bib, press Enter…' : ''}
        disabled={disabled}
        className="flex-1 min-w-[6rem] outline-none text-sm bg-transparent"
        aria-label="Bib number input" />
    </div>
  );
};

BibChipInput.propTypes = {
  chips:           PropTypes.arrayOf(PropTypes.shape({ bib: PropTypes.number, status: PropTypes.string })).isRequired,
  onAdd:           PropTypes.func.isRequired,
  onRemove:        PropTypes.func.isRequired,
  knownRunners:    PropTypes.arrayOf(PropTypes.number).isRequired,
  existingRecords: PropTypes.arrayOf(PropTypes.number).isRequired,
  statusWarnings:  PropTypes.arrayOf(PropTypes.shape({ number: PropTypes.number, status: PropTypes.string })),
  disabled:        PropTypes.bool,
};

BibChipInput.defaultProps = { statusWarnings: [], disabled: false };

export default BibChipInput;
