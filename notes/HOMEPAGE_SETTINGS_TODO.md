# Homepage & Settings Implementation TODO

## Task: Transform Homepage to App-Friendly Interface with Global UI Settings

### ✅ Phase 1: Type Definitions & Constants (COMPLETED)
- [x] Added VIEW_MODES constant (grid, list)
- [x] Added CONTRAST_MODES constant (normal, high)
- [x] Added TOUCH_TARGETS constants (44px, 48px, 56px)
- [x] Added FONT_SIZE range constants
- [x] Added DEFAULT_STATUS_COLORS
- [x] Expanded DEFAULT_SETTINGS to include:
  - fontSize: 1.0
  - statusColors
  - highContrastMode: false
  - reducedMotion: false
  - runnerViewMode: 'grid'
  - touchOptimized: true
  - compactMode: false
  - hapticsEnabled: true
  - keyboardShortcuts: true
- [x] Updated exports in types/index.js

### ✅ Phase 2: DOM Utilities (COMPLETED)
- [x] Created src/utils/settingsDOM.js with functions:
  - applyThemeToDOM()
  - applyFontSizeToDOM()
  - applyContrastToDOM()
  - applyReducedMotionToDOM()
  - applyTouchOptimizedToDOM()
  - applyCompactModeToDOM()
  - applyStatusColorsToDOM()
  - initializeSettings()

### ✅ Phase 3: CSS Custom Properties (COMPLETED)
- [x] Added settings-related CSS variables to src/index.css:
  - --font-scale and font size variables
  - --touch-target-min
  - --high-contrast-multiplier
  - --animation-duration
- [x] Added .touch-optimized class styles
- [x] Added .high-contrast class styles
- [x] Added .compact-mode class styles
- [x] Added .reduce-motion class styles

### ✅ Phase 4: Enhanced Settings Modal (COMPLETED)
- [x] Updated SettingsModal.jsx with new imports
- [x] Added preview functionality for all settings
- [x] Organized into sections:
  - 🎨 Appearance (dark mode, high contrast, reduced motion, font size)
  - 📱 Display & Interaction (touch optimization, compact mode, view mode, group size)
  - 🎨 Status Colors (customizable colors)
  - ⚠️ Danger Zone (clear database)
- [x] Made all controls touch-friendly (48px minimum)
- [x] Added proper ARIA labels and roles
- [x] Implemented immediate preview of changes
- [x] Added revert on cancel functionality

### ✅ Phase 5: Global Settings Application (COMPLETED)
- [x] Updated App.jsx to initialize settings on mount
- [x] Added system preference listeners (dark mode, reduced motion)
- [x] Applied settings globally via DOM utilities

### 🔄 Phase 6: Transform Homepage (IN PROGRESS)
- [ ] Remove hero section with gradient background
- [ ] Create app-style header component (AppHeader.jsx)
  - [ ] Logo and title
  - [ ] Settings icon (always visible)
  - [ ] Help icon
- [ ] Transform module cards to touch-friendly buttons
  - [ ] Minimum 48px touch targets
  - [ ] Larger icons and text
  - [ ] Better spacing
  - [ ] Haptic feedback support
- [ ] Reorganize layout:
  - [ ] Sticky header
  - [ ] Touch-optimized cards
  - [ ] Better mobile responsiveness
- [ ] Update RaceStatsCard for touch interactions
- [ ] Add pull-to-refresh indicator (optional)

### 📋 Phase 7: Additional Enhancements (PENDING)
- [ ] Create FloatingSettingsButton component (FAB)
- [ ] Add settings export/import functionality
  - [ ] Export as JSON
  - [ ] Export as QR code
  - [ ] Import from JSON
  - [ ] Import from QR code scan
- [ ] Update manifest.json for PWA
  - [ ] Add theme-color meta tag support
  - [ ] Ensure proper viewport settings
- [ ] Add haptic feedback implementation
- [ ] Implement keyboard shortcuts toggle

### 🧪 Phase 8: Testing (PENDING)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Verify touch target sizes (48px minimum)
- [ ] Test dark mode and high-contrast combinations
- [ ] Verify settings persistence across sessions
- [ ] Test offline functionality
- [ ] Add unit tests for settings utilities
- [ ] Add integration tests for settings modal

### 📝 Phase 9: Documentation (PENDING)
- [ ] Update user guide with new settings
- [ ] Document accessibility features
- [ ] Create settings migration guide
- [ ] Update README with new features

## Current Status

**Completed:** Phases 1-5 (Foundation, Utilities, CSS, Settings Modal, Global Application)

**Next Steps:**
1. Transform LandingPage.jsx to remove hero and make app-friendly
2. Create AppHeader component with persistent settings access
3. Update module cards for touch optimization
4. Test on actual devices

## Notes

### Design Decisions Made:
- Touch targets set to 48px (exceeds WCAG AA 44px requirement)
- High contrast mode uses 1.3x multiplier
- Font size range: 0.8x to 1.5x (80% to 150%)
- Settings preview changes immediately in modal
- System preferences respected as fallback when user hasn't set explicit preference

### Breaking Changes:
- DEFAULT_SETTINGS structure expanded significantly
- New CSS classes added that may affect existing components
- Settings now stored in useRaceStore instead of separate store

### Accessibility Improvements:
- All interactive elements have proper ARIA labels
- Touch targets meet WCAG 2.5.5 Level AAA (48px)
- High contrast mode for visibility
- Reduced motion support for vestibular disorders
- Keyboard navigation support (to be implemented)

### Performance Considerations:
- Settings applied via CSS custom properties (efficient)
- DOM updates batched in useEffect
- No unnecessary re-renders with proper dependency arrays

## Files Modified

1. ✅ src/types/index.js - Added new constants and expanded DEFAULT_SETTINGS
2. ✅ src/utils/settingsDOM.js - Created new utility file
3. ✅ src/index.css - Added CSS custom properties and utility classes
4. ✅ src/components/Settings/SettingsModal.jsx - Complete rewrite with new features
5. ✅ src/App.jsx - Added settings initialization and system preference listeners
6. 🔄 src/components/Home/LandingPage.jsx - To be transformed
7. 📋 src/components/Layout/AppHeader.jsx - To be created
8. 📋 src/components/Settings/FloatingSettingsButton.jsx - To be created

## Testing Checklist

### Manual Testing
- [ ] Dark mode toggle works correctly
- [ ] High contrast mode increases visibility
- [ ] Font size slider updates text immediately
- [ ] Touch optimization increases button sizes
- [ ] Compact mode reduces spacing
- [ ] Reduced motion disables animations
- [ ] Status colors update correctly
- [ ] Settings persist after page reload
- [ ] Settings revert on cancel
- [ ] Reset to defaults works
- [ ] Clear database confirmation works

### Device Testing
- [ ] iPhone (Safari)
- [ ] Android phone (Chrome)
- [ ] iPad (Safari)
- [ ] Android tablet (Chrome)
- [ ] Desktop (Chrome, Firefox, Safari, Edge)

### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Focus indicators visible
- [ ] Color contrast ratios meet WCAG AA
- [ ] Touch targets meet size requirements

## Future Enhancements

1. **Settings Profiles**: Allow users to save and switch between setting profiles
2. **Theme Customization**: Beyond dark/light, allow custom color themes
3. **Layout Presets**: Predefined layouts for different use cases
4. **Sync Settings**: Cloud sync for settings across devices
5. **Advanced Accessibility**: Screen reader optimizations, voice control
6. **Performance Mode**: Reduce visual effects for better performance on older devices
