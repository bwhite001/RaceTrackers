import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportsPanel from '../../src/components/BaseStation/ReportsPanel';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import { REPORT_TYPES } from '../../src/utils/reportUtils';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

// Mock device detection hook
vi.mock('../../shared/hooks/useDeviceDetection', () => ({
  default: () => ({
    isDesktop: true
  })
}));

// Mock ReportBuilder component
vi.mock('../../components/BaseStation/ReportBuilder', () => ({
  default: ({ onGenerate, onCancel }) => (
    <div data-testid="report-builder">
      <button onClick={() => onGenerate({ name: 'Test Report' })}>Generate</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
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

  test('renders quick reports', () => {
    render(<ReportsPanel />);

    // Check report titles
    expect(screen.getByText('Missing Numbers Report')).toBeInTheDocument();
    expect(screen.getByText('Out List')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Log')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText(/List of expected runners/i)).toBeInTheDocument();
    expect(screen.getByText(/List of runners currently on the course/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed log of all checkpoint activity/i)).toBeInTheDocument();
  });

  test('handles quick report generation', async () => {
    render(<ReportsPanel />);

    // Generate missing numbers report
    const buttons = screen.getAllByText('Generate Report');
    fireEvent.click(buttons[0]); // First report is Missing Numbers

    expect(mockStore.generateMissingNumbersReport).toHaveBeenCalled();
    expect(buttons[0]).toBeDisabled();
    expect(screen.getByText('Generating...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });

  test('handles report generation errors', async () => {
    const error = new Error('Test error');
    mockStore.generateMissingNumbersReport.mockRejectedValue(error);

    render(<ReportsPanel />);

    // Try to generate report
    const buttons = screen.getAllByText('Generate Report');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  test('opens report builder dialog', async () => {
    render(<ReportsPanel />);

    // Click custom report button
    fireEvent.click(screen.getByText('Create Custom Report'));

    // Check dialog is open
    expect(screen.getByTestId('report-builder')).toBeInTheDocument();
  });

  test('handles custom report generation', async () => {
    render(<ReportsPanel />);

    // Open report builder
    fireEvent.click(screen.getByText('Create Custom Report'));

    // Generate report
    fireEvent.click(screen.getByText('Generate'));

    // Check store interaction
    expect(mockStore.exportBaseStationData).toHaveBeenCalledWith({
      name: 'Test Report'
    });

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByTestId('report-builder')).not.toBeInTheDocument();
    });
  });

  test('handles custom report cancellation', () => {
    render(<ReportsPanel />);

    // Open report builder
    fireEvent.click(screen.getByText('Create Custom Report'));

    // Cancel report creation
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should close
    expect(screen.queryByTestId('report-builder')).not.toBeInTheDocument();
  });

  test('handles loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    render(<ReportsPanel />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles error state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      error: 'Test error'
    }));

    render(<ReportsPanel />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  test('shows keyboard shortcut on desktop', () => {
    render(<ReportsPanel />);
    expect(screen.getByText(/Press R to quickly access/i)).toBeInTheDocument();
  });

  test('hides keyboard shortcut on mobile', () => {
    vi.mock('../../shared/hooks/useDeviceDetection', () => ({
      default: () => ({
        isDesktop: false
      })
    }));

    render(<ReportsPanel />);
    expect(screen.queryByText(/Press R to quickly access/i)).not.toBeInTheDocument();
  });

  test('is accessible', () => {
    render(<ReportsPanel />);

    // Check headings
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
});
