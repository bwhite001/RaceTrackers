import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Decoder } from 'qram';
import * as base64url from 'base64url-universal';
import pako from 'pako';
import TransferService from '../../services/TransferService';

/**
 * Camera scanner for incoming QR transfer data.
 *
 * Handles both static QR (prefixed CST:) and animated qram streams.
 *
 * Props:
 *   onDecoded   {function(packet)}  — called with the decoded + validated packet
 *   onCancel    {function}
 */
export default function QRScannerCamera({ onDecoded, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const decoderRef = useRef(null);
  const decodePromiseRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [progress, setProgress] = useState(null); // null = not started, 0-1 = stream progress
  const [scanning, setScanning] = useState(false);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    rafRef.current = null;
    streamRef.current = null;
  }, []);

  // ── Handle a decoded QR string ────────────────────────────────────────────
  const handleQRText = useCallback(async (text) => {
    if (!text) return;

    if (text.startsWith('CST:')) {
      // Static QR — decode immediately
      cancelAnimationFrame(rafRef.current);
      stopCamera();
      try {
        const packet = await TransferService.decodeAndDecompress(text.slice(4));
        onDecoded(packet);
      } catch (e) {
        setCameraError('Failed to decode QR: ' + e.message);
        setScanning(false);
      }
      return;
    }

    // qram stream frame — enqueue into decoder
    if (!decoderRef.current) return;
    try {
      const bytes = base64url.decode(text);
      const prog = await decoderRef.current.enqueue(bytes);
      if (prog) {
        const pct = prog.totalBlocks > 0 ? prog.receivedBlocks / prog.totalBlocks : 0;
        setProgress(Math.min(pct, 1));
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        // non-fatal — keep scanning
      }
    }
  }, [onDecoded, stopCamera]);

  // ── Start qram decoder ────────────────────────────────────────────────────
  const startQramDecoder = useCallback(() => {
    const decoder = new Decoder();
    decoderRef.current = decoder;

    decodePromiseRef.current = decoder.decode().then(({ data }) => {
      stopCamera();
      // data is Uint8Array of pako-gzipped JSON
      const json = pako.ungzip(data, { to: 'string' });
      const packet = JSON.parse(json);
      onDecoded(packet);
    }).catch(e => {
      if (e.name !== 'AbortError') setCameraError('Stream decode failed: ' + e.message);
    });
  }, [onDecoded, stopCamera]);

  // ── Scan loop ─────────────────────────────────────────────────────────────
  const startScanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code?.data) {
          handleQRText(code.data);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [handleQRText]);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setProgress(null);
    setScanning(true);

    // Start qram decoder in background (handles stream; ignored for static QR)
    startQramDecoder();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      startScanLoop();
    } catch {
      setCameraError('camera');
      setScanning(false);
    }
  }, [startQramDecoder, startScanLoop]);

  // ── iOS photo fallback ────────────────────────────────────────────────────
  const handlePhotoFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      await handleQRText(code.data);
    } else {
      setCameraError('No QR code found in photo. Try again.');
    }
  }, [handleQRText]);

  // ── File import fallback (JSON) ───────────────────────────────────────────
  const handleJSONFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const packet = JSON.parse(text);
      if (packet?.type === 'checkpoint-sync') {
        onDecoded(packet);
      } else {
        setCameraError('Invalid file format.');
      }
    } catch {
      setCameraError('Could not read file.');
    }
  }, [onDecoded]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Video viewfinder */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder overlay */}
        {scanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-blue-400 rounded-2xl opacity-70" />
          </div>
        )}

        {/* Stream progress bar */}
        {progress !== null && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3">
            <p className="text-xs text-gray-300 mb-1">
              {Math.round(progress * 100)}% — keep scanning…
            </p>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-5 flex flex-col items-center gap-3">
        {!scanning && !cameraError && (
          <button
            onClick={startCamera}
            className="w-full max-w-xs py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-colors"
          >
            Start Scanning
          </button>
        )}

        {cameraError === 'camera' && (
          <div className="w-full max-w-xs text-center">
            <p className="text-sm text-amber-400 mb-3">
              Camera access unavailable — use a photo or file instead.
            </p>
            <label className="block w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold text-center cursor-pointer transition-colors">
              Take a photo of the QR code
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoFile}
              />
            </label>
          </div>
        )}

        {cameraError && cameraError !== 'camera' && (
          <p className="text-sm text-red-400 text-center">{cameraError}</p>
        )}

        {/* File import fallback */}
        <label className="text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors underline">
          Import from file instead
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleJSONFile}
          />
        </label>

        <button
          onClick={() => { stopCamera(); onCancel(); }}
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
