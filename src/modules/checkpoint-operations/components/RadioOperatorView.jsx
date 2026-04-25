import React, { useState, useCallback, useRef, useEffect } from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import QRScannerCamera from './transfer/QRScannerCamera';
import TransferSummaryModal from './transfer/TransferSummaryModal';
import TransferService from '../services/TransferService';
import useCheckpointStore from '../store/checkpointStore';
import useRaceMaintenanceStore from '../../race-maintenance/store/raceMaintenanceStore';
import CalloutSheet from '../../../components/Checkpoint/CalloutSheet';

/**
 * Radio Operator Mode — receive batches from the marker via QR, then call them in.
 *
 * Layout:
 *   Top zone  — "Scan QR" button + last import summary
 *   Main area — CalloutSheet (time-grouped segments with Called In buttons)
 *
 * This component does NOT render QuickEntryBar or RunnerGrid — radio operators
 * are receive-only for runner data.
 *
 * Props:
 *   raceId           {number}
 *   checkpointNumber {number}
 */
export default function RadioOperatorView({ raceId, checkpointNumber }) {
  const [scanning, setScanning] = useState(false);
  const [packet, setPacket] = useState(null);
  const [stats, setStats] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const { loadCheckpointData } = useCheckpointStore();
  const { currentRace } = useRaceMaintenanceStore();

  const handleDecoded = useCallback(
    async (pkt) => {
      setScanning(false);
      setPacket(pkt);
      setStats(null);
      setImportError(null);
      try {
        const dryStats = await TransferService.applyToCheckpointRunners(raceId, pkt, {
          dryRun: true,
        });
        if (isMountedRef.current) {
          setStats(dryStats);
        }
      } catch {
        // dry-run failed — stats stays null, Import button will be disabled
      }
    },
    [raceId]
  );

  const handleImport = useCallback(async () => {
    if (!packet) return;
    setImporting(true);
    setImportError(null);
    try {
      await TransferService.applyToCheckpointRunners(raceId, packet);
      await loadCheckpointData(raceId ?? currentRace?.id, checkpointNumber);
      if (isMountedRef.current) {
        setPacket(null);
        setStats(null);
      }
    } catch (e) {
      if (isMountedRef.current) {
        setImportError('Import failed: ' + e.message);
      }
    } finally {
      if (isMountedRef.current) {
        setImporting(false);
      }
    }
  }, [packet, raceId, checkpointNumber, currentRace, loadCheckpointData]);

  const handleStartScan = useCallback(() => {
    setScanning(true);
    setImportError(null);
  }, []);

  const handleCancelScan = useCallback(() => {
    setPacket(null);
    setStats(null);
    setScanning(false);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Scan zone */}
      <div className="bg-gray-900 dark:bg-gray-950 text-white px-4 py-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm">Incoming Batch</p>
            <p className="text-gray-400 text-xs">
              Scan QR from the marker's device to receive entries.
            </p>
          </div>
          {!scanning && (
            <button
              onClick={handleStartScan}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shrink-0"
            >
              <QrCodeIcon className="w-4 h-4" />
              Scan QR
            </button>
          )}
        </div>
      </div>

      {/* Callout sheet */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-6">
        <CalloutSheet />
      </div>

      {/* Overlays */}
      {scanning && (
        <QRScannerCamera onDecoded={handleDecoded} onCancel={handleCancelScan} />
      )}

      {packet && (
        <TransferSummaryModal
          packet={packet}
          stats={stats}
          onImport={handleImport}
          onCancel={handleCancelScan}
          importing={importing}
        />
      )}

      {importError && (
        <div role="alert" className="fixed bottom-20 left-4 right-4 bg-red-900/80 rounded-xl px-4 py-3 text-red-300 text-sm text-center z-50">
          {importError}
        </div>
      )}
    </div>
  );
}
