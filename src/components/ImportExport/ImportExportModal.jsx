import React, { useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import { useRaceStore } from '../../store/useRaceStore.js';

const ImportExportModal = ({ isOpen, onClose }) => {
  const { 
    exportRaceConfig, 
    exportRaceResults, 
    exportCheckpointResults,
    importRaceConfig, 
    importCheckpointResults,
    raceConfig, 
    checkpoints,
    isLoading 
  } = useRaceStore();
  
  const [activeTab, setActiveTab] = useState('export');
  const [exportData, setExportData] = useState(null);
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exportType, setExportType] = useState('config'); // 'config', 'results', or 'checkpoint'
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(1);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      let data;
      if (exportType === 'config') {
        data = await exportRaceConfig();
        setExportData(data);
        setSuccess('Race configuration exported successfully!');
      } else if (exportType === 'results') {
        data = await exportRaceResults('csv');
        // For CSV, trigger download directly
        const blob = new Blob([data.content], { type: data.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSuccess('Race results exported successfully!');
      } else if (exportType === 'checkpoint') {
        data = await exportCheckpointResults(selectedCheckpoint);
        setExportData(data);
        setSuccess('Checkpoint results exported successfully!');
      }
    } catch (err) {
      setError('Failed to export: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Please enter the configuration data');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const data = JSON.parse(importText.trim());
      
      // Determine import type based on data structure
      if (data.exportType === 'checkpoint-results') {
        await importCheckpointResults(data);
        setSuccess('Checkpoint results imported successfully!');
      } else if (data.exportType === 'full-race-data') {
        await importRaceConfig(data);
        setSuccess('Full race data imported and merged successfully! All checkpoint data has been consolidated.');
      } else {
        await importRaceConfig(data);
        setSuccess('Race configuration imported successfully!');
      }
      
      setImportText('');
      
      // Close modal after successful import
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check the configuration data.');
      } else {
        setError('Failed to import data: ' + err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `race-config-${raceConfig?.name?.replace(/\s+/g, '-') || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        setImportText(content);
        setError('');
        setSuccess('File loaded successfully. Click "Import Configuration" to proceed.');
      } catch (err) {
        setError('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCopyToClipboard = async () => {
    if (!exportData) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setSuccess('Configuration copied to clipboard!');
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleEmailShare = () => {
    if (!exportData) return;

    const subject = encodeURIComponent(`Race Configuration: ${raceConfig?.name || 'Export'}`);
    const body = encodeURIComponent(
      `Race Configuration Data:\n\n${JSON.stringify(exportData, null, 2)}\n\n` +
      `Import this configuration into RaceTracker Pro by copying the JSON data above.`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setExportData(null);
    setImportText('');
    setError('');
    setSuccess('');
    setActiveTab('export');
    setExportType('config');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import / Export Race Configuration
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab('export');
              clearMessages();
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'export'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Export Configuration
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              clearMessages();
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'import'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Import Configuration
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Export Type Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Export Type
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="exportType"
                      value="config"
                      checked={exportType === 'config'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="text-primary-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Race Configuration
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Export race setup for sharing or backup
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="exportType"
                      value="results"
                      checked={exportType === 'results'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="text-primary-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Race Results (CSV)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Export runner results and times
                      </div>
                    </div>
                  </label>

                  {checkpoints && checkpoints.length > 0 && (
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="exportType"
                        value="checkpoint"
                        checked={exportType === 'checkpoint'}
                        onChange={(e) => setExportType(e.target.value)}
                        className="text-primary-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Checkpoint Results
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Export specific checkpoint data
                        </div>
                      </div>
                    </label>
                  )}
                </div>

                {/* Checkpoint Selection */}
                {exportType === 'checkpoint' && checkpoints && checkpoints.length > 0 && (
                  <div className="mt-4">
                    <label htmlFor="selectedCheckpoint" className="form-label">
                      Select Checkpoint
                    </label>
                    <select
                      id="selectedCheckpoint"
                      value={selectedCheckpoint}
                      onChange={(e) => setSelectedCheckpoint(parseInt(e.target.value))}
                      className="form-input"
                    >
                      {checkpoints.map(checkpoint => (
                        <option key={checkpoint.number} value={checkpoint.number}>
                          {checkpoint.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!exportData && (exportType === 'config' || exportType === 'checkpoint') ? (
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {exportType === 'config' 
                      ? 'Export your race configuration to share with other devices or as a backup.'
                      : 'Export checkpoint results to share with the base station or other devices.'
                    }
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={isProcessing || isLoading || !raceConfig}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(isProcessing || isLoading) ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 spinner"></div>
                        <span>Exporting...</span>
                      </div>
                    ) : (
                      exportType === 'config' ? 'Export Race Configuration' : 'Export Checkpoint Results'
                    )}
                  </button>
                  {!raceConfig && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      No race configuration available to export
                    </p>
                  )}
                </div>
              ) : exportType === 'results' ? (
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Export race results as a CSV file with runner numbers, statuses, times, and notes.
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={isProcessing || isLoading || !raceConfig}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(isProcessing || isLoading) ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 spinner"></div>
                        <span>Exporting...</span>
                      </div>
                    ) : (
                      'Export Race Results (CSV)'
                    )}
                  </button>
                  {!raceConfig && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      No race available to export
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* QR Code */}
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      QR Code
                    </h3>
                    <div className="inline-block p-4 bg-white rounded-lg">
                      <QRCode 
                        value={JSON.stringify(exportData)} 
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Scan this QR code with another device to import complete race data including all checkpoints, runners, and timing information
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handleCopyToClipboard}
                      className="btn-secondary flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </button>
                    
                    <button
                      onClick={handleDownload}
                      className="btn-secondary flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                    
                    <button
                      onClick={handleEmailShare}
                      className="btn-secondary flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Email</span>
                    </button>
                  </div>

                  {/* JSON Data */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Configuration Data
                    </h3>
                    <textarea
                      value={JSON.stringify(exportData, null, 2)}
                      readOnly
                      rows={8}
                      className="form-input font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Import Race Configuration
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Upload a JSON file, paste the race configuration data below, or scan a QR code from another device.
                </p>

                {/* File Upload Section */}
                <div className="mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={triggerFileUpload}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload JSON File</span>
                  </button>
                </div>

                <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                  or
                </div>
                
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste race configuration JSON data here..."
                  rows={10}
                  className="form-input font-mono text-sm"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleImport}
                  disabled={isProcessing || isLoading || !importText.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isProcessing || isLoading) ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 spinner"></div>
                      <span>Importing...</span>
                    </div>
                  ) : (
                    'Import Configuration'
                  )}
                </button>
                
                <button
                  onClick={() => setImportText('')}
                  className="btn-secondary"
                >
                  Clear
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Import Instructions
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• <strong>QR Code Sharing:</strong> Scan QR codes from other devices to import complete race data</li>
                  <li>• <strong>Smart Merging:</strong> If the race already exists, data will be intelligently merged</li>
                  <li>• <strong>Checkpoint Consolidation:</strong> BaseStation can merge data from all checkpoint operators</li>
                  <li>• <strong>Data Priority:</strong> More recent times and advanced statuses take precedence</li>
                  <li>• <strong>Full Race Data:</strong> Includes all runners, checkpoints, times, and call-in data</li>
                  <li>• <strong>Backward Compatible:</strong> Works with older race configuration formats</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
