import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Section Component
 * 
 * Provides consistent spacing and styling for page sections.
 * Supports multiple spacing variants, background colors, and border options.
 * 
 * @component
 * @example
 * ```jsx
 * <Section spacing="normal" background="white" border="bottom">
 *   <h2>Section Title</h2>
 *   <p>Section content...</p>
 * </Section>
 * ```
 */
const Section = ({
  children,
  spacing = 'normal',
  background = 'transparent',
  border = 'none',
  className = '',
  as: Component = 'section',
  ...props
}) => {
  // Spacing variants (vertical padding)
  const spacingClasses = {
    none: '',
    tight: 'py-4 sm:py-6',
    normal: 'py-6 sm:py-8 lg:py-12',
    relaxed: 'py-8 sm:py-12 lg:py-16',
    loose: 'py-12 sm:py-16 lg:py-24',
  };

  // Background variants
  const backgroundClasses = {
    transparent: '',
    white: 'bg-white dark:bg-gray-900',
    gray: 'bg-gray-50 dark:bg-gray-800',
    'gray-light': 'bg-gray-100 dark:bg-gray-800',
    navy: 'bg-navy-900 text-white',
    'navy-light': 'bg-navy-800 text-white',
    accent: 'bg-accent-600 text-white',
    gold: 'bg-gold-500 text-navy-900',
  };

  // Border variants
  const borderClasses = {
    none: '',
    top: 'border-t border-gray-200 dark:border-gray-700',
    bottom: 'border-b border-gray-200 dark:border-gray-700',
    both: 'border-y border-gray-200 dark:border-gray-700',
    all: 'border border-gray-200 dark:border-gray-700',
  };

  const sectionClasses = cn(
    // Base styles
    'w-full',
    
    // Spacing
    spacingClasses[spacing],
    
    // Background
    backgroundClasses[background],
    
    // Border
    borderClasses[border],
    
    // Custom classes
    className
  );

  return (
    <Component className={sectionClasses} {...props}>
      {children}
    </Component>
  );
};

Section.propTypes = {
  /** Content of the section */
  children: PropTypes.node.isRequired,
  
  /** Vertical spacing (padding) */
  spacing: PropTypes.oneOf(['none', 'tight', 'normal', 'relaxed', 'loose']),
  
  /** Background color variant */
  background: PropTypes.oneOf([
    'transparent',
    'white',
    'gray',
    'gray-light',
    'navy',
    'navy-light',
    'accent',
    'gold',
  ]),
  
  /** Border position */
  border: PropTypes.oneOf(['none', 'top', 'bottom', 'both', 'all']),
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** HTML element or React component to render as */
  as: PropTypes.elementType,
};

export default Section;
