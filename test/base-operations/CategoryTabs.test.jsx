import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CategoryTabs from '../../src/modules/base-operations/components/Leaderboard/CategoryTabs';

const tabs = [
  { key: 'M', label: 'Male', count: 5 },
  { key: 'F', label: 'Female', count: 3 },
];

describe('CategoryTabs', () => {
  it('renders a tab for each category', () => {
    render(<CategoryTabs tabs={tabs} activeTab="M" onTabChange={() => {}}>{() => <div>content</div>}</CategoryTabs>);
    expect(screen.getByRole('tab', { name: /^male/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^female/i })).toBeInTheDocument();
  });

  it('shows runner count badge on each tab', () => {
    render(<CategoryTabs tabs={tabs} activeTab="M" onTabChange={() => {}}>{() => <div />}</CategoryTabs>);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onTabChange with tab key when clicked', () => {
    const onChange = vi.fn();
    render(<CategoryTabs tabs={tabs} activeTab="M" onTabChange={onChange}>{() => <div />}</CategoryTabs>);
    fireEvent.click(screen.getByRole('tab', { name: /^female/i }));
    expect(onChange).toHaveBeenCalledWith('F');
  });

  it('renders children with the active tab key', () => {
    render(
      <CategoryTabs tabs={tabs} activeTab="F" onTabChange={() => {}}>
        {(key) => <div data-testid="content">{key}</div>}
      </CategoryTabs>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('F');
  });
});
