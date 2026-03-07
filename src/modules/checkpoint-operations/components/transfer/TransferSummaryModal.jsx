import React from 'react';

/**
 * Confirmation modal shown after a successful QR scan.
 *
 * Props:
 *   packet        {object}     — decoded transfer packet
 *   stats         {{ imported, updated, skipped }}  — dry-run counts (null while calculating)
 *   onImport      {function}
 *   onCancel      {function}
 *   importing     {boolean}    — true while applyToCheckpointRunners is running
 */
export default function TransferSummaryModal({ packet, stats, onImport, onCancel, importing = false }) {
  if (!packet) return null;

  const times = packet.entries.map(e => e.at).filter(Boolean).sort();
  const earliest = times[0] ? new Date(times[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const latest = times[times.length - 1] ? new Date(times[times.length - 1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const shortDevice = packet.deviceId ? packet.deviceId.slice(0, 8) : 'unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-700">
          <p className="text-white font-semibold text-base">Transfer received</p>
          <p className="text-gray-400 text-sm mt-0.5">
            From device <span className="text-gray-200 font-mono">{shortDevice}</span>
            {' · '}Checkpoint {packet.checkpointNumber}
          </p>
          {times.length > 0 && (
            <p className="text-gray-400 text-sm">{earliest} – {latest}</p>
          )}
        </div>

        {/* Stats */}
        <div className="px-5 py-4 border-b border-gray-700 space-y-2">
          {stats ? (
            <>
              <Row label="New entries" value={stats.imported} positive />
              <Row label="Updated" value={stats.updated} neutral />
              <Row label="Skipped (same or older)" value={stats.skipped} muted />
            </>
          ) : (
            <p className="text-gray-400 text-sm">Calculating…</p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={onCancel}
            disabled={importing}
            className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={importing || !stats}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {importing ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, positive, neutral, muted }) {
  const valueClass = positive && value > 0
    ? 'text-green-400'
    : muted
    ? 'text-gray-500'
    : 'text-gray-200';

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-semibold text-sm tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}
