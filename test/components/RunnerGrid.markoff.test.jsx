import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/shared/services/database/schema.js';
import useCheckpointStore from '../../src/modules/checkpoint-operations/store/checkpointStore.js';
import RunnerGrid from '../../src/components/Checkpoint/RunnerGrid.jsx';

const RACE = 501;
const CP = 2;
const tile = (n) => screen.getByRole('button', { name: new RegExp(`^Runner ${n},`) });
const row = (n) => db.checkpoint_runners.where(['raceId', 'checkpointNumber', 'number']).equals([RACE, CP, n]).first();

beforeEach(async () => {
  await db.checkpoint_runners.clear();
  await db.checkpoint_runners.bulkAdd([140, 141, 142, 143].map(number => ({
    raceId: RACE, checkpointNumber: CP, number, status: 'not-started', calledIn: false,
  })));
  await useCheckpointStore.getState().loadCheckpointData(RACE, CP);
});

describe('Mark off (RunnerGrid)', () => {
  it('tapping a not-passed tile marks it at now', async () => {
    render(<RunnerGrid />);
    fireEvent.click(tile(142));
    await waitFor(() => expect(tile(142)).toHaveAccessibleName(/^Runner 142, \d\d:\d\d$/));
    expect((await row(142)).status).toBe('passed');
    expect(screen.getByTestId('markoff-status')).toHaveTextContent(/142 marked at \d\d:\d\d/);
  });

  it('tapping a passed tile opens the edit sheet instead of unmarking', async () => {
    render(<RunnerGrid />);
    fireEvent.click(tile(141));
    await waitFor(() => expect(tile(141)).toHaveAccessibleName(/\d\d:\d\d$/));
    fireEvent.click(tile(141));
    const sheet = await screen.findByRole('dialog', { name: '141' });
    expect(within(sheet).getByText('Passed · not called in yet')).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Keep time' })).toBeInTheDocument();
    expect((await row(141)).status).toBe('passed');
  });

  it('unmark shows "was HH:MM", Undo restores the exact record', async () => {
    render(<RunnerGrid />);
    fireEvent.click(tile(143));
    await waitFor(() => expect(tile(143)).toHaveAccessibleName(/\d\d:\d\d$/));
    const before = await row(143);
    fireEvent.click(tile(143));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Unmark runner' }));
    await waitFor(() => expect(tile(143)).toHaveAccessibleName(/was \d\d:\d\d/));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(async () => expect(await row(143)).toEqual(before));
  });

  it('an unmarked runner restores at its original time', async () => {
    render(<RunnerGrid />);
    fireEvent.click(tile(140));
    await waitFor(() => expect(tile(140)).toHaveAccessibleName(/\d\d:\d\d$/));
    const original = (await row(140)).actualTime;
    fireEvent.click(tile(140));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Unmark runner' }));
    await waitFor(() => expect(tile(140)).toHaveAccessibleName(/was/));
    fireEvent.click(tile(140));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Unmarked earlier')).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole('button', { name: /^Mark at / }));
    await waitFor(async () => expect((await row(140)).actualTime).toBe(original));
  });

  it('quick entry marks several numbers, skips unknown and already-marked ones', async () => {
    render(<RunnerGrid />);
    fireEvent.click(tile(140));
    await waitFor(() => expect(tile(140)).toHaveAccessibleName(/\d\d:\d\d$/));
    fireEvent.change(screen.getByLabelText('Bib numbers'), { target: { value: '141, 142 140 999' } });
    fireEvent.submit(screen.getByLabelText('Bib numbers').closest('form'));
    await waitFor(() => expect(screen.getByTestId('markoff-status')).toHaveTextContent(/2 runners marked at .*999 not at this checkpoint.*140 already marked/));
    expect((await row(141)).status).toBe('passed');
    expect((await row(142)).status).toBe('passed');
  });
});
