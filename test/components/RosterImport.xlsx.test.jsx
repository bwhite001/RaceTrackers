import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RosterImport from '../../src/modules/race-maintenance/components/RosterImport.jsx';

// Mock the repository
vi.mock('../../src/modules/race-maintenance/services/RaceMaintenanceRepository', () => ({
  default: {
    bulkUpsertRunnerDetails: vi.fn().mockResolvedValue({ updated: 2, created: 0, errors: 0 }),
  },
}));

// Mock xlsxImport to avoid bundling SheetJS in jsdom
vi.mock('../../src/utils/xlsxImport', () => ({
  FIELD_OPTIONS: [
    { value: 'number',      label: 'Bib # (required)' },
    { value: 'firstName',   label: 'First Name' },
    { value: 'lastName',    label: 'Last Name' },
    { value: 'gender',      label: 'Gender' },
    { value: 'batchNumber', label: 'Wave / Batch' },
    { value: 'ignore',      label: '— ignore —' },
  ],
  parseXlsxFile: vi.fn().mockResolvedValue({
    headers: ['Bib Numbers', 'First Name', 'Last Name', 'Sex'],
    rows: [
      { 'Bib Numbers': '101', 'First Name': 'Alice', 'Last Name': 'Smith', 'Sex': 'F' },
      { 'Bib Numbers': '102', 'First Name': 'Bob',   'Last Name': 'Jones', 'Sex': 'M' },
    ],
  }),
  detectColumnMappings: vi.fn().mockReturnValue({
    mappings: { 'Bib Numbers': 'number', 'First Name': 'firstName', 'Last Name': 'lastName', 'Sex': 'gender' },
    autoDetected: new Set(['Bib Numbers', 'First Name', 'Last Name', 'Sex']),
  }),
  applyMappingsToRows: vi.fn().mockReturnValue({
    valid: [
      { number: 101, firstName: 'Alice', lastName: 'Smith', gender: 'F', batchNumber: 1 },
      { number: 102, firstName: 'Bob',   lastName: 'Jones', gender: 'M', batchNumber: 1 },
    ],
    errors: [],
  }),
}));

describe('RosterImport — xlsx flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders file picker and dev picker in idle state', () => {
    render(<RosterImport raceId={3} />);
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByText('Dev only')).toBeInTheDocument();
  });

  it('enters map step after xlsx file is selected', async () => {
    render(<RosterImport raceId={3} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument());
    expect(screen.getByText('Bib Numbers')).toBeInTheDocument();
  });

  it('Next: Preview button is disabled when no number column is mapped', async () => {
    const { detectColumnMappings } = await import('../../src/utils/xlsxImport');
    detectColumnMappings.mockReturnValueOnce({
      mappings: { 'Col A': 'ignore' },
      autoDetected: new Set(),
    });

    render(<RosterImport raceId={3} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => screen.getByText(/Step 1 of 2/i));
    expect(screen.getByText('Next: Preview →')).toBeDisabled();
  });

  it('advances to preview step when Next is clicked', async () => {
    render(<RosterImport raceId={3} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => screen.getByText('Next: Preview →'));
    fireEvent.click(screen.getByText('Next: Preview →'));

    await waitFor(() => expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument());
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('Back to mapping returns to map step', async () => {
    render(<RosterImport raceId={3} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => screen.getByText('Next: Preview →'));
    fireEvent.click(screen.getByText('Next: Preview →'));
    await waitFor(() => screen.getByText('← Back to mapping'));
    fireEvent.click(screen.getByText('← Back to mapping'));

    await waitFor(() => expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument());
  });

  it('completes import and shows success message', async () => {
    const RaceMaintenanceRepository = (await import('../../src/modules/race-maintenance/services/RaceMaintenanceRepository')).default;

    render(<RosterImport raceId={3} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => screen.getByText('Next: Preview →'));
    fireEvent.click(screen.getByText('Next: Preview →'));
    await waitFor(() => screen.getByText(/Import 2 Runners/i));
    fireEvent.click(screen.getByText(/Import 2 Runners/i));

    await waitFor(() => expect(screen.getByText(/Import complete/i)).toBeInTheDocument());
    expect(RaceMaintenanceRepository.bulkUpsertRunnerDetails).toHaveBeenCalledWith(3, expect.any(Array));
  });
});
