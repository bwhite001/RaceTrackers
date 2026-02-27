import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

/**
 * QRScannerModal
 * Uses the device camera and jsQR to decode a QR code containing
 * a race config JSON payload. Calls onScan(jsonString) on success.
 *
 * Props:
 *   isOpen   {boolean}  - controls visibility
 *   onScan   {function} - called with the decoded JSON string
 *   onClose  {function} - called when user dismisses
 */
const QRScannerModal = ({ isOpen, onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | requesting | scanning | error
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStatus('idle');
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      stopCamera();
      onScan(code.data);
      return;
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, [onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStatus('scanning');
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setStatus('error');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.');
      } else {
        setErrorMsg('Could not access camera: ' + err.message);
      }
    }
  }, [tick]);

  // Start/stop camera when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scan QR Code
          </h3>
          <button
            onClick={handleClose}
            aria-label="Close scanner"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {status === 'requesting' && (
            <div className="flex flex-col items-center py-8 text-gray-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Requesting camera access…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errorMsg}</p>
              <button onClick={startCamera} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Try Again
              </button>
            </div>
          )}

          {(status === 'scanning' || status === 'requesting') && (
            <div className={status === 'requesting' ? 'hidden' : ''}>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                Point the camera at the QR code from the exporting device.
              </p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                className="w-full rounded-lg bg-black"
                playsInline
                muted
              />
            </div>
          )}

          {/* Hidden canvas used for frame decoding */}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
