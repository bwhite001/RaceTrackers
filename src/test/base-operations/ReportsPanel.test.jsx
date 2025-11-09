import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsPanel from '../../components/BaseStation/ReportsPanel';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import { HOTKEYS } from '../../types';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

// Mock device detection hook
vi.mock('../../shared/hooks/useDeviceDetection', () => ({
  default: () => ({
    isDesktop: true
  })
}));

describe('ReportsPanel', () => {
  const mockStore = {
    generateMissingNumbersReport: vi.fn(),
    generateOutListReport: vi.fn(),
    generateCheckpointLogReport: vi.fn(),
    exportBaseStationData: vi.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
  });

  test('renders all report types', () => {
    render(<ReportsPanel />);

    // Check report titles
    expect(screen.getByText('Missing Numbers Report')).toBeInTheDocument();
    expect(screen.getByText('Out List')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Log')).toBeInTheDocument();
    expect(screen.getByText('Export All Data')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText(/List of expected runners who have not checked in/i)).toBeInTheDocument();
    expect(screen.getByText(/List of runners currently on the course/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed log of all checkpoint activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Export complete race data in CSV format/i)).toBeInTheDocument();
  });

  test('handles missing numbers report generation', async () => {
    render(<ReportsPanel />);

    const buttons = screen.getAllByText('Generate Report');
    const missingButton = buttons[0]; // First report is Missing Numbers

    fireEvent.click(missingButton);

    expect(mockStore.generateMissingNumbersReport).toHaveBeenCalled();
    expect(missingButton).toBeDisabled();
    expect(screen.getByText('Generating...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });

  test('handles out list report generation', async () => {
    render(<ReportsPanel />);

    const buttons = screen.getAllByText('Generate Report');
    const outListButton = buttons[1]; // Second report is Out List

    fireEvent.click(outListButton);

    expect(mockStore.generateOutListReport).toHaveBeenCalled();
    expect(outListButton).toBeDisabled();
  });

  test('handles checkpoint log report generation', async () => {
    render(<ReportsPanel />);

    const buttons = screen.getAllByText('Generate Report');
    const checkpointButton = buttons[2]; // Third report is Checkpoint Log

    fireEvent.click(checkpointButton);

    expect(mockStore.generateCheckpointLogReport).toHaveBeenCalled();
    expect(checkpointButton).toBeDisabled();
  });

  test('handles data export', async () => {
    render(<ReportsPanel />);

    const buttons = screen.getAllByText('Generate Report');
    const exportButton = buttons[3]; // Fourth report is Export All Data

    fireEvent.click(exportButton);

    expect(mockStore.exportBaseStationData).toHaveBeenCalled();
    expect(exportButton).toBeDisabled();
  });

  test('displays loading state during report generation', async () => {
    // Mock loading state
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    render(<ReportsPanel />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  test('displays error message when report generation fails', async () => {
    const error = 'Failed to generate report';
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      error
    }));

    render(<ReportsPanel />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('handles multiple report generations', async () => {
    render(<ReportsPanel />);

    const buttons = screen.getAllByText('Generate Report');

    // Generate missing numbers report
    fireEvent.click(buttons[0]);
    expect(mockStore.generateMissingNumbersReport).toHaveBeenCalled();

    // Generate out list report
    fireEvent.click(buttons[1]);
    expect(mockStore.generateOutListReport).toHaveBeenCalled();

    // Each button should be disabled only when its report is being generated
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeEnabled();
  });

  test('displays keyboard shortcut on desktop', () => {
    render(<ReportsPanel />);

    expect(screen.getByText(`Press ${HOTKEYS.REPORTS} to quickly access the reports panel`)).toBeInTheDocument();
  });

  test('hides keyboard shortcut on mobile', () => {
    // Mock mobile device
    vi.mock('../../shared/hooks/useDeviceDetection', () => ({
      default: () => ({
        isDesktop: false
      })
    }));

    render(<ReportsPanel />);

    expect(screen.queryByText(`Press ${HOTKEYS.REPORTS} to quickly access the reports panel`)).not.toBeInTheDocument();
  });

  test('is accessible', () => {
    render(<ReportsPanel />);

    // Check headings hierarchy
    expect(screen.getByRole('heading', { name: 'Reports & Exports' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About Reports' })).toBeInTheDocument();

    // Check buttons
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });

    // Check loading states
    const loadingButtons = screen.queryAllByText('Generating...');
    loadingButtons.forEach(button => {
      expect(button.closest('button')).toHaveAttribute('disabled');
    });
  });

  test('memoizes correctly', () => {
    const { rerender } = render(<ReportsPanel />);
    
    // First render
    const firstRender = screen.getAllByRole('button')[0].innerHTML;

    // Rerender with same props
    rerender(<ReportsPanel />);
    const secondRender = screen.getAllByRole('button')[0].innerHTML;

    // Should be exactly the same DOM
    expect(firstRender).toBe(secondRender);

    // Update store data
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    // Rerender with different data
    rerender(<ReportsPanel />);
    const thirdRender = screen.getAllByRole('button')[0].innerHTML;

    // Should be different DOM
    expect(thirdRender).not.toBe(secondRender);
  });
});
