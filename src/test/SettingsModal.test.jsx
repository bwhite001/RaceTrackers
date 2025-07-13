import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsModal from '../components/Settings/SettingsModal.jsx'

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
  updateSettings: vi.fn()
}

vi.mock('../../store/useRaceStore.js', () => ({
  default: () => mockStore
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
    expect(screen.getByText('Font Size')).toBeInTheDocument()
  })

  it('toggles dark mode when dark mode switch is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Find and click the dark mode toggle
    const darkModeToggle = screen.getByRole('button', { name: /dark mode/i })
    await user.click(darkModeToggle)
    
    // Check if dark class is added to document
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('font size buttons have proper dark mode text classes', () => {
    // Set dark mode in settings
    mockStore.settings.darkMode = true
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Check font size buttons
    const smallButton = screen.getByText('Small')
    const mediumButton = screen.getByText('Medium')
    const normalButton = screen.getByText('Normal')
    
    // Verify buttons have dark mode text classes
    expect(smallButton.closest('button')).toHaveClass('text-gray-900', 'dark:text-gray-100')
    expect(mediumButton.closest('button')).toHaveClass('text-gray-900', 'dark:text-gray-100')
    expect(normalButton.closest('button')).toHaveClass('text-gray-900', 'dark:text-gray-100')
  })

  it('view mode buttons have proper dark mode text classes', () => {
    mockStore.settings.darkMode = true
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Check view mode buttons
    const gridButton = screen.getByText('Grid')
    const listButton = screen.getByText('List')
    
    // Verify buttons have dark mode text classes
    expect(gridButton.closest('button')).toHaveClass('text-primary-700', 'dark:text-primary-300')
    expect(listButton.closest('button')).toHaveClass('text-gray-900', 'dark:text-gray-100')
  })

  it('selected font size button has proper styling', async () => {
    const user = userEvent.setup()
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Click on Large font size
    const largeButton = screen.getByText('Large')
    await user.click(largeButton)
    
    // Check if button has selected styling
    expect(largeButton.closest('button')).toHaveClass('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20')
  })

  it('selected view mode button has proper styling', async () => {
    const user = userEvent.setup()
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Click on List view mode
    const listButton = screen.getByText('List')
    await user.click(listButton)
    
    // Check if button has selected styling
    expect(listButton.closest('button')).toHaveClass('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20')
  })

  it('applies font size changes immediately', async () => {
    const user = userEvent.setup()
    render(<SettingsModal isOpen={true} onClose={() => {}} />)
    
    // Click on Large font size (value 1.2)
    const largeButton = screen.getByText('Large')
    await user.click(largeButton)
    
    // Check if CSS custom property is set
    expect(document.documentElement.style.getPropertyValue('--font-size-multiplier')).toBe('1.2')
  })

  it('saves settings when save button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SettingsModal isOpen={true} onClose={onClose} />)
    
    // Make a change
    const largeButton = screen.getByText('Large')
    await user.click(largeButton)
    
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
    
    // Make a change
    const largeButton = screen.getByText('Large')
    await user.click(largeButton)
    
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
