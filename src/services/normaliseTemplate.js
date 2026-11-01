/**
 * Converts any template format (rich JS or simple JSON) to the canonical shape
 * consumed by TemplateSelectionStep, RaceSetup, and RaceTemplateService.
 *
 * @param {Object} raw - Raw template object (rich JS or simple JSON format)
 * @returns {Object} Normalised template in canonical shape (includes courseGpx if present)
 */
export function normaliseTemplate(raw) {
  const isRichFormat = raw.defaultRunnerRangeStart != null;

  // Checkpoints — keep distance and operator callsigns ("VK4IE (John)" → "VK4IE"); location "lat, lng" becomes numeric coordinates when both parse
  const checkpoints = (raw.checkpoints || []).map(cp => {
    const callsigns = (cp.metadata?.operators || []).map(o => String(o).split(' ')[0]).filter(Boolean);
    const [lat, lng] = String(cp.location ?? '').split(',').map(s => s.trim());
    const latitude = Number(lat), longitude = Number(lng);
    const hasCoords = lat && lng && Number.isFinite(latitude) && Number.isFinite(longitude);
    return {
      number: cp.number,
      name: cp.name,
      orderSequence: cp.orderSequence ?? cp.number,
      ...(cp.locationName && { locationName: cp.locationName }),
      ...(hasCoords && { latitude, longitude }),
      ...(cp.distanceKm != null && { distanceKm: cp.distanceKm }),
      ...(callsigns.length && { operatorCallsigns: callsigns }),
    };
  });

  // Runner ranges
  let runnerRanges, defaultRunnerRangeStart, defaultRunnerRangeEnd;
  if (isRichFormat) {
    defaultRunnerRangeStart = raw.defaultRunnerRangeStart;
    defaultRunnerRangeEnd = raw.defaultRunnerRangeEnd;
    runnerRanges = [{ min: defaultRunnerRangeStart, max: defaultRunnerRangeEnd }];
  } else {
    runnerRanges = raw.runnerRanges || [];
    defaultRunnerRangeStart = runnerRanges[0]?.min ?? 1;
    defaultRunnerRangeEnd = runnerRanges[runnerRanges.length - 1]?.max ?? 100;
  }

  return {
    id: raw.id,
    name: raw.name,
    eventType: raw.eventType || 'Trail Run',
    description: raw.description || '',
    defaultStartTime: raw.defaultStartTime || '07:00:00',
    defaultRunnerRangeStart,
    defaultRunnerRangeEnd,
    baseLocation: raw.metadata?.baseLocation || '',
    checkpoints,
    runnerRanges,
    defaultBatches: isRichFormat ? [] : (raw.defaultBatches || []),
    raceDefaults: raw.raceDefaults || {},
    courseGpx: raw.courseGpx || null
  };
}
