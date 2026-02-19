import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../../src/components/Layout/LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);

    // Check default message
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Check spinner element
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');

    // Check default size (md)
    const spinnerIcon = spinner.querySelector('div');
    expect(spinnerIcon).toHaveClass('w-8', 'h-8');

    // Check screen reader text
    expect(screen.getByText('Loading content, please wait')).toHaveClass('sr-only');
  });

  test('renders with custom message', () => {
    const message = 'Custom loading message';
    render(<LoadingSpinner message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', message);
  });

  test('handles different sizes', () => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };

    Object.entries(sizes).forEach(([size, expectedClass]) => {
      const { unmount } = render(<LoadingSpinner size={size} />);
      const spinnerIcon = screen.getByRole('status').querySelector('div');
      expect(spinnerIcon).toHaveClass(...expectedClass.split(' '));
      unmount();
    });
  });

  test('renders in fullScreen mode', () => {
    render(<LoadingSpinner fullScreen />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('fixed', 'inset-0');
  });

  test('renders with overlay', () => {
    render(<LoadingSpinner overlay />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(
      'bg-white/80',
      'dark:bg-gray-900/80',
      'backdrop-blur-sm',
      'z-50'
    );
  });

  test('accepts and applies custom className', () => {
    const customClass = 'custom-test-class';
    render(<LoadingSpinner className={customClass} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(customClass);
  });

  test('renders in dark mode', () => {
    // Mock dark mode
    document.documentElement.classList.add('dark');

    render(<LoadingSpinner />);
    
    const message = screen.getByText('Loading...');
    expect(message).toHaveClass('dark:text-gray-300');

    // Clean up
    document.documentElement.classList.remove('dark');
  });

  test('is accessible', () => {
    const message = 'Loading data';
    render(<LoadingSpinner message={message} />);

    // Check ARIA attributes
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', message);

    // Check live region for message updates
    const messageElement = screen.getByText(message);
    expect(messageElement).toHaveAttribute('aria-live', 'polite');

    // Check screen reader only text
    const srOnly = screen.getByText('Loading content, please wait');
    expect(srOnly).toHaveClass('sr-only');
  });

  test('memoizes correctly', () => {
    const { rerender } = render(<LoadingSpinner />);
    
    // First render
    const firstRender = screen.getByRole('status').innerHTML;

    // Rerender with same props
    rerender(<LoadingSpinner />);
    const secondRender = screen.getByRole('status').innerHTML;

    // Should be exactly the same DOM
    expect(firstRender).toBe(secondRender);

    // Rerender with different props
    rerender(<LoadingSpinner message="Different message" />);
    const thirdRender = screen.getByRole('status').innerHTML;

    // Should be different DOM
    expect(thirdRender).not.toBe(secondRender);
  });

  test('handles empty message prop', () => {
    render(<LoadingSpinner message="" />);
    
    // Message element should not be rendered
    const messageElements = screen.queryAllByRole('paragraph');
    expect(messageElements).toHaveLength(0);

    // Screen reader text should still be present
    expect(screen.getByText('Loading content, please wait')).toBeInTheDocument();
  });

  test('combines multiple class conditions correctly', () => {
    render(
      <LoadingSpinner 
        fullScreen 
        overlay 
        className="custom-class"
      />
    );
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(
      'fixed',
      'inset-0',
      'bg-white/80',
      'dark:bg-gray-900/80',
      'backdrop-blur-sm',
      'z-50',
      'custom-class'
    );
  });
});
