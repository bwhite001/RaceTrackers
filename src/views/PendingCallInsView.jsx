import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBaseOperationsStore from '../modules/base-operations/store/baseOperationsStore';
import CheckpointRepository from '../modules/checkpoint-operations/services/CheckpointRepository';

/**
 * Pending Call-Ins View — Base Station.
 * Shows 5-minute groups from checkpoint_runners that have NOT been called in to base.
 * Operators can mark groups as called in from this view.
 */
function PendingCallInsView() {
  const navigate = useNavigate();
  const { currentRaceId, checkpoints } = useBaseOperationsStore();
  const [selectedCp, setSelectedCp] = useState(null);
  const [cpRunners, setCpRunners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingGroup, setMarkingGroup] = useState(null);

  const sortedCheckpoints = useMemo(() => {
    return [...(checkpoints || [])].sort((a, b) => a.number - b.number);
  }, [checkpoints]);

  // Select first checkpoint on load
  useEffect(() => {
    if (sortedCheckpoints.length > 0 && !selectedCp) {
      setSelectedCp(sortedCheckpoints[0].number);
    }
  }, [sortedCheckpoints]);

  // Load checkpoint runners when selected CP changes
  useEffect(() => {
    if (!currentRaceId || !selectedCp) return;
    setLoading(true);
    CheckpointRepository.getCheckpointRunners(currentRaceId, selectedCp)
      .then(setCpRunners)
      .finally(() => setLoading(false));
  }, [currentRaceId, selectedCp]);

  // Group runners by commonTimeLabel — include only passed runners
  const groups = useMemo(() => {
    const passed = cpRunners.filter(r => r.status === 'passed' && r.commonTimeLabel);
    const map = {};
    for (const r of passed) {
      if (!map[r.commonTimeLabel]) {
        map[r.commonTimeLabel] = {
          commonTimeLabel: r.commonTimeLabel,
          commonTime: r.commonTime,
          runners: [],
          calledIn: true
        };
      }
      map[r.commonTimeLabel].runners.push(r);
      if (!r.calledIn) map[r.commonTimeLabel].calledIn = false;
    }
    return Object.values(map).sort((a, b) => new Date(a.commonTime) - new Date(b.commonTime));
  }, [cpRunners]);

  const pendingGroups = groups.filter(g => !g.calledIn);
  const calledGroups = groups.filter(g => g.calledIn);

  const handleMarkCalled = async (group) => {
    if (!currentRaceId || !selectedCp) return;
    setMarkingGroup(group.commonTimeLabel);
    try {
      await CheckpointRepository.markGroupCalledIn(currentRaceId, selectedCp, group.commonTimeLabel);
      // Reload
      const updated = await CheckpointRepository.getCheckpointRunners(currentRaceId, selectedCp);
      setCpRunners(updated);
    } catch (err) {
      console.error('Failed to mark group called in:', err);
    } finally {
      setMarkingGroup(null);
    }
  };

  const formatRunners = (runners) => {
    const nums = runners.map(r => r.number).sort((a, b) => a - b);
    const groups = [];
    let start = nums[0], end = nums[0];
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === end + 1) { end = nums[i]; }
      else {
        groups.push(start === end ? `${start}` : `${start}–${end}`);
        start = end = nums[i];
      }
    }
    if (nums.length > 0) groups.push(start === end ? `${start}` : `${start}–${end}`);
    return groups.join(', ');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pending Call-Ins
        </h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/base-station/dashboard')} className="btn-outline text-sm">
            Dashboard
          </button>
          <button onClick={() => navigate('/base-station/leaderboard')} className="btn-outline text-sm">
            Leaderboard
          </button>
        </div>
      </div>

      {/* Checkpoint tabs */}
      {sortedCheckpoints.length > 0 && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {sortedCheckpoints.map(cp => (
            <button
              key={cp.number}
              onClick={() => setSelectedCp(cp.number)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedCp === cp.number
                  ? 'border-navy-600 text-navy-700 dark:text-navy-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              CP{cp.number}
              {cp.name && cp.name !== `Checkpoint ${cp.number}` && (
                <span className="ml-1 text-xs opacity-75 hidden sm:inline">— {cp.name}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading…</div>
      )}

      {!loading && (
        <>
          {/* Pending groups */}
          {pendingGroups.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Pending ({pendingGroups.length} group{pendingGroups.length !== 1 ? 's' : ''})
              </h2>
              {pendingGroups.map(group => (
                <div
                  key={group.commonTimeLabel}
                  className="p-4 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {group.commonTimeLabel}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">{group.runners.length} runner{group.runners.length !== 1 ? 's' : ''}: </span>
                        {formatRunners(group.runners)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarkCalled(group)}
                      disabled={markingGroup === group.commonTimeLabel}
                      className="btn-primary text-sm flex-shrink-0 disabled:opacity-50"
                    >
                      {markingGroup === group.commonTimeLabel ? 'Marking…' : 'Mark Called In'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-lg font-medium text-green-700 dark:text-green-400">
                All groups called in
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                No pending call-ins for this checkpoint.
              </p>
            </div>
          )}

          {/* Called groups (history) */}
          {calledGroups.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                Called In ({calledGroups.length})
              </h2>
              {calledGroups.map(group => (
                <div
                  key={group.commonTimeLabel}
                  className="flex items-center justify-between p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {group.commonTimeLabel}
                    </span>
                    <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                      {group.runners.length} runner{group.runners.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Called In</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PendingCallInsView;
