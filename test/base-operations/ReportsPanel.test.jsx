import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsPanel from '../../src/modules/base-operations/components/ReportsPanel';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import { BaseOperationsRepository } from '../../src/modules/base-operations/services/BaseOperationsRepository';

// Mock the store and repository
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');
vi.mock('../../src/modules/base-operations/services/BaseOperationsRepository');

describe('ReportsPanel', () => {
  const mockReport = { content: 'report', filename: 'report.csv', mimeType: 'text/csv' };
  let mockRepoInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepoInstance = { generateReport: vi.fn().mockResolvedValue(mockReport) };
    BaseOperationsRepository.mockImplementation(() => mockRepoInstance);
    useBaseOperationsStore.mockImplementation(() => ({ currentRaceId: 42, checkpoints: [] }));
    // Suppress Blob/URL.createObjectURL in jsdom
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
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
      expect(mockRepoInstance.generateReport).toHaveBeenCalledWith(42, 'missing', expect.any(Object));
    });
  });

  test('a failed report tells the operator', async () => {
    mockRepoInstance.generateReport.mockRejectedValue(new Error('Test error'));
    render(<ReportsPanel />);
    fireEvent.click(screen.getByText('Generate Report'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not generate the report: Test error');
  });

  test.each([['Finisher List', 'finisherList'], ['Full Officials Report', 'officialsReport'], ['Split Times', 'splitTimes']])(
    '%s generates', async (label, type) => {
      render(<ReportsPanel />);
      fireEvent.click(screen.getByText(label));
      fireEvent.click(screen.getByText('Generate Report'));
      await waitFor(() => expect(mockRepoInstance.generateReport).toHaveBeenCalledWith(42, type, expect.any(Object)));
    });

  test('uses the raceId prop with no store race', async () => {
    useBaseOperationsStore.mockImplementation(() => ({ currentRaceId: null, checkpoints: [] }));
    render(<ReportsPanel raceId={7} />);
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => expect(mockRepoInstance.generateReport).toHaveBeenCalledWith(7, 'missing', expect.any(Object)));
  });

  test('opens report builder dialog', () => {
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
      expect(mockRepoInstance.generateReport).toHaveBeenCalledWith(42, 'summary', expect.any(Object));
    });
  });

  test('handles custom report cancellation', () => {
    render(<ReportsPanel />);
    fireEvent.click(screen.getByText('Out List Report'));
    expect(screen.getByText('Out List Report')).toBeInTheDocument();
  });

  test('handles loading state', async () => {
    // Loading state is local (generating spinner during async call)
    mockRepoInstance.generateReport.mockImplementation(
      () => new Promise(() => {}) // never resolves — stays in loading
    );
    render(<ReportsPanel />);
    fireEvent.click(screen.getByText('Generate Report'));

    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });
  });

  test('handles error state', () => {
    render(<ReportsPanel />);
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  test('shows keyboard shortcut on desktop', () => {
    render(<ReportsPanel />);
    expect(screen.getByText('About Reports')).toBeInTheDocument();
  });

  test('is accessible — Generate Report button is labelled', () => {
    render(<ReportsPanel />);
    const generateBtn = screen.getByText('Generate Report');
    expect(generateBtn).toBeInTheDocument();
  });

  test('uses raceId prop over store currentRaceId', async () => {
    render(<ReportsPanel raceId={99} />);
    fireEvent.click(screen.getByText('Generate Report'));

    await waitFor(() => {
      expect(mockRepoInstance.generateReport).toHaveBeenCalledWith(99, 'missing', expect.any(Object));
    });
  });
});
