# StandardModal Usage Guide

## Overview

The `StandardModal` component is a standardized, reusable modal wrapper that follows SOLID and DRY principles. It combines the design system's `Modal`, `DialogHeader`, and `DialogFooter` components into a single, easy-to-use component with consistent styling and behavior.

## Benefits

1. **DRY (Don't Repeat Yourself)**: Eliminates repetitive modal boilerplate code
2. **SOLID Principles**: Single responsibility, open for extension
3. **Consistency**: All modals have the same look, feel, and behavior
4. **Full-Width Design**: Responsive with max-w-7xl by default (customizable)
5. **Prominent Close Button**: Large, easy-to-click close button (w-7 h-7)
6. **Accessibility**: Built-in keyboard shortcuts, focus management, ARIA labels
7. **Flexibility**: Highly customizable while maintaining consistency

## Basic Usage

```jsx
import { StandardModal } from '../../../shared/components/ui';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="My Dialog Title"
      subtitle="Optional subtitle"
      primaryAction={{
        label: 'Save',
        onClick: handleSave,
        disabled: !isValid
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => setIsOpen(false)
      }}
    >
      {/* Your content here */}
      <div className="space-y-4">
        <p>Dialog content goes here</p>
      </div>
    </StandardModal>
  );
}
```

## Props Reference

### Modal Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | required | Whether modal is visible |
| `onClose` | function | required | Callback when modal closes |
| `size` | string | `'2xl'` | Modal size: 'sm', 'md', 'lg', 'xl', '2xl', 'full' |
| `closeOnBackdropClick` | boolean | `true` | Close when clicking outside |
| `closeOnEsc` | boolean | `true` | Close on ESC key |
| `showCloseButton` | boolean | `true` | Show X button in top-right |

### Header Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Modal title |
| `subtitle` | string | optional | Subtitle below title |
| `icon` | node | optional | Icon element to display |
| `headerActions` | node | optional | Additional header buttons |
| `stickyHeader` | boolean | `true` | Header stays visible when scrolling |

### Footer Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `primaryAction` | object | optional | Primary button config |
| `secondaryAction` | object | optional | Secondary button config |
| `tertiaryAction` | object | optional | Tertiary button config |
| `footerAlign` | string | `'end'` | Button alignment: 'start', 'center', 'end', 'between' |
| `stickyFooter` | boolean | `false` | Footer stays visible when scrolling |
| `showFooter` | boolean | `true` | Whether to show footer |

### Action Button Config

```typescript
{
  label: string;        // Button text
  onClick: function;    // Click handler
  disabled?: boolean;   // Disable button
  loading?: boolean;    // Show loading spinner
  variant?: string;     // 'primary', 'danger', 'success', 'warning'
}
```

### Content & Styling

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | node | required | Modal content |
| `className` | string | optional | Additional modal classes |
| `bodyClassName` | string | optional | Additional body classes |

## Size Guide

- **sm** (max-w-md): Small dialogs, simple confirmations
- **md** (max-w-2xl): Medium dialogs, forms with few fields
- **lg** (max-w-4xl): Large dialogs, detailed forms
- **xl** (max-w-6xl): Extra large, complex content
- **2xl** (max-w-7xl): **Default**, full-featured dialogs
- **full** (max-w-[95vw]): Nearly full screen

## Examples

### Simple Confirmation Dialog

```jsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  subtitle="This action cannot be undone"
  size="md"
  primaryAction={{
    label: 'Confirm',
    onClick: handleConfirm,
    variant: 'danger'
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: onClose
  }}
>
  <p>Are you sure you want to proceed?</p>
</StandardModal>
```

### Form Dialog with Validation

```jsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Edit Runner"
  subtitle="Update runner information"
  size="lg"
  primaryAction={{
    label: 'Save Changes',
    onClick: handleSubmit,
    disabled: !isValid,
    loading: isSubmitting
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: onClose
  }}
>
  <form className="space-y-4">
    <div>
      <label className="form-label">Runner Number</label>
      <input type="text" className="form-input" />
    </div>
    <div>
      <label className="form-label">Status</label>
      <select className="form-input">
        <option>Active</option>
        <option>Withdrawn</option>
      </select>
    </div>
  </form>
</StandardModal>
```

### Dialog with Icon and Three Actions

```jsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Backup & Restore"
  subtitle="Manage your race data"
  icon={
    <svg className="w-6 h-6 text-blue-500">
      {/* icon path */}
    </svg>
  }
  size="xl"
  footerAlign="between"
  tertiaryAction={{
    label: 'Reset to Defaults',
    onClick: handleReset
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: onClose
  }}
  primaryAction={{
    label: 'Create Backup',
    onClick: handleBackup,
    variant: 'success'
  }}
>
  {/* Complex backup/restore UI */}
</StandardModal>
```

### Full-Width Dialog with Sticky Footer

```jsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Race Overview"
  subtitle="Complete race statistics and reports"
  size="full"
  stickyFooter={true}
  primaryAction={{
    label: 'Export Report',
    onClick: handleExport
  }}
>
  <div className="space-y-6">
    {/* Large tables, charts, etc. */}
  </div>
</StandardModal>
```

### Dialog Without Footer

```jsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Help Documentation"
  size="xl"
  showFooter={false}
>
  <div className="prose dark:prose-invert">
    {/* Documentation content */}
  </div>
</StandardModal>
```

## Migration Guide

### Before (Custom Modal)

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
    <div className="flex items-center justify-between p-6 border-b">
      <h2 className="text-xl font-bold">Title</h2>
      <button onClick={onClose}>
        <svg className="w-6 h-6">...</svg>
      </button>
    </div>
    <div className="p-6">
      {/* Content */}
    </div>
    <div className="flex justify-end p-6 border-t">
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button onClick={handleSave} className="btn-primary">Save</button>
    </div>
  </div>
</div>
```

### After (StandardModal)

```jsx
<StandardModal
  isOpen={isOpen}
  onClose={onClose}
  title="Title"
  primaryAction={{ label: 'Save', onClick: handleSave }}
  secondaryAction={{ label: 'Cancel', onClick: onClose }}
>
  {/* Content */}
</StandardModal>
```

**Lines of code reduced: ~20 lines → ~8 lines (60% reduction)**

## Best Practices

1. **Always provide a title**: Required for accessibility
2. **Use appropriate sizes**: Don't use 'full' unless necessary
3. **Provide clear action labels**: "Save Changes" not just "Save"
4. **Handle loading states**: Use `loading` prop on actions
5. **Validate before enabling**: Use `disabled` prop appropriately
6. **Consider mobile**: Test on small screens
7. **Use subtitles**: Provide context for complex operations
8. **Sticky headers**: Keep enabled for long content
9. **Consistent button order**: Primary on right, secondary on left
10. **Close on success**: Call `onClose()` after successful operations

## Accessibility Features

- **Keyboard Navigation**: Tab through focusable elements
- **ESC to Close**: Press ESC key to close modal
- **Focus Trap**: Focus stays within modal
- **Focus Restoration**: Returns focus to trigger element
- **ARIA Labels**: Proper `role="dialog"` and `aria-modal`
- **Screen Reader Support**: Semantic HTML structure
- **Touch Targets**: 44x44px minimum (touch-target class)

## Styling Customization

### Custom Body Styling

```jsx
<StandardModal
  bodyClassName="bg-gray-50 dark:bg-gray-900"
  // ...
>
```

### Custom Modal Styling

```jsx
<StandardModal
  className="border-4 border-blue-500"
  // ...
>
```

## Common Patterns

### Confirmation with Warning

```jsx
<StandardModal
  title="Delete Race"
  subtitle="This action cannot be undone"
  primaryAction={{
    label: 'Delete',
    onClick: handleDelete,
    variant: 'danger'
  }}
>
  <WarningBox
    variant="error"
    title="Warning"
    message="All race data will be permanently deleted."
  />
</StandardModal>
```

### Multi-Step Form

```jsx
<StandardModal
  title={`Step ${step} of 3`}
  primaryAction={{
    label: step === 3 ? 'Finish' : 'Next',
    onClick: handleNext
  }}
  secondaryAction={{
    label: step === 1 ? 'Cancel' : 'Back',
    onClick: step === 1 ? onClose : handleBack
  }}
>
  {renderStep(step)}
</StandardModal>
```

## Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StandardModal } from '../../../shared/components/ui';

test('closes on ESC key', () => {
  const onClose = jest.fn();
  render(
    <StandardModal isOpen={true} onClose={onClose} title="Test">
      Content
    </StandardModal>
  );
  
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});
```

## Troubleshooting

### Modal not closing
- Check `closeOnEsc` and `closeOnBackdropClick` props
- Verify `onClose` function is provided
- Check for event.preventDefault() in child components

### Content overflow
- Use `bodyClassName` to add custom scrolling
- Consider using a smaller `size`
- Enable `stickyHeader` and `stickyFooter`

### Styling conflicts
- Check for conflicting global styles
- Use `className` prop for modal-level overrides
- Use `bodyClassName` for content-level overrides

## Support

For issues or questions:
1. Check this guide
2. Review existing modal implementations
3. Check design system documentation
4. Consult SOLID_DRY_IMPLEMENTATION_GUIDE.md
