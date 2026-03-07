import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CourseMapStep from '../../src/components/Setup/CourseMapStep';

const checkpoints = [
  { number: 1, name: 'Ridge Top' },
  { number: 2, name: 'Valley Crossing' },
];

describe('CourseMapStep', () => {
  it('renders three input tabs', () => {
    render(<CourseMapStep checkpoints={checkpoints} onComplete={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /upload gpx/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /gpx url/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /manual/i })).toBeInTheDocument();
  });

  it('calls onSkip when Skip button is clicked', () => {
    const onSkip = vi.fn();
    render(<CourseMapStep checkpoints={checkpoints} onComplete={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalled();
  });

  it('shows manual lat/lng inputs for each checkpoint on Manual tab', () => {
    render(<CourseMapStep checkpoints={checkpoints} onComplete={vi.fn()} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /manual/i }));
    expect(screen.getByLabelText(/ridge top.*lat/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valley crossing.*lat/i)).toBeInTheDocument();
  });

  it('calls onComplete with GPS data when manual coords are saved', async () => {
    const onComplete = vi.fn();
    render(<CourseMapStep checkpoints={checkpoints} onComplete={onComplete} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /manual/i }));
    fireEvent.change(screen.getByLabelText(/ridge top.*lat/i), { target: { value: '-27.1' } });
    fireEvent.change(screen.getByLabelText(/ridge top.*lng/i), { target: { value: '153.1' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      checkpointCoordinates: expect.arrayContaining([
        expect.objectContaining({ number: 1, latitude: -27.1, longitude: 153.1 }),
      ]),
    }));
  });

  it('shows CORS warning when GPX URL tab is active', () => {
    render(<CourseMapStep checkpoints={checkpoints} onComplete={vi.fn()} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /gpx url/i }));
    expect(screen.getByText(/cors/i)).toBeInTheDocument();
  });
});
