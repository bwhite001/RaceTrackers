import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportExportModal from '../components/ImportExport/ImportExportModal.jsx';
import useRaceStore from '../store/useRaceStore.js';

// Mock the race store
vi.mock('../store/useRaceStore.js');

// Mock QRCode component
vi.mock('qrcode.react', () => ({
  default: ({ value, size }) => (
    <div data-testid="qr-code" data-value={value} data-size={size}>
      QR Code Mock
    </div>
  )
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and click for download
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// Create a proper mock element with all necessary properties and methods
const createMockElement = () => ({
  href: '',
  download: '',
  click: mockClick,
  style: { display: '' },
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn()
  }
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => createMockElement()),
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true
});

describe('ImportExportModal Component - Enhanced Functionality', () => {
  const mockExportRaceConfig = vi.fn();
  const mockExportRaceResults = vi.fn();
  const mockImportRaceConfig = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    
    // Reset URL mocks
    global.URL.createObjectURL.mockClear();
    global.URL.revokeObjectURL.mockClear();
    mockClick.mockClear();
    mockAppendChild.mockClear();
    mockRemoveChild.mockClear();
    
    // Default mock implementation
    useRaceStore.mockReturnValue({
      raceConfig: {
        id: '1',
        name: 'Test Marathon 2025',
        date: '2025-07-13',
        startTime: '08:00',
        minRunner: 100,
        maxRunner: 150
      },
      exportRaceConfig: mockExportRaceConfig,
      exportRaceResults: mockExportRaceResults,
      importRaceConfig: mockImportRaceConfig,
      isLoading: false,
      error: null
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Modal Rendering', () => {
    it('should render modal when open', () => {
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Import / Export Race Configuration')).toBeInTheDocument();
      expect(screen.getByText('Export Configuration')).toBeInTheDocument();
      expect(screen.getByText('Import Configuration')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<ImportExportModal isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByText('Import / Export Race Configuration')).not.toBeInTheDocument();
    });

    it('should handle close button click', () => {
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Export Configuration Tab', () => {
    it('should show export options', () => {
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Export Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Race Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('Race Results (CSV)')).toBeInTheDocument();
    });

    it('should export race configuration as JSON', async () => {
      const mockExportData = {
        raceConfig: {
          name: 'Test Marathon 2025',
          date: '2025-07-13',
          startTime: '08:00',
          minRunner: 100,
          maxRunner: 150
        },
        exportedAt: '2025-07-13T10:00:00Z',
        version: '1.0.0'
      };
      
      mockExportRaceConfig.mockResolvedValue(mockExportData);
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      // Select JSON export
      const jsonRadio = screen.getByLabelText('Race Configuration');
      fireEvent.click(jsonRadio);
      
      // Click export button
      const exportButton = screen.getByText('Export Race Configuration');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockExportRaceConfig).toHaveBeenCalledTimes(1);
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should export race results as CSV', async () => {
      const mockCSVData = {
        content: `Race Name,Test Marathon 2025
Race Date,2025-07-13
Start Time,08:00
Total Runners,51
Export Date,2025-07-13

Runner Number,Status,Recorded Time,Time from Start
100,passed,2025-07-13T08:15:30Z,00:15:30
101,not-started,,
102,dnf,,`,
        filename: 'race-results.csv',
        mimeType: 'text/csv'
      };
      
      mockExportRaceResults.mockResolvedValue(mockCSVData);
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      // Select CSV export
      const csvRadio = screen.getByLabelText('Race Results (CSV)');
      fireEvent.click(csvRadio);
      
      // Click export button
      const exportButton = screen.getByText('Export Race Results (CSV)');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockExportRaceResults).toHaveBeenCalledTimes(1);
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });
    });

    it('should show success message after export', async () => {
      mockExportRaceConfig.mockResolvedValue({});
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      const exportButton = screen.getByText('Export Race Configuration');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText('Race configuration exported successfully!')).toBeInTheDocument();
      });
    });

    it('should handle export errors', async () => {
      mockExportRaceConfig.mockRejectedValue(new Error('Export failed'));
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      const exportButton = screen.getByText('Export Race Configuration');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to export/)).toBeInTheDocument();
      });
    });
  });

  describe('Import Configuration Tab', () => {
    beforeEach(() => {
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to import tab
      const importTab = screen.getByText('Import Configuration');
      fireEvent.click(importTab);
    });

    it('should show import options', () => {
      expect(screen.getByText('Import Race Configuration')).toBeInTheDocument();
      expect(screen.getByText('Upload JSON File')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Paste race configuration JSON data here...')).toBeInTheDocument();
      expect(screen.getByText('Import Configuration')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should handle file upload', async () => {
      const mockFile = new File(['{"test": "data"}'], 'race-config.json', { type: 'application/json' });
      const fileInput = screen.getByLabelText('Upload JSON File');
      
      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        result: '{"raceConfig": {"name": "Imported Race"}}',
        onload: null
      };
      
      global.FileReader = vi.fn(() => mockFileReader);
      
      await userEvent.upload(fileInput, mockFile);
      
      // Simulate file read completion
      mockFileReader.onload();
      
      await waitFor(() => {
        expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
      });
    });

    it('should handle manual JSON input', async () => {
      const user = userEvent.setup();
      const jsonData = '{"raceConfig": {"name": "Manual Import Race"}}';
      
      const textArea = screen.getByPlaceholderText('Paste race configuration JSON data here...');
      await user.type(textArea, jsonData);
      
      expect(textArea.value).toBe(jsonData);
    });

    it('should import configuration successfully', async () => {
      const user = userEvent.setup();
      const importData = {
        raceConfig: {
          name: 'Imported Race',
          date: '2025-08-01',
          startTime: '09:00',
          minRunner: 1,
          maxRunner: 100
        }
      };
      
      mockImportRaceConfig.mockResolvedValue('imported-race-id');
      
      const textArea = screen.getByPlaceholderText('Paste race configuration JSON data here...');
      await user.type(textArea, JSON.stringify(importData));
      
      const importButton = screen.getByText('Import Configuration');
      fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(mockImportRaceConfig).toHaveBeenCalledWith(importData);
        expect(screen.getByText('Race configuration imported successfully!')).toBeInTheDocument();
      });
    });

    it('should handle invalid JSON input', async () => {
      const user = userEvent.setup();
      
      const textArea = screen.getByPlaceholderText('Paste race configuration JSON data here...');
      await user.type(textArea, 'invalid json');
      
      const importButton = screen.getByText('Import Configuration');
      fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid JSON format/)).toBeInTheDocument();
      });
    });

    it('should handle import errors', async () => {
      const user = userEvent.setup();
      const importData = { raceConfig: { name: 'Test' } };
      
      mockImportRaceConfig.mockRejectedValue(new Error('Import failed'));
      
      const textArea = screen.getByPlaceholderText('Paste race configuration JSON data here...');
      await user.type(textArea, JSON.stringify(importData));
      
      const importButton = screen.getByText('Import Configuration');
      fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to import/)).toBeInTheDocument();
      });
    });

    it('should clear input when Clear button is clicked', async () => {
      const user = userEvent.setup();
      
      const textArea = screen.getByPlaceholderText('Paste race configuration JSON data here...');
      await user.type(textArea, 'some text');
      
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      expect(textArea.value).toBe('');
    });

    it('should require input before importing', () => {
      const importButton = screen.getByText('Import Configuration');
      fireEvent.click(importButton);
      
      expect(screen.getByText(/Please provide race configuration data/)).toBeInTheDocument();
    });
  });

  describe('QR Code Display', () => {
    it('should show QR code for export data', async () => {
      const mockExportData = { raceConfig: { name: 'Test' } };
      mockExportRaceConfig.mockResolvedValue(mockExportData);
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      const exportButton = screen.getByText('Export Race Configuration');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('qr-code')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during export', () => {
      useRaceStore.mockReturnValue({
        raceConfig: {
          id: '1',
          name: 'Test Marathon 2025',
          date: '2025-07-13',
          startTime: '08:00',
          minRunner: 100,
          maxRunner: 150
        },
        exportRaceConfig: mockExportRaceConfig,
        exportRaceResults: mockExportRaceResults,
        importRaceConfig: mockImportRaceConfig,
        isLoading: true,
        error: null
      });
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should show loading state during import', () => {
      useRaceStore.mockReturnValue({
        raceConfig: {
          id: '1',
          name: 'Test Marathon 2025',
          date: '2025-07-13',
          startTime: '08:00',
          minRunner: 100,
          maxRunner: 150
        },
        exportRaceConfig: mockExportRaceConfig,
        exportRaceResults: mockExportRaceResults,
        importRaceConfig: mockImportRaceConfig,
        isLoading: true,
        error: null
      });
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to import tab
      const importTab = screen.getByText('Import Configuration');
      fireEvent.click(importTab);
      
      expect(screen.getByText('Importing...')).toBeInTheDocument();
    });
  });

  describe('No Race Configuration', () => {
    it('should show message when no race is configured', () => {
      useRaceStore.mockReturnValue({
        raceConfig: null,
        exportRaceConfig: mockExportRaceConfig,
        exportRaceResults: mockExportRaceResults,
        importRaceConfig: mockImportRaceConfig,
        isLoading: false,
        error: null
      });
      
      render(<ImportExportModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('No race configuration available to export')).toBeInTheDocument();
    });
  });
});
