import React, { useState } from 'react';
import { LinkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../../design-system/components/Button/Button.jsx';

/**
 * LinkCheckpointsStep — optional wizard step to mark two checkpoints as being
 * at the same physical location. Stores `linkedCheckpointNumber` metadata only.
 *
 * Props:
 *   checkpoints: Array<{ number, name, linkedCheckpointNumber? }>
 *   onNext: (updatedCheckpoints) => void
 *   onBack: () => void
 */
export default function LinkCheckpointsStep({ checkpoints, onNext, onBack }) {
  // links: Map<lower_number, higher_number>
  const [links, setLinks] = useState(() => {
    const m = new Map();
    checkpoints.forEach(cp => {
      if (cp.linkedCheckpointNumber != null && cp.number < cp.linkedCheckpointNumber) {
        m.set(cp.number, cp.linkedCheckpointNumber);
      }
    });
    return m;
  });
  const [selecting, setSelecting] = useState(null); // cpNumber pending second selection

  const linkedNumbers = new Set([...links.keys(), ...links.values()]);

  const handleTileClick = (cpNumber) => {
    if (selecting === null) {
      setSelecting(cpNumber);
      return;
    }
    if (selecting === cpNumber) {
      // Clicked same tile — deselect
      setSelecting(null);
      return;
    }
    // Second selection — form pair
    const [a, b] = selecting < cpNumber ? [selecting, cpNumber] : [cpNumber, selecting];
    setLinks(prev => new Map(prev).set(a, b));
    setSelecting(null);
  };

  const handleUnlink = (a, b) => {
    setLinks(prev => {
      const next = new Map(prev);
      next.delete(a < b ? a : b);
      return next;
    });
  };

  const handleNext = () => {
    const updated = checkpoints.map(cp => {
      const asKey = [...links.entries()].find(([k]) => k === cp.number);
      const asVal = [...links.entries()].find(([, v]) => v === cp.number);
      if (asKey) return { ...cp, linkedCheckpointNumber: asKey[1] };
      if (asVal) return { ...cp, linkedCheckpointNumber: asVal[0] };
      return { ...cp, linkedCheckpointNumber: null };
    });
    onNext(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Link Checkpoints{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(optional)</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          If two checkpoints are at the same physical location (e.g. a turnaround), link them so
          volunteers can operate both from one screen.
        </p>
      </div>

      {selecting !== null && (
        <p className="text-sm font-medium text-navy-700 dark:text-navy-300">
          CP{selecting} selected — now click the checkpoint it shares a location with.
        </p>
      )}

      {/* Linked pairs */}
      {[...links.entries()].map(([a, b]) => {
        const cpA = checkpoints.find(c => c.number === a);
        const cpB = checkpoints.find(c => c.number === b);
        return (
          <div
            key={`${a}-${b}`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-navy-500 bg-navy-50 dark:bg-navy-900/20"
          >
            <LinkIcon className="w-5 h-5 text-navy-600 dark:text-navy-400 shrink-0" />
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              CP{a} {cpA?.name ? `— ${cpA.name}` : ''} ↔ CP{b}{' '}
              {cpB?.name ? `— ${cpB.name}` : ''}
            </span>
            <button
              data-testid={`unlink-${a}-${b}`}
              onClick={() => handleUnlink(a, b)}
              className="ml-auto p-1 rounded text-gray-500 hover:text-red-500 transition-colors"
              aria-label={`Unlink CP${a} and CP${b}`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Checkpoint tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {checkpoints.map(cp => {
          const isLinked = linkedNumbers.has(cp.number);
          const isSelecting = selecting === cp.number;
          return (
            <button
              key={cp.number}
              data-testid={`cp-tile-${cp.number}`}
              onClick={() => !isLinked && handleTileClick(cp.number)}
              disabled={isLinked}
              className={`
                px-4 py-3 rounded-lg border-2 text-left transition-all
                ${
                  isSelecting
                    ? 'border-navy-500 bg-navy-100 dark:bg-navy-800'
                    : isLinked
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-navy-400'
                }
              `}
            >
              <p className="font-semibold text-gray-900 dark:text-white text-sm">CP{cp.number}</p>
              {cp.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{cp.name}</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
