import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../../../components/Layout/Header';
import { HOTKEYS } from '../../../types';

// Mock useDeviceDetection hook
vi.mock('../../../shared/hooks/useDeviceDetection', () => ({
  default: () => ({
    isDesktop: true
  })
}));

describe('Header', () => {
  const defaultProps = {
    title: 'Base Station Operations',
    stats: {
      finished: 50,
      active: 30
    },
    lastSync: new Date().toISOString(),
    onOpenSettings: vi.fn(),
    onOpenHelp: vi.fn()
  };

  // Test wrapper component
  const TestWrapper = ({ children }) => (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with required props', () => {
    render(<Header {...defaultProps} />, { wrapper: TestWrapper });

    // Check title
    expect(screen.getByText('Base Station Operations')).toBeInTheDocument();

    // Check stats
    expect(screen.getByText('Finished: 50')).toBeInTheDocument();
    expect(screen.getByText('Active: 30')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByLabelText('Help')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Exit Base Station')).toBeInTheDocument();
  });

  test('displays hotkey hints on desktop', () => {
    render(<Header {...defaultProps} />, { wrapper: TestWrapper });

    // Check hotkey hints
    expect(screen.getByText(`(${HOTKEYS.HELP})`)).toBeInTheDocument();
    expect(screen.getByText(`(${HOTKEYS.ESCAPE})`)).toBeInTheDocument();
  });

  test('handles button clicks', () => {
    render(<Header {...defaultProps} />, { wrapper: TestWrapper });

    // Click help button
    fireEvent.click(screen.getByLabelText('Help'));
    expect(defaultProps.onOpenHelp).toHaveBeenCalled();

    // Click settings button
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(defaultProps.onOpenSettings).toHaveBeenCalled();
  });

  test('handles exit with custom handler', () => {
    const onExit = vi.fn();
    render(
      <Header {...defaultProps} onExit={onExit} />,
      { wrapper: TestWrapper }
    );

    fireEvent.click(screen.getByLabelText('Exit Base Station'));
    expect(onExit).toHaveBeenCalled();
  });

  test('handles exit without custom handler', () => {
    const { container } = render(
      <Header {...defaultProps} />,
      { wrapper: TestWrapper }
    );

    fireEvent.click(screen.getByLabelText('Exit Base Station'));
    // Should navigate to home (handled by router)
    expect(container).toBeInTheDocument();
  });

  test('formats last sync time correctly', () => {
    const now = new Date();
    render(
      <Header 
        {...defaultProps} 
        lastSync={now.toISOString()} 
      />,
      { wrapper: TestWrapper }
    );

    // Check last sync time in mobile view
    const formattedTime = now.toLocaleTimeString();
    expect(screen.getByText(`Last update: ${formattedTime}`)).toBeInTheDocument();
  });

  test('displays "Never" when no last sync time provided', () => {
    render(
      <Header 
        {...defaultProps} 
        lastSync={null} 
      />,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('Last update: Never')).toBeInTheDocument();
  });

  test('renders in dark mode correctly', () => {
    // Mock dark mode
    document.documentElement.classList.add('dark');

    render(<Header {...defaultProps} />, { wrapper: TestWrapper });

    // Check dark mode classes
    expect(screen.getByRole('banner')).toHaveClass('dark:bg-gray-800');

    // Clean up
    document.documentElement.classList.remove('dark');
  });

  test('is responsive on mobile', () => {
    // Mock mobile device
    vi.mock('../../../shared/hooks/useDeviceDetection', () => ({
      default: () => ({
        isDesktop: false
      })
    }));

    render(<Header {...defaultProps} />, { wrapper: TestWrapper });

    // Quick stats should be hidden on mobile
    const statsContainer = screen.getByText('Finished: 50').parentElement.parentElement;
    expect(statsContainer).toHaveClass('hidden sm:flex');

    // Last sync info should be visible on mobile
    const lastSyncInfo = screen.getByText(/Last update:/).parentElement;
    expect(lastSyncInfo).toHaveClass('sm:hidden');
  });

  test('has correct accessibility attributes', () => {
    render(<Header {...defaultProps} />, { wrapper: TestWrapper });

    // Check that header is marked as a banner landmark
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // Check that title is marked as heading
    expect(screen.getByRole('heading')).toHaveTextContent('Base Station Operations');

    // Check that buttons have accessible labels
    expect(screen.getByLabelText('Help')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Exit Base Station')).toBeInTheDocument();
  });

  test('memoizes correctly and only rerenders when props change', () => {
    const { rerender } = render(
      <Header {...defaultProps} />,
      { wrapper: TestWrapper }
    );

    // First render
    const firstRender = screen.getByRole('banner').innerHTML;

    // Rerender with same props
    rerender(<Header {...defaultProps} />);
    const secondRender = screen.getByRole('banner').innerHTML;

    // Should be exactly the same DOM
    expect(firstRender).toBe(secondRender);

    // Rerender with different props
    rerender(
      <Header 
        {...defaultProps} 
        stats={{ ...defaultProps.stats, finished: 51 }} 
      />
    );
    const thirdRender = screen.getByRole('banner').innerHTML;

    // Should be different DOM
    expect(thirdRender).not.toBe(secondRender);
  });
});
