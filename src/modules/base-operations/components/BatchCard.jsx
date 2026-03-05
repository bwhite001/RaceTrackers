import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BatchCard = ({ batch, checkpointName, isHighlighted, onVoid }) => {
  const [expanded, setExpanded] = useState(false);
  const submittedAt = new Date(batch.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div data-testid="batch-card"
      className={`border rounded-lg p-3 transition-all ${batch.voided ? 'opacity-40' : ''}
        ${isHighlighted ? 'ring-2 ring-amber-400 animate-pulse' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-sm">{checkpointName}</span>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Common: {batch.commonTime}</span>
          <span className="ml-2 text-xs text-gray-400">Recorded: {submittedAt}</span>
        </div>
        {!batch.voided && (
          <button type="button" aria-label="expand" onClick={() => setExpanded(v => !v)}
            className="text-gray-400 hover:text-gray-600 text-xs">{expanded ? '▲' : '▼'}</button>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {batch.bibs.map(bib => (
          <span key={bib} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300">{bib}</span>
        ))}
      </div>
      {expanded && !batch.voided && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
          <button type="button" aria-label="void batch" onClick={() => onVoid(batch.id)}
            className="text-sm text-red-600 hover:text-red-800 font-medium">Void batch</button>
        </div>
      )}
      {batch.voided && <div className="mt-1 text-xs text-red-500">Voided</div>}
    </div>
  );
};

BatchCard.propTypes = {
  batch: PropTypes.object.isRequired,
  checkpointName: PropTypes.string.isRequired,
  isHighlighted: PropTypes.bool,
  onVoid: PropTypes.func.isRequired,
};

export default BatchCard;
