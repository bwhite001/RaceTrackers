import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore';
import InputSection from './InputSection';
import DraftView from './DraftView';
import HistoryView from './HistoryView';

const BatchEntryLayout = ({ onUnsavedChanges }) => {
  const { runners, sessionBatches, submitRadioBatch, voidSessionBatch, editSessionBatch, loading } =
    useBaseOperationsStore();
  const { checkpoints, runners: raceRunners, currentRace } = useRaceStore();

  const [checkpointNumber, setCheckpointNumber] = useState(null);
  const [commonTime, setCommonTime] = useState('');
  const [chips, setChips] = useState([]);
  const [editingBatch, setEditingBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('draft');

  const existingRecords = useMemo(() => {
    if (!checkpointNumber) return [];
    return (runners ?? [])
      .filter(r => r.checkpointNumber === checkpointNumber && r.status !== 'not-started')
      .map(r => r.number);
  }, [runners, checkpointNumber]);

  const cpName = useCallback((n) => {
    const cp = (checkpoints ?? []).find(c => c.number === n);
    return cp ? `CP${cp.number} — ${cp.name}` : `CP${n ?? '?'}`;
  }, [checkpoints]);

  const handleBibEntered = useCallback((bibs) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChips(prev => {
      const existing = new Set(prev.map(c => c.bib));
      const newChips = bibs
        .filter(b => !existing.has(b))
        .map(b => ({ bib: b, addedAt: now, isOriginal: false }));
      return [...prev, ...newChips];
    });
    onUnsavedChanges?.(true);
  }, [onUnsavedChanges]);

  const handleRemove = useCallback((bib) => setChips(prev => prev.filter(c => c.bib !== bib)), []);

  const handleClear = useCallback(() => {
    setChips([]);
    onUnsavedChanges?.(false);
  }, [onUnsavedChanges]);

  const handleRecord = useCallback(async () => {
    if (!checkpointNumber || !commonTime || chips.length === 0) return;
    await submitRadioBatch(chips.map(c => c.bib), commonTime, checkpointNumber, {});
    setChips([]);
    onUnsavedChanges?.(false);
    setActiveTab('history');
  }, [checkpointNumber, commonTime, chips, submitRadioBatch, onUnsavedChanges]);

  const handleEditBatch = useCallback((batch) => {
    const batchNumber = (sessionBatches ?? []).indexOf(batch) + 1;
    setEditingBatch({ ...batch, batchNumber });
    setCheckpointNumber(batch.checkpointNumber);
    setCommonTime(batch.commonTime);
    const submittedTime = new Date(batch.submittedAt).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setChips(batch.bibs.map(bib => ({ bib, addedAt: submittedTime, isOriginal: true })));
    setActiveTab('draft');
  }, [sessionBatches]);

  const handleCancel = useCallback(() => {
    setEditingBatch(null);
    setChips([]);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!editingBatch || chips.length === 0) return;
    await editSessionBatch(editingBatch.id, chips.map(c => c.bib), commonTime, checkpointNumber);
    setEditingBatch(null);
    setChips([]);
    setActiveTab('history');
  }, [editingBatch, chips, commonTime, checkpointNumber, editSessionBatch]);

  const draftCount = chips.length;
  const historyCount = (sessionBatches ?? []).filter(b => !b.voided).length;
  const raceStartTime = currentRace?.startTime ?? null;

  return (
    <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 dark:divide-gray-700
                    rounded-lg border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800 overflow-hidden">

      {/* ── Left column: Input ── */}
      <div className="md:w-72 lg:w-80 flex-shrink-0 border-b md:border-b-0 border-gray-200 dark:border-gray-700">
        <InputSection
          checkpoints={checkpoints ?? []}
          checkpointNumber={checkpointNumber}
          commonTime={commonTime}
          locked={!!editingBatch}
          disabled={loading}
          raceStartTime={raceStartTime}
          onCheckpointChange={setCheckpointNumber}
          onTimeChange={setCommonTime}
          onBibEntered={handleBibEntered}
        />
      </div>

      {/* ── Right column: Draft / History tabs + list ── */}
      <div className="flex flex-col flex-1 min-h-[320px]">

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
          {[
            { id: 'draft',   label: '📝 Draft',   count: draftCount,   ariaLabel: 'Draft' },
            { id: 'history', label: '📋 History',  count: historyCount, ariaLabel: 'History' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.ariaLabel}
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-bold ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'draft' ? (
            <DraftView
              runners={chips}
              checkpointName={checkpointNumber ? cpName(checkpointNumber) : ''}
              commonTime={commonTime}
              existingRecords={existingRecords}
              editingBatch={editingBatch}
              loading={loading}
              onRemove={handleRemove}
              onClear={handleClear}
              onRecord={handleRecord}
              onCancel={handleCancel}
              onUpdate={handleUpdate}
            />
          ) : (
            <div className="p-4">
              <HistoryView
                batches={sessionBatches ?? []}
                checkpoints={checkpoints ?? []}
                onEdit={handleEditBatch}
                onVoid={voidSessionBatch}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

BatchEntryLayout.propTypes = { onUnsavedChanges: PropTypes.func };

export default BatchEntryLayout;
