import { Link, useNavigate, useLocation } from 'react-router-dom';
import useNavigationStore, { MODULE_TYPES, OPERATION_STATUS } from '../../shared/store/navigationStore';
import useSettingsStore from '../../shared/store/settingsStore';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentModule, operationStatus, endOperation } = useNavigationStore();
  const { settings, toggleDarkMode } = useSettingsStore();

  const handleHomeClick = (e) => {
    if (operationStatus === OPERATION_STATUS.IN_PROGRESS) {
      e.preventDefault();
      const confirmed = window.confirm(
        'Are you sure you want to exit the current operation? This may result in loss of unsaved data.'
      );
      if (!confirmed) return;
      
      // End operation and navigate home
      endOperation();
    }
    navigate('/');
  };

  const getModuleTitle = () => {
    switch (currentModule) {
      case MODULE_TYPES.RACE_MAINTENANCE:
        return 'Race Maintenance';
      case MODULE_TYPES.CHECKPOINT:
        return `Checkpoint Operations (CP ${settings.currentCheckpoint || 1})`;
      case MODULE_TYPES.BASE_STATION:
        return 'Base Station Operations';
      default:
        return 'Race Tracker';
    }
  };

  return (
    <header className="relative bg-navy-900 text-white shadow-lg">
      {/* Diagonal Accent Stripe */}
      <div className="absolute top-0 right-0 w-32 h-full bg-accent-600 transform skew-x-12 translate-x-16 opacity-30"></div>
      
      <div className="relative container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Home Link */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleHomeClick}
              className={`flex items-center space-x-3 ${
                operationStatus === OPERATION_STATUS.IN_PROGRESS
                  ? 'cursor-help'
                  : 'hover:opacity-80 transition-opacity'
              }`}
            >
              {/* Logo Icon */}
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-navy-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
              <div className="hidden md:block">
                <div className="text-xl font-bold leading-tight">
                  {getModuleTitle()}
                </div>
                <div className="text-xs text-navy-200">
                  Offline Race Management
                </div>
              </div>
            </button>
          </div>

          {/* Center - Operation Status */}
          {operationStatus === OPERATION_STATUS.IN_PROGRESS && (
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gold-500 text-navy-900 rounded-lg font-medium">
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Operation in Progress</span>
              </div>
            </div>
          )}

          {/* Right Side - Navigation & Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-navy-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {settings.darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Home Button - Only show if not on home page */}
            {location.pathname !== '/' && operationStatus !== OPERATION_STATUS.IN_PROGRESS && (
              <Link
                to="/"
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Home</span>
              </Link>
            )}

            {/* Settings Button */}
            <button
              className="p-2 rounded-lg hover:bg-navy-800 transition-colors"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Operation Status */}
        {operationStatus === OPERATION_STATUS.IN_PROGRESS && (
          <div className="md:hidden mt-3 flex items-center justify-center">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gold-500 text-navy-900 rounded-lg text-sm font-medium">
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Operation Active</span>
            </div>
          </div>
        )}

        {/* Module-specific navigation warning */}
        {operationStatus === OPERATION_STATUS.IN_PROGRESS && (
          <div className="mt-3 text-xs text-navy-200 text-center bg-navy-800/50 rounded-lg py-2 px-4">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Navigation is restricted during active operations
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
