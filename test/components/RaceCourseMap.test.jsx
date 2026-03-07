import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RaceCourseMap from '../../src/modules/base-operations/components/RaceCourseMap';
import { RUNNER_STATUSES } from '../../src/types';

const checkpoints = [
  { number: 1, name: 'Ridge Top', latitude: -27.1, longitude: 153.1 },
  { number: 2, name: 'Valley Crossing', latitude: -27.2, longitude: 153.2 },
];

const gpx = `<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="-27.05" lon="153.05"/>
    <trkpt lat="-27.1" lon="153.1"/>
    <trkpt lat="-27.2" lon="153.2"/>
  </trkseg></trk>
</gpx>`;

const runners = [
  // 8 runners passed CP1
  ...Array.from({ length: 8 }, (_, i) => ({
    number: i + 1, checkpointNumber: 1, status: RUNNER_STATUSES.PASSED,
  })),
  // 3 runners passed CP2
  ...Array.from({ length: 3 }, (_, i) => ({
    number: i + 1, checkpointNumber: 2, status: RUNNER_STATUSES.PASSED,
  })),
];
const total = 10;

describe('RaceCourseMap', () => {
  it('renders nothing when no GPX and no checkpoint coordinates', () => {
    const { container } = render(
      <RaceCourseMap courseGpx={null} checkpoints={[{ number: 1, name: 'CP1' }]} runners={[]} total={10} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the map container when courseGpx is provided', () => {
    render(<RaceCourseMap courseGpx={gpx} checkpoints={checkpoints} runners={runners} total={total} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('shows checkpoint markers in the map', () => {
    render(<RaceCourseMap courseGpx={gpx} checkpoints={checkpoints} runners={runners} total={total} />);
    expect(screen.getAllByTestId('marker')).toHaveLength(checkpoints.length);
  });

  it('is collapsible — clicking collapse hides the map', () => {
    render(<RaceCourseMap courseGpx={gpx} checkpoints={checkpoints} runners={runners} total={total} />);
    fireEvent.click(screen.getByRole('button', { name: /collapse/i }));
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
  });

  it('shows correct pass counts per checkpoint', () => {
    render(<RaceCourseMap courseGpx={gpx} checkpoints={checkpoints} runners={runners} total={total} />);
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });
});
