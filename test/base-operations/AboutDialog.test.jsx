import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AboutDialog from '../../src/modules/base-operations/components/AboutDialog';

describe('AboutDialog', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('About RaceTracker Pro')).toBeInTheDocument();
    expect(screen.getByText(/Version \d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AboutDialog
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('About RaceTracker Pro')).not.toBeInTheDocument();
  });

  it('shows application information', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Application Information')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Build Date')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();
  });

  it('shows key features', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Base Station features
    expect(screen.getByText('Base Station Mode')).toBeInTheDocument();
    // List items include the bullet character "• " as part of the text node
    expect(screen.getByText('• Real-time runner tracking')).toBeInTheDocument();
    expect(screen.getByText('• Status management')).toBeInTheDocument();
    expect(screen.getByText('• Comprehensive reporting')).toBeInTheDocument();
    expect(screen.getByText('• Data backup & restore')).toBeInTheDocument();

    // Checkpoint features
    expect(screen.getByText('Checkpoint Mode')).toBeInTheDocument();
    expect(screen.getByText('• Quick data entry')).toBeInTheDocument();
    expect(screen.getByText('• Offline operation')).toBeInTheDocument();
    expect(screen.getByText('• Auto-sync when online')).toBeInTheDocument();
    expect(screen.getByText('• Resource management')).toBeInTheDocument();
  });

  it('shows credits section', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.getByText(/Built with ❤️/)).toBeInTheDocument();

    // Open source libraries
    expect(screen.getByText('Open Source Libraries')).toBeInTheDocument();
    // List items include the bullet character "• " as part of the text node
    expect(screen.getByText('• React - UI Framework')).toBeInTheDocument();
    expect(screen.getByText('• Zustand - State Management')).toBeInTheDocument();
    expect(screen.getByText('• Dexie.js - IndexedDB Wrapper')).toBeInTheDocument();
    expect(screen.getByText('• TailwindCSS - Styling')).toBeInTheDocument();
  });

  it('shows legal information', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} RaceTracker Pro/)).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    expect(screen.getByText(/Licensed under the MIT License/)).toBeInTheDocument();
    expect(screen.getByText(/This software is provided "as is"/)).toBeInTheDocument();
  });

  it('handles close button click', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles close button in footer', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows version information prominently', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const versionText = screen.getByText(/Version \d+\.\d+\.\d+/);
    expect(versionText).toHaveClass('text-sm', 'text-gray-500');
  });

  it('shows build date matching the hardcoded year', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // BUILD_DATE is hardcoded as '2024' in the component
    expect(screen.getAllByText('2024').length).toBeGreaterThanOrEqual(1);
  });

  it('shows MIT license details', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('MIT License')).toBeInTheDocument();
    expect(screen.getByText(/without warranty of any kind/i)).toBeInTheDocument();
  });

  it('shows development team information', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.getByText(/Built with ❤️ by the RaceTracker Pro team/)).toBeInTheDocument();
  });

  it('shows open source acknowledgments', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Open Source Libraries')).toBeInTheDocument();
    ['React', 'Zustand', 'Dexie.js', 'TailwindCSS'].forEach(library => {
      expect(screen.getByText(new RegExp(library))).toBeInTheDocument();
    });
  });

  it('has an accessible close button in the header', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // The header X button has aria-label="Close"
    expect(screen.getByLabelText('Close')).toHaveAttribute('aria-label', 'Close');
  });

  it('has a close button in the footer', () => {
    render(
      <AboutDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Footer close button has visible text "Close" but no aria-label
    // Both buttons are accessible: one via aria-label, one via text content
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
  });
});
