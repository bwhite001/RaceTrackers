import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MODULE_TYPES } from './shared/store/navigationStore';
import useSettingsStore from './shared/store/settingsStore';
import { useRaceStore } from './store/useRaceStore';
import { initializeSettings } from './utils/settingsDOM';
import ProtectedRoute from './shared/components/ProtectedRoute';
import NetworkStatusIndicator from './shared/components/NetworkStatusIndicator';
import { ToastProvider } from './shared/components/ui/Toast';

// Import module components
import Homepage from './components/Home/Homepage';
import RaceSetup from './components/Setup/RaceSetup';
import RaceManagementView from './views/RaceManagementView';
import CheckpointView from './views/CheckpointView';
import BaseStationView from './views/BaseStationView';
import RaceOverview from './views/RaceOverview';
import LiveDashboardView from './views/LiveDashboardView';
import LeaderboardView from './views/LeaderboardView';
import PendingCallInsView from './views/PendingCallInsView';
import Footer from './components/Layout/Footer';

function App() {
  const { initializeSettings: initSettingsStore } = useSettingsStore();
  const { settings } = useRaceStore();

  // Initialize settings on mount
  useEffect(() => {
    // Initialize settings store (if it exists)
    if (initSettingsStore) {
      initSettingsStore();
    }
    
    // Apply settings to DOM
    initializeSettings(settings);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleDarkModeChange = (e) => {
      // Only apply if user hasn't explicitly set dark mode
      if (!settings.darkMode && e.matches) {
        document.documentElement.classList.add('dark');
      }
    };

    const handleMotionChange = (e) => {
      // Only apply if user hasn't explicitly set reduced motion
      if (!settings.reducedMotion && e.matches) {
        document.documentElement.classList.add('reduce-motion');
      }
    };

    darkModeQuery.addEventListener('change', handleDarkModeChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [settings.darkMode, settings.reducedMotion]);

  return (
    <ToastProvider>
      <Router>
        <NetworkStatusIndicator />
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Home page - accessible to all */}
            <Route path="/" element={<Homepage />} />

            {/* Race Management - Dedicated page for managing all races */}
            <Route
              path="/race-management"
              element={
                <ProtectedRoute moduleType={MODULE_TYPES.RACE_MAINTENANCE}>
                  <RaceManagementView />
                </ProtectedRoute>
              }
            />

            {/* Race Maintenance Module */}
            <Route
              path="/race-maintenance/*"
              element={
                <ProtectedRoute moduleType={MODULE_TYPES.RACE_MAINTENANCE}>
                  <Routes>
                    <Route path="setup" element={<RaceSetup />} />
                    <Route path="overview" element={<RaceOverview />} />
                    <Route path="*" element={<Navigate to="/race-maintenance/setup" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Checkpoint Operations Module */}
            <Route
              path="/checkpoint/*"
              element={
                <ProtectedRoute moduleType={MODULE_TYPES.CHECKPOINT}>
                  <Routes>
                    <Route path=":checkpointId" element={<CheckpointView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Base Station Operations Module */}
            <Route
              path="/base-station/*"
              element={
                <ProtectedRoute moduleType={MODULE_TYPES.BASE_STATION}>
                  <Routes>
                    <Route path="operations" element={<BaseStationView />} />
                    <Route path="dashboard" element={<LiveDashboardView />} />
                    <Route path="leaderboard" element={<LeaderboardView />} />
                    <Route path="pending" element={<PendingCallInsView />} />
                    <Route path="*" element={<Navigate to="/base-station/operations" replace />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;
