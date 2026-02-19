import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportBuilder from '../../src/components/BaseStation/ReportBuilder';
import { REPORT_TYPES, REPORT_FORMATS, REPORT_TEMPLATES } from '../../src/utils/reportUtils';

describe('ReportBuilder', () => {
  const defaultProps = {
    onGenerate: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders form elements correctly', () => {
    render(<ReportBuilder {...defaultProps} />);

    // Check form elements
    expect(screen.getByLabelText(/Report Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Report Template/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Columns/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Format/i)).toBeInTheDocument();

    // Check buttons
    expect(screen.getByRole('button', { name: /Generate Report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  test('handles template selection', async () => {
    render(<ReportBuilder {...defaultProps} />);

    const templateSelect = screen.getByLabelText(/Report Template/i);

    // Select BASIC template (option value is the object key = 'BASIC')
    await userEvent.selectOptions(templateSelect, 'BASIC');

    // The template pre-selects columns — verify at least one checkbox is checked
    const checkboxes = screen.getAllByRole('checkbox');
    const checkedBoxes = checkboxes.filter(cb => cb.checked);
    expect(checkedBoxes.length).toBeGreaterThan(0);
  });

  test('handles column selection', async () => {
    render(<ReportBuilder {...defaultProps} />);
    
    // Select some columns
    const numberColumn = screen.getByLabelText(/Runner Number/i);
    const statusColumn = screen.getByLabelText(/Status/i);

    await userEvent.click(numberColumn);
    await userEvent.click(statusColumn);

    expect(numberColumn).toBeChecked();
    expect(statusColumn).toBeChecked();

    // Unselect a column
    await userEvent.click(numberColumn);
    expect(numberColumn).not.toBeChecked();
    expect(statusColumn).toBeChecked();
  });

  test('handles format selection', async () => {
    render(<ReportBuilder {...defaultProps} />);
    
    // Select different formats
    const csvFormat = screen.getByLabelText(/CSV/i);
    const jsonFormat = screen.getByLabelText(/JSON/i);

    await userEvent.click(jsonFormat);
    expect(jsonFormat).toBeChecked();
    expect(csvFormat).not.toBeChecked();
  });

  test('validates form before submission', async () => {
    render(<ReportBuilder {...defaultProps} />);
    
    // Try to submit without data
    const submitButton = screen.getByText(/Generate Report/i);
    fireEvent.click(submitButton);

    // Check validation messages
    expect(screen.getByText('Report name is required')).toBeInTheDocument();
    expect(screen.getByText('At least one column must be selected')).toBeInTheDocument();

    // Fill required fields
    await userEvent.type(screen.getByLabelText(/Report Name/i), 'Test Report');
    await userEvent.click(screen.getByLabelText(/Runner Number/i));

    // Submit again
    fireEvent.click(submitButton);
    expect(defaultProps.onGenerate).toHaveBeenCalled();
  });

  test('handles form submission with valid data', async () => {
    render(<ReportBuilder {...defaultProps} />);

    // Fill form
    await userEvent.type(screen.getByLabelText(/Report Name/i), 'Test Report');
    await userEvent.selectOptions(screen.getByLabelText(/Report Template/i), 'BASIC');
    await userEvent.click(screen.getByLabelText(/JSON/i));

    // Submit form
    fireEvent.click(screen.getByText(/Generate Report/i));

    // Check onGenerate call — template key is 'BASIC' (object key)
    expect(defaultProps.onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Report',
        template: 'BASIC',
        format: REPORT_FORMATS.JSON,
        columns: REPORT_TEMPLATES.BASIC.columns
      })
    );
  });

  test('handles cancel button', () => {
    render(<ReportBuilder {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  test('shows template description', async () => {
    render(<ReportBuilder {...defaultProps} />);

    // Select template — value is object key 'BASIC'
    await userEvent.selectOptions(
      screen.getByLabelText(/Report Template/i),
      'BASIC'
    );

    // Check description
    expect(screen.getByText(REPORT_TEMPLATES.BASIC.description)).toBeInTheDocument();
  });

  test('shows sortable indicator for columns', () => {
    render(<ReportBuilder {...defaultProps} />);
    
    // Find sortable columns
    const sortableLabels = screen.getAllByText('Sortable');
    expect(sortableLabels.length).toBeGreaterThan(0);
  });

  test('is accessible', () => {
    render(<ReportBuilder {...defaultProps} />);

    // Check form labels
    expect(screen.getByLabelText(/Report Name/i)).toHaveAttribute('id');
    expect(screen.getByLabelText(/Report Template/i)).toHaveAttribute('id');

    // Check radio inputs exist for format selection
    const radios = screen.getAllByRole('radio', { hidden: true });
    expect(radios.length).toBeGreaterThan(0);

    // Check checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });
  });

  test('maintains state between template changes', async () => {
    render(<ReportBuilder {...defaultProps} />);

    // Fill name
    const nameInput = screen.getByLabelText(/Report Name/i);
    await userEvent.type(nameInput, 'Test Report');

    // Change template — use object key 'BASIC'
    await userEvent.selectOptions(
      screen.getByLabelText(/Report Template/i),
      'BASIC'
    );

    // Name should persist
    expect(nameInput.value).toBe('Test Report');
  });

  test('resets validation errors on input change', async () => {
    render(<ReportBuilder {...defaultProps} />);
    
    // Trigger validation error
    fireEvent.click(screen.getByText(/Generate Report/i));
    expect(screen.getByText('Report name is required')).toBeInTheDocument();

    // Type in name field
    await userEvent.type(screen.getByLabelText(/Report Name/i), 'Test');
    expect(screen.queryByText('Report name is required')).not.toBeInTheDocument();
  });
});
