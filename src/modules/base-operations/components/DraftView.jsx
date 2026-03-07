import React from 'react';
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
}) => {
  const isEditMode = editingBatch !== null;
  const duplicates = runners.filter(r => existingRecords.includes(r.bib));
  const hasDuplicates = duplicates.length > 0;

  if (runners.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16">
          <span className="text-5xl mb-3" role="img" aria-label="runner">🏃</span>
          <p className="font-medium">No runners yet</p>
          <p className="text-sm mt-1">Enter bib numbers above to start building your batch</p>
        </div>
        <DraftFooter
          count={0} isEditMode={isEditMode} loading={loading}
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
              const isDup = existingRecords.includes(r.bib);
              const rowCls = isDup
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : r.isOriginal
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-blue-50 dark:bg-blue-900/10';
              return (
                <tr key={r.bib} className={`border-b border-gray-100 dark:border-gray-700 ${rowCls}`}>
                  <td className="px-4 py-3 font-bold text-base">
                    {isDup && <span className="mr-1">⚠️</span>}
                    {r.bib}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {isDup ? 'Already in batch' : r.isOriginal ? 'Original' : r.addedAt}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Remove runner ${r.bib}`}
                      onClick={() => onRemove(r.bib)}
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
        count={runners.length} isEditMode={isEditMode} loading={loading}
        onClear={onClear} onRecord={onRecord} onCancel={onCancel} onUpdate={onUpdate}
      />
    </div>
  );
};

const DraftFooter = ({ count, isEditMode, loading, onClear, onRecord, onCancel, onUpdate }) => (
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
        disabled={count === 0 || loading}
        className="px-6 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Recording…' : `Record ${count} Runner${count === 1 ? '' : 's'}`}
      </button>
    )}
  </div>
);

DraftView.propTypes = {
  runners: PropTypes.arrayOf(PropTypes.shape({
    bib:        PropTypes.number.isRequired,
    addedAt:    PropTypes.string,
    isOriginal: PropTypes.bool,
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
};

DraftView.defaultProps = { existingRecords: [], editingBatch: null, loading: false };

export default DraftView;
