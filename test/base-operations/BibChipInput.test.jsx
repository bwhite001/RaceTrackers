import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BibChipInput from 'modules/base-operations/components/BibChipInput';

const knownRunners = [1, 2, 42, 100, 200];

describe('BibChipInput', () => {
  it('adds a green chip for valid bib', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[]} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 42, status: 'valid' });
  });

  it('normalises leading zeros: "042" → bib 42', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[]} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '042' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 42, status: 'valid' });
  });

  it('adds amber chip when bib already recorded at this checkpoint', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[42]} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 42, status: 'duplicate' });
  });

  it('adds red chip for bib not in race', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[]} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '999' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 999, status: 'unknown' });
  });

  it('adds status-warn chip for DNF runner', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[]} statusWarnings={[{ number: 42, status: 'dnf' }]} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 42, status: 'status-warn' });
  });

  it('adds status-warn chip for non-starter (DNS)', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[]} statusWarnings={[{ number: 1, status: 'non-starter' }]} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 1, status: 'status-warn' });
  });

  it('duplicate takes priority over status-warn', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[42]} statusWarnings={[{ number: 42, status: 'dnf' }]} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 42, status: 'duplicate' });
  });

  it('calls onRemove when chip × clicked', () => {
    const onRemove = vi.fn();
    render(<BibChipInput chips={[{ bib: 42, status: 'valid' }]} onAdd={vi.fn()} onRemove={onRemove} knownRunners={knownRunners} existingRecords={[]} />);
    fireEvent.click(screen.getByLabelText('Remove bib 42'));
    expect(onRemove).toHaveBeenCalledWith(42);
  });

  it('clears input after Enter', () => {
    render(<BibChipInput chips={[]} onAdd={vi.fn()} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[]} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.value).toBe('');
  });

  it('handles Tab key same as Enter', () => {
    const onAdd = vi.fn();
    render(<BibChipInput chips={[]} onAdd={onAdd} onRemove={vi.fn()} knownRunners={knownRunners} existingRecords={[]} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(onAdd).toHaveBeenCalledWith({ bib: 1, status: 'valid' });
  });
});
