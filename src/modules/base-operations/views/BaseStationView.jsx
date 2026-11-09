import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpTrayIcon, PresentationChartLineIcon, Cog6ToothIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { withOperationExit } from '../../../shared/components/ExitOperationModal';
import HotkeysProvider from '../../../shared/components/HotkeysProvider';
import useNavigationStore, { MODULE_TYPES } from '../../../shared/store/navigationStore';
import useBaseOperationsStore from '../store/baseOperationsStore';
import { useRaceStore } from '../../../store/useRaceStore.js';
import useSettingsStore from '../../../shared/store/settingsStore';
import { HOTKEYS, RUNNER_STATUSES } from '../../../types';
import { BaseAppBar, UndoBar, useUndo } from '../../../design-system/components/VK';
import useNow from '../../../shared/hooks/useNow';
import { hhmm } from '../../../services/blocks.js';
import ImportExportModal from '../../../components/ImportExport/ImportExportModal';

// Components
import BaseReceive from '../components/BaseReceive';
import BaseReports from '../components/BaseReports';
import BaseOverview from '../components/BaseOverview';
import WithdrawalDialog from '../components/WithdrawalDialog';
import BaseStatusView from '../components/BaseStatusView';
import CrewLog from '../components/CrewLog';
import ErrorMessage from '../../../components/Layout/ErrorMessage';
import SettingsModal from '../../../components/Settings/SettingsModal';
import HelpDialog from '../components/HelpDialog';
import FileBackupStatus from '../components/FileBackupStatus';
import LoadingSpinner from '../../../components/Layout/LoadingSpinner';
import KeyHint from '../components/KeyHint';
import QuickWithdrawSheet from '../components/QuickWithdrawSheet';
import LateEntrySheet from '../components/LateEntrySheet';
import ShortcutSheet from '../components/ShortcutSheet';
import useKeyboardStore from '../../../shared/store/keyboardStore';
import { resolveKey, isPhysicalKey } from '../services/keymap';

const HeaderIcon = ({ label, Icon, onClick, hint }) => (
  <button type="button" onClick={onClick} aria-label={label} title={label}
    className="relative w-11 h-11 flex items-center justify-center rounded-btn text-white hover:bg-white/10">
    <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
    {hint && <KeyHint action={hint} />}
  </button>
);

const isEditable = (el) => !!el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable);
/* global __APP_VERSION__ */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '';

/**
 * BaseStationView Component
 * Main view for base station operations
 */
const BaseStationView = ({ onExitAttempt, setHasUnsavedChanges }) => {
  const navigate = useNavigate();

  // Store access
  const { currentRaceId, currentRace, loading, error, stats, runners, initialize, refreshData, lastSync } = useBaseOperationsStore();
  const now = useNow();
  const { selectedRaceForMode, checkpoints, loadRace: loadRaceIntoStore, runners: raceRunners } = useRaceStore();
  const { darkMode } = useSettingsStore();
  const initStarted = useRef(false);

  // Group flat runner records by bib number for overview components
  const groupedRunners = useMemo(() => {
    const byRunner = new Map();
    const PASSED_STATUSES = new Set([RUNNER_STATUSES.PASSED, RUNNER_STATUSES.MARKED_OFF, RUNNER_STATUSES.CALLED_IN]);
    for (const r of (runners ?? [])) {
      if (!byRunner.has(r.number)) {
        byRunner.set(r.number, { number: r.number, status: RUNNER_STATUSES.NOT_STARTED, checkpointStatuses: {}, checkpointTimes: {}, hasBaseRecord: false });
      }
      const entry = byRunner.get(r.number);
      if (r.checkpointNumber !== 0) {
        entry.checkpointStatuses[r.checkpointNumber] = r.status;
        const t = r.commonTime || r.markOffTime || r.callInTime;
        if (t) entry.checkpointTimes[r.checkpointNumber] = t;
      } else {
        entry.status = r.status;
        entry.hasBaseRecord = true;
      }
    }
    for (const entry of byRunner.values()) {
      if (!entry.hasBaseRecord && Object.values(entry.checkpointStatuses).some(s => PASSED_STATUSES.has(s))) {
        entry.status = RUNNER_STATUSES.ACTIVE;
      }
    }
    // Merge name data from race runner list
    const nameMap = new Map((raceRunners ?? []).map(r => [r.number, r]));
    for (const entry of byRunner.values()) {
      const r = nameMap.get(entry.number);
      if (r) { entry.firstName = r.firstName || ''; entry.lastName = r.lastName || ''; }
    }
    return Array.from(byRunner.values());
  }, [runners, raceRunners]);

  // Local state
  const [activeTab, setActiveTab] = useState('receive');
  const [reportFocus, setReportFocus] = useState(null);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState('dnf');
  const withdrawUndo = useUndo();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [sheet, setSheet] = useState(null); // 'withdraw' | 'late' | 'keys'
  const receiveRef = useRef(null);
  const keysOn = useRaceStore(s => s.settings?.wicen2Keys) !== false;
  const message = useKeyboardStore(s => s.message);
  const say = useKeyboardStore(s => s.say);
  const setPhysical = useKeyboardStore(s => s.setPhysical);
  const setAltHeld = useKeyboardStore(s => s.setAltHeld);

  // The status line answers a key, then clears
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => say(''), 6000);
    return () => clearTimeout(t);
  }, [message, say]);

  // Initialize base station from selectedRaceForMode, or redirect if no race
  useEffect(() => {
    if (currentRaceId && currentRaceId === selectedRaceForMode) {
      // Re-hydrate runners from DB on page reload (runners are not persisted to localStorage)
      refreshData();
      // Ensure checkpoints are loaded into useRaceStore (used by the overview map and grids)
      if (checkpoints.length === 0) {
        loadRaceIntoStore(currentRaceId).catch(() => {});
      }
      return;
    }
    // New or different race selected: initialize (guard against StrictMode double-fire)
    if (selectedRaceForMode && !initStarted.current) {
      initStarted.current = true;
      initialize(selectedRaceForMode)
        .then(() => loadRaceIntoStore(selectedRaceForMode).catch(() => {}))
        .catch(() => navigate('/'));
    } else if (!selectedRaceForMode) {
      navigate('/');
    }
  }, [currentRaceId, selectedRaceForMode, initialize, navigate, refreshData, loadRaceIntoStore, checkpoints.length]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    if (tab !== 'reports') setReportFocus(null);
    setActiveTab(tab);
  }, []);

  // Handle withdrawal dialog
  const handleWithdrawal = useCallback((type) => {
    setWithdrawalType(type);
    setShowWithdrawalDialog(true);
  }, []);

  // Handle settings
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  // Handle help
  const handleOpenHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  // Handle exit
  const handleExit = useCallback(() => {
    if (onExitAttempt) {
      onExitAttempt();
    } else {
      navigate('/');
    }
  }, [onExitAttempt, navigate]);

  // ── WICEN2 keyboard layer (docs/design-handoff/WICEN2_PARITY.md) ─────────
  // Keys call the same handlers as the buttons: no second write path.
  const runKey = (r) => {
    switch (r.action) {
      case 'withdraw': setSheet('withdraw'); break;
      case 'lateEntry': setSheet('late'); break;
      case 'missing': setReportFocus('missing'); setActiveTab('reports'); break;
      case 'outList': handleTabChange('status'); break;
      case 'reports': handleTabChange('reports'); break;
      case 'backup': window.dispatchEvent(new Event('racetracker:backup-now')); break;
      case 'help': setSheet(s => (s === 'keys' ? null : 'keys')); break;
      case 'about': say(`RaceTracker Pro ${APP_VERSION}`.trim()); break;
      case 'unused': say(r.message); break;
      default: receiveRef.current?.handle(r.action);
    }
  };
  const runKeyRef = useRef(runKey);
  runKeyRef.current = runKey;
  const tabRef = useRef(activeTab);
  tabRef.current = activeTab;

  useEffect(() => {
    let altTimer = null;
    const stopHints = () => { clearTimeout(altTimer); altTimer = null; setAltHeld(false); };
    const onDown = (e) => {
      const editable = isEditable(e.target);
      if (isPhysicalKey(e, editable)) setPhysical();
      if (!keysOn) return;
      if (e.key === 'Alt' && !altTimer) altTimer = setTimeout(() => setAltHeld(true), 500);
      const sheetOpen = !!document.querySelector('[role="dialog"]');
      const r = resolveKey(e, { enabled: keysOn, tab: tabRef.current, sheetOpen });
      if (r) { e.preventDefault(); e.stopPropagation(); runKeyRef.current(r); return; }
      if (editable || sheetOpen || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === '?') { e.preventDefault(); setSheet('keys'); return; }
      // A checkpoint typed with nothing focused starts the CheckPt box
      if (tabRef.current === 'receive' && /^[0-9sSfF]$/.test(e.key)) {
        e.preventDefault(); e.stopPropagation();
        receiveRef.current?.typeCheckpoint(e.key);
      }
    };
    const onUp = (e) => { if (e.key === 'Alt') { e.preventDefault(); stopHints(); } };
    document.addEventListener('keydown', onDown, true);
    document.addEventListener('keyup', onUp, true);
    window.addEventListener('blur', stopHints);
    return () => {
      stopHints();
      document.removeEventListener('keydown', onDown, true);
      document.removeEventListener('keyup', onUp, true);
      window.removeEventListener('blur', stopHints);
    };
  }, [keysOn, setPhysical, setAltHeld]);

  // Define hotkeys
  const hotkeys = {
    [HOTKEYS.NEW_ENTRY]: () => handleTabChange('receive'),
    [HOTKEYS.REPORTS]: () => handleTabChange('reports'),
    [HOTKEYS.DROPOUT]: () => handleWithdrawal('dnf'),
    'shift+d': () => handleTabChange('status'),
    'escape': () => {
      if (showWithdrawalDialog) setShowWithdrawalDialog(false);
    }
  };

  if (!currentRaceId) {
    return null; // useEffect handles navigate('/')
  }

  // Spinner only for the first load — later refreshes keep the screen (and any
  // call being received) in place.
  if (loading && !lastSync) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <HotkeysProvider hotkeys={hotkeys}>
      <div className="min-h-screen bg-vk-paper dark:bg-gray-900 flex flex-col">
        <BaseAppBar
          frequency={currentRace?.frequency}
          nowText={hhmm(now)}
          active={activeTab}
          onChange={handleTabChange}
          onHome={handleExit}
          right={(
            <>
              <FileBackupStatus raceId={currentRaceId} />
              <HeaderIcon label="Import / Export" Icon={ArrowUpTrayIcon} onClick={() => setShowImportExport(true)} />
              <HeaderIcon label="Live Dashboard" Icon={PresentationChartLineIcon} onClick={() => navigate('/base-station/dashboard')} />
              <HeaderIcon label="Settings" Icon={Cog6ToothIcon} onClick={handleOpenSettings} />
              <HeaderIcon label="Help" Icon={QuestionMarkCircleIcon} onClick={handleOpenHelp} hint="help" />
            </>
          )}
        />

        <main className="flex-1 pb-6">
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-label={currentRace?.name ?? 'Base station'}
            className="space-y-6"
            data-screenshot-target
          >
            {activeTab === 'receive' && <BaseReceive ref={receiveRef} />}

            {activeTab === 'overview' && (
              <BaseOverview
                raceRunners={raceRunners ?? []}
                mapCheckpoints={checkpoints ?? []}
                groupedRunners={groupedRunners}
                onViewOverdue={() => { setReportFocus('missing'); handleTabChange('reports'); }}
              />
            )}

            {activeTab === 'status' && (
              <BaseStatusView onWithdrawDetails={() => handleWithdrawal('withdrawal')} />
            )}

            {activeTab === 'crews' && <CrewLog />}

            {activeTab === 'reports' && (
              <BaseReports key={reportFocus ?? 'reports'} initialReport={reportFocus ?? 'missing'} />
            )}

          </div>
        </main>


        {/* Withdrawal Dialog */}
        <WithdrawalDialog
          isOpen={showWithdrawalDialog}
          onClose={() => setShowWithdrawalDialog(false)}
          type={withdrawalType}
          onDone={withdrawUndo.offer}
        />
        <UndoBar {...withdrawUndo.bar} className="fixed left-4 right-4 bottom-6 z-40 max-w-xl mx-auto" />
        <QuickWithdrawSheet open={sheet === 'withdraw'} onClose={() => setSheet(null)} onDone={withdrawUndo.offer} />
        <LateEntrySheet open={sheet === 'late'} onClose={() => setSheet(null)} onDone={withdrawUndo.offer} />
        <ShortcutSheet open={sheet === 'keys'} onClose={() => setSheet(null)} />
        {message && (
          <div role="status" data-testid="kb-status"
            className="fixed left-4 bottom-24 z-40 max-w-md rounded-btn bg-vk-ink text-white text-sm font-semibold px-3 py-2 shadow-btn">
            {message}
          </div>
        )}


        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <HelpDialog
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />

        <ImportExportModal isOpen={showImportExport} onClose={() => setShowImportExport(false)} />
      </div>
    </HotkeysProvider>
  );
};

// Wrap with operation exit handling
export default withOperationExit(BaseStationView);
