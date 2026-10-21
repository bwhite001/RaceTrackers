/**
 * Base's field (race-day fixes Part B): the setup's runners plus any late
 * entries base has accepted (field_changes, not cancelled). Every count,
 * check and report reads this, so a late runner is a real runner everywhere.
 */
export function fieldNumbers(setupNumbers = [], fieldChanges = []) {
  const out = new Set(setupNumbers);
  for (const c of fieldChanges) if (!c.cancelledAt && c.kind === 'late') out.add(c.number);
  return [...out].sort((a, b) => a - b);
}

/** Late entries still in the field, by bib. */
export function lateNumbers(fieldChanges = []) {
  return new Set(fieldChanges.filter(c => !c.cancelledAt && c.kind === 'late').map(c => c.number));
}
