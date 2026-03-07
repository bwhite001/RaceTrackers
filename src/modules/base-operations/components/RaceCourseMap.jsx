import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parseGpx } from '../../../services/gpxUtils';
import { RUNNER_STATUSES } from '../../../types';

/** Numbered circle divIcon — avoids Vite asset path resolution issues. */
const makeMarkerIcon = (number, colour) =>
  L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${colour};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

/** Returns a Tailwind-compatible hex colour based on fraction of runners passed. */
const markerColour = (passed, total) => {
  if (total === 0) return '#6b7280';
  const pct = passed / total;
  if (pct > 0.66) return '#16a34a';
  if (pct > 0.33) return '#d97706';
  return '#dc2626';
};

/**
 * RaceCourseMap — displays the race course polyline and checkpoint markers
 * with live pass counts on the base station Overview tab.
 *
 * Returns null if there is nothing to display (no GPX and no checkpoint coordinates).
 */
const RaceCourseMap = ({ courseGpx, checkpoints = [], runners = [], total = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);

  const parsed = useMemo(() => (courseGpx ? parseGpx(courseGpx) : null), [courseGpx]);

  const coordCheckpoints = useMemo(
    () => checkpoints.filter(cp => cp.latitude != null && cp.longitude != null),
    [checkpoints]
  );

  // Count how many unique runners have passed at or beyond each checkpoint number.
  // A runner "passes" CP N if they have a record with checkpointNumber >= N and status PASSED,
  // or if they have a base station record (checkpointNumber === 0 means finished).
  const passCounts = useMemo(() => {
    // Build a map of runner → highest checkpoint number they've reached
    const maxCpByRunner = new Map();
    for (const r of runners) {
      const isPassedStatus =
        r.status === RUNNER_STATUSES.PASSED ||
        r.status === RUNNER_STATUSES.MARKED_OFF ||
        r.status === RUNNER_STATUSES.CALLED_IN;
      const isFinished = r.checkpointNumber === 0;
      if (!isPassedStatus && !isFinished) continue;
      const cpNum = isFinished ? Infinity : r.checkpointNumber;
      const prev = maxCpByRunner.get(r.number) ?? -Infinity;
      if (cpNum > prev) maxCpByRunner.set(r.number, cpNum);
    }
    const counts = {};
    for (const cp of checkpoints) {
      let count = 0;
      for (const maxCp of maxCpByRunner.values()) {
        if (maxCp >= cp.number) count++;
      }
      counts[cp.number] = count;
    }
    return counts;
  }, [runners, checkpoints]);

  // Nothing to render
  if (!parsed?.trackPoints?.length && coordCheckpoints.length === 0) return null;

  const initialCenter = parsed?.bounds
    ? [
        (parsed.bounds.north + parsed.bounds.south) / 2,
        (parsed.bounds.east + parsed.bounds.west) / 2,
      ]
    : [coordCheckpoints[0].latitude, coordCheckpoints[0].longitude];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Race Course Map
          <span className="ml-2 font-normal text-gray-400 text-xs">
            {coordCheckpoints.length} checkpoint{coordCheckpoints.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <button
          aria-label={collapsed ? 'Expand map' : 'Collapse map'}
          onClick={() => setCollapsed(c => !c)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {collapsed ? 'Expand ▾' : 'Collapse ▴'}
        </button>
      </div>

      {/* Collapsed: checkpoint summary pills */}
      {collapsed && (
        <div className="flex flex-wrap gap-2 px-4 py-2">
          {checkpoints.map(cp => (
            <span
              key={cp.number}
              className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-0.5"
            >
              <span className="font-semibold">CP{cp.number}</span>
              <span className="text-gray-500">{passCounts[cp.number] ?? 0}/{total}</span>
            </span>
          ))}
        </div>
      )}

      {/* Map */}
      {!collapsed && (
        <div className="md:h-96 h-72">
          <MapContainer
            center={initialCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {parsed?.trackPoints?.length > 0 && (
              <Polyline positions={parsed.trackPoints} color="#1e3a5f" weight={3} opacity={0.8} />
            )}
            {coordCheckpoints.map(cp => {
              const passed = passCounts[cp.number] ?? 0;
              return (
                <Marker
                  key={cp.number}
                  position={[cp.latitude, cp.longitude]}
                  icon={makeMarkerIcon(cp.number, markerColour(passed, total))}
                >
                  <Popup>
                    <strong>{cp.name}</strong>
                    <br />
                    {passed}/{total} runners passed
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* Pass count summary row */}
      {!collapsed && (
        <div className="flex flex-wrap gap-3 px-4 py-2 border-t border-gray-100 dark:border-gray-700/50 text-xs text-gray-600 dark:text-gray-400">
          {checkpoints.map(cp => (
            <span key={cp.number}>
              <strong>CP{cp.number}</strong>{' '}
              {passCounts[cp.number] ?? 0}/{total}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RaceCourseMap;
