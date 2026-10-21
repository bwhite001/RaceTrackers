import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import { ArrowDownTrayIcon, EnvelopeIcon, DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ExportService } from '../../services/import-export/ExportService.js';
import { setupFileName, shareEmailUrl } from './shareRace.js';
import { Button } from '../../design-system/components';
import AppBar from '../../design-system/components/VK/AppBar';

// Plain-JSON QR, readable by the Home "Scan race QR code" scanner.
// Above this size the QR is too dense to scan reliably (level L ≈ 2,900 chars).
const QR_MAX_CHARS = 2500;

/**
 * Share race config by QR (spec §4.3): large QR in a white card, counts,
 * Download / Email / Copy tiles, primary "Show full screen".
 */
const ShareRaceModal = ({ isOpen, raceId, onClose, onImport }) => {
  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!isOpen || !raceId) return;
    setPkg(null);
    setError(null);
    // Setup only (no results) — what a volunteer device needs to load the race
    ExportService.exportRaceSetup(raceId).then(setPkg).catch(e => setError(e.message));
  }, [isOpen, raceId]);

  if (!isOpen) return null;

  const json = pkg ? JSON.stringify(pkg) : '';
  const race = pkg?.data?.races?.[0] ?? {};
  const runnerCount = pkg?.metadata?.totalRunners ?? 0;
  const cpCount = pkg?.metadata?.totalCheckpoints ?? 0;
  const qrFits = json.length > 0 && json.length <= QR_MAX_CHARS;
  const fileName = setupFileName(race.name);

  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };
  // Share the setup as a file where the device can (Web Share); otherwise
  // download it and open a short email asking for it to be attached.
  const email = async () => {
    const text = JSON.stringify(pkg, null, 2);
    const file = typeof File !== 'undefined' ? new File([text], fileName, { type: 'application/json' }) : null;
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `Race setup: ${race.name ?? ''}`, text: 'Open RaceTracker › Scan race QR code › Import and choose this file.' });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return;
      }
    }
    download();
    window.open(shareEmailUrl(race.name, fileName));
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tile = (label, Icon, onClick) => (
    <button type="button" onClick={onClick}
      className="bg-white dark:bg-gray-800 border border-vk-border dark:border-gray-700 rounded-btn min-h-[72px] flex flex-col items-center justify-center gap-1.5 text-[13px] font-semibold text-vk-ink dark:text-gray-100">
      <Icon className="w-[22px] h-[22px] text-vk-blue" aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-vk-paper dark:bg-gray-900 flex flex-col overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="share-race-hd">
      <AppBar title="Share race" subtitle={race.name} onBack={onClose} backLabel="Close share race" right={null} />
      <main className="flex-1 px-5 py-[22px] flex flex-col gap-[18px] max-w-md w-full mx-auto">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 id="share-race-hd" className="font-display font-bold text-xl text-vk-navy dark:text-white">Scan to load this race</h2>
          <p className="text-sm leading-relaxed text-vk-muted dark:text-gray-400">
            On each volunteer device: open RaceTracker, tap <strong className="text-vk-ink dark:text-white">Scan race QR code</strong>.
          </p>
        </div>

        <div className="self-center bg-white border border-vk-border rounded-sheet p-[18px] shadow-sheet flex flex-col items-center gap-3">
          {error && <p className="text-sm text-vk-red">{error}</p>}
          {!pkg && !error && <p className="text-sm text-vk-muted w-[252px] h-[252px] flex items-center justify-center">Preparing race…</p>}
          {pkg && qrFits && (
            <div role="img" aria-label={`QR code for ${race.name} race configuration`}>
              <QRCode value={json} size={252} level="L" />
            </div>
          )}
          {pkg && !qrFits && (
            <p className="text-sm text-vk-ink w-[252px] leading-relaxed">
              This race is too large for one QR code ({json.length.toLocaleString('en-AU')} characters).
              Use Download, Email or Copy below to send the file instead.
            </p>
          )}
          {pkg && <div className="text-xs text-vk-muted">{runnerCount} runners · {cpCount} checkpoints</div>}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {tile('Download', ArrowDownTrayIcon, download)}
          {tile('Email', EnvelopeIcon, email)}
          {tile(copied ? 'Copied' : 'Copy', DocumentDuplicateIcon, copy)}
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <Button variant="gold" size="primary" fullWidth disabled={!qrFits} onClick={() => setFullScreen(true)}>
            Show full screen
          </Button>
          {onImport && (
            <Button variant="plain" size="action" fullWidth onClick={onImport}>Import a race instead</Button>
          )}
          <div className="text-center text-xs text-vk-muted">Works without internet — device to device</div>
        </div>
      </main>

      {fullScreen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center gap-6 p-4">
          <QRCode value={json} size={Math.min(window.innerWidth, window.innerHeight) - 80} level="L" />
          <Button variant="plain" size="action" onClick={() => setFullScreen(false)} leftIcon={<XMarkIcon className="w-5 h-5" />}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShareRaceModal;
