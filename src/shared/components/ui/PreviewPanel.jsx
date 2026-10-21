import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * PreviewPanel Component
 * 
 * Data preview display with formatting options.
 * 
 * @component
 * @example
 * <PreviewPanel
 *   title="Preview"
 *   data={parsedNumbers}
 *   count={parsedNumbers.length}
 *   formatData={(data) => data.join(', ')}
 * />
 */
const PreviewPanel = ({
  title,
  data,
  count,
  formatData,
  emptyMessage = 'No data to preview',
  variant = 'default',
  className,
  children,
}) => {
  const variants = {
    default: 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700',
    info: 'bg-navy-50 dark:bg-navy-900/20 border-navy-200 dark:border-navy-800',
    success: 'bg-navy-50 dark:bg-navy-900/20 border-navy-200 dark:border-navy-800',
    warning: 'bg-gold-50 dark:bg-gold-900/20 border-gold-200 dark:border-gold-800',
  };

  const hasData = data && (Array.isArray(data) ? data.length > 0 : true);
  const displayData = formatData && data ? formatData(data) : data;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        variants[variant],
        className
      )}
    >
      {/* Header */}
      {(title || count !== undefined) && (
        <div className="flex items-center justify-between mb-2">
          {title && (
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {title}
              {count !== undefined && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  ({count} {count === 1 ? 'item' : 'items'})
                </span>
              )}
            </h3>
          )}
        </div>
      )}

      {/* Content */}
      {hasData ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {children || (
            <div className="whitespace-pre-wrap break-words">
              {typeof displayData === 'string' ? displayData : JSON.stringify(displayData, null, 2)}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {emptyMessage}
        </p>
      )}
    </div>
  );
};

PreviewPanel.propTypes = {
  title: PropTypes.string,
  data: PropTypes.any,
  count: PropTypes.number,
  formatData: PropTypes.func,
  emptyMessage: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'info', 'success', 'warning']),
  className: PropTypes.string,
  children: PropTypes.node,
};

export default PreviewPanel;
