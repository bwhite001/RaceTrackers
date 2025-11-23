import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useBaseOperationsStore from '../store/baseOperationsStore';
import TimeUtils from '../../../services/timeUtils';

/**
 * BackupRestoreDialog - Backup and restore race data
 * 
 * Features:
 * - Create date-stamped backups
 * - Restore from backup files
 * - Backup history management
 * - Backup verification
 * - Export to external storage
 */

const BackupRestoreDialog = ({ isOpen, onClose }) => {
  const [backupLocation, setBackupLocation] = useState('local');
  const [backupNote, setBackupNote] = useState('');
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [errors, setErrors] = useState({});

  const {
    backups,
    loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    verifyBackup,
    exportBackup,
    loading
  } = useBaseOperationsStore();

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setErrors({});

    try {
      const backup = await createBackup({
        location: backupLocation,
        note: backupNote.trim() || null
      });

      if (backupLocation === 'external') {
        await exportBackup(backup.id);
      }

      setBackupNote('');
      await loadBackups();
    } catch (error) {
      setErrors({
        create: error.message || 'Failed to create backup'
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    if (!window.confirm('Are you sure you want to restore from this backup? Current data will be overwritten.')) {
      return;
    }

    setIsRestoring(true);
    setErrors({});

    try {
      // Verify backup integrity first
      const isValid = await verifyBackup(selectedBackup.id);
      if (!isValid) {
        throw new Error('Backup verification failed. The backup file may be corrupted.');
      }

      await restoreBackup(selectedBackup.id);
      onClose();
    } catch (error) {
      setErrors({
        restore: error.message || 'Failed to restore from backup'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      await deleteBackup(backupId);
      await loadBackups();
      if (selectedBackup?.id === backupId) {
        setSelectedBackup(null);
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  };

  const handleExport = async (backup) => {
    try {
      await exportBackup(backup.id);
    } catch (error) {
      console.error('Failed to export backup:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Backup & Restore
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage race data backups
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-lg p-2 touch-target"
            aria-label="Close"
            title="Close (Esc)"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Create Backup */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Create Backup
            </h3>

            {/* Backup Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Location
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="local"
                    checked={backupLocation === 'local'}
                    onChange={(e) => setBackupLocation(e.target.value)}
                    className="form-radio"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Local Storage
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="external"
                    checked={backupLocation === 'external'}
                    onChange={(e) => setBackupLocation(e.target.value)}
                    className="form-radio"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    External Storage (USB/Download)
                  </span>
                </label>
              </div>
            </div>

            {/* Backup Note */}
            <div>
              <label htmlFor="backupNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Backup Note (Optional)
              </label>
              <textarea
                id="backupNote"
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                rows={2}
                className="form-input w-full"
                placeholder="Add a note to identify this backup..."
              />
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup || loading}
              className="btn-primary w-full"
            >
              {isCreatingBackup ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Backup...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Create Backup
                </>
              )}
            </button>

            {errors.create && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.create}
                </p>
              </div>
            )}
          </div>

          {/* Restore from Backup */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Restore from Backup
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  No Backups Available
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Create a backup to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Backup List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      onClick={() => setSelectedBackup(backup)}
                      className={`p-4 rounded-lg border-2 cursor-pointer ${
                        selectedBackup?.id === backup.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {TimeUtils.formatTime(backup.createdAt)}
                          </div>
                          {backup.note && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {backup.note}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExport(backup);
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Export backup"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(backup.id);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete backup"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Size: {(backup.size / 1024).toFixed(1)} KB • Location: {backup.location}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Restore Button */}
                <button
                  onClick={handleRestore}
                  disabled={!selectedBackup || isRestoring || loading}
                  className="btn-primary w-full"
                >
                  {isRestoring ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Restoring...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Restore Selected Backup
                    </>
                  )}
                </button>

                {errors.restore && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.restore}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              About Backup & Restore
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Backups include all race data, settings, and logs</li>
              <li>• Local backups are stored in browser storage</li>
              <li>• External backups can be saved to USB or downloaded</li>
              <li>• Restoring will overwrite current data</li>
              <li>• All backups are verified before restore</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

BackupRestoreDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default BackupRestoreDialog;
