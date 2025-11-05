import React from 'react';
import { cn } from '../../utils/classNames';

/**
 * CardHeader Component
 * Header section for Card component
 */

const CardHeader = ({
  children,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={cn('mb-4', className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {action && <div>{action}</div>}
        </div>
      )}
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
};

export default CardHeader;
