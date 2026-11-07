import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../../src/shared/components/ui/Toast.jsx';

// Edit race, Race overview and Race management call addToast({ message, variant }):
// it threw "is not a function", so code after it (navigating away from a deleted race) never ran
const Caller = () => {
  const { addToast } = useToast();
  return <button type="button" onClick={() => addToast({ variant: 'success', message: 'Checkpoint 1 waves saved.' })}>save</button>;
};

describe('useToast', () => {
  it('addToast shows the message', () => {
    render(<ToastProvider><Caller /></ToastProvider>);
    fireEvent.click(screen.getByText('save'));
    expect(screen.getByText('Checkpoint 1 waves saved.')).toBeInTheDocument();
  });
});
