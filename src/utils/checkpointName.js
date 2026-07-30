/**
 * Resolve a checkpoint's display name from a race's checkpoint config.
 *
 * Operators name checkpoints during setup ("Ridgeline"), and that name — not the
 * number — is what they use on the radio and on paper. Every place that shows a
 * checkpoint to a human routes through here so the fallback stays consistent.
 *
 * @param {Array<{number: number, name?: string}>|null|undefined} checkpoints
 * @param {number|string} number - checkpoint number (route params arrive as strings)
 * @returns {string} the configured name, or "Checkpoint N" when unnamed/unknown
 */
export const getCheckpointName = (checkpoints, number) =>
  checkpoints?.find(cp => Number(cp.number) === Number(number))?.name
  || `Checkpoint ${number}`;

/** Filename-safe form of a checkpoint name, e.g. "Creek Crossing" -> "creek-crossing". */
export const slugifyCheckpointName = (name) =>
  String(name).trim().replace(/\s+/g, '-').toLowerCase();

export default getCheckpointName;
