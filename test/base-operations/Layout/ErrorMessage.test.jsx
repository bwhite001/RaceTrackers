import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../../src/../components/Layout/ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps = {
    message: 'An error occurred'
  };

  test('renders with required props', () => {
    render(<ErrorMessage {...defaultProps} />);

    // Check error message
    expect(screen.getByText('An error occurred')).toBeInTheDocument();

    // Check error icon
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Check screen reader text
    expect(screen.getByText('Error occurred: An error occurred')).toHaveClass('sr-only');
  });

  test('renders error details when provided', () => {
    const details = 'Error details: Network timeout';
    render(<ErrorMessage {...defaultProps} details={details} />);

    expect(screen.getByText(details)).toBeInTheDocument();
    expect(screen.getByText(details).tagName.toLowerCase()).toBe('pre');
  });

  test('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage {...defaultProps} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Retry operation' });
    expect(retryButton).toBeInTheDocument();

    // Test button click
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  test('does not render retry button when onRetry not provided', () => {
    render(<ErrorMessage {...defaultProps} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders in fullScreen mode', () => {
    render(<ErrorMessage {...defaultProps} fullScreen />);
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveClass('fixed', 'inset-0');
  });

  test('accepts and applies custom className', () => {
    const customClass = 'custom-test-class';
    render(<ErrorMessage {...defaultProps} className={customClass} />);
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveClass(customClass);
  });

  test('renders in dark mode', () => {
    // Mock dark mode
    document.documentElement.classList.add('dark');

    render(<ErrorMessage {...defaultProps} />);
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveClass('dark:bg-red-900/20');

    const message = screen.getByText('An error occurred');
    expect(message).toHaveClass('dark:text-red-200');

    // Clean up
    document.documentElement.classList.remove('dark');
  });

  test('is accessible', () => {
    render(<ErrorMessage {...defaultProps} />);

    // Check ARIA attributes
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');

    // Check screen reader text
    const srText = screen.getByText('Error occurred: An error occurred');
    expect(srText).toHaveClass('sr-only');
  });

  test('memoizes correctly', () => {
    const { rerender } = render(<ErrorMessage {...defaultProps} />);
    
    // First render
    const firstRender = screen.getByRole('alert').innerHTML;

    // Rerender with same props
    rerender(<ErrorMessage {...defaultProps} />);
    const secondRender = screen.getByRole('alert').innerHTML;

    // Should be exactly the same DOM
    expect(firstRender).toBe(secondRender);

    // Rerender with different props
    rerender(<ErrorMessage {...defaultProps} message="Different error" />);
    const thirdRender = screen.getByRole('alert').innerHTML;

    // Should be different DOM
    expect(thirdRender).not.toBe(secondRender);
  });

  test('handles long error messages and details', () => {
    const longMessage = 'A'.repeat(100);
    const longDetails = 'B'.repeat(500);

    render(
      <ErrorMessage 
        message={longMessage} 
        details={longDetails}
      />
    );

    // Message should be visible
    expect(screen.getByText(longMessage)).toBeInTheDocument();

    // Details should be in a pre tag with wrapping enabled
    const detailsElement = screen.getByText(longDetails);
    expect(detailsElement.tagName.toLowerCase()).toBe('pre');
    expect(detailsElement).toHaveClass('whitespace-pre-wrap');
  });

  test('combines multiple class conditions correctly', () => {
    render(
      <ErrorMessage 
        {...defaultProps}
        fullScreen 
        className="custom-class"
      />
    );
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveClass(
      'fixed',
      'inset-0',
      'bg-red-50',
      'dark:bg-red-900/20',
      'custom-class'
    );
  });
});
