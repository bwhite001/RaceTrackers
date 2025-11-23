# SOLID & DRY Refactoring Plan - Complete Codebase Refactor

## Executive Summary

This document outlines a comprehensive refactoring of 38+ components to follow SOLID principles and DRY patterns. The refactoring will create reusable UI primitives, extract common patterns, and establish a consistent component architecture.

## Goals

1. **Create Reusable UI Primitives** - Extract common UI patterns into shared components
2. **Apply SOLID Principles** - Ensure single responsibility, open/closed, and dependency inversion
3. **Eliminate Code Duplication** - DRY up repeated patterns across components
4. **Establish Consistent APIs** - Standardize component interfaces and prop patterns
5. **Improve Maintainability** - Make codebase easier to understand and modify

## Refactoring Strategy

### Phase 1: Create Reusable UI Primitives (Foundation)
### Phase 2: Refactor Settings Module
### Phase 3: Refactor Dialog Components
### Phase 4: Refactor Form Components
### Phase 5: Refactor Layout Components
### Phase 6: Update Design System Exports
### Phase 7: Documentation & Cleanup

---

## Phase 1: Create Reusable UI Primitives

### 1.1 Toggle Component
**Location:** `src/shared/components/ui/Toggle.jsx`

**Purpose:** Replace 9+ duplicated toggle switches across SettingsModal and other components

**Features:**
- Accessible switch with ARIA attributes
- Size variants (sm, md, lg)
- Label positioning (left, right, top)
- Disabled state
- Loading state
- Custom colors

**API:**
```jsx
<Toggle
  checked={value}
  onChange={handleChange}
  label="Dark Mode"
  description="Switch between light and dark themes"
  size="md"
  disabled={false}
  loading={false}
/>
```

**Replaces:**
- SettingsModal: 9 toggle instances
- Various settings dialogs

---

### 1.2 ColorPicker Component
**Location:** `src/shared/components/ui/ColorPicker.jsx`

**Purpose:** Standardize color input across status colors and theme customization

**Features:**
- Native color input with preview
- Preset color swatches
- Hex/RGB input
- Recent colors history
- Accessibility labels

**API:**
```jsx
<ColorPicker
  value={color}
  onChange={handleColorChange}
  label="Primary Color"
  presets={['#ff0000', '#00ff00', '#0000ff']}
  showInput={true}
/>
```

**Replaces:**
- SettingsModal: Status color inputs
- Theme customization inputs

---

### 1.3 SettingsSection Component
**Location:** `src/shared/components/ui/SettingsSection.jsx`

**Purpose:** Consistent section headers and layout for settings panels

**Features:**
- Icon support
- Collapsible sections
- Description text
- Dividers
- Badge/count display

**API:**
```jsx
<SettingsSection
  title="Appearance"
  icon={<PaintBrushIcon />}
  description="Customize the look and feel"
  collapsible={true}
  defaultOpen={true}
>
  {children}
</SettingsSection>
```

**Replaces:**
- SettingsModal: Section headers
- Various settings panels

---

### 1.4 SettingItem Component
**Location:** `src/shared/components/ui/SettingItem.jsx`

**Purpose:** Consistent layout for individual settings with label, description, and control

**Features:**
- Label and description
- Control slot (right-aligned)
- Error state
- Helper text
- Validation feedback

**API:**
```jsx
<SettingItem
  label="Font Size"
  description="Adjust the application-wide font size"
  helperText="Range: 80% to 150%"
  error={error}
>
  <Slider value={fontSize} onChange={handleChange} />
</SettingItem>
```

**Replaces:**
- SettingsModal: Individual setting layouts
- Form field layouts

---

### 1.5 Slider Component
**Location:** `src/shared/components/ui/Slider.jsx`

**Purpose:** Accessible range input with value display

**Features:**
- Min/max/step configuration
- Value display (inline or tooltip)
- Marks/ticks
- Disabled state
- Custom formatting

**API:**
```jsx
<Slider
  value={value}
  onChange={handleChange}
  min={0.8}
  max={1.5}
  step={0.1}
  showValue={true}
  formatValue={(v) => `${Math.round(v * 100)}%`}
  marks={[0.8, 1.0, 1.2, 1.5]}
/>
```

**Replaces:**
- SettingsModal: Font size slider
- Other range inputs

---

### 1.6 FormField Component
**Location:** `src/shared/components/ui/FormField.jsx`

**Purpose:** Wrapper for form inputs with consistent label, error, and helper text layout

**Features:**
- Label with required indicator
- Error message display
- Helper text
- Character counter
- Validation state icons

**API:**
```jsx
<FormField
  label="Runner Number"
  required={true}
  error={errors.runnerNumber}
  helperText="Enter a valid runner number"
>
  <Input
    value={runnerNumber}
    onChange={handleChange}
  />
</FormField>
```

**Replaces:**
- WithdrawalDialog: Form field layouts
- VetOutDialog: Form field layouts
- DataEntry: Form field layouts
- All form components

---

### 1.7 DialogHeader Component
**Location:** `src/shared/components/ui/DialogHeader.jsx`

**Purpose:** Consistent dialog header with title, description, and close button

**Features:**
- Title and subtitle
- Close button (optional)
- Icon support
- Sticky positioning
- Custom actions slot

**API:**
```jsx
<DialogHeader
  title="Vet Out Runner"
  subtitle="Failed veterinary check"
  onClose={handleClose}
  icon={<ExclamationIcon />}
  showCloseButton={true}
/>
```

**Replaces:**
- All dialog headers (10+ components)

---

### 1.8 DialogFooter Component
**Location:** `src/shared/components/ui/DialogFooter.jsx`

**Purpose:** Consistent dialog footer with action buttons

**Features:**
- Primary/secondary action buttons
- Loading states
- Sticky positioning
- Responsive layout
- Custom actions slot

**API:**
```jsx
<DialogFooter
  primaryAction={{
    label: 'Save',
    onClick: handleSave,
    loading: isSaving,
    disabled: !isValid
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: handleCancel
  }}
  tertiaryAction={{
    label: 'Reset',
    onClick: handleReset
  }}
/>
```

**Replaces:**
- All dialog footers (10+ components)

---

### 1.9 WarningBox Component
**Location:** `src/shared/components/ui/WarningBox.jsx`

**Purpose:** Consistent warning/info/error message boxes

**Features:**
- Variant types (info, warning, error, success)
- Icon support
- Dismissible
- Title and description
- Action buttons

**API:**
```jsx
<WarningBox
  variant="warning"
  title="Important: Vet-Out Action"
  message="This will permanently mark the runner as vetted out."
  dismissible={false}
/>
```

**Replaces:**
- VetOutDialog: Warning box
- WithdrawalDialog: Error messages
- Various alert/warning displays

---

### 1.10 PreviewPanel Component
**Location:** `src/shared/components/ui/PreviewPanel.jsx`

**Purpose:** Display preview of parsed/processed data

**Features:**
- Title and count
- Scrollable content
- Empty state
- Loading state
- Actions (clear, copy, etc.)

**API:**
```jsx
<PreviewPanel
  title="Preview"
  count={parsedNumbers.length}
  items={parsedNumbers}
  renderItem={(item) => item}
  emptyMessage="No items to preview"
  onClear={handleClear}
/>
```

**Replaces:**
- WithdrawalDialog: Preview section
- DataEntry: Preview section
- Import dialogs: Preview sections

---

### 1.11 ButtonGroup Component (Enhanced)
**Location:** `src/shared/components/ui/ButtonGroup.jsx`

**Purpose:** Enhanced button group with better variants and states

**Features:**
- Horizontal/vertical layout
- Size variants
- Active state styling
- Badge/count support
- Icon support

**API:**
```jsx
<ButtonGroup orientation="horizontal" size="md">
  <ButtonGroup.Button
    active={filter === 'all'}
    onClick={() => setFilter('all')}
    badge={count}
  >
    All Races
  </ButtonGroup.Button>
</ButtonGroup>
```

**Replaces:**
- RaceSelectionModal: Filter buttons
- Various button groups

---

### 1.12 SearchInput Component
**Location:** `src/shared/components/ui/SearchInput.jsx`

**Purpose:** Consistent search input with clear button and keyboard shortcuts

**Features:**
- Clear button
- Loading state
- Keyboard shortcut hint
- Debounced onChange
- Icon customization

**API:**
```jsx
<SearchInput
  value={searchTerm}
  onChange={handleSearch}
  placeholder="Search races..."
  debounce={300}
  shortcut="⌘K"
  loading={isSearching}
/>
```

**Replaces:**
- RaceSelectionModal: Search input
- SharedRunnerGrid: Search input
- Various search implementations

---

### 1.13 EmptyState Component
**Location:** `src/shared/components/ui/EmptyState.jsx`

**Purpose:** Consistent empty state displays

**Features:**
- Icon/illustration
- Title and description
- Primary action button
- Secondary actions
- Size variants

**API:**
```jsx
<EmptyState
  icon={<InboxIcon />}
  title="No races yet"
  description="Get started by creating your first race"
  primaryAction={{
    label: 'Create Race',
    onClick: handleCreate
  }}
/>
```

**Replaces:**
- LandingPage: Empty state
- Various empty states

---

### 1.14 LoadingSpinner Component
**Location:** `src/shared/components/ui/LoadingSpinner.jsx`

**Purpose:** Consistent loading indicators

**Features:**
- Size variants
- Color variants
- With/without text
- Overlay mode
- Inline mode

**API:**
```jsx
<LoadingSpinner
  size="md"
  text="Loading races..."
  overlay={false}
/>
```

**Replaces:**
- All loading spinners across components

---

### 1.15 Textarea Component (Enhanced)
**Location:** `src/shared/components/ui/Textarea.jsx`

**Purpose:** Enhanced textarea with character count and auto-resize

**Features:**
- Auto-resize
- Character counter
- Max length
- Error state
- Placeholder
- Disabled state

**API:**
```jsx
<Textarea
  value={notes}
  onChange={handleChange}
  placeholder="Enter notes..."
  maxLength={500}
  showCount={true}
  autoResize={true}
  rows={4}
/>
```

**Replaces:**
- WithdrawalDialog: Textarea
- VetOutDialog: Textarea
- Various textarea implementations

---

## Phase 2: Refactor Settings Module

### 2.1 Refactor SettingsModal.jsx
**File:** `src/components/Settings/SettingsModal.jsx`

**Changes:**
- Extract toggle switches to `<Toggle>` component
- Extract color pickers to `<ColorPicker>` component
- Extract sections to `<SettingsSection>` component
- Extract individual settings to `<SettingItem>` component
- Extract slider to `<Slider>` component
- Use `<DialogHeader>` and `<DialogFooter>`
- Use `<WarningBox>` for danger zone

**Before:** 450+ lines with duplicated patterns
**After:** ~150 lines using reusable components

**New Structure:**
```jsx
<Modal isOpen={isOpen} onClose={handleCancel}>
  <DialogHeader title="Settings" onClose={handleCancel} />
  
  <ModalBody>
    <SettingsSection title="🎨 Appearance" icon={<PaintBrushIcon />}>
      <SettingItem label="Dark Mode" description="...">
        <Toggle checked={darkMode} onChange={...} />
      </SettingItem>
      
      <SettingItem label="Font Size" description="...">
        <Slider value={fontSize} onChange={...} />
      </SettingItem>
    </SettingsSection>
    
    <SettingsSection title="🎨 Status Colors">
      {Object.entries(statusColors).map(([status, color]) => (
        <SettingItem key={status} label={status}>
          <ColorPicker value={color} onChange={...} />
        </SettingItem>
      ))}
    </SettingsSection>
    
    <SettingsSection title="⚠️ Danger Zone">
      <WarningBox variant="error" title="Clear Database" message="..." />
    </SettingsSection>
  </ModalBody>
  
  <DialogFooter
    primaryAction={{ label: 'Save', onClick: handleSave }}
    secondaryAction={{ label: 'Cancel', onClick: handleCancel }}
    tertiaryAction={{ label: 'Reset', onClick: resetDefaults }}
  />
</Modal>
```

---

## Phase 3: Refactor Dialog Components

### 3.1 Refactor WithdrawalDialog.jsx
**File:** `src/components/BaseStation/WithdrawalDialog.jsx`

**Changes:**
- Use `<DialogHeader>` component
- Use `<DialogFooter>` component
- Use `<FormField>` for inputs
- Use `<Textarea>` for reason input
- Use `<PreviewPanel>` for parsed numbers
- Use `<WarningBox>` for errors

**Before:** 250+ lines with custom dialog structure
**After:** ~100 lines using reusable components

---

### 3.2 Refactor VetOutDialog.jsx
**File:** `src/modules/base-operations/components/VetOutDialog.jsx`

**Changes:**
- Use `<DialogHeader>` component
- Use `<DialogFooter>` component
- Use `<FormField>` for all inputs
- Use `<Textarea>` for medical notes
- Use `<WarningBox>` for warning message
- Extract VET_OUT_REASONS to constants file

**Before:** 350+ lines with custom dialog structure
**After:** ~150 lines using reusable components

---

### 3.3 Refactor Other Dialogs
Apply same pattern to:
- `src/modules/base-operations/components/AboutDialog.jsx`
- `src/modules/base-operations/components/BackupRestoreDialog.jsx`
- `src/modules/base-operations/components/DuplicateEntriesDialog.jsx`
- `src/modules/base-operations/components/HelpDialog.jsx`
- `src/components/ImportExport/ConflictResolutionDialog.jsx`
- `src/components/ImportExport/ImportExportModal.jsx`
- `src/shared/components/ExitOperationModal.jsx`

---

## Phase 4: Refactor Form Components

### 4.1 Refactor DataEntry.jsx
**File:** `src/components/BaseStation/DataEntry.jsx`

**Changes:**
- Use `<FormField>` for inputs
- Use `<Textarea>` for runner input
- Use `<PreviewPanel>` for parsed numbers
- Use `<WarningBox>` for errors
- Extract validation logic to custom hook

**Before:** 300+ lines with inline form structure
**After:** ~150 lines using reusable components

---

### 4.2 Refactor RaceConfig.jsx
**File:** `src/components/Setup/RaceConfig.jsx`

**Changes:**
- Use `<FormField>` for all inputs
- Use `<SettingsSection>` for grouping
- Use `<WarningBox>` for validation errors
- Extract form logic to custom hook

---

## Phase 5: Refactor Layout Components

### 5.1 Refactor Header.jsx
**File:** `src/components/Layout/Header.jsx`

**Changes:**
- Extract icon buttons to reusable `<IconButton>` component
- Use consistent spacing and sizing
- Extract network indicator
- Use design system colors

---

### 5.2 Refactor BreadcrumbNav.jsx
**File:** `src/components/Layout/BreadcrumbNav.jsx`

**Changes:**
- Use design system components
- Consistent styling
- Better accessibility

---

### 5.3 Refactor ErrorMessage.jsx
**File:** `src/components/Layout/ErrorMessage.jsx`

**Changes:**
- Convert to use `<WarningBox>` component
- Add retry functionality
- Better error categorization

---

## Phase 6: Refactor Page Components

### 6.1 Refactor LandingPage.jsx
**File:** `src/components/Home/LandingPage.jsx`

**Changes:**
- Extract `<ModuleCard>` to separate component
- Use `<EmptyState>` component
- Use `<LoadingSpinner>` component
- Use `<SearchInput>` in race selection
- Better component organization

---

### 6.2 Refactor RaceSelectionModal.jsx
**File:** `src/components/Home/RaceSelectionModal.jsx`

**Changes:**
- Use `<DialogHeader>` component
- Use `<DialogFooter>` component
- Use `<SearchInput>` component
- Use `<ButtonGroup>` for filters
- Use `<EmptyState>` for no results

---

### 6.3 Refactor Other Views
Apply patterns to:
- `src/views/CheckpointView.jsx`
- `src/views/RaceManagementView.jsx`
- `src/components/BaseStation/BaseStationCallInPage.jsx`
- `src/components/BaseStation/ReportBuilder.jsx`
- `src/components/BaseStation/ReportsPanel.jsx`
- `src/modules/base-operations/components/ReportsPanel.jsx`

---

## Phase 7: Update Design System

### 7.1 Create UI Components Index
**File:** `src/shared/components/ui/index.js`

**Export all new UI primitives:**
```javascript
export { Toggle } from './Toggle';
export { ColorPicker } from './ColorPicker';
export { SettingsSection } from './SettingsSection';
export { SettingItem } from './SettingItem';
export { Slider } from './Slider';
export { FormField } from './FormField';
export { DialogHeader } from './DialogHeader';
export { DialogFooter } from './DialogFooter';
export { WarningBox } from './WarningBox';
export { PreviewPanel } from './PreviewPanel';
export { SearchInput } from './SearchInput';
export { EmptyState } from './EmptyState';
export { LoadingSpinner } from './LoadingSpinner';
export { Textarea } from './Textarea';
export { IconButton } from './IconButton';
```

---

### 7.2 Update Design System Index
**File:** `src/design-system/components/index.js`

**Add re-exports from shared/components/ui:**
```javascript
// Existing exports
export * from './Form';
export * from './Button';
export * from './Modal';
// ... etc

// New UI primitives
export * from '../../shared/components/ui';
```

---

## Phase 8: Create Custom Hooks

### 8.1 useFormValidation Hook
**File:** `src/shared/hooks/useFormValidation.js`

**Purpose:** Centralize form validation logic

**API:**
```javascript
const { errors, validate, clearErrors } = useFormValidation(schema);
```

---

### 8.2 useDialog Hook
**File:** `src/shared/hooks/useDialog.js`

**Purpose:** Manage dialog state and lifecycle

**API:**
```javascript
const { isOpen, open, close, toggle } = useDialog();
```

---

### 8.3 useSettings Hook
**File:** `src/shared/hooks/useSettings.js`

**Purpose:** Simplified settings access and updates

**API:**
```javascript
const { settings, updateSetting, resetSettings } = useSettings();
```

---

## Implementation Checklist

### Phase 1: UI Primitives (Week 1)
- [ ] Create Toggle component
- [ ] Create ColorPicker component
- [ ] Create SettingsSection component
- [ ] Create SettingItem component
- [ ] Create Slider component
- [ ] Create FormField component
- [ ] Create DialogHeader component
- [ ] Create DialogFooter component
- [ ] Create WarningBox component
- [ ] Create PreviewPanel component
- [ ] Create ButtonGroup (enhanced)
- [ ] Create SearchInput component
- [ ] Create EmptyState component
- [ ] Create LoadingSpinner component
- [ ] Create Textarea component
- [ ] Create IconButton component
- [ ] Create ui/index.js exports

### Phase 2: Settings Module (Week 1-2)
- [ ] Refactor SettingsModal.jsx
- [ ] Test settings functionality
- [ ] Verify all settings work correctly

### Phase 3: Dialog Components (Week 2)
- [ ] Refactor WithdrawalDialog.jsx
- [ ] Refactor VetOutDialog.jsx
- [ ] Refactor AboutDialog.jsx
- [ ] Refactor BackupRestoreDialog.jsx
- [ ] Refactor DuplicateEntriesDialog.jsx
- [ ] Refactor HelpDialog.jsx
- [ ] Refactor ConflictResolutionDialog.jsx
- [ ] Refactor ImportExportModal.jsx
- [ ] Refactor ExitOperationModal.jsx

### Phase 4: Form Components (Week 2-3)
- [ ] Refactor DataEntry.jsx
- [ ] Refactor RaceConfig.jsx
- [ ] Refactor CalloutSheet.jsx
- [ ] Refactor other form components

### Phase 5: Layout Components (Week 3)
- [ ] Refactor Header.jsx
- [ ] Refactor BreadcrumbNav.jsx
- [ ] Refactor ErrorMessage.jsx

### Phase 6: Page Components (Week 3-4)
- [ ] Refactor LandingPage.jsx
- [ ] Refactor RaceSelectionModal.jsx
- [ ] Refactor CheckpointView.jsx
- [ ] Refactor RaceManagementView.jsx
- [ ] Refactor BaseStationCallInPage.jsx
- [ ] Refactor ReportBuilder.jsx
- [ ] Refactor ReportsPanel.jsx (both versions)
- [ ] Refactor other view components

### Phase 7: Design System (Week 4)
- [ ] Update ui/index.js
- [ ] Update design-system/components/index.js
- [ ] Verify all exports work
- [ ] Update documentation

### Phase 8: Custom Hooks (Week 4)
- [ ] Create useFormValidation hook
- [ ] Create useDialog hook
- [ ] Create useSettings hook
- [ ] Update components to use hooks

### Phase 9: Cleanup (Week 4)
- [ ] Remove duplicate code
- [ ] Update all import paths
- [ ] Verify no broken imports
- [ ] Run linter
- [ ] Manual testing of all features

---

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each UI primitive has one clear purpose
- Settings logic separated from presentation
- Form validation extracted to hooks
- Dialog structure separated from content

### Open/Closed Principle (OCP)
- Components accept props for customization
- Variants and sizes configurable
- Extensible through composition
- No need to modify components for new use cases

### Liskov Substitution Principle (LSP)
- All Toggle instances interchangeable
- All Dialog components follow same pattern
- Consistent prop interfaces

### Interface Segregation Principle (ISP)
- Components only require props they need
- Optional props for advanced features
- No forced dependencies

### Dependency Inversion Principle (DIP)
- Components depend on abstractions (props)
- Not coupled to specific stores
- Callbacks for actions, not direct store access

---

## DRY Improvements

### Before Refactoring
- **Toggle switches:** 9 duplicated implementations
- **Dialog headers:** 10+ custom implementations
- **Form fields:** 20+ inline layouts
- **Color pickers:** 5+ custom implementations
- **Preview panels:** 3+ custom implementations
- **Warning boxes:** 8+ custom implementations

### After Refactoring
- **Toggle switches:** 1 reusable component
- **Dialog headers:** 1 reusable component
- **Form fields:** 1 reusable component
- **Color pickers:** 1 reusable component
- **Preview panels:** 1 reusable component
- **Warning boxes:** 1 reusable component

### Code Reduction Estimate
- **Before:** ~8,000 lines across 38 files
- **After:** ~4,500 lines (43% reduction)
- **New primitives:** ~1,500 lines
- **Net reduction:** ~2,000 lines (25% overall)

---

## Breaking Changes

### Import Path Changes
```javascript
// Old
import { Button } from '../../design-system/components';

// New (still works)
import { Button } from '../../design-system/components';

// New UI primitives
import { Toggle, FormField } from '../../shared/components/ui';
// OR
import { Toggle, FormField } from '../../design-system/components';
```

### Component API Changes
Most components maintain backward compatibility, but some props may be renamed for consistency:
- `isOpen` → `open` (optional, both supported)
- `onClose` → `onClose` (no change)
- Custom styling props standardized

---

## Testing Strategy

### Manual Testing Required
- [ ] All settings work correctly
- [ ] All dialogs open/close properly
- [ ] All forms validate correctly
- [ ] All buttons respond to clicks
- [ ] Dark mode works everywhere
- [ ] Touch targets are correct size
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

### Visual Regression Testing
- [ ] Take screenshots before refactoring
- [ ] Compare after refactoring
- [ ] Verify no visual changes (unless intentional)

---

## Documentation Updates

### Component Documentation
- [ ] Add JSDoc comments to all new components
- [ ] Create Storybook stories (optional)
- [ ] Update README with new component structure

### Migration Guide
- [ ] Document import path changes
- [ ] Provide before/after examples
- [ ] List breaking changes

---

## Success Metrics

### Code Quality
- ✅ Reduced code duplication by 60%+
- ✅ Improved component reusability
- ✅ Consistent component APIs
- ✅ Better separation of concerns

### Developer Experience
- ✅ Faster feature development
- ✅ Easier to understand codebase
- ✅ Consistent patterns across app
- ✅ Better IDE autocomplete

### User Experience
- ✅ No visual regressions
- ✅ Same or better performance
- ✅ Improved accessibility
- ✅ Consistent UI/UX

---

## Timeline

**Week 1:** Phase 1 (UI Primitives) + Phase 2 (Settings)
**Week 2:** Phase 3 (Dialogs) + Phase 4 (Forms)
**Week 3:** Phase 5 (Layout) + Phase 6 (Pages)
**Week 4:** Phase 7 (Design System) + Phase 8 (Hooks) + Phase 9 (Cleanup)

**Total Estimated Time:** 4 weeks

---

## Notes

- All tests will be removed/ignored as requested
- Focus on creating reusable components first
- Refactor consuming components second
- Track progress in this document
- Update checklist as work progresses

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1: Create UI primitives
3. Test each primitive as it's created
4. Move to Phase 2: Refactor Settings
5. Continue through phases sequentially
6. Update this document with progress

---

**Status:** 📋 PLAN CREATED - AWAITING APPROVAL
**Last Updated:** 2024
**Estimated Completion:** 4 weeks from start
