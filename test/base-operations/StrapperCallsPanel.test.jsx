import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import StrapperCallsPanel from '../../src/modules/base-operations/components/StrapperCallsPanel';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../src/services/timeUtils';

// Mock the store and TimeUtils
vi.mock('../../src/modules/base-operations/store/baseOperationsStore');
vi.mock('../../src/services/timeUtils');

describe('StrapperCallsPanel', () => {
  const mockLoadStrapperCalls = vi.fn();
  const mockAddStrapperCall = vi.fn();
  const mockUpdateStrapperCall = vi.fn();
  const mockCompleteStrapperCall = vi.fn();
  const mockDeleteStrapperCall = vi.fn();

  const mockStrapperCalls = [
    {
      id: 1,
      checkpoint: 1,
      priority: 'urgent',
      description: 'Medical assistance needed',
      status: 'pending',
      createdAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      checkpoint: 2,
      priority: 'high',
      description: 'Water resupply required',
      status: 'in-progress',
      createdAt: '2024-01-01T10:30:00Z'
    },
    {
      id: 3,
      checkpoint: 1,
      priority: 'medium',
      description: 'Additional volunteers needed',
      status: 'completed',
      createdAt: '2024-01-01T09:00:00Z',
      completedAt: '2024-01-01T09:30:00Z'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock store implementation
    useBaseOperationsStore.mockImplementation(() => ({
      strapperCalls: mockStrapperCalls,
      loadStrapperCalls: mockLoadStrapperCalls,
      addStrapperCall: mockAddStrapperCall,
      updateStrapperCall: mockUpdateStrapperCall,
      completeStrapperCall: mockCompleteStrapperCall,
      deleteStrapperCall: mockDeleteStrapperCall,
      loading: false
    }));

    // Mock TimeUtils
    TimeUtils.formatTime.mockImplementation(time => new Date(time).toLocaleString());
  });

  it('renders correctly', () => {
    render(<StrapperCallsPanel />);

    expect(screen.getByText('Strapper Calls')).toBeInTheDocument();
    expect(screen.getByText(/Resource requests from checkpoints/i)).toBeInTheDocument();
    expect(mockLoadStrapperCalls).toHaveBeenCalled();
  });

  it('shows status summary cards', () => {
    render(<StrapperCallsPanel />);

    // The status summary grid uses bg-*-50 card divs. The counts are rendered as
    // <p class="text-2xl font-bold ...">N</p> directly inside each card.
    // Scope to each card by finding the card via the bold count element's sibling label.
    // Strategy: find each card's container via closest() on the status label element,
    // using a class that is unique to the summary section (not the table badges).
    // The summary cards use "text-2xl font-bold" for the count; table badges do not.
    const countElements = document.querySelectorAll('p.text-2xl.font-bold');

    // There should be 4 summary cards: pending, in-progress, completed, cancelled
    expect(countElements.length).toBe(4);

    // With mock data: 1 pending, 1 in-progress, 1 completed, 0 cancelled
    // Cards are rendered in order: Pending, In Progress, Completed, Cancelled
    expect(countElements[0].textContent).toBe('1'); // pending
    expect(countElements[1].textContent).toBe('1'); // in-progress
    expect(countElements[2].textContent).toBe('1'); // completed
    expect(countElements[3].textContent).toBe('0'); // cancelled
  });

  it('handles new call creation', async () => {
    render(<StrapperCallsPanel />);

    // Open new call modal
    fireEvent.click(screen.getByText('New Call'));

    // Fill form — labels are associated via htmlFor/id in AddStrapperCallModal
    fireEvent.change(screen.getByLabelText(/Checkpoint/i), {
      target: { value: '2' }
    });

    fireEvent.change(screen.getByLabelText(/Priority/i), {
      target: { value: 'high' }
    });

    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Test call' }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Call'));
    });

    expect(mockAddStrapperCall).toHaveBeenCalledWith(
      2,
      'high',
      'Test call'
    );
  });

  it('filters by checkpoint', () => {
    render(<StrapperCallsPanel />);

    // The checkpoint select has no aria-label; select it by its position among comboboxes
    const selects = screen.getAllByRole('combobox');
    const checkpointSelect = selects[0]; // First select is checkpoint filter

    // Filter to checkpoint 1
    fireEvent.change(checkpointSelect, {
      target: { value: '1' }
    });

    // Should show only checkpoint 1 calls
    expect(screen.getByText('Medical assistance needed')).toBeInTheDocument();
    expect(screen.getByText('Additional volunteers needed')).toBeInTheDocument();
    expect(screen.queryByText('Water resupply required')).not.toBeInTheDocument();
  });

  it('filters by status', () => {
    render(<StrapperCallsPanel />);

    // The status select has no aria-label; select it by its position among comboboxes
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[1]; // Second select is status filter

    // Filter to pending status
    fireEvent.change(statusSelect, {
      target: { value: 'pending' }
    });

    // Should show only pending calls
    expect(screen.getByText('Medical assistance needed')).toBeInTheDocument();
    expect(screen.queryByText('Water resupply required')).not.toBeInTheDocument();
    expect(screen.queryByText('Additional volunteers needed')).not.toBeInTheDocument();
  });

  it('handles call status updates', async () => {
    render(<StrapperCallsPanel />);

    // Start a pending call
    const startButton = screen.getByText('Start');
    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(mockUpdateStrapperCall).toHaveBeenCalledWith(1, { status: 'in-progress' });

    // Complete an in-progress call
    const completeButton = screen.getByText('Complete');
    await act(async () => {
      fireEvent.click(completeButton);
    });

    expect(mockCompleteStrapperCall).toHaveBeenCalledWith(2);
  });

  it('handles call deletion', async () => {
    render(<StrapperCallsPanel />);

    // Delete a call
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockDeleteStrapperCall).toHaveBeenCalledWith(1);
  });

  it('shows loading state', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      strapperCalls: [],
      loadStrapperCalls: mockLoadStrapperCalls,
      loading: true
    }));

    render(<StrapperCallsPanel />);

    // The loading spinner is a styled div with animate-spin class, no role="status"
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows empty state when no calls', () => {
    useBaseOperationsStore.mockImplementation(() => ({
      strapperCalls: [],
      loadStrapperCalls: mockLoadStrapperCalls,
      loading: false
    }));

    render(<StrapperCallsPanel />);

    expect(screen.getByText('No Strapper Calls')).toBeInTheDocument();
  });

  it('validates new call form', async () => {
    render(<StrapperCallsPanel />);

    // Open new call modal
    fireEvent.click(screen.getByText('New Call'));

    // Try to submit without description
    await act(async () => {
      fireEvent.click(screen.getByText('Create Call'));
    });

    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(mockAddStrapperCall).not.toHaveBeenCalled();
  });

  it('sorts calls by priority and time', () => {
    render(<StrapperCallsPanel />);

    const rows = screen.getAllByRole('row').slice(1); // Skip header row

    // First row should be urgent priority
    expect(within(rows[0]).getByText('Urgent')).toBeInTheDocument();

    // Second row should be high priority
    expect(within(rows[1]).getByText('High')).toBeInTheDocument();
  });

  it('shows priority labels in the table', () => {
    render(<StrapperCallsPanel />);

    // Each call in mockStrapperCalls has a priority label rendered in the table
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('handles auto-refresh toggle', () => {
    vi.useFakeTimers();

    render(<StrapperCallsPanel />);

    // Enable auto-refresh
    fireEvent.click(screen.getByLabelText(/Auto-refresh every 30 seconds/i));

    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(mockLoadStrapperCalls).toHaveBeenCalledTimes(2); // Once on mount, once after timer

    vi.useRealTimers();
  });

  it('maintains filter state across refreshes', async () => {
    render(<StrapperCallsPanel />);

    const selects = screen.getAllByRole('combobox');
    const checkpointSelect = selects[0];
    const statusSelect = selects[1];

    // Set filters
    fireEvent.change(checkpointSelect, { target: { value: '1' } });
    fireEvent.change(statusSelect, { target: { value: 'pending' } });

    // Refresh
    fireEvent.click(screen.getByTitle('Refresh list'));

    // Should maintain filter selections
    expect(checkpointSelect).toHaveValue('1');
    expect(statusSelect).toHaveValue('pending');
  });

  it('shows call completion time', () => {
    render(<StrapperCallsPanel />);

    const completedCall = mockStrapperCalls.find(call => call.status === 'completed');
    expect(screen.getByText(`Completed: ${new Date(completedCall.completedAt).toLocaleString()}`)).toBeInTheDocument();
  });

  it('handles errors during call creation', async () => {
    mockAddStrapperCall.mockRejectedValue(new Error('Failed to create call'));

    render(<StrapperCallsPanel />);

    // Open new call modal
    fireEvent.click(screen.getByText('New Call'));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Test call' }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Call'));
    });

    expect(screen.getByText('Failed to create call')).toBeInTheDocument();
  });
});
