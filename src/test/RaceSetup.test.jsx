import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RaceSetup from '../components/Setup/RaceSetup.jsx';
import useRaceStore from '../store/useRaceStore.js';
import { APP_MODES } from '../types/index.js';

// Mock the race store
vi.mock('../store/useRaceStore.js');

describe('RaceSetup Component - Multiple Race Management', () => {
  const mockCreateRace = vi.fn();
  const mockSetMode = vi.fn();
  const mockGetAllRaces = vi.fn();
  const mockSwitchToRace = vi.fn();
  const mockDeleteRace = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    useRaceStore.mockReturnValue({
      createRace: mockCreateRace,
      setMode: mockSetMode,
      getAllRaces: mockGetAllRaces,
      switchToRace: mockSwitchToRace,
      deleteRace: mockDeleteRace,
      clearError: mockClearError,
      isLoading: false,
      error: null,
      raceConfig: null
    });
  });

  describe('No Races State', () => {
    it('should show empty state when no races exist', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        expect(screen.getByText('No races found. Create your first race to get started.')).toBeInTheDocument();
        expect(screen.getByText('Create First Race')).toBeInTheDocument();
      });
    });

    it('should show create race form when clicking Create First Race', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        const createButton = screen.getByText('Create First Race');
        fireEvent.click(createButton);
      });
      
      expect(screen.getByText('Create New Race')).toBeInTheDocument();
      expect(screen.getByLabelText('Race Name')).toBeInTheDocument();
    });
  });

  describe('Multiple Races Management', () => {
    const mockRaces = [
      {
        id: '1',
        name: 'Test Marathon 2025',
        date: '2025-07-13',
        startTime: '08:00',
        minRunner: 100,
        maxRunner: 150,
        createdAt: '2025-07-13T10:00:00Z'
      },
      {
        id: '2',
        name: 'Sprint Championship 2025',
        date: '2025-07-13',
        startTime: '08:00',
        minRunner: 1,
        maxRunner: 50,
        createdAt: '2025-07-13T11:00:00Z'
      }
    ];

    it('should display existing races', async () => {
      mockGetAllRaces.mockResolvedValue(mockRaces);
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: { ...mockRaces[0] }
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Marathon 2025')).toBeInTheDocument();
        expect(screen.getByText('Sprint Championship 2025')).toBeInTheDocument();
        expect(screen.getByText('Runners: 100-150')).toBeInTheDocument();
        expect(screen.getByText('Runners: 1-50')).toBeInTheDocument();
      });
    });

    it('should show current race with Current label', async () => {
      mockGetAllRaces.mockResolvedValue(mockRaces);
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: { ...mockRaces[0] },
        currentRaceId: '1'
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        expect(screen.getByText('Current')).toBeInTheDocument();
        expect(screen.getByText('Select')).toBeInTheDocument();
      });
    });

    it('should handle race switching', async () => {
      mockGetAllRaces.mockResolvedValue(mockRaces);
      mockSwitchToRace.mockResolvedValue();
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: { ...mockRaces[0] },
        currentRaceId: '1',
        switchToRace: mockSwitchToRace
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        const selectButton = screen.getByText('Select');
        fireEvent.click(selectButton);
      });
      
      expect(mockSwitchToRace).toHaveBeenCalledWith('2');
    });

    it('should handle race deletion', async () => {
      mockGetAllRaces.mockResolvedValue(mockRaces);
      mockDeleteRace.mockResolvedValue();
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: { ...mockRaces[0] },
        currentRaceId: '1',
        deleteRace: mockDeleteRace
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete the race "Test Marathon 2025"? This action cannot be undone.');
      expect(mockDeleteRace).toHaveBeenCalledWith('1');
      
      confirmSpy.mockRestore();
    });

    it('should not delete race if user cancels confirmation', async () => {
      mockGetAllRaces.mockResolvedValue(mockRaces);
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: { ...mockRaces[0] },
        currentRaceId: '1',
        deleteRace: mockDeleteRace
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteRace).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Race Creation Form', () => {
    it('should create new race with valid data', async () => {
      const user = userEvent.setup();
      mockGetAllRaces.mockResolvedValue([]);
      mockCreateRace.mockResolvedValue('new-race-id');
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        createRace: mockCreateRace
      });
      
      render(<RaceSetup />);
      
      // Click Create First Race to show form
      await waitFor(() => {
        const createButton = screen.getByText('Create First Race');
        fireEvent.click(createButton);
      });
      
      // Fill out the form
      await user.type(screen.getByLabelText('Race Name'), 'New Test Race');
      await user.type(screen.getByLabelText('Runner Range (Quick Input)'), '1-100');
      
      // Submit the form
      const submitButton = screen.getByText('Create Race');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateRace).toHaveBeenCalledWith({
          name: 'New Test Race',
          date: expect.any(String),
          startTime: '08:00',
          minRunner: 1,
          maxRunner: 100
        });
      });
    });

    it('should validate form fields', async () => {
      const user = userEvent.setup();
      mockGetAllRaces.mockResolvedValue([]);
      
      render(<RaceSetup />);
      
      // Click Create First Race to show form
      await waitFor(() => {
        const createButton = screen.getByText('Create First Race');
        fireEvent.click(createButton);
      });
      
      // Try to submit without filling required fields
      const submitButton = screen.getByText('Create Race');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Race name is required')).toBeInTheDocument();
      });
    });

    it('should parse runner range correctly', async () => {
      const user = userEvent.setup();
      mockGetAllRaces.mockResolvedValue([]);
      
      render(<RaceSetup />);
      
      // Click Create First Race to show form
      await waitFor(() => {
        const createButton = screen.getByText('Create First Race');
        fireEvent.click(createButton);
      });
      
      // Enter range in quick input
      const rangeInput = screen.getByLabelText('Runner Range (Quick Input)');
      await user.type(rangeInput, '100-200');
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('100')).toBeInTheDocument();
        expect(screen.getByDisplayValue('200')).toBeInTheDocument();
        expect(screen.getByText('Total runners: 101')).toBeInTheDocument();
      });
    });

    it('should show cancel button and handle cancellation', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      render(<RaceSetup />);
      
      // Click Create First Race to show form
      await waitFor(() => {
        const createButton = screen.getByText('Create First Race');
        fireEvent.click(createButton);
      });
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      
      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByText('Create First Race')).toBeInTheDocument();
      });
      
      // The "Create New Race" button should still be visible at the top
      expect(screen.getByText('Create New Race')).toBeInTheDocument();
    });
  });

  describe('Mode Selection', () => {
    it('should show mode selection when race is configured', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: {
          id: '1',
          name: 'Test Race',
          date: '2025-07-13',
          startTime: '08:00',
          minRunner: 1,
          maxRunner: 100
        }
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Operation Mode for "Test Race"')).toBeInTheDocument();
        expect(screen.getByText('Checkpoint Mode')).toBeInTheDocument();
        expect(screen.getByText('Base Station Mode')).toBeInTheDocument();
      });
    });

    it('should handle checkpoint mode selection', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: {
          id: '1',
          name: 'Test Race',
          date: '2025-07-13',
          startTime: '08:00',
          minRunner: 1,
          maxRunner: 100
        },
        setMode: mockSetMode
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        const checkpointButton = screen.getByText('Checkpoint Mode');
        fireEvent.click(checkpointButton);
      });
      
      expect(mockSetMode).toHaveBeenCalledWith(APP_MODES.CHECKPOINT);
    });

    it('should handle base station mode selection', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        raceConfig: {
          id: '1',
          name: 'Test Race',
          date: '2025-07-13',
          startTime: '08:00',
          minRunner: 1,
          maxRunner: 100
        },
        setMode: mockSetMode
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        const baseStationButton = screen.getByText('Base Station Mode');
        fireEvent.click(baseStationButton);
      });
      
      expect(mockSetMode).toHaveBeenCalledWith(APP_MODES.BASE_STATION);
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        error: 'Failed to create race'
      });
      
      render(<RaceSetup />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create race')).toBeInTheDocument();
      });
    });

    it('should handle loading state', async () => {
      mockGetAllRaces.mockResolvedValue([]);
      
      useRaceStore.mockReturnValue({
        ...useRaceStore(),
        isLoading: true
      });
      
      render(<RaceSetup />);
      
      expect(screen.getByText('Loading races...')).toBeInTheDocument();
    });
  });
});
