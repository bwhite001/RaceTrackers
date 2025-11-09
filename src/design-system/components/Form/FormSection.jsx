import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '../Badge';

const FormSection = ({ 
  icon: Icon, 
  title, 
  description, 
  required, 
  children,
  className = ''
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <Icon className="w-5 h-5 text-primary-500" />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
            {title}
          </h3>
          {required && (
            <Badge variant="danger" size="sm">Required</Badge>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

FormSection.propTypes = {
  /** Icon component to display (optional) */
  icon: PropTypes.elementType,
  /** Section title */
  title: PropTypes.string.isRequired,
  /** Optional description text */
  description: PropTypes.string,
  /** Whether the section contains required fields */
  required: PropTypes.bool,
  /** Section content */
  children: PropTypes.node.isRequired,
  /** Additional CSS classes */
  className: PropTypes.string
};

export default FormSection;
