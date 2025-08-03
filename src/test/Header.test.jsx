import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../components/Layout/Header.jsx';
import { useRaceStore } from '../store/useRaceStore.js';
import { APP_MODES } from '../types/index.js';

// Mock the race store
vi.mock('../store/useRaceStore.js');

describe('Header Component - Back Navigation', () => {
  const mockSetMode = vi.fn();
  const mockSetCurrentCheckpoint = vi.fn();
  const mockOnSettingsClick = vi.fn();
  const mockOnImportExportClick = vi.fn();
  const mockGetRunnerCounts = vi.fn(() => ({
    total: 0,
    notStarted: 0,
    passed: 0,
    nonStarter: 0,
    dnf: 0
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    useRaceStore.mockReturnValue({
      mode: APP_MODES.SETUP,
      raceConfig: null,
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: mockGetRunnerCounts
    });
  });

  it('should render title and settings button in setup mode', () => {
    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
    expect(screen.queryByTitle('Back to Race Setup')).not.toBeInTheDocument();
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
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: vi.fn(() => ({
        total: 250,
        notStarted: 200,
        passed: 40,
        nonStarter: 5,
        dnf: 5
      }))
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByTitle('Back to Race Setup')).toBeInTheDocument();
    expect(screen.getAllByText('Test Marathon 2025')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2025-07-13')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Runners: 100-150')[0]).toBeInTheDocument();
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
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: vi.fn(() => ({
        total: 50,
        notStarted: 30,
        passed: 15,
        nonStarter: 3,
        dnf: 2
      }))
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByTitle('Back to Race Setup')).toBeInTheDocument();
    expect(screen.getAllByText('Sprint Championship 2025')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Runners: 1-50')[0]).toBeInTheDocument();
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
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: mockGetRunnerCounts
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    const backButton = screen.getByTitle('Back to Race Setup');
    fireEvent.click(backButton);

    expect(mockSetCurrentCheckpoint).toHaveBeenCalledWith(null);
    expect(mockSetMode).toHaveBeenCalledWith(APP_MODES.RACE_OVERVIEW);
  });

  it('should handle settings button click', () => {
    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    const settingsButton = screen.getByTitle('Settings');
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
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: mockGetRunnerCounts
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getByTitle('Import/Export')).toBeInTheDocument();
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
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: mockGetRunnerCounts
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    const importExportButton = screen.getByTitle('Import/Export');
    fireEvent.click(importExportButton);

    expect(mockOnImportExportClick).toHaveBeenCalledTimes(1);
  });

  it('should not show import/export button when no race is configured', () => {
    useRaceStore.mockReturnValue({
      mode: APP_MODES.SETUP,
      raceConfig: null,
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: mockGetRunnerCounts
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.queryByTitle('Import/Export')).not.toBeInTheDocument();
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
      setMode: mockSetMode,
      setCurrentCheckpoint: mockSetCurrentCheckpoint,
      getRunnerCounts: mockGetRunnerCounts
    });

    render(
      <Header 
        onSettingsClick={mockOnSettingsClick}
        onImportExportClick={mockOnImportExportClick}
      />
    );

    expect(screen.getAllByText('Ultra Marathon Championship 2025')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2025-12-25')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Runners: 500-999')[0]).toBeInTheDocument();
  });
});
