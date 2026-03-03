import React from 'react';
import PropTypes from 'prop-types';
import BatchCard from './BatchCard';

const SessionHistoryPane = ({ batches, checkpoints, activeBib, onVoid }) => {
  const cpName = (n) => {
    const cp = checkpoints.find(c => c.number === n);
    return cp ? `${cp.name}` : `CP${n ?? '?'}`;
  };

  if (batches.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8">No batches recorded yet this session</div>;
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {batches.map(batch => (
        <BatchCard key={batch.id} batch={batch}
          checkpointName={cpName(batch.checkpointNumber)}
          isHighlighted={activeBib !== null && batch.bibs.includes(activeBib)}
          onVoid={onVoid} />
      ))}
    </div>
  );
};

SessionHistoryPane.propTypes = {
  batches: PropTypes.array.isRequired,
  checkpoints: PropTypes.array.isRequired,
  activeBib: PropTypes.number,
  onVoid: PropTypes.func.isRequired,
};

export default SessionHistoryPane;
