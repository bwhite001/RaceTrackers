import React from 'react';
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatDistanceToNow } from 'date-fns';
import StatusStrip from '../../src/../components/Layout/StatusStrip';

describe('StatusStrip', () => {
  const defaultProps = {
    stats: {
      total: 100,
      finished: 50,
      active: 30,
      dnf: 10,
      dns: 5
    },
    lastSync: new Date().toISOString()
  };

  beforeEach(() => {
    // Reset any mocks or test state
  });

  test('renders all statistics correctly', () => {
    render(<StatusStrip {...defaultProps} />);

    // Check all stat values are displayed
    expect(screen.getByText('100')).toBeInTheDocument(); // Total
    expect(screen.getByText('50')).toBeInTheDocument();  // Finished
    expect(screen.getByText('30')).toBeInTheDocument();  // Active
    expect(screen.getByText('10')).toBeInTheDocument();  // DNF
    expect(screen.getByText('5')).toBeInTheDocument();   // DNS
  });

  test('calculates and displays remaining runners correctly', () => {
    render(<StatusStrip {...defaultProps} />);

    // Remaining = Total - (Finished + DNF + DNS)
    // 100 - (50 + 10 + 5) = 35
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  test('formats last sync time correctly', () => {
    const now = new Date();
    const props = {
      ...defaultProps,
      lastSync: now.toISOString()
    };

    render(<StatusStrip {...props} />);

    const expectedTimeString = formatDistanceToNow(now, { addSuffix: true });
    expect(screen.getByText(`Last update: ${expectedTimeString}`)).toBeInTheDocument();
  });

  test('displays "Never" when no last sync time is provided', () => {
    const props = {
      ...defaultProps,
      lastSync: null
    };

    render(<StatusStrip {...props} />);
    expect(screen.getByText('Last update: Never')).toBeInTheDocument();
  });

  test('applies correct color classes based on status', () => {
    render(<StatusStrip {...defaultProps} />);

    // Check that each status has the correct color class
    const finishedLabel = screen.getByText('Finished:');
    expect(finishedLabel).toHaveClass('text-green-600');

    const activeLabel = screen.getByText('Active:');
    expect(activeLabel).toHaveClass('text-blue-600');

    const dnfLabel = screen.getByText('DNF:');
    expect(dnfLabel).toHaveClass('text-red-600');

    const dnsLabel = screen.getByText('DNS:');
    expect(dnsLabel).toHaveClass('text-yellow-600');
  });

  test('renders in dark mode correctly', () => {
    // Mock dark mode by adding dark class to document
    document.documentElement.classList.add('dark');

    render(<StatusStrip {...defaultProps} />);

    // Check dark mode specific classes
    expect(screen.getByRole('contentinfo')).toHaveClass('dark:bg-gray-800');

    // Clean up
    document.documentElement.classList.remove('dark');
  });

  test('updates when stats change', () => {
    const { rerender } = render(<StatusStrip {...defaultProps} />);

    // Initial check
    expect(screen.getByText('50')).toBeInTheDocument(); // Initial finished count

    // Update props
    const newProps = {
      ...defaultProps,
      stats: {
        ...defaultProps.stats,
        finished: 51
      }
    };

    // Rerender with new props
    rerender(<StatusStrip {...newProps} />);

    // Check updated value
    expect(screen.getByText('51')).toBeInTheDocument();
  });

  test('is memoized and only rerenders when props change', () => {
    const { rerender } = render(<StatusStrip {...defaultProps} />);

    // First render
    const firstRender = screen.getByRole('contentinfo').innerHTML;

    // Rerender with same props
    rerender(<StatusStrip {...defaultProps} />);
    const secondRender = screen.getByRole('contentinfo').innerHTML;

    // Should be exactly the same DOM
    expect(firstRender).toBe(secondRender);

    // Rerender with different props
    rerender(<StatusStrip {...{
      ...defaultProps,
      stats: { ...defaultProps.stats, finished: 51 }
    }} />);
    const thirdRender = screen.getByRole('contentinfo').innerHTML;

    // Should be different DOM
    expect(thirdRender).not.toBe(secondRender);
  });

  test('handles zero values correctly', () => {
    const props = {
      stats: {
        total: 0,
        finished: 0,
        active: 0,
        dnf: 0,
        dns: 0
      },
      lastSync: null
    };

    render(<StatusStrip {...props} />);

    // All stats should show 0
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(6); // Total, Finished, Active, DNF, DNS, Remaining
  });

  test('has correct accessibility attributes', () => {
    render(<StatusStrip {...defaultProps} />);

    // Check that status strip is marked as a contentinfo landmark
    const statusStrip = screen.getByRole('contentinfo');
    expect(statusStrip).toBeInTheDocument();

    // Check that stats are properly labeled
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('Finished:')).toBeInTheDocument();
    expect(screen.getByText('Active:')).toBeInTheDocument();
    expect(screen.getByText('DNF:')).toBeInTheDocument();
    expect(screen.getByText('DNS:')).toBeInTheDocument();
    expect(screen.getByText('Remaining:')).toBeInTheDocument();
  });
});
