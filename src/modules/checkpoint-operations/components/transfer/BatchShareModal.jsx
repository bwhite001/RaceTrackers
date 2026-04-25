import React, { useEffect, useState, useCallback } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import TransferService from '../../services/TransferService';
import QRDisplayFullscreen from './QRDisplayFullscreen';

/**
 * Modal for the marker to share a batch of new entries to the radio operator via QR.
 *
 * Phases: 'preview' → 'qr' → 'confirm' → (onClose called)
 *
 * lastShareTimestamp is only advanced when operator explicitly confirms the batch
 * was received. Cancelling at any phase leaves the timestamp unchanged, so the
 * same entries are offered again next time (retry resilience).
 *
 * Props:
 *   raceId           {number}
 *   checkpointNumber {number}
 *   onClose          {function}
 */
export default function BatchShareModal({ raceId, checkpointNumber, onClose }) {
  const [phase, setPhase] = useState('preview'); // 'preview' | 'qr' | 'confirm'
  const [lastShare, setLastShare] = useState(null);
  const [isPendingRetry, setIsPendingRetry] = useState(false);
  const [entryCount, setEntryCount] = useState(null);
  const [packet, setPacket] = useState(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!raceId || checkpointNumber == null) return;
    let cancelled = false;
    (async () => {
      const [ts, pending] = await Promise.all([
        TransferService.getLastShareTimestamp(raceId, checkpointNumber),
        TransferService.getPendingBatch(raceId, checkpointNumber),
      ]);
      if (cancelled) return;
      setLastShare(ts);
      setIsPendingRetry(pending);
      const p = await TransferService.buildPayload(raceId, checkpointNumber, {
        isDelta: true,
        sinceTimestamp: ts,
      });
      if (!cancelled) setEntryCount(p.count);
    })().catch((e) => {
      if (!cancelled) setError('Failed to load batch info. Please close and try again.');
    });
    return () => { cancelled = true; };
  }, [raceId, checkpointNumber]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setBuilding(true);
    try {
      const p = await TransferService.buildPayload(raceId, checkpointNumber, {
        isDelta: true,
        sinceTimestamp: lastShare,
      });
      if (p.count === 0) {
        setError('No new entries to share.');
        return;
      }
      await TransferService.savePendingBatch(raceId, checkpointNumber);
      setPacket(p);
      setPhase('qr');
    } catch (e) {
      setError(e.message);
    } finally {
      setBuilding(false);
    }
  }, [raceId, checkpointNumber, lastShare]);

  const handleQRDone = useCallback(() => setPhase('confirm'), []);

  const handleCancel = useCallback(() => onClose(), [onClose]);

  const handleConfirmSent = useCallback(async () => {
    await TransferService.saveLastShareTimestamp(raceId, checkpointNumber);
    await TransferService.clearPendingBatch(raceId, checkpointNumber);
    onClose();
  }, [raceId, checkpointNumber, onClose]);

  // ── QR phase ────────────────────────────────────────────────────────────────
  if (phase === 'qr' && packet) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <QRDisplayFullscreen
          packet={packet}
          onDone={handleQRDone}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // ── Confirm phase ────────────────────────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
          <div className="px-5 pt-5 pb-4 border-b border-gray-700 text-center">
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-3">
              <CheckIcon className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-semibold text-base">Confirm batch sent?</p>
            <p className="text-gray-400 text-sm mt-1">
              Only confirm once the radio operator has successfully scanned the QR code.
            </p>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <button
              onClick={handleConfirmSent}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 font-semibold text-white transition-colors"
            >
              ✓ Yes, batch was received
            </button>
            <button
              onClick={() => setPhase('qr')}
              className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 transition-colors"
            >
              ← Show QR again
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors text-center py-1"
            >
              Cancel — I'll confirm later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview phase ────────────────────────────────────────────────────────────
  const lastShareLabel = lastShare
    ? new Date(lastShare).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-700">
          <div>
            <p className="text-white font-semibold text-base">Share Batch</p>
            <p className="text-gray-400 text-sm">
              {lastShareLabel ? `Last share: ${lastShareLabel}` : 'First share this session'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Entry count / retry notice */}
        <div className="px-5 py-5">
          {isPendingRetry && (
            <div className="mb-4 px-4 py-3 bg-amber-900/30 border border-amber-700/50 rounded-xl">
              <p className="text-amber-300 text-sm font-medium">
                Previous share may not have been received
              </p>
              <p className="text-amber-400/70 text-xs mt-0.5">Showing the same batch again.</p>
            </div>
          )}

          {entryCount === null ? (
            <p className="text-gray-400 text-sm text-center">Calculating…</p>
          ) : entryCount === 0 ? (
            <p className="text-gray-400 text-sm text-center">No new entries since last share.</p>
          ) : (
            <p className="text-white text-center">
              <span className="text-3xl font-bold text-blue-400">{entryCount}</span>
              <span className="text-gray-400 text-sm ml-2">
                {entryCount === 1 ? 'new entry' : 'new entries'}
                {lastShareLabel ? ` since ${lastShareLabel}` : ''}
              </span>
            </p>
          )}
        </div>

        {error && (
          <p className="text-amber-400 text-sm text-center px-5 pb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="px-5 pb-5">
          <button
            onClick={handleGenerate}
            disabled={building || entryCount === null || entryCount === 0}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 font-semibold text-white transition-colors"
          >
            {building
              ? 'Building QR…'
              : isPendingRetry
              ? 'Retry — Generate QR'
              : 'Generate QR Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
