import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../../design-system/components';
import { cn } from '../../../design-system/utils/classNames';

/**
 * DialogFooter Component
 * 
 * Consistent footer for dialogs with action buttons.
 * Replaces 10+ custom dialog footer implementations.
 * 
 * @component
 * @example
 * <DialogFooter
 *   primaryAction={{
 *     label: 'Save',
 *     onClick: handleSave,
 *     loading: isSaving
 *   }}
 *   secondaryAction={{
 *     label: 'Cancel',
 *     onClick: handleCancel
 *   }}
 * />
 */
const DialogFooter = ({
  primaryAction,
  secondaryAction,
  tertiaryAction,
  sticky = true,
  align = 'right',
  className,
  children,
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-900',
        sticky && 'sticky bottom-0',
        alignmentClasses[align],
        className
      )}
    >
      {/* Custom Children (left side) */}
      {children && <div className="flex-1">{children}</div>}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {tertiaryAction && (
          <button
            type="button"
            onClick={tertiaryAction.onClick}
            disabled={tertiaryAction.disabled || tertiaryAction.loading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300',
              'hover:text-gray-900 dark:hover:text-white transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'touch-target'
            )}
            {...tertiaryAction.props}
          >
            {tertiaryAction.loading ? 'Loading...' : tertiaryAction.label}
          </button>
        )}

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled || secondaryAction.loading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300',
              'rounded-md shadow-sm hover:bg-gray-50',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500',
              'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'touch-target'
            )}
            {...secondaryAction.props}
          >
            {secondaryAction.loading ? 'Loading...' : secondaryAction.label}
          </button>
        )}

        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'touch-target',
              primaryAction.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            )}
            {...primaryAction.props}
          >
            {primaryAction.loading ? 'Loading...' : primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

DialogFooter.propTypes = {
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    variant: PropTypes.oneOf(['primary', 'danger']),
    props: PropTypes.object,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    props: PropTypes.object,
  }),
  tertiaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    props: PropTypes.object,
  }),
  sticky: PropTypes.bool,
  align: PropTypes.oneOf(['left', 'center', 'right', 'between']),
  className: PropTypes.string,
  children: PropTypes.node,
};

export default DialogFooter;
