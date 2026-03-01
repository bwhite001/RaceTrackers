import React from 'react';
import useRaceMaintenanceStore from '../../modules/race-maintenance/store/raceMaintenanceStore';

/**
 * Step 3 of the race setup wizard — configure waves/batches.
 *
 * When `raceId` is provided (editing an existing race), changes are persisted
 * to Dexie immediately via the store's saveBatch / deleteBatch actions.
 * When `raceId` is absent (new race wizard), changes update local form state
 * via the `onChange` callback and are persisted when the race is created.
 */
function BatchConfigStep({ batches, onChange, raceStartTime, raceId }) {
  const storeSaveBatch = useRaceMaintenanceStore(s => s.saveBatch);
  const storeDeleteBatch = useRaceMaintenanceStore(s => s.deleteBatch);

  const persistBatch = (batch) => {
    if (raceId) storeSaveBatch(raceId, batch);
  };

  const addBatch = () => {
    const next = batches.length + 1;
    const newBatch = {
      batchNumber: next,
      batchName: `Wave ${next}`,
      startTime: raceStartTime || ''
    };
    const updated = [...batches, newBatch];
    onChange(updated);
    if (raceId) storeSaveBatch(raceId, newBatch);
  };

  const removeBatch = index => {
    const removed = batches[index];
    const updated = batches
      .filter((_, i) => i !== index)
      .map((b, i) => ({ ...b, batchNumber: i + 1 }));
    onChange(updated);
    if (raceId && removed) storeDeleteBatch(raceId, removed.batchNumber);
  };

  const updateBatch = (index, field, value) => {
    const updated = batches.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    onChange(updated);
  };

  const handleBlur = (index) => {
    persistBatch(batches[index]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Wave / Batch Configuration
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure starting waves for your race. Each wave has its own start
          time used to calculate elapsed times on the leaderboard.
        </p>
      </div>

      <div className="space-y-3">
        {batches.map((batch, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-900 text-navy-700 dark:text-navy-300 flex items-center justify-center text-sm font-semibold">
              {batch.batchNumber}
            </span>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Wave Name
                </label>
                <input
                  type="text"
                  value={batch.batchName}
                  onChange={e => updateBatch(index, 'batchName', e.target.value)}
                  onBlur={() => handleBlur(index)}
                  placeholder="e.g. Elite Wave"
                  className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={batch.startTime ? batch.startTime.slice(11, 16) : ''}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':');
                    const date = raceStartTime
                      ? raceStartTime.slice(0, 10)
                      : new Date().toISOString().slice(0, 10);
                    updateBatch(index, 'startTime', `${date}T${h}:${m}:00`);
                  }}
                  onBlur={() => handleBlur(index)}
                  className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                />
              </div>
            </div>

            {batches.length > 1 && (
              <button
                type="button"
                onClick={() => removeBatch(index)}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label={`Remove wave ${batch.batchNumber}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addBatch}
        className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-navy-500 dark:hover:border-navy-400 hover:text-navy-600 dark:hover:text-navy-300 text-sm font-medium transition-colors"
      >
        + Add Wave
      </button>
    </div>
  );
}

export default BatchConfigStep;
