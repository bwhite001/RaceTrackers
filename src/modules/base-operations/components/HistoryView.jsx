import React from 'react';
import PropTypes from 'prop-types';
import BatchCard from './BatchCard';

const HistoryView = ({ batches, checkpoints, onEdit, onVoid }) => {
  const cpName = (n) => {
    const cp = checkpoints.find(c => c.number === n);
    return cp ? `CP${cp.number} — ${cp.name}` : `CP${n ?? '?'}`;
  };

  const activeBatches = batches.filter(b => !b.voided);
  const totalRunners = activeBatches.reduce((sum, b) => sum + b.bibs.length, 0);

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-5xl mb-3" role="img" aria-label="history">📋</span>
        <p className="font-medium">No batches yet</p>
        <p className="text-sm mt-1">Record your first batch to see it appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary + print */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeBatches.length} batch{activeBatches.length !== 1 ? 'es' : ''},{' '}
          {totalRunners} runner{totalRunners !== 1 ? 's' : ''} total
        </p>
        <button
          type="button"
          aria-label="Print Session"
          onClick={() => window.print()}
          className="print:hidden px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          🖨 Print Session
        </button>
      </div>

      {/* Batch list — most recent first (index 0 = most recent) */}
      {batches.map((batch, idx) => (
        <BatchCard
          key={batch.id}
          batch={batch}
          checkpointName={cpName(batch.checkpointNumber)}
          batchNumber={batches.length - idx}
          onEdit={onEdit}
          onVoid={onVoid}
        />
      ))}

      {/* Print-only expanded layout */}
      <div className="hidden print:block mt-4">
        <h2 className="text-lg font-bold mb-2">Session History</h2>
        {activeBatches.map((batch, idx) => (
          <div key={batch.id} className="mb-4 pb-4 border-b">
            <p className="font-semibold">
              Batch {batches.length - batches.indexOf(batch)} — {cpName(batch.checkpointNumber)} — {batch.commonTime}
            </p>
            <p className="text-sm">Recorded: {new Date(batch.submittedAt).toLocaleString()}</p>
            {batch.editedAt && (
              <p className="text-sm">Edited: {new Date(batch.editedAt).toLocaleString()}</p>
            )}
            <p className="text-sm">
              Runners ({batch.bibs.length}): {[...batch.bibs].sort((a, b) => a - b).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

HistoryView.propTypes = {
  batches:     PropTypes.array.isRequired,
  checkpoints: PropTypes.array.isRequired,
  onEdit:      PropTypes.func.isRequired,
  onVoid:      PropTypes.func.isRequired,
};

export default HistoryView;
