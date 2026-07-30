/**
 * M-1 / #5: Setup wizard step indicator legibility
 *
 * Labels for steps not yet reached used text-gray-500 / dark:text-gray-400,
 * which is too faint to read as "upcoming step" rather than "disabled".
 * They must use a higher-contrast gray while staying visually subordinate to
 * the current step (navy) and completed steps (green).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StepIndicator from '../../src/components/Setup/StepIndicator';

const STEPS = [
  { number: 1, label: 'Race Details', description: 'Name, date and checkpoints' },
  { number: 2, label: 'Runner Ranges', description: 'Bib number ranges' },
  { number: 3, label: 'Waves', description: 'Batch start times' },
];

const labelFor = (text) => screen.getByText(text);

describe('M-1 / #5: StepIndicator contrast', () => {
  it('upcoming step labels use the higher-contrast gray', () => {
    render(<StepIndicator steps={STEPS} currentStep={0} />);

    const upcoming = labelFor('Runner Ranges');
    expect(upcoming.className).toContain('text-gray-600');
    expect(upcoming.className).toContain('dark:text-gray-300');
    // The faint pairing must be gone
    expect(upcoming.className).not.toContain('text-gray-500');
    expect(upcoming.className).not.toContain('dark:text-gray-400');
  });

  it('keeps the current step visually dominant', () => {
    render(<StepIndicator steps={STEPS} currentStep={1} />);

    expect(labelFor('Runner Ranges').className).toContain('text-navy-900');
  });

  it('keeps completed steps green', () => {
    render(<StepIndicator steps={STEPS} currentStep={2} />);

    expect(labelFor('Race Details').className).toContain('text-green-700');
  });

  it('renders every step label and description', () => {
    render(<StepIndicator steps={STEPS} currentStep={0} />);

    STEPS.forEach(s => {
      expect(screen.getByText(s.label)).toBeInTheDocument();
      expect(screen.getByText(s.description)).toBeInTheDocument();
    });
  });
});
