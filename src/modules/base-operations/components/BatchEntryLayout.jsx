import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore';
import BatchEntryPane from './BatchEntryPane';
import SessionHistoryPane from './SessionHistoryPane';

const BatchEntryLayout = ({ onUnsavedChanges }) => {
  const { runners, sessionBatches, submitRadioBatch, voidSessionBatch, loading } = useBaseOperationsStore();
  const { checkpoints, runners: raceRunners } = useRaceStore();
  const [activeBib, setActiveBib] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [mobileTab, setMobileTab] = useState('entry');

  const knownRunners = useMemo(() => (raceRunners ?? []).map(r => r.number), [raceRunners]);

  const existingRecords = useMemo(() => {
    if (selectedCheckpoint === null) return [];
    // Only flag runners that have actually been recorded (not-started records are pre-created
    // for all runners when a checkpoint is initialised and must not trigger a duplicate warning).
    return runners
      .filter(r => r.checkpointNumber === selectedCheckpoint && r.status !== 'not-started')
      .map(r => r.number);
  }, [runners, selectedCheckpoint]);

  const statusWarnings = useMemo(() => {
    const seen = new Map();
    for (const r of runners) {
      if ((r.status === 'dnf' || r.status === 'non-starter') && !seen.has(r.number)) {
        seen.set(r.number, r.status);
      }
    }
    return Array.from(seen.entries()).map(([number, status]) => ({ number, status }));
  }, [runners]);

  const handleSubmit = useCallback(async ({ checkpointNumber, commonTime, bibs }) => {
    setSelectedCheckpoint(checkpointNumber);
    await submitRadioBatch(bibs.map(c => c.bib), commonTime, checkpointNumber);
    onUnsavedChanges?.(false);
  }, [submitRadioBatch, onUnsavedChanges]);

  const entryPane = (
    <BatchEntryPane
      checkpoints={checkpoints ?? []}
      knownRunners={knownRunners}
      existingRecords={existingRecords}
      statusWarnings={statusWarnings}
      onSubmit={handleSubmit}
      onCheckpointChange={setSelectedCheckpoint}
      loading={loading}
    />
  );

  const historyPane = (
    <SessionHistoryPane
      batches={sessionBatches}
      checkpoints={checkpoints ?? []}
      activeBib={activeBib}
      onVoid={voidSessionBatch}
    />
  );

  return (
    <div className="h-full">
      <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-700 mb-4">
        {['entry', 'history'].map(tab => (
          <button key={tab}
            className={`flex-1 py-2 text-sm font-medium capitalize ${mobileTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setMobileTab(tab)}>
            {tab}{tab === 'history' && sessionBatches.length > 0 && ` (${sessionBatches.length})`}
          </button>
        ))}
      </div>
      <div className="hidden lg:flex h-full gap-4">
        <div className="w-[45%] border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto">{entryPane}</div>
        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Session History</h3>
          {historyPane}
        </div>
      </div>
      <div className="lg:hidden">
        {mobileTab === 'entry' ? entryPane : <div className="p-4">{historyPane}</div>}
      </div>
    </div>
  );
};

BatchEntryLayout.propTypes = { onUnsavedChanges: PropTypes.func };
export default BatchEntryLayout;
