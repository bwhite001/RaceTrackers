import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../../design-system/utils/classNames';

/**
 * SettingsSection Component
 * 
 * Collapsible section for grouping related settings.
 * 
 * @component
 * @example
 * <SettingsSection
 *   title="Appearance"
 *   icon="🎨"
 *   description="Customize the look and feel"
 *   collapsible={true}
 * >
 *   {children}
 * </SettingsSection>
 */
const SettingsSection = ({
  title,
  icon,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  badge,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between',
          collapsible && 'cursor-pointer select-none'
        )}
        onClick={toggleOpen}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {title}
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-navy-100 dark:bg-navy-900 text-navy-800 dark:text-navy-200 rounded-full">
                  {badge}
                </span>
              )}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {collapsible && (
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
          >
            <svg
              className={cn('w-5 h-5 transition-transform', isOpen && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </section>
  );
};

SettingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  collapsible: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

export default SettingsSection;
