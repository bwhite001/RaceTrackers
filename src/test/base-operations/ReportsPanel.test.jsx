import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ReportsPanel from '../../modules/base-operations/components/ReportsPanel';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';

// Mock the store
vi.mock('../../modules/base-operations/store/baseOperationsStore');

describe('ReportsPanel', () => {
  const mockGenerateReport = vi.fn();
  const mockDownloadReport = vi.fn();
  const mockPreviewReport = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      generateReport: mockGenerateReport,
      downloadReport: mockDownloadReport,
      previewReport: mockPreviewReport,
      loading: false
    }));
  });

  it('renders correctly', () => {
    render(<ReportsPanel />);

    expect(screen.getByText('Generate Reports')).toBeInTheDocument();
    expect(screen.getByText(/Create and export race reports/i)).toBeInTheDocument();
  });

  it('shows all report types', () => {
    render(<ReportsPanel />);

    expect(screen.getByText('Missing Numbers Report')).toBeInTheDocument();
    expect(screen.getByText('Out List Report')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Log Report')).toBeInTheDocument();
    expect(screen.getByText('Race Summary Report')).toBeInTheDocument();
  });

  it('shows all export formats', () => {
    render(<ReportsPanel />);

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
  });

  it('handles report type selection', () => {
    render(<ReportsPanel />);

    // Select missing numbers report
    fireEvent.click(screen.getByText('Missing Numbers Report'));
    expect(screen.getByText(/List of runners who haven't checked in/i)).toBeInTheDocument();
  });

  it('handles export format selection', () => {
    render(<ReportsPanel />);

    // Select Excel format
    fireEvent.click(screen.getByText('Excel'));
    expect(screen.getByText(/Microsoft Excel format with formatting/i)).toBeInTheDocument();
  });

  it('generates report with selected options', async () => {
    render(<ReportsPanel />);

    // Select report type and format
    fireEvent.click(screen.getByText('Missing Numbers Report'));
    fireEvent.click(screen.getByText('Excel'));

    // Fill in options
    fireEvent.change(screen.getByLabelText(/Checkpoint/i), {
      target: { value: '2' }
    });

    fireEvent.change(screen.getByLabelText(/Time Range/i), {
      target: { value: '3h' }
    });

    // Generate report
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Report'));
    });

    expect(mockGenerateReport).toHaveBeenCalledWith('missing', {
      format: 'excel',
      checkpoint: 2,
      timeRange: '3h',
      includeNotes: true
    });
  });

  it('handles preview mode', async () => {
    render(<ReportsPanel />);

    // Enable preview
    fireEvent.click(screen.getByLabelText(/Show preview before download/i));

    // Select report and generate
    fireEvent.click(screen.getByText('Missing Numbers Report'));
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Report'));
    });

    expect(mockPreviewReport).toHaveBeenCalled();
  });

  it('shows loading state during generation', async () => {
    // Mock generate to take some time
    mockGenerateReport.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ReportsPanel />);

    // Start report generation
    fireEvent.click(screen.getByText('Generate Report'));

    // Should show loading state
    expect(await screen.findByText('Generating...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });

  it('handles generation errors', async () => {
    mockGenerateReport.mockRejectedValue(new Error('Generation failed'));

    render(<ReportsPanel />);

    // Try to generate report
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Report'));
    });

    expect(screen.getByText('Generation failed')).toBeInTheDocument();
  });

  it('validates required options', async () => {
    render(<ReportsPanel />);

    // Try to generate without selecting report type
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Report'));
    });

    expect(screen.getByText('Please select a report type')).toBeInTheDocument();
    expect(mockGenerateReport).not.toHaveBeenCalled();
  });

  it('shows report-specific options', () => {
    render(<ReportsPanel />);

    // Select checkpoint log report
    fireEvent.click(screen.getByText('Checkpoint Log Report'));

    // Should show checkpoint selection
    expect(screen.getByLabelText(/Checkpoint/i)).toBeInTheDocument();

    // Select out list report
    fireEvent.click(screen.getByText('Out List Report'));

    // Should show status filters
    expect(screen.getByLabelText(/Include Status/i)).toBeInTheDocument();
  });

  it('maintains options across report type changes', () => {
    render(<ReportsPanel />);

    // Set some options
    fireEvent.change(screen.getByLabelText(/Time Range/i), {
      target: { value: '3h' }
    });

    // Change report type
    fireEvent.click(screen.getByText('Out List Report'));
    fireEvent.click(screen.getByText('Missing Numbers Report'));

    // Options should be preserved
    expect(screen.getByLabelText(/Time Range/i)).toHaveValue('3h');
  });

  it('shows appropriate icons for report types', () => {
    render(<ReportsPanel />);

    // Check for report type icons
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(4); // One icon per report type
  });

  it('handles batch export', async () => {
    render(<ReportsPanel />);

    // Enable batch export
    fireEvent.click(screen.getByLabelText(/Export all report types/i));

    // Generate reports
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Reports'));
    });

    // Should have called generate for each report type
    expect(mockGenerateReport).toHaveBeenCalledTimes(4);
  });

  it('shows export format descriptions', () => {
    render(<ReportsPanel />);

    expect(screen.getByText(/Comma-separated values, best for spreadsheets/i)).toBeInTheDocument();
    expect(screen.getByText(/Microsoft Excel format with formatting/i)).toBeInTheDocument();
    expect(screen.getByText(/Web page format with styling/i)).toBeInTheDocument();
  });

  it('disables generation during loading', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      generateReport: mockGenerateReport,
      loading: true
    }));

    render(<ReportsPanel />);

    expect(screen.getByText('Generate Report')).toBeDisabled();
  });

  it('remembers last used options', () => {
    const { unmount } = render(<ReportsPanel />);

    // Set options
    fireEvent.click(screen.getByText('Missing Numbers Report'));
    fireEvent.click(screen.getByText('Excel'));
    fireEvent.change(screen.getByLabelText(/Time Range/i), {
      target: { value: '3h' }
    });

    // Unmount and remount
    unmount();
    render(<ReportsPanel />);

    // Options should be restored
    expect(screen.getByText('Missing Numbers Report')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Excel')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/Time Range/i)).toHaveValue('3h');
  });
});
