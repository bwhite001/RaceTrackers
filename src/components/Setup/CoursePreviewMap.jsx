import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Numbered circle marker using SVG divIcon — avoids Vite asset resolution issues with default icons
const makeCheckpointIcon = (number) =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#1e40af;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(
        [[bounds.south, bounds.west], [bounds.north, bounds.east]],
        { padding: [20, 20] }
      );
    }
  }, [bounds, map]);
  return null;
};

/**
 * Lazy-loaded mini-map preview shown in the Course Map wizard step after GPX import.
 */
const CoursePreviewMap = ({ trackPoints, bounds, checkpoints, coords }) => (
  <div
    className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
    style={{ height: 280 }}
  >
    <MapContainer style={{ height: '100%', width: '100%' }} center={[0, 0]} zoom={2}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds bounds={bounds} />
      <Polyline positions={trackPoints} color="#1e40af" weight={3} />
      {coords
        .filter(c => c.latitude !== '' && c.longitude !== '')
        .map(c => (
          <Marker
            key={c.number}
            position={[parseFloat(c.latitude), parseFloat(c.longitude)]}
            icon={makeCheckpointIcon(c.number)}
          >
            <Popup>
              {checkpoints.find(cp => cp.number === c.number)?.name ?? `CP ${c.number}`}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  </div>
);

export default CoursePreviewMap;
