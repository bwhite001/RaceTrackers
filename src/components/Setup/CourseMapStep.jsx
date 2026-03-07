import React, { useState, useCallback, Suspense, lazy } from 'react';
import { parseGpx } from '../../services/gpxUtils';

const CoursePreviewMap = lazy(() => import('./CoursePreviewMap'));

const TABS = ['Upload GPX', 'GPX URL', 'Manual'];

/**
 * Step 5 of the race setup wizard — optional course GPS data entry.
 */
const CourseMapStep = ({ checkpoints, onComplete, onSkip, initialData = null }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [gpxResult, setGpxResult] = useState(
    initialData?.courseGpx ? parseGpx(initialData.courseGpx) : null
  );
  const [rawGpx, setRawGpx] = useState(initialData?.courseGpx ?? null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [coords, setCoords] = useState(() =>
    checkpoints.map(cp => ({
      number: cp.number,
      latitude: initialData?.checkpoints?.find(c => c.number === cp.number)?.latitude ?? '',
      longitude: initialData?.checkpoints?.find(c => c.number === cp.number)?.longitude ?? '',
    }))
  );

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseGpx(text);
      if (parsed) {
        setRawGpx(text);
        setGpxResult(parsed);
        // Auto-populate coordinates from waypoints if names match
        setCoords(prev => prev.map(cp => {
          const cpName = checkpoints.find(c => c.number === cp.number)?.name?.toLowerCase() ?? '';
          const match = parsed.waypoints.find(w => w.name.toLowerCase().includes(cpName));
          return match ? { ...cp, latitude: match.lat, longitude: match.lng } : cp;
        }));
      }
    };
    reader.readAsText(file);
  }, [checkpoints]);

  const handleFetchUrl = useCallback(async () => {
    setUrlError(null);
    setUrlLoading(true);
    try {
      const res = await fetch(urlInput);
      const text = await res.text();
      const parsed = parseGpx(text);
      if (parsed) {
        setRawGpx(text);
        setGpxResult(parsed);
      } else {
        setUrlError('Could not parse GPX from that URL.');
      }
    } catch {
      setUrlError('Fetch failed — the server may block cross-origin (CORS) requests. Download the GPX file manually and use the Upload tab instead.');
    } finally {
      setUrlLoading(false);
    }
  }, [urlInput]);

  const handleSave = useCallback(() => {
    const checkpointCoordinates = coords
      .filter(c => c.latitude !== '' && c.longitude !== '')
      .map(c => ({ number: c.number, latitude: parseFloat(c.latitude), longitude: parseFloat(c.longitude) }));
    onComplete({
      courseGpx: rawGpx ?? null,
      courseBounds: gpxResult?.bounds ?? null,
      checkpointCoordinates,
    });
  }, [coords, rawGpx, gpxResult, onComplete]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Course Map <span className="text-sm font-normal text-gray-400">(Optional)</span>
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Import a GPX file to show the course on the base station overview map. You can skip this and add it later.
        </p>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map((label, i) => (
          <button
            key={label}
            role="tab"
            aria-selected={activeTab === i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i
                ? 'border-navy-600 text-navy-700 dark:text-navy-300 dark:border-navy-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <label className="block cursor-pointer">
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-navy-400">
              <div className="space-y-1 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag &amp; drop a <strong>.gpx</strong> file here, or click to browse
                </p>
                <input type="file" accept=".gpx" className="sr-only" onChange={handleFileUpload} />
              </div>
            </div>
          </label>
          {gpxResult && (
            <p className="text-sm text-green-700 dark:text-green-400">
              ✓ GPX loaded — {gpxResult.trackPoints.length} track points, {gpxResult.waypoints.length} waypoints
            </p>
          )}
        </div>
      )}

      {/* URL tab */}
      {activeTab === 1 && (
        <div className="space-y-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
            ⚠ CORS note: Most AllTrails, Strava, and Garmin URLs block cross-origin requests.
            If this fails, download the GPX manually and use the Upload tab.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleFetchUrl}
              disabled={!urlInput || urlLoading}
              className="px-4 py-2 text-sm bg-navy-600 text-white rounded disabled:opacity-50"
            >
              {urlLoading ? 'Fetching…' : 'Fetch'}
            </button>
          </div>
          {urlError && <p className="text-sm text-red-600 dark:text-red-400">{urlError}</p>}
        </div>
      )}

      {/* Manual coordinates tab */}
      {activeTab === 2 && (
        <div className="space-y-3">
          {checkpoints.map((cp, i) => (
            <div key={cp.number} className="flex items-center gap-3">
              <span className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{cp.name}</span>
              <label className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Lat</span>
                <input
                  aria-label={`${cp.name} Lat`}
                  type="number"
                  step="any"
                  value={coords[i].latitude}
                  onChange={e => setCoords(prev => prev.map((c, j) => j === i ? { ...c, latitude: e.target.value } : c))}
                  className="w-28 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Lng</span>
                <input
                  aria-label={`${cp.name} Lng`}
                  type="number"
                  step="any"
                  value={coords[i].longitude}
                  onChange={e => setCoords(prev => prev.map((c, j) => j === i ? { ...c, longitude: e.target.value } : c))}
                  className="w-28 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Mini map preview (shown when GPX loaded) */}
      {gpxResult && gpxResult.trackPoints.length > 0 && (
        <Suspense fallback={<div className="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
          <CoursePreviewMap
            trackPoints={gpxResult.trackPoints}
            waypoints={gpxResult.waypoints}
            bounds={gpxResult.bounds}
            checkpoints={checkpoints}
            coords={coords}
          />
        </Suspense>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline"
        >
          Skip for now
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 text-sm bg-navy-600 text-white rounded hover:bg-navy-700"
        >
          Save &amp; Continue
        </button>
      </div>
    </div>
  );
};

export default CourseMapStep;
