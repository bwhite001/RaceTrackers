import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MODULE_TYPES } from './shared/store/navigationStore';
import useSettingsStore from './shared/store/settingsStore';
import ProtectedRoute from './shared/components/ProtectedRoute';
import NetworkStatusIndicator from './shared/components/NetworkStatusIndicator';

// Import module components
import Homepage from './components/Home/Homepage';
import RaceSetup from './components/Setup/RaceSetup';
import CheckpointView from './views/CheckpointView';
import BaseStationView from './views/BaseStationView';
import RaceOverview from './views/RaceOverview';
import Footer from './components/Layout/Footer';

function App() {
  const { initializeSettings } = useSettingsStore();

  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  return (
    <Router>
      <NetworkStatusIndicator />
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Home page - accessible to all */}
            <Route path="/" element={<Homepage />} />

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
  );
}

export default App;
