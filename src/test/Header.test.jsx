import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../components/Layout/Header.jsx';
import useRaceStore from '../store/useRaceStore.js';
import { APP_MODES } from '../types/index.js';

// Mock the race store
vi.mock('../store/useRaceStore.js');

describe('Header Component - Back Navigation', () => {
  const mockSetMode = vi.fn();
  const mockOnSettingsClick = vi.fn();
  const mockOnImportExportClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    useRaceStore.mockReturnValue({
      mode: APP_MODES.SETUP,
      raceConfig: null,
      setMode: mockSetMode
    });
  });

  it('should render title and settings button in setup mode', () => {
    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByText('RaceTracker Pro')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    expect(screen.queryByLabelText('Back to Setup')).not.toBeInTheDocument();
  });

  it('should show back button in checkpoint mode', () => {
    useRaceStore.mockReturnValue({
      mode: APP_MODES.CHECKPOINT,
      raceConfig: { 
        id: '1', 
        name: 'Test Marathon 2025',
        date: '2025-07-13',
        minRunner: 100,
        maxRunner: 150
      },
      setMode: mockSetMode
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByLabelText('Back to Setup')).toBeInTheDocument();
    expect(screen.getByText('Test Marathon 2025')).toBeInTheDocument();
    expect(screen.getByText('2025-07-13')).toBeInTheDocument();
    expect(screen.getByText('Runners: 100-150')).toBeInTheDocument();
  });

  it('should show back button in base station mode', () => {
    useRaceStore.mockReturnValue({
      mode: APP_MODES.BASE_STATION,
      raceConfig: { 
        id: '1', 
        name: 'Sprint Championship 2025',
        date: '2025-07-13',
        minRunner: 1,
        maxRunner: 50
      },
      setMode: mockSetMode
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByLabelText('Back to Setup')).toBeInTheDocument();
    expect(screen.getByText('Sprint Championship 2025')).toBeInTheDocument();
    expect(screen.getByText('Runners: 1-50')).toBeInTheDocument();
  });

  it('should handle back button click', () => {
    useRaceStore.mockReturnValue({
      mode: APP_MODES.CHECKPOINT,
      raceConfig: { 
        id: '1', 
        name: 'Test Race',
        date: '2025-07-13',
        minRunner: 1,
        maxRunner: 100
      },
      setMode: mockSetMode
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    const backButton = screen.getByLabelText('Back to Setup');
    fireEvent.click(backButton);

    expect(mockSetMode).toHaveBeenCalledWith(APP_MODES.SETUP);
  });

  it('should handle settings button click', () => {
    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    const settingsButton = screen.getByLabelText('Settings');
    fireEvent.click(settingsButton);

    expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
  });

  it('should show import/export button when race is configured', () => {
    useRaceStore.mockReturnValue({
      mode: APP_MODES.SETUP,
      raceConfig: { 
        id: '1', 
        name: 'Test Race',
        date: '2025-07-13',
        minRunner: 1,
        maxRunner: 100
      },
      setMode: mockSetMode
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByLabelText('Import/Export')).toBeInTheDocument();
  });

  it('should handle import/export button click', () => {
    useRaceStore.mockReturnValue({
      mode: APP_MODES.SETUP,
      raceConfig: { 
        id: '1', 
        name: 'Test Race',
        date: '2025-07-13',
        minRunner: 1,
        maxRunner: 100
      },
      setMode: mockSetMode
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    const importExportButton = screen.getByLabelText('Import/Export');
    fireEvent.click(importExportButton);

    expect(mockOnImportExportClick).toHaveBeenCalledTimes(1);
  });

  it('should not show import/export button when no race is configured', () => {
    useRaceStore.mockReturnValue({
      mode: APP_MODES.SETUP,
      raceConfig: null,
      setMode: mockSetMode
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.queryByLabelText('Import/Export')).not.toBeInTheDocument();
  });

  it('should display race information correctly', () => {
    const raceConfig = {
      id: '1',
      name: 'Ultra Marathon Championship 2025',
      date: '2025-12-25',
      startTime: '06:00',
      minRunner: 500,
      maxRunner: 999
    };

    useRaceStore.mockReturnValue({
      mode: APP_MODES.CHECKPOINT,
      raceConfig,
      setMode: mockSetMode
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByText('Ultra Marathon Championship 2025')).toBeInTheDocument();
    expect(screen.getByText('2025-12-25')).toBeInTheDocument();
    expect(screen.getByText('Runners: 500-999')).toBeInTheDocument();
  });
});
