import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import HelpDialog from '../../modules/base-operations/components/HelpDialog';
import { useHotkeys } from '../../shared/components/HotkeysProvider';

// Mock the hotkeys hook
jest.mock('../../shared/components/HotkeysProvider');

describe('HelpDialog', () => {
  const mockOnClose = jest.fn();
  const mockHotkeys = {
    'alt+a': {
      handler: jest.fn(),
      description: 'Add checkpoint',
      category: 'navigation'
    },
    'alt+b': {
      handler: jest.fn(),
      description: 'Add number',
      category: 'dataEntry'
    },
    'alt+s': {
      handler: jest.fn(),
      description: 'Sort entries',
      category: 'sorting'
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock hotkeys hook implementation
    useHotkeys.mockImplementation(() => ({
      hotkeys: mockHotkeys
    }));
  });

  it('renders correctly when open', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Help & Documentation')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <HelpDialog
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Help & Documentation')).not.toBeInTheDocument();
  });

  it('shows all help sections', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Quick Start')).toBeInTheDocument();
    expect(screen.getByText('Data Entry')).toBeInTheDocument();
    expect(screen.getByText('Runner Status')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Backup & Restore')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
  });

  it('switches between sections', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
        initialSection="quickStart"
      />
    );

    // Click Data Entry section
    fireEvent.click(screen.getByText('Data Entry'));
    expect(screen.getByText('Single Entry')).toBeInTheDocument();

    // Click Reports section
    fireEvent.click(screen.getByText('Reports'));
    expect(screen.getByText('Available Reports')).toBeInTheDocument();
  });

  it('shows keyboard shortcuts for each section', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Navigation shortcuts
    fireEvent.click(screen.getByText('Quick Start'));
    expect(screen.getByText('Add checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Alt + A')).toBeInTheDocument();

    // Data entry shortcuts
    fireEvent.click(screen.getByText('Data Entry'));
    expect(screen.getByText('Add number')).toBeInTheDocument();
    expect(screen.getByText('Alt + B')).toBeInTheDocument();
  });

  it('groups hotkeys by category', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Navigation category
    const navigationSection = screen.getByText('Navigation').closest('div');
    expect(navigationSection).toHaveTextContent('Add checkpoint');

    // Data Entry category
    const dataEntrySection = screen.getByText('Data Entry').closest('div');
    expect(dataEntrySection).toHaveTextContent('Add number');
  });

  it('handles close button click', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows section descriptions', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Quick Start section
    fireEvent.click(screen.getByText('Quick Start'));
    expect(screen.getByText(/Select your operation mode/i)).toBeInTheDocument();

    // Data Entry section
    fireEvent.click(screen.getByText('Data Entry'));
    expect(screen.getByText(/Single Entry/i)).toBeInTheDocument();
    expect(screen.getByText(/Bulk Entry/i)).toBeInTheDocument();
  });

  it('shows appropriate icons for each section', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Check for section icons
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(6); // One icon per section
  });

  it('highlights active section', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Click Data Entry section
    fireEvent.click(screen.getByText('Data Entry'));

    // Data Entry should be highlighted
    const dataEntryButton = screen.getByText('Data Entry').closest('button');
    expect(dataEntryButton).toHaveClass('bg-primary-50');
  });

  it('preserves section selection across re-renders', () => {
    const { rerender } = render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Select Data Entry section
    fireEvent.click(screen.getByText('Data Entry'));

    // Re-render
    rerender(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Data Entry section should still be selected
    expect(screen.getByText('Single Entry')).toBeInTheDocument();
  });

  it('shows keyboard shortcut for closing help', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Press Alt \+ H to open help anytime/i)).toBeInTheDocument();
  });

  it('shows troubleshooting steps', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Go to troubleshooting section
    fireEvent.click(screen.getByText('Troubleshooting'));

    expect(screen.getByText('Common Issues')).toBeInTheDocument();
    expect(screen.getByText('Recovery Steps')).toBeInTheDocument();
  });

  it('shows backup and restore instructions', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Go to backup section
    fireEvent.click(screen.getByText('Backup & Restore'));

    expect(screen.getByText('Backup Types')).toBeInTheDocument();
    expect(screen.getByText('Best Practices')).toBeInTheDocument();
  });

  it('shows reports documentation', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Go to reports section
    fireEvent.click(screen.getByText('Reports'));

    expect(screen.getByText('Available Reports')).toBeInTheDocument();
    expect(screen.getByText('Export Options')).toBeInTheDocument();
  });

  it('shows runner status management help', () => {
    render(
      <HelpDialog
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Go to runner status section
    fireEvent.click(screen.getByText('Runner Status'));

    expect(screen.getByText('Status Types')).toBeInTheDocument();
    expect(screen.getByText('Changing Status')).toBeInTheDocument();
  });
});
