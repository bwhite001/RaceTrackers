import React, { useState, useEffect, useCallback } from 'react';
import useBaseOperationsStore from '../../store/baseOperationsStore';
import useSettingsStore from '../../../../shared/store/settingsStore';
import RaceMaintenanceRepository from '../../../race-maintenance/services/RaceMaintenanceRepository';
import useLeaderboard from './hooks/useLeaderboard';
import LeaderboardControls from './LeaderboardControls';
import LeaderboardTable from './LeaderboardTable';
import CategoryTabs from './CategoryTabs';
import CombinedGrid from './CombinedGrid';
import './leaderboard.print.css';

const GENDER_TABS = [
  { key: 'M', label: 'Male' },
  { key: 'F', label: 'Female' },
  { key: 'X', label: 'Other' },
];

/**
 * LeaderboardTab — main entry point for the Leaderboard tab in BaseStationView.
 * Replaces the old Leaderboard component.
 */
export default function LeaderboardTab() {
  const { runners, currentRaceId, currentRace, refreshData } = useBaseOperationsStore();
  const { settings, updateSetting } = useSettingsStore();
  const [batches, setBatches] = useState([]);

  // Load batches on mount / race change
  useEffect(() => {
    if (!currentRaceId) return;
    RaceMaintenanceRepository.getBatches(currentRaceId).then(setBatches).catch(() => {});
  }, [currentRaceId]);

  const groupingMode = settings.leaderboardGroupingMode ?? 'gender';
  const setGroupingMode = useCallback((mode) => updateSetting('leaderboardGroupingMode', mode), [updateSetting]);

  const [showNames, setShowNames] = useState(true);
  const [activeGenderTab, setActiveGenderTab] = useState('M');
  const [activeWaveTab, setActiveWaveTab] = useState(null);

  const { overall, grouped, lastUpdated, refresh } = useLeaderboard(
    runners,
    batches,
    currentRace,
    { onRefresh: refreshData }
  );

  // Set default wave tab once data loads
  useEffect(() => {
    const waveKeys = Object.keys(grouped.wave);
    if (!activeWaveTab && waveKeys.length > 0) {
      setActiveWaveTab(String(waveKeys[0]));
    }
  }, [grouped.wave, activeWaveTab]);

  const raceName = currentRace?.name ?? 'Race';
  const hasData = overall.length > 0;

  // Build gender tabs — only show populated genders, switch to first populated if active is empty
  const genderTabs = GENDER_TABS
    .map(t => ({ ...t, count: grouped.gender[t.key]?.length ?? 0 }))
    .filter(t => t.count > 0);

  // Ensure active gender tab is valid
  const safeGenderTab = genderTabs.find(t => t.key === activeGenderTab)?.key
    ?? genderTabs[0]?.key
    ?? 'M';

  // Build wave tabs
  const waveTabs = Object.entries(grouped.wave).map(([key, entries]) => ({
    key,
    label: batches.find(b => String(b.batchNumber) === key)?.batchName ?? `Wave ${key}`,
    count: entries.length,
  }));

  const safeWaveTab = activeWaveTab ?? waveTabs[0]?.key;

  return (
    <div className="space-y-4 leaderboard-print-target">
      <LeaderboardControls
        groupingMode={groupingMode}
        onGroupingChange={setGroupingMode}
        showNames={showNames}
        onShowNamesToggle={() => setShowNames(v => !v)}
        onRefresh={refresh}
        lastUpdated={lastUpdated}
        entries={overall}
        raceName={raceName}
        hasData={hasData}
      />

      {groupingMode === 'overall' && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <LeaderboardTable entries={overall} showNames={showNames} />
        </div>
      )}

      {groupingMode === 'gender' && (
        genderTabs.length > 0 ? (
          <CategoryTabs
            tabs={genderTabs}
            activeTab={safeGenderTab}
            onTabChange={setActiveGenderTab}
          >
            {(key) => (
              <div className="rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700 overflow-hidden">
                <LeaderboardTable
                  entries={grouped.gender[key] ?? []}
                  showNames={showNames}
                  hideGender
                />
              </div>
            )}
          </CategoryTabs>
        ) : (
          <p className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            No finishers recorded yet.
          </p>
        )
      )}

      {groupingMode === 'wave' && (
        waveTabs.length > 0 ? (
          <CategoryTabs
            tabs={waveTabs}
            activeTab={safeWaveTab ?? waveTabs[0]?.key}
            onTabChange={setActiveWaveTab}
          >
            {(key) => (
              <div className="rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700 overflow-hidden">
                <LeaderboardTable
                  entries={grouped.wave[key] ?? []}
                  showNames={showNames}
                  hideWave
                />
              </div>
            )}
          </CategoryTabs>
        ) : (
          <p className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            No finishers recorded yet.
          </p>
        )
      )}

      {groupingMode === 'combined' && (
        <CombinedGrid
          grouped={grouped.combined}
          batches={batches}
          onViewFull={(key) => {
            const [gender] = key.split('-');
            setGroupingMode('gender');
            setActiveGenderTab(gender);
          }}
        />
      )}
    </div>
  );
}
