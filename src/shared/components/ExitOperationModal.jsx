import React from 'react';
import { useNavigate } from 'react-router-dom';
import useNavigationStore from '../store/navigationStore';

const ExitOperationModal = ({ isOpen, onClose, hasUnsavedChanges = false }) => {
  const navigate = useNavigate();
  const { endOperation, currentModule } = useNavigationStore();

  if (!isOpen) return null;

  const handleExit = () => {
    endOperation();
    onClose();
    navigate('/');
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          Exit {currentModule.replace('-', ' ')}?
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Are you sure you want to exit the current operation?
          </p>
          
          {hasUnsavedChanges && (
            <p className="text-red-600 dark:text-red-400 text-sm">
              Warning: You have unsaved changes that will be lost.
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Exit Operation
          </button>
        </div>
      </div>
    </div>
  );
};

// Higher-order component to handle operation exits
export const withOperationExit = (WrappedComponent) => {
  return function WithOperationExitComponent(props) {
    const [showExitModal, setShowExitModal] = React.useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

    // Handle browser back button
    React.useEffect(() => {
      const handleBeforeUnload = (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = '';
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    return (
      <>
        <WrappedComponent
          {...props}
          onExitAttempt={() => setShowExitModal(true)}
          setHasUnsavedChanges={setHasUnsavedChanges}
        />
        <ExitOperationModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </>
    );
  };
};

export default ExitOperationModal;
