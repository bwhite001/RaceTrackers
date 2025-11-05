import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import ExitOperationModal, { withOperationExit } from '../shared/components/ExitOperationModal';
import useNavigationStore from '../shared/store/navigationStore';

// Mock navigation hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

// Mock navigation store
vi.mock('../shared/store/navigationStore');

// Test component wrapped with withOperationExit
const TestComponent = withOperationExit(({ onExitAttempt, setHasUnsavedChanges }) => (
  <div>
    <h1>Test Component</h1>
    <button onClick={() => setHasUnsavedChanges(true)}>Make Changes</button>
    <button onClick={onExitAttempt}>Exit</button>
  </div>
));

const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('ExitOperationModal', () => {
  const mockNavigate = vi.fn();
  const mockEndOperation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useNavigationStore.mockImplementation(() => ({
      currentModule: 'test-module',
      endOperation: mockEndOperation
    }));
  });

  describe('Modal Component', () => {
    test('renders when open', () => {
      render(
        <ExitOperationModal
          isOpen={true}
          onClose={vi.fn()}
          hasUnsavedChanges={false}
        />
      );

      expect(screen.getByText(/exit test-module/i)).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(
        <ExitOperationModal
          isOpen={false}
          onClose={vi.fn()}
          hasUnsavedChanges={false}
        />
      );

      expect(screen.queryByText(/exit test-module/i)).not.toBeInTheDocument();
    });

    test('shows warning when there are unsaved changes', () => {
      render(
        <ExitOperationModal
          isOpen={true}
          onClose={vi.fn()}
          hasUnsavedChanges={true}
        />
      );

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    test('calls onClose when canceling', () => {
      const onClose = vi.fn();
      render(
        <ExitOperationModal
          isOpen={true}
          onClose={onClose}
          hasUnsavedChanges={false}
        />
      );

      fireEvent.click(screen.getByText(/cancel/i));
      expect(onClose).toHaveBeenCalled();
    });

    test('navigates home and ends operation when confirming exit', async () => {
      render(
        <ExitOperationModal
          isOpen={true}
          onClose={vi.fn()}
          hasUnsavedChanges={false}
        />
      );

      fireEvent.click(screen.getByText(/exit operation/i));

      await waitFor(() => {
        expect(mockEndOperation).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('withOperationExit HOC', () => {
    test('provides exit attempt handler to wrapped component', () => {
      renderWithRouter(<TestComponent />);
      
      expect(screen.getByText(/test component/i)).toBeInTheDocument();
      expect(screen.getByText(/exit/i)).toBeInTheDocument();
    });

    test('shows modal when exit is attempted', () => {
      renderWithRouter(<TestComponent />);
      
      fireEvent.click(screen.getByText(/exit/i));
      expect(screen.getByText(/exit test-module/i)).toBeInTheDocument();
    });

    test('tracks unsaved changes', async () => {
      renderWithRouter(<TestComponent />);
      
      // Make changes
      fireEvent.click(screen.getByText(/make changes/i));
      
      // Attempt to exit
      fireEvent.click(screen.getByText(/exit/i));

      // Should show unsaved changes warning
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    test('prevents browser refresh when there are unsaved changes', () => {
      renderWithRouter(<TestComponent />);
      
      // Make changes
      fireEvent.click(screen.getByText(/make changes/i));
      
      // Simulate beforeunload event
      const event = new Event('beforeunload');
      event.preventDefault = vi.fn();
      window.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.returnValue).toBe('');
    });

    test('allows browser refresh when no unsaved changes', () => {
      renderWithRouter(<TestComponent />);
      
      // Simulate beforeunload event without making changes
      const event = new Event('beforeunload');
      event.preventDefault = vi.fn();
      window.dispatchEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.returnValue).toBe(undefined);
    });
  });

  describe('Integration with Navigation Store', () => {
    test('ends operation when exiting successfully', async () => {
      renderWithRouter(<TestComponent />);
      
      // Attempt to exit
      fireEvent.click(screen.getByText(/exit/i));
      
      // Confirm exit
      fireEvent.click(screen.getByText(/exit operation/i));

      await waitFor(() => {
        expect(mockEndOperation).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('maintains operation when canceling exit', () => {
      renderWithRouter(<TestComponent />);
      
      // Attempt to exit
      fireEvent.click(screen.getByText(/exit/i));
      
      // Cancel exit
      fireEvent.click(screen.getByText(/cancel/i));

      expect(mockEndOperation).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
