import React, { useState, useCallback } from 'react';
import QRScannerCamera from './QRScannerCamera';
import TransferSummaryModal from './TransferSummaryModal';
import TransferService from '../../services/TransferService';
import useCheckpointStore from '../../store/checkpointStore';
import useRaceMaintenanceStore from '../../../race-maintenance/store/raceMaintenanceStore';

/**
 * Receive panel — camera scanner → confirmation modal → import.
 *
 * Props:
 *   raceId           {number}
 *   checkpointNumber {number}
 *   onDone           {function}  — called after successful import
 */
export default function ReceivePanel({ raceId, checkpointNumber, onDone }) {
  const [scanning, setScanning] = useState(false);
  const [packet, setPacket] = useState(null);
  const [stats, setStats] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { loadCheckpointData } = useCheckpointStore();
  const { currentRace } = useRaceMaintenanceStore();

  // Called by QRScannerCamera when a full packet is decoded
  const handleDecoded = useCallback(async (pkt) => {
    setScanning(false);
    setPacket(pkt);
    setImportError(null);
    setStats(null);

    // Dry-run to compute stats preview (read-only pass)
    try {
      const dryStats = await TransferService.applyToCheckpointRunners(raceId, pkt, { dryRun: true });
      setStats(dryStats);
    } catch {
      // If dry-run fails just show the packet without stats
      setStats({ imported: '?', updated: '?', skipped: '?' });
    }
  }, [raceId]);

  const handleImport = useCallback(async () => {
    if (!packet) return;
    setImporting(true);
    setImportError(null);
    try {
      const result = await TransferService.applyToCheckpointRunners(raceId, packet);
      // Reload checkpoint data so the grid reflects the new entries
      if (currentRace) {
        await loadCheckpointData(currentRace.id, checkpointNumber);
      }
      setSuccessMessage(`Imported ${result.imported} new, updated ${result.updated}.`);
      setPacket(null);
      setStats(null);
    } catch (e) {
      setImportError('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  }, [packet, raceId, checkpointNumber, currentRace, loadCheckpointData]);

  const handleCancel = useCallback(() => {
    setPacket(null);
    setStats(null);
    setScanning(false);
  }, []);

  // ── Success state ─────────────────────────────────────────────────────────
  if (successMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-base">Import complete</p>
          <p className="text-gray-400 text-sm mt-1">{successMessage}</p>
        </div>
        <button
          onClick={onDone}
          className="w-full max-w-xs py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white transition-colors"
        >
          Back to checkpoint
        </button>
        <button
          onClick={() => { setSuccessMessage(null); setScanning(false); }}
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors underline"
        >
          Scan another device
        </button>
      </div>
    );
  }

  // ── Camera scanner ────────────────────────────────────────────────────────
  if (scanning) {
    return (
      <>
        <QRScannerCamera onDecoded={handleDecoded} onCancel={handleCancel} />
        {packet && (
          <TransferSummaryModal
            packet={packet}
            stats={stats}
            onImport={handleImport}
            onCancel={handleCancel}
            importing={importing}
          />
        )}
        {importError && (
          <div className="absolute bottom-20 left-4 right-4 bg-red-900/80 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
            {importError}
          </div>
        )}
      </>
    );
  }

  // ── Initial prompt ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.24M16 16H9m4 4V9a1 1 0 00-1-1H9" />
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold text-base">Scan incoming data</p>
        <p className="text-gray-400 text-sm mt-1">
          Point the camera at the QR code on the operator's device.
          Works for both single codes and animated streams.
        </p>
      </div>
      <button
        onClick={() => setScanning(true)}
        className="w-full max-w-xs py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white transition-colors"
      >
        Start Scanning
      </button>

      {packet && (
        <TransferSummaryModal
          packet={packet}
          stats={stats}
          onImport={handleImport}
          onCancel={handleCancel}
          importing={importing}
        />
      )}
    </div>
  );
}
