import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BatchCard = ({ batch, checkpointName, batchNumber, isHighlighted, onEdit, onVoid }) => {
  const [expanded, setExpanded] = useState(false);

  const submittedAt = new Date(batch.submittedAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const isEdited = !!batch.editedFrom;

  if (batch.voided) {
    return (
      <div data-testid="batch-card" className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 opacity-40">
        <span className="text-sm text-gray-500">
          Batch {batchNumber} — {checkpointName} — {batch.bibs.length} runner{batch.bibs.length !== 1 ? 's' : ''}
        </span>
        <span className="ml-2 text-xs text-red-500">Voided</span>
      </div>
    );
  }

  return (
    <div data-testid="batch-card"
      className={`border rounded-lg overflow-hidden transition-all ${
        isHighlighted ? 'ring-2 ring-amber-400 animate-pulse' : 'border-gray-200 dark:border-gray-700'
      }`}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <button
          type="button"
          aria-label="expand"
          onClick={() => setExpanded(v => !v)}
          className="text-gray-400 hover:text-gray-600 text-xs w-4 shrink-0"
        >
          {expanded ? '▼' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">{checkpointName}</span>
          <span className="ml-2 text-sm text-gray-500">⏰ {batch.commonTime}</span>
          {isEdited && (
            <span title="Edited" className="ml-2 text-xs text-orange-500">✏️</span>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {batch.bibs.length} runner{batch.bibs.length !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          aria-label="Edit Batch"
          onClick={() => onEdit(batch)}
          className="ml-2 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shrink-0"
        >
          Edit Batch
        </button>
      </div>

      {/* Expandable details */}
      <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${expanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {/* Runner pills — sorted numerically */}
          <div className="flex flex-wrap gap-1 mb-3">
            {[...batch.bibs].sort((a, b) => a - b).map(bib => (
              <span key={bib}
                className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {bib}
              </span>
            ))}
          </div>
          {/* Metadata */}
          <p className="text-xs text-gray-500 dark:text-gray-400">📅 Recorded: {submittedAt}</p>
          {isEdited && batch.editedAt && (
            <p className="text-xs text-orange-500 mt-0.5">
              ✏️ Edited: {new Date(batch.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
          <div className="flex justify-end mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" aria-label="void batch" onClick={() => onVoid(batch.id)}
              className="text-sm text-red-600 hover:text-red-800 font-medium">
              Void batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

BatchCard.propTypes = {
  batch:           PropTypes.object.isRequired,
  checkpointName:  PropTypes.string.isRequired,
  batchNumber:     PropTypes.number.isRequired,
  isHighlighted:   PropTypes.bool,
  onEdit:          PropTypes.func.isRequired,
  onVoid:          PropTypes.func.isRequired,
};

export default BatchCard;
