import React, { useState } from 'react';
import PropTypes from 'prop-types';

const DraftView = ({
  runners,
  checkpointName,
  commonTime,
  existingRecords,
  editingBatch,
  loading,
  onRemove,
  onClear,
  onRecord,
  onCancel,
  onUpdate,
  onResolve,
}) => {
  const [resolvingId, setResolvingId] = useState(null);
  const isEditMode = editingBatch !== null;
  const unresolved = runners.filter(r => r.isUnresolved && r.bib === null);
  const hasUnresolved = unresolved.length > 0;
  const duplicates = runners.filter(r => !r.isUnresolved && existingRecords.includes(r.bib));
  const hasDuplicates = duplicates.length > 0;
  const unknowns = runners.filter(r => !r.isUnresolved && r.isUnknown);
  const hasUnknowns = unknowns.length > 0;

  if (runners.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16">
          <span className="text-5xl mb-3" role="img" aria-label="runner">🏃</span>
          <p className="font-medium">No runners yet</p>
          <p className="text-sm mt-1">Enter bib numbers above to start building your batch</p>
        </div>
        <DraftFooter
          count={0} isEditMode={isEditMode} loading={loading} hasUnresolved={false}
          onClear={onClear} onRecord={onRecord} onCancel={onCancel} onUpdate={onUpdate}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-4 py-3 text-sm font-semibold border-b ${
        isEditMode
          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200'
          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      }`}>
        {isEditMode
          ? `✏️ EDITING BATCH #${editingBatch.batchNumber}`
          : `📝 DRAFT FOR: ${checkpointName}`
        }
        {commonTime && (
          <span className="ml-2 font-normal">⏰ {commonTime}</span>
        )}
      </div>

      {/* Unresolved calls warning */}
      {hasUnresolved && (
        <div role="alert" className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 text-amber-800 dark:text-amber-200 text-sm">
          ⚠️ {unresolved.length} unresolved call{unresolved.length > 1 ? 's' : ''} — resolve or remove before submitting
        </div>
      )}

      {/* Unknown bib error */}
      {hasUnknowns && (
        <div role="alert" className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 text-red-800 dark:text-red-200 text-sm">
          ❌ {unknowns.map(r => `Runner ${r.bib} is not a registered racer`).join(', ')}
        </div>
      )}

      {/* Duplicate warning */}
      {hasDuplicates && (
        <div role="alert" className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 text-amber-800 dark:text-amber-200 text-sm">
          ⚠️ {duplicates.map(r => `Runner ${r.bib} is already in this batch`).join(', ')}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Runner</th>
              <th className="px-4 py-2 text-left">Added At</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runners.map(r => {
              const isUnresolved = r.isUnresolved && r.bib === null;
              const isDup = !isUnresolved && existingRecords.includes(r.bib);
              const isUnknown = !isUnresolved && r.isUnknown;
              const rowCls = isUnresolved
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : isUnknown
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : isDup
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : r.isOriginal
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/10';
              return (
                <tr key={r.id ?? r.bib} className={`border-b border-gray-100 dark:border-gray-700 ${rowCls}`}>
                  <td className="px-4 py-3 font-bold text-base">
                    {isUnresolved
                      ? <span className="text-amber-600 dark:text-amber-400">?</span>
                      : <>
                          {isUnknown && <span className="mr-1">❌</span>}
                          {!isUnknown && isDup && <span className="mr-1">⚠️</span>}
                          {r.bib}
                        </>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {isUnresolved ? (
                      resolvingId === r.id ? (
                        <input
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                          type="number"
                          placeholder="Bib number…"
                          className="w-24 border border-amber-400 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const n = parseInt(e.target.value, 10);
                              if (!isNaN(n) && n > 0) {
                                onResolve?.(r.id, n);
                                setResolvingId(null);
                              }
                            }
                            if (e.key === 'Escape') setResolvingId(null);
                          }}
                          onBlur={() => setResolvingId(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setResolvingId(r.id)}
                          className="text-sm text-amber-700 dark:text-amber-400 underline hover:no-underline"
                        >
                          Resolve
                        </button>
                      )
                    ) : isUnknown ? 'Not a registered racer' : isDup ? 'Already in batch' : r.isOriginal ? 'Original' : r.addedAt}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Remove runner ${r.bib ?? '?'}`}
                      onClick={() => onRemove(r.id ?? r.bib)}
                      disabled={loading}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded px-2 py-1 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DraftFooter
        count={runners.length} isEditMode={isEditMode} loading={loading} hasUnresolved={hasUnresolved}
        onClear={onClear} onRecord={onRecord} onCancel={onCancel} onUpdate={onUpdate}
      />
    </div>
  );
};

const DraftFooter = ({ count, hasUnresolved, isEditMode, loading, onClear, onRecord, onCancel, onUpdate }) => (
  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
    {isEditMode ? (
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Cancel
      </button>
    ) : (
      <button
        type="button"
        onClick={onClear}
        disabled={count === 0}
        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        Clear Draft
      </button>
    )}

    {isEditMode ? (
      <button
        type="button"
        onClick={onUpdate}
        disabled={count === 0 || loading}
        className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating…' : 'Update Batch'}
      </button>
    ) : (
      <button
        type="button"
        onClick={onRecord}
        disabled={count === 0 || loading || hasUnresolved}
        className="px-6 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Recording…' : hasUnresolved ? 'Resolve all calls first' : `Record ${count} Runner${count === 1 ? '' : 's'}`}
      </button>
    )}
  </div>
);

DraftView.propTypes = {
  runners: PropTypes.arrayOf(PropTypes.shape({
    id:           PropTypes.string,
    bib:          PropTypes.number,
    addedAt:      PropTypes.string,
    isOriginal:   PropTypes.bool,
    isUnknown:    PropTypes.bool,
    isUnresolved: PropTypes.bool,
  })).isRequired,
  checkpointName:  PropTypes.string,
  commonTime:      PropTypes.string,
  existingRecords: PropTypes.arrayOf(PropTypes.number),
  editingBatch:    PropTypes.object,
  loading:         PropTypes.bool,
  onRemove:        PropTypes.func.isRequired,
  onClear:         PropTypes.func.isRequired,
  onRecord:        PropTypes.func.isRequired,
  onCancel:        PropTypes.func.isRequired,
  onUpdate:        PropTypes.func.isRequired,
  onResolve:       PropTypes.func,
};

DraftView.defaultProps = { existingRecords: [], editingBatch: null, loading: false };

export default DraftView;
