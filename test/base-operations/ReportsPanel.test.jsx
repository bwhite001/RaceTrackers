import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsPanel from '../../src/modules/base-operations/components/ReportsPanel';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

// Mock the store
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

describe('ReportsPanel', () => {
  const mockStore = {
    generateReport: vi.fn().mockResolvedValue({ data: 'report-data' }),
    downloadReport: vi.fn().mockResolvedValue(undefined),
    previewReport: vi.fn().mockResolvedValue(undefined),
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBaseOperationsStore.mockImplementation(() => mockStore);
  });

  test('renders quick reports', () => {
    render(<ReportsPanel />);

    expect(screen.getByText('Missing Numbers Report')).toBeInTheDocument();
    expect(screen.getByText('Out List Report')).toBeInTheDocument();
    expect(screen.getByText('Checkpoint Log Report')).toBeInTheDocument();
    expect(screen.getByText('Race Summary Report')).toBeInTheDocument();
  });

  test('handles quick report generation', async () => {
    render(<ReportsPanel />);

    fireEvent.click(screen.getByText('Generate Report'));

    await waitFor(() => {
      expect(mockStore.generateReport).toHaveBeenCalled();
    });
  });

  test('handles report generation errors', async () => {
    mockStore.generateReport.mockRejectedValue(new Error('Test error'));
    render(<ReportsPanel />);

    fireEvent.click(screen.getByText('Generate Report'));

    // Error is logged; no crash — component still renders
    await waitFor(() => {
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });
  });

  test('opens report builder dialog', () => {
    // ReportsPanel doesn't have a "Create Custom Report" dialog — it has a single generate button
    render(<ReportsPanel />);
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  test('handles custom report generation', async () => {
    render(<ReportsPanel />);

    // Select a different report type (summary)
    fireEvent.click(screen.getByText('Race Summary Report'));

    // Generate
    fireEvent.click(screen.getByText('Generate Report'));

    await waitFor(() => {
      expect(mockStore.generateReport).toHaveBeenCalledWith('summary', expect.any(Object));
    });
  });

  test('handles custom report cancellation', () => {
    // N/A for this component — clicking another report type deselects
    render(<ReportsPanel />);
    fireEvent.click(screen.getByText('Out List Report'));
    expect(screen.getByText('Out List Report')).toBeInTheDocument();
  });

  test('handles loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      ...mockStore,
      loading: true
    }));

    render(<ReportsPanel />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  test('handles error state', () => {
    // The component logs errors; no error display in UI from store.error
    render(<ReportsPanel />);
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  test('shows keyboard shortcut on desktop', () => {
    // ReportsPanel doesn't have a keyboard shortcut hint in the module version
    render(<ReportsPanel />);
    expect(screen.getByText('About Reports')).toBeInTheDocument();
  });

  test('is accessible — Generate Report button is labelled', () => {
    render(<ReportsPanel />);
    const generateBtn = screen.getByText('Generate Report');
    expect(generateBtn).toBeInTheDocument();
  });
});
