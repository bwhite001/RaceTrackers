import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowsRightLeftIcon, QrCodeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { withOperationExit } from '../shared/components/ExitOperationModal';
import useNavigationStore, { MODULE_TYPES } from '../shared/store/navigationStore';
import useCheckpointStore from '../modules/checkpoint-operations/store/checkpointStore';
import useSettingsStore from '../shared/store/settingsStore';
import useRaceMaintenanceStore, { raceMaintenanceStore } from '../modules/race-maintenance/store/raceMaintenanceStore';
import { useRaceStore } from '../store/useRaceStore.js';
import { computeStats, pendingRunners, oldestWaitingMinutes, isCallDue } from '../modules/checkpoint-operations/services/checkpointStats';
import useNow from '../shared/hooks/useNow';
import { AppBar, SavedIndicator, StatTile, CheckpointTabBar } from '../design-system/components/VK';

import RunnerGrid from '../components/Checkpoint/RunnerGrid';
import CalloutSheet from '../components/Checkpoint/CalloutSheet';
import CheckpointOverview from '../components/Checkpoint/CheckpointOverview';
import ReadOutView from '../modules/checkpoint-operations/components/ReadOutView';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ErrorMessage from '../components/Layout/ErrorMessage';
import ExportCheckpointResultsModal from '../modules/checkpoint-operations/components/ExportCheckpointResultsModal';
import RadioOperatorView from '../modules/checkpoint-operations/components/RadioOperatorView';
import BatchShareModal from '../modules/checkpoint-operations/components/transfer/BatchShareModal';
import TransferService from '../modules/checkpoint-operations/services/TransferService';

const HeaderIcon = ({ label, onClick, Icon }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label}
    className="w-11 h-11 flex items-center justify-center rounded-btn hover:bg-white/10">
    <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
  </button>
);

const RoleToggle = ({ role, onChange }) => (
  <div className="grid grid-cols-2 bg-white/10 rounded-btn p-1 gap-1" role="group" aria-label="Checkpoint role">
    {[['marker', 'Marker'], ['radio', 'Radio Operator']].map(([id, label]) => (
      <button key={id} type="button" aria-pressed={role === id} onClick={() => onChange(id)}
        className={`min-h-[36px] rounded-lg text-[13px] ${role === id ? 'bg-white text-vk-navy font-bold' : 'text-vk-on-navy font-semibold'}`}>
        {label}
      </button>
    ))}
  </div>
);

const CheckpointView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const { checkpointId } = useParams();
  const navigate = useNavigate();
  const cpNumber = parseInt(checkpointId, 10);
  const [activeTab, setActiveTab] = useState('mark-off');
  const [readOut, setReadOut] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [role, setRole] = useState('marker'); // 'marker' | 'radio'
  const [showBatchShare, setShowBatchShare] = useState(false);
  const [unsharedCount, setUnsharedCount] = useState(0);
  const now = useNow();

  const { startOperation } = useNavigationStore();
  const { currentRace, loadCurrentRace, checkpoints = [] } = useRaceMaintenanceStore();
  const { runners = [], loading, error, initializeCheckpoint } = useCheckpointStore();
  const { loadRace: loadRaceIntoLegacyStore, loadCheckpointRunners } = useRaceStore();
  const { updateSetting } = useSettingsStore();

  const checkpoint = checkpoints.find(cp => cp.number === cpNumber);
  const stats = useMemo(() => computeStats(runners), [runners]);
  const waiting = useMemo(() => pendingRunners(runners).length, [runners]);
  const oldest = useMemo(() => oldestWaitingMinutes(runners, now), [runners, now]);
  const callDue = isCallDue({ waiting, oldestMinutes: oldest }, { minutes: currentRace?.callDueMinutes ?? 5 });

  // Initialize checkpoint operation
  useEffect(() => {
    const initializeOperation = async () => {
      try {
        if (!currentRace) await loadCurrentRace();
        const freshRace = raceMaintenanceStore.getState().currentRace;
        if (freshRace) {
          startOperation(MODULE_TYPES.CHECKPOINT);
          // Seeds any missing bibs (idempotent) and loads the checkpoint
          await initializeCheckpoint(freshRace.id, cpNumber);
          // Legacy store is still used by the radio operator and transfer views
          await loadRaceIntoLegacyStore?.(freshRace.id);
          await loadCheckpointRunners?.(cpNumber);
          await updateSetting?.('currentCheckpoint', cpNumber);
        } else if (!currentRace) {
          navigate('/', {
            replace: true,
            state: { error: 'No active race found. Please create or select a race first.' }
          });
        }
      } catch (err) {
        console.error('Error initializing checkpoint:', err);
      }
    };
    initializeOperation();
  }, [checkpointId, currentRace, loadCurrentRace, initializeCheckpoint, startOperation, updateSetting, navigate, loadRaceIntoLegacyStore, loadCheckpointRunners, cpNumber]);

  // Every mark is saved immediately — nothing is ever "unsaved"
  useEffect(() => {
    setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  // Unshared runner count for the Share Batch badge
  useEffect(() => {
    if (!currentRace?.id || !checkpointId) return;
    const raceId = currentRace.id;
    let cancelled = false;
    (async () => {
      const ts = await TransferService.getLastShareTimestamp(raceId, cpNumber);
      const payload = await TransferService.buildPayload(raceId, cpNumber, { isDelta: true, sinceTimestamp: ts });
      if (!cancelled) setUnsharedCount(payload.count);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [currentRace?.id, checkpointId, runners, cpNumber]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const shortName = `CP${cpNumber}`;
  const location = checkpoint?.locationName || checkpoint?.name || '';
  const operator = checkpoint?.operatorCallsigns?.[0] ?? '';
  const baseCallsign = currentRace?.baseCallsign || 'VK4WIP';

  if (readOut) {
    return <ReadOutView onClose={() => setReadOut(false)} />;
  }

  const header = {
    'mark-off': {
      title: `Checkpoint ${cpNumber}`,
      subtitle: [location, operator].filter(Boolean).join(' · '),
      body: (
        <div className="grid grid-cols-3 gap-2">
          <StatTile variant="onNavy" value={stats.passed} label="Passed" />
          <StatTile variant="onNavy" value={stats.toCome} label="Still to come" />
          <StatTile variant="gold" value={stats.toCall} label="To call in" />
        </div>
      ),
    },
    callout: {
      title: `${shortName} · Callout`,
      subtitle: [[operator, baseCallsign].filter(Boolean).join(' → '), currentRace?.frequency].filter(Boolean).join(' · '),
      body: callDue ? (
        <div className="bg-vk-gold text-vk-ink rounded-btn px-3 py-2 flex items-center gap-2.5" role="status">
          <ClockIcon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          <div className="text-[13px] font-bold flex-1">Call due — {waiting} waiting, oldest {oldest} min</div>
        </div>
      ) : null,
    },
    overview: {
      title: `${shortName} · Overview`,
      subtitle: [location, operator].filter(Boolean).join(' · '),
      body: <OverviewProgress stats={stats} />,
    },
  }[activeTab];

  return (
    <div className="h-[100dvh] flex flex-col bg-vk-paper dark:bg-gray-900">
      <AppBar
        title={role === 'radio' ? `Checkpoint ${cpNumber}` : header.title}
        subtitle={role === 'radio' ? 'Radio operator' : header.subtitle}
        onBack={onExitAttempt}
        backLabel="Leave checkpoint"
        right={<SavedIndicator compact />}
      >
        {/* Actions share the role row so the title and callsigns get the full width */}
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0"><RoleToggle role={role} onChange={setRole} /></div>
          {role === 'marker' && (
            <button type="button" onClick={() => setShowBatchShare(true)}
              aria-label={`Share batch, ${unsharedCount} runner${unsharedCount === 1 ? '' : 's'}`} title="Share batch"
              className="relative w-11 h-11 flex items-center justify-center rounded-btn hover:bg-white/10">
              <QrCodeIcon className="w-[22px] h-[22px]" aria-hidden="true" />
              {unsharedCount > 0 && (
                <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-extrabold text-vk-ink bg-vk-gold rounded-full" aria-hidden="true">
                  {unsharedCount}
                </span>
              )}
            </button>
          )}
          <HeaderIcon label="Transfer Data" Icon={ArrowsRightLeftIcon} onClick={() => navigate(`/checkpoint/${checkpointId}/transfer`)} />
          <HeaderIcon label="Export Results" Icon={ArrowDownTrayIcon} onClick={() => setShowExportModal(true)} />
        </div>
        {role === 'marker' && header.body}
      </AppBar>

      {role === 'marker' ? (
        <>
          <main className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto" data-screenshot-target>
            {activeTab === 'mark-off' && <RunnerGrid />}
            {activeTab === 'callout' && <CalloutSheet onReadOut={() => setReadOut(true)} />}
            {activeTab === 'overview' && <CheckpointOverview />}
          </main>

          <CheckpointTabBar active={activeTab} onChange={setActiveTab} calloutCount={stats.toCall} />

          <BatchShareModal
            isOpen={showBatchShare}
            raceId={currentRace?.id}
            checkpointNumber={cpNumber}
            onClose={() => setShowBatchShare(false)}
          />
        </>
      ) : (
        <main className="flex-1 overflow-y-auto" data-screenshot-target>
          <RadioOperatorView raceId={currentRace?.id} checkpointNumber={cpNumber} />
        </main>
      )}

      <ExportCheckpointResultsModal
        isOpen={showExportModal}
        raceId={currentRace?.id}
        checkpointNumber={cpNumber}
        checkpointName={checkpoint?.name || `Checkpoint ${checkpointId}`}
        raceName={currentRace?.name ?? ''}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

/** % through + stacked bar: called in / passed not called / to come / out. */
const OverviewProgress = ({ stats }) => {
  const total = stats.total || 1;
  const pct = (n) => `${(n / total) * 100}%`;
  return (
    <div className="px-2 flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <div className="font-display font-extrabold text-[26px]">{Math.round((stats.passed / total) * 100)}%</div>
        <div className="text-[13px] text-vk-on-navy">{stats.passed} of {stats.total} through</div>
      </div>
      <div
        className="flex h-2.5 rounded-full overflow-hidden bg-white/15"
        role="img"
        aria-label={`${stats.called} called in, ${stats.toCall} passed not called in, ${stats.toCome} to come, ${stats.dns} DNS, ${stats.dnf} DNF`}
      >
        <div style={{ width: pct(stats.called) }} className="bg-vk-on-navy" />
        <div style={{ width: pct(stats.toCall) }} className="bg-vk-gold" />
        <div className="flex-1" />
        {/* DNS is muted (never started); only DNF is red (G8) */}
        <div style={{ width: pct(stats.dns) }} className="border border-dashed border-vk-on-navy/70" data-testid="bar-dns" />
        <div style={{ width: pct(stats.dnf) }} className="bg-vk-red" data-testid="bar-dnf" />
      </div>
    </div>
  );
};

export default withOperationExit(CheckpointView);
