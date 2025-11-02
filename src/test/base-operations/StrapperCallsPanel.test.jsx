import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import StrapperCallsPanel from '../../modules/base-operations/components/StrapperCallsPanel';
import useBaseOperationsStore from '../../modules/base-operations/store/baseOperationsStore';
import TimeUtils from '../../services/timeUtils';

// Mock the store and TimeUtils
jest.mock('../../modules/base-operations/store/baseOperationsStore');
jest.mock('../../services/timeUtils');

describe('StrapperCallsPanel', () => {
  const mockLoadStrapperCalls = jest.fn();
  const mockAddStrapperCall = jest.fn();
  const mockUpdateStrapperCall = jest.fn();
  const mockCompleteStrapperCall = jest.fn();
  const mockDeleteStrapperCall = jest.fn();

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
    jest.clearAllMocks();

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

    expect(screen.getByText('1')).toBeInTheDocument(); // 1 pending
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 in progress
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 completed
  });

  it('handles new call creation', async () => {
    render(<StrapperCallsPanel />);

    // Open new call modal
    fireEvent.click(screen.getByText('New Call'));

    // Fill form
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

    // Filter to checkpoint 1
    fireEvent.change(screen.getByLabelText(/All Checkpoints/i), {
      target: { value: '1' }
    });

    // Should show only checkpoint 1 calls
    expect(screen.getByText('Medical assistance needed')).toBeInTheDocument();
    expect(screen.getByText('Additional volunteers needed')).toBeInTheDocument();
    expect(screen.queryByText('Water resupply required')).not.toBeInTheDocument();
  });

  it('filters by status', () => {
    render(<StrapperCallsPanel />);

    // Filter to pending status
    fireEvent.change(screen.getByLabelText(/All Status/i), {
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

    expect(screen.getByRole('status')).toBeInTheDocument();
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

    const calls = screen.getAllByRole('row').slice(1); // Skip header row
    
    // First call should be urgent
    expect(within(calls[0]).getByText('Urgent')).toBeInTheDocument();
    
    // Second call should be high priority
    expect(within(calls[1]).getByText('High')).toBeInTheDocument();
  });

  it('shows appropriate priority icons', () => {
    render(<StrapperCallsPanel />);

    // Check for priority icons
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(3); // One icon per call
  });

  it('handles auto-refresh toggle', () => {
    jest.useFakeTimers();

    render(<StrapperCallsPanel />);

    // Enable auto-refresh
    fireEvent.click(screen.getByLabelText(/Auto-refresh every 30 seconds/i));

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockLoadStrapperCalls).toHaveBeenCalledTimes(2); // Once on mount, once after timer

    jest.useRealTimers();
  });

  it('maintains filter state across refreshes', async () => {
    render(<StrapperCallsPanel />);

    // Set filters
    fireEvent.change(screen.getByLabelText(/All Checkpoints/i), {
      target: { value: '1' }
    });

    fireEvent.change(screen.getByLabelText(/All Status/i), {
      target: { value: 'pending' }
    });

    // Refresh
    fireEvent.click(screen.getByTitle('Refresh list'));

    // Should maintain filter selections
    expect(screen.getByLabelText(/All Checkpoints/i)).toHaveValue('1');
    expect(screen.getByLabelText(/All Status/i)).toHaveValue('pending');
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
