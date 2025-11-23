import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * EmptyState Component
 * 
 * Empty state displays with icons and actions.
 * 
 * @component
 * @example
 * <EmptyState
 *   icon={<InboxIcon />}
 *   title="No runners found"
 *   description="Try adjusting your search or filters"
 *   action={{ label: 'Clear filters', onClick: handleClear }}
 * />
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
  children,
}) => {
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20',
      title: 'text-xl',
      description: 'text-lg',
    },
  };

  const sizeClasses = sizes[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses.container,
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className={cn('text-gray-400 dark:text-gray-500 mb-4', sizeClasses.icon)}>
          {icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3 className={cn('font-semibold text-gray-900 dark:text-white mb-2', sizeClasses.title)}>
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className={cn('text-gray-500 dark:text-gray-400 mb-6 max-w-md', sizeClasses.description)}>
          {description}
        </p>
      )}

      {/* Custom Children */}
      {children && <div className="mb-6">{children}</div>}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                'px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white',
                'rounded-lg font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2',
                'touch-target'
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={cn(
                'px-4 py-2 text-gray-700 dark:text-gray-300',
                'hover:text-gray-900 dark:hover:text-white',
                'font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2',
                'touch-target'
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node,
};

export default EmptyState;
