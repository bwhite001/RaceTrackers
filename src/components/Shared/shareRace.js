/**
 * Share-race helpers (interim, until the rtsetup package). A full race is too
 * long for a QR code or a mailto: body (~2,000 characters on many clients),
 * so email shares the setup as a file and keeps the message short.
 */

/** Result data that must never travel in a shared race setup. */
export const RESULT_KEYS = [
  'checkpointRunners', 'baseStationRunners', 'withdrawalRecords', 'vetOutRecords',
  'auditLog', 'deletedEntries', 'strapperCalls', 'radioCalls',
];

export const MAILTO_MAX = 1800;

export function setupFileName(raceName) {
  return `race-setup-${String(raceName || 'race').trim().replace(/\s+/g, '-')}.json`;
}

/** Short email: instructions only — the setup travels as an attached file. */
export function shareEmailUrl(raceName, fileName) {
  const subject = `Race setup: ${raceName || ''}`.slice(0, 120);
  const body = [
    `Race setup for ${raceName || 'the race'} is attached as ${fileName}.`,
    '',
    'If it isn\'t attached, please attach the file that has just downloaded to this device.',
    '',
    'To load it: open RaceTracker, tap Scan race QR code, then Import and choose the file.',
  ].join('\n');
  // Fixed short text — well under MAILTO_MAX (a unit test holds it there)
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
