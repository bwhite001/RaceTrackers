import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HeadsUpGrid from '../../src/modules/base-operations/components/HeadsUpGrid';
import useBaseOperationsStore from '../../src/modules/base-operations/store/baseOperationsStore';

vi.mock('../../src/modules/base-operations/store/baseOperationsStore');

const mockRunners = [
  { number: 42, status: 'active', firstName: 'Alice', lastName: 'Smith', checkpointStatuses: {}, checkpointTimes: {} },
  { number: 100, status: 'not-started', firstName: 'Bob', lastName: 'Jones', checkpointStatuses: {}, checkpointTimes: {} },
];

beforeEach(() => {
  useBaseOperationsStore.mockReturnValue({
    submitRadioBatch: vi.fn(),
    clearCheckpointRunner: vi.fn(),
    clearAllCheckpointTimes: vi.fn(),
  });
});

describe('HeadsUpGrid', () => {
  it('does not show Name column when showNames is false', () => {
    render(<HeadsUpGrid runners={mockRunners} checkpoints={[]} showNames={false} />);
    expect(screen.queryByRole('columnheader', { name: /name/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('shows Name column with runner names when showNames is true', () => {
    render(<HeadsUpGrid runners={mockRunners} checkpoints={[]} showNames={true} />);
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('shows — for runners with no name when showNames is true', () => {
    const runnersNoName = [
      { number: 7, status: 'not-started', firstName: '', lastName: '', checkpointStatuses: {}, checkpointTimes: {} },
    ];
    render(<HeadsUpGrid runners={runnersNoName} checkpoints={[]} showNames={true} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
