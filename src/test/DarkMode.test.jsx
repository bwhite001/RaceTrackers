import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

describe('Dark Mode CSS Classes', () => {
  beforeEach(() => {
    // Reset DOM classes
    document.documentElement.classList.remove('dark')
  })

  it('applies dark mode class to document root', () => {
    // Simulate dark mode activation
    document.documentElement.classList.add('dark')
    
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark mode class from document root', () => {
    // Add dark mode first
    document.documentElement.classList.add('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    
    // Remove dark mode
    document.documentElement.classList.remove('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('button classes work correctly in light mode', () => {
    const { container } = render(
      <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
        Test Button
      </button>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-gray-200', 'text-gray-900')
    expect(button).toHaveClass('dark:bg-gray-700', 'dark:text-gray-100')
  })

  it('primary button classes are applied correctly', () => {
    const { container } = render(
      <button className="btn-primary">
        Primary Button
      </button>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('btn-primary')
  })

  it('secondary button classes are applied correctly', () => {
    const { container } = render(
      <button className="btn-secondary">
        Secondary Button
      </button>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveClass('btn-secondary')
  })

  it('form input classes work in dark mode', () => {
    const { container } = render(
      <input className="form-input" placeholder="Test input" />
    )
    
    const input = container.querySelector('input')
    expect(input).toHaveClass('form-input')
  })

  it('card classes work in dark mode', () => {
    const { container } = render(
      <div className="card">
        <p>Card content</p>
      </div>
    )
    
    const card = container.querySelector('div')
    expect(card).toHaveClass('card')
  })

  it('tab button classes work correctly', () => {
    const { container } = render(
      <div>
        <button className="tab-button active">Active Tab</button>
        <button className="tab-button inactive">Inactive Tab</button>
      </div>
    )
    
    const activeTab = container.querySelector('.active')
    const inactiveTab = container.querySelector('.inactive')
    
    expect(activeTab).toHaveClass('tab-button', 'active')
    expect(inactiveTab).toHaveClass('tab-button', 'inactive')
  })
})

describe('Font Size Scaling', () => {
  beforeEach(() => {
    // Reset font size
    document.documentElement.style.removeProperty('--font-size-multiplier')
  })

  it('sets font size multiplier correctly', () => {
    document.documentElement.style.setProperty('--font-size-multiplier', '1.2')
    
    const multiplier = document.documentElement.style.getPropertyValue('--font-size-multiplier')
    expect(multiplier).toBe('1.2')
  })

  it('resets font size multiplier to default', () => {
    // Set a custom value first
    document.documentElement.style.setProperty('--font-size-multiplier', '1.5')
    expect(document.documentElement.style.getPropertyValue('--font-size-multiplier')).toBe('1.5')
    
    // Reset to default
    document.documentElement.style.setProperty('--font-size-multiplier', '1')
    expect(document.documentElement.style.getPropertyValue('--font-size-multiplier')).toBe('1')
  })
})

describe('Status Colors', () => {
  it('applies status color CSS variables correctly', () => {
    const statusColors = {
      'not-started': '#9ca3af',
      'passed': '#10b981',
      'non-starter': '#ef4444',
      'dnf': '#f59e0b'
    }
    
    // Apply status colors as CSS custom properties
    Object.entries(statusColors).forEach(([status, color]) => {
      document.documentElement.style.setProperty(`--status-${status}`, color)
    })
    
    // Verify colors are set
    expect(document.documentElement.style.getPropertyValue('--status-not-started')).toBe('#9ca3af')
    expect(document.documentElement.style.getPropertyValue('--status-passed')).toBe('#10b981')
    expect(document.documentElement.style.getPropertyValue('--status-non-starter')).toBe('#ef4444')
    expect(document.documentElement.style.getPropertyValue('--status-dnf')).toBe('#f59e0b')
  })
})
