import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsModal from '../components/Settings/SettingsModal.jsx'

// Mock StorageService to prevent IndexedDB calls
vi.mock('../services/storage.js', () => ({
  default: {
    saveSetting: vi.fn(() => Promise.resolve()),
  }
}))

// Mock the store
const mockStore = {
  settings: {
    darkMode: false,
    fontSize: 1.0,
    statusColors: {
      'not-started': '#9ca3af',
      'passed': '#10b981',
      'non-starter': '#ef4444',
      'dnf': '#f59e0b'
    },
    runnerViewMode: 'grid',
    groupSize: 50
  },
  updateSettings: vi.fn(),
  clearAllData: vi.fn()
}

vi.mock('../store/useRaceStore.js', () => ({
  useRaceStore: () => mockStore
}))

describe('SettingsModal Dark Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset DOM classes
    document.documentElement.classList.remove('dark')
  })

  it('renders settings modal with proper dark mode styling', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Check if modal is rendered
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Dark Mode')).toBeInTheDocument()
    expect(screen.getByLabelText('Font Size')).toBeInTheDocument()
  })

  it('toggles dark mode when dark mode switch is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Find the dark mode toggle button (it's the toggle switch next to "Dark Mode" label)
    const darkModeSection = screen.getByText('Dark Mode').closest('div').parentElement
    const darkModeToggle = darkModeSection.querySelector('button')
    await user.click(darkModeToggle)
    
    // Check if dark class is added to document
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('font size range input works correctly', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    const fontSizeInput = screen.getByLabelText('Font Size')
    expect(fontSizeInput).toBeInTheDocument()
    expect(fontSizeInput.type).toBe('range')
    expect(fontSizeInput.value).toBe('1')
    
    // Test changing the value
    fireEvent.change(fontSizeInput, { target: { value: '1.2' } })
    expect(fontSizeInput.value).toBe('1.2')
  })

  it('status color inputs are present', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Find color inputs by their type and associated text
    const colorInputs = screen.getAllByDisplayValue(/^#[0-9a-f]{6}$/i)
    expect(colorInputs).toHaveLength(4)
    
    // Check that status text is present
    expect(screen.getByText('not started')).toBeInTheDocument()
    expect(screen.getByText('passed')).toBeInTheDocument()
    expect(screen.getByText('non starter')).toBeInTheDocument()
    expect(screen.getByText('dnf')).toBeInTheDocument()
  })

  it('saves settings when save button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsModal isOpen={true} onClose={onClose} />)
    
    // Make a change to font size
    const fontSizeInput = screen.getByLabelText('Font Size')
    fireEvent.change(fontSizeInput, { target: { value: '1.2' } })
    
    // Click save
    const saveButton = screen.getByText('Save Changes')
    await user.click(saveButton)
    
    // Check if updateSettings was called
    expect(mockStore.updateSettings).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('reverts changes when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsModal isOpen={true} onClose={onClose} />)
    
    // Make a change to font size
    const fontSizeInput = screen.getByLabelText('Font Size')
    fireEvent.change(fontSizeInput, { target: { value: '1.2' } })
    
    // Click cancel
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    // Check if settings were not saved
    expect(mockStore.updateSettings).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    
    // Check if font size was reverted
    expect(document.documentElement.style.getPropertyValue('--font-size-multiplier')).toBe('1')
  })
})
