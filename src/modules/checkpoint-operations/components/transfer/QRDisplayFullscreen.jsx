import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode.react';
import { Encoder } from 'qram';
import * as base64url from 'base64url-universal';
import TransferService from '../../services/TransferService';
import pako from 'pako';

const STREAM_FPS = 6;

/**
 * Full-screen QR display for transfer.
 *
 * Props:
 *   packet        {object}    — decoded transfer packet (not yet compressed)
 *   onDone        {function}  — called when operator taps Done
 *   onCancel      {function}  — called when operator taps Cancel/Back
 */
export default function QRDisplayFullscreen({ packet, onDone, onCancel }) {
  const [encoded, setEncoded] = useState(null);
  const [method, setMethod] = useState(null);
  const [sizeBytes, setSizeBytes] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [error, setError] = useState(null);

  // qram stream state
  const streamFramesRef = useRef([]); // pre-built base64url frame strings
  const animRef = useRef(null);
  const frameIdxRef = useRef(0);

  // ── Compress & decide method ──────────────────────────────────────────────
  useEffect(() => {
    if (!packet) return;
    try {
      const { encoded: enc, sizeBytes: sz, method: m } = TransferService.compressAndEncode(packet);
      setEncoded(enc);
      setSizeBytes(sz);
      setMethod(m);
    } catch (e) {
      setError('Failed to compress data: ' + e.message);
    }
  }, [packet]);

  // ── Build qram stream frames ──────────────────────────────────────────────
  useEffect(() => {
    if (method !== 'stream' || !encoded) return;

    let cancelled = false;
    (async () => {
      try {
        // Re-compress to raw bytes for qram (it needs Uint8Array)
        const json = JSON.stringify(packet);
        const compressed = pako.gzip(json);

        const encoder = new Encoder({ data: compressed, blockSize: 800 });
        const stream = await encoder.createReadableStream();
        const reader = stream.getReader();
        const frames = [];

        // Pre-generate enough frames for smooth looping (~3s worth)
        const TARGET_FRAMES = STREAM_FPS * 20; // 20s loop
        for (let i = 0; i < TARGET_FRAMES; i++) {
          const { value: pkt } = await reader.read();
          frames.push(base64url.encode(pkt.data));
        }
        stream.cancel();

        if (!cancelled) {
          streamFramesRef.current = frames;
          frameIdxRef.current = 0;
          setFrameIndex(0);
        }
      } catch (e) {
        if (!cancelled) setError('Failed to build stream: ' + e.message);
      }
    })();

    return () => { cancelled = true; };
  }, [method, encoded, packet]);

  // ── Animate stream frames ─────────────────────────────────────────────────
  useEffect(() => {
    if (method !== 'stream' || streamFramesRef.current.length === 0) return;

    const interval = setInterval(() => {
      const frames = streamFramesRef.current;
      if (frames.length === 0) return;
      frameIdxRef.current = (frameIdxRef.current + 1) % frames.length;
      setFrameIndex(frameIdxRef.current);
    }, Math.floor(1000 / STREAM_FPS));

    animRef.current = interval;
    return () => clearInterval(interval);
  }, [method, streamFramesRef.current.length]);

  // ── Web Share fallback ────────────────────────────────────────────────────
  const handleShareFile = useCallback(() => {
    const json = JSON.stringify(packet, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], `checkpoint-sync-${Date.now()}.json`, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Checkpoint Data' }).catch(() => {});
    } else {
      // Fallback: trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [packet]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={onCancel} className="text-blue-400 underline text-sm">Go back</button>
      </div>
    );
  }

  if (!encoded || !method) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Building QR code…</p>
      </div>
    );
  }

  const currentQRValue = method === 'static'
    ? 'CST:' + encoded
    : (streamFramesRef.current[frameIndex] ?? '');

  const isStreamReady = method !== 'stream' || streamFramesRef.current.length > 0;

  return (
    <div className="flex flex-col items-center justify-between h-full bg-black text-white px-4 py-6 select-none">
      {/* Header */}
      <div className="text-center">
        <p className="text-lg font-semibold">
          {method === 'static' ? 'Show to receiving device' : 'Keep screens facing — scanning…'}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {packet.count} {packet.count === 1 ? 'entry' : 'entries'}
          {packet.isDelta ? ' (new only)' : ' (full history)'}
          {' · '}
          {method === 'static'
            ? `${sizeBytes} bytes`
            : `${Math.round(sizeBytes / 1024)} KB — streaming`}
        </p>
      </div>

      {/* QR Code */}
      <div className="flex-1 flex items-center justify-center my-4">
        {isStreamReady && currentQRValue ? (
          <div className="bg-white p-4 rounded-xl">
            <QRCode
              value={currentQRValue}
              size={280}
              level="M"
              includeMargin={false}
            />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Preparing stream…</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={onDone}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white transition-colors"
        >
          Done — receiver got it
        </button>
        <button
          onClick={handleShareFile}
          className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 transition-colors"
        >
          Can't scan? Share file instead
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
