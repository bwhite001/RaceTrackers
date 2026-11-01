import { describe, it, expect } from 'vitest';
import { parseGpx } from '../../src/services/gpxUtils';
import { getAllTemplates } from '../../src/data/templates/index.js';

const SAMPLE_GPX = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="-27.100" lon="153.100"><name>Ridge Top</name></wpt>
  <wpt lat="-27.200" lon="153.200"><name>Valley Crossing</name></wpt>
  <trk><trkseg>
    <trkpt lat="-27.050" lon="153.050"/>
    <trkpt lat="-27.100" lon="153.100"/>
    <trkpt lat="-27.200" lon="153.200"/>
    <trkpt lat="-27.250" lon="153.250"/>
  </trkseg></trk>
</gpx>`;

describe('parseGpx', () => {
  it('returns null for empty input', () => {
    expect(parseGpx('')).toBeNull();
    expect(parseGpx(null)).toBeNull();
  });

  it('extracts track points as [lat, lng] pairs', () => {
    const result = parseGpx(SAMPLE_GPX);
    expect(result.trackPoints).toHaveLength(4);
    expect(result.trackPoints[0]).toEqual([-27.050, 153.050]);
    expect(result.trackPoints[3]).toEqual([-27.250, 153.250]);
  });

  it('extracts named waypoints', () => {
    const result = parseGpx(SAMPLE_GPX);
    expect(result.waypoints).toHaveLength(2);
    expect(result.waypoints[0]).toEqual({ name: 'Ridge Top', lat: -27.100, lng: 153.100 });
    expect(result.waypoints[1]).toEqual({ name: 'Valley Crossing', lat: -27.200, lng: 153.200 });
  });

  it('computes bounding box from track points', () => {
    const result = parseGpx(SAMPLE_GPX);
    expect(result.bounds.north).toBeCloseTo(-27.050);
    expect(result.bounds.south).toBeCloseTo(-27.250);
    expect(result.bounds.east).toBeCloseTo(153.250);
    expect(result.bounds.west).toBeCloseTo(153.050);
  });

  it('returns empty arrays for GPX with no tracks or waypoints', () => {
    const result = parseGpx(`<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"></gpx>`);
    expect(result.trackPoints).toEqual([]);
    expect(result.waypoints).toEqual([]);
    expect(result.bounds).toBeNull();
  });
});

describe('template course GPX', () => {
  it.each(getAllTemplates().map(t => [t.id, t.courseGpx]))('%s template GPX parses', (_, gpx) => {
    const parsed = parseGpx(gpx);
    expect(parsed).not.toBeNull();
    expect(parsed.trackPoints.length).toBeGreaterThanOrEqual(2);
  });

  it('Mt Glorious track is the real course', () => {
    const { trackPoints } = parseGpx(getAllTemplates().find(t => t.id === 'mt-glorious-mountain-trail').courseGpx);
    const metres = ([a, b], [c, d]) => Math.hypot((a - c) * 110950, (b - d) * 99000);
    const length = trackPoints.slice(1).reduce((km, p, i) => km + metres(trackPoints[i], p) / 1000, 0);
    expect(trackPoints.length).toBeGreaterThanOrEqual(100);
    expect(length).toBeGreaterThan(19);
    expect(length).toBeLessThan(24);
    // Passes CP1–4 within 100 m, in course order
    const cps = [[-27.321677, 152.714852], [-27.345838, 152.730526], [-27.366238, 152.730747], [-27.34649, 152.750306]];
    const hits = cps.map(cp => trackPoints.findIndex(p => metres(p, cp) < 100));
    expect(hits.every(i => i >= 0)).toBe(true);
    expect(hits).toEqual([...hits].sort((a, b) => a - b));
  });
});
