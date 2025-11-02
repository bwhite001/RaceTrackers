import { Link, useNavigate, useLocation } from 'react-router-dom';
import useNavigationStore, { MODULE_TYPES, OPERATION_STATUS } from '../../shared/store/navigationStore';
import useSettingsStore from '../../shared/store/settingsStore';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentModule, operationStatus, endOperation } = useNavigationStore();
  const { settings } = useSettingsStore();

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
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Home Link */}
          <div className="flex items-center">
            <button
              onClick={handleHomeClick}
              className={`text-xl font-bold ${
                operationStatus === OPERATION_STATUS.IN_PROGRESS
                  ? 'cursor-help'
                  : 'hover:text-blue-200'
              }`}
            >
              {getModuleTitle()}
            </button>
          </div>

          {/* Operation Status */}
          {operationStatus === OPERATION_STATUS.IN_PROGRESS && (
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500 text-sm">
                Operation in Progress
              </span>
            </div>
          )}

          {/* Navigation Links - Only show if no operation is in progress */}
          {operationStatus !== OPERATION_STATUS.IN_PROGRESS && (
            <nav className="flex items-center space-x-4">
              {location.pathname !== '/' && (
                <Link
                  to="/"
                  className="text-sm hover:text-blue-200 transition-colors"
                >
                  Return Home
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Module-specific navigation warning */}
        {operationStatus === OPERATION_STATUS.IN_PROGRESS && (
          <div className="mt-2 text-sm text-yellow-200 text-center">
            Navigation is restricted during active operations
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
