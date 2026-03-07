import React, { useEffect, useState, useCallback } from 'react';
import TransferService from '../../services/TransferService';
import QRDisplayFullscreen from './QRDisplayFullscreen';

/**
 * Send panel — scope selector → QR display.
 *
 * Props:
 *   raceId           {number}
 *   checkpointNumber {number}
 *   onDone           {function}  — called after operator taps Done (saves timestamp)
 */
export default function SendPanel({ raceId, checkpointNumber, onDone }) {
  const [scope, setScope] = useState('delta'); // 'delta' | 'full'
  const [lastShare, setLastShare] = useState(null);
  const [building, setBuilding] = useState(false);
  const [packet, setPacket] = useState(null);
  const [error, setError] = useState(null);
  const [entryCount, setEntryCount] = useState(null); // preview count

  // Load last share timestamp + preview count on mount
  useEffect(() => {
    if (!raceId || checkpointNumber == null) return;
    TransferService.getLastShareTimestamp(raceId, checkpointNumber).then(setLastShare);
  }, [raceId, checkpointNumber]);

  // Preview entry count when scope changes
  useEffect(() => {
    if (!raceId || checkpointNumber == null) return;
    const sinceTs = scope === 'delta' ? lastShare : null;
    TransferService.buildPayload(raceId, checkpointNumber, {
      isDelta: scope === 'delta',
      sinceTimestamp: sinceTs,
    }).then(p => setEntryCount(p.count)).catch(() => setEntryCount(null));
  }, [raceId, checkpointNumber, scope, lastShare]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setBuilding(true);
    setPacket(null);
    try {
      const sinceTs = scope === 'delta' ? lastShare : null;
      const p = await TransferService.buildPayload(raceId, checkpointNumber, {
        isDelta: scope === 'delta',
        sinceTimestamp: sinceTs,
      });
      if (p.count === 0) {
        setError('No entries to share. Either all entries have already been shared, or no runners have been marked off yet.');
        setBuilding(false);
        return;
      }
      setPacket(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setBuilding(false);
    }
  }, [raceId, checkpointNumber, scope, lastShare]);

  const handleDone = useCallback(async () => {
    await TransferService.saveLastShareTimestamp(raceId, checkpointNumber);
    setPacket(null);
    onDone();
  }, [raceId, checkpointNumber, onDone]);

  // ── Show QR display once packet is ready ──────────────────────────────────
  if (packet) {
    return (
      <QRDisplayFullscreen
        packet={packet}
        onDone={handleDone}
        onCancel={() => setPacket(null)}
      />
    );
  }

  // ── Scope selector ────────────────────────────────────────────────────────
  const lastShareLabel = lastShare
    ? new Date(lastShare).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col h-full px-4 py-6 gap-6">
      <div>
        <p className="text-white font-semibold text-base mb-1">What to include</p>
        <p className="text-gray-400 text-sm">
          Choose how much data to share with the receiving device.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <ScopeOption
          id="delta"
          selected={scope === 'delta'}
          onSelect={() => setScope('delta')}
          title={lastShareLabel ? `New entries since ${lastShareLabel}` : 'New entries (first share)'}
          description={lastShareLabel
            ? 'Only entries recorded after your last share — keeps QR codes small.'
            : 'All entries marked off so far (no previous share on this device).'}
        />
        <ScopeOption
          id="full"
          selected={scope === 'full'}
          onSelect={() => setScope('full')}
          title="Full checkpoint history"
          description="Every entry recorded at this checkpoint — use at end of race or for a full catch-up."
        />
      </div>

      {entryCount !== null && (
        <p className="text-gray-400 text-sm text-center">
          {entryCount === 0
            ? 'No entries to share with this selection.'
            : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} will be included`}
        </p>
      )}

      {error && (
        <p className="text-amber-400 text-sm text-center px-2">{error}</p>
      )}

      <div className="mt-auto">
        <button
          onClick={handleGenerate}
          disabled={building || entryCount === 0}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 font-semibold text-white transition-colors"
        >
          {building ? 'Building QR…' : 'Generate QR Code'}
        </button>
      </div>
    </div>
  );
}

function ScopeOption({ id, selected, onSelect, title, description }) {
  return (
    <button
      onClick={onSelect}
      className={`text-left w-full px-4 py-3 rounded-xl border transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-900/30 text-white'
          : 'border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
          selected ? 'border-blue-400 bg-blue-400' : 'border-gray-500'
        }`} />
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}
