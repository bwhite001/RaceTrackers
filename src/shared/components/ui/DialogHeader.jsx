import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * DialogHeader Component
 * 
 * Consistent header for dialogs with title, subtitle, and close button.
 * Replaces 10+ custom dialog header implementations.
 * 
 * @component
 * @example
 * <DialogHeader
 *   title="Vet Out Runner"
 *   subtitle="Failed veterinary check"
 *   onClose={handleClose}
 *   icon={<ExclamationIcon />}
 * />
 */
const DialogHeader = ({
  title,
  subtitle,
  icon,
  onClose,
  showCloseButton = true,
  sticky = true,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800',
        sticky && 'sticky top-0 z-10',
        className
      )}
    >
      {/* Title Section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-2 ml-4">
        {actions}
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'rounded-lg transition-all',
              'focus:outline-none focus:ring-2 focus:ring-navy-500',
              'touch-target'
            )}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

DialogHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
  sticky: PropTypes.bool,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default DialogHeader;
