/**
 * Parses a GPX XML string and extracts track points, waypoints, and bounding box.
 * Uses DOMParser (available in all modern browsers and jsdom test environment).
 *
 * @param {string|null} gpxString - Raw GPX XML
 * @returns {{ trackPoints: [number,number][], waypoints: {name:string,lat:number,lng:number}[], bounds: {north,south,east,west}|null } | null}
 */
export function parseGpx(gpxString) {
  if (!gpxString) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxString, 'application/xml');

  if (doc.querySelector('parsererror')) return null;

  // Extract track points from all <trkpt> elements
  const trkpts = Array.from(doc.querySelectorAll('trkpt'));
  const trackPoints = trkpts
    .map(pt => [
      parseFloat(pt.getAttribute('lat')),
      parseFloat(pt.getAttribute('lon')),
    ])
    .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

  // Extract named waypoints from <wpt> elements
  const wpts = Array.from(doc.querySelectorAll('wpt'));
  const waypoints = wpts
    .map(pt => ({
      name: pt.querySelector('name')?.textContent?.trim() ?? '',
      lat: parseFloat(pt.getAttribute('lat')),
      lng: parseFloat(pt.getAttribute('lon')),
    }))
    .filter(w => !isNaN(w.lat) && !isNaN(w.lng));

  // Compute bounding box from track points
  let bounds = null;
  if (trackPoints.length > 0) {
    const lats = trackPoints.map(([lat]) => lat);
    const lngs = trackPoints.map(([, lng]) => lng);
    bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }

  return { trackPoints, waypoints, bounds };
}
