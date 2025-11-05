import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/classNames';

/**
 * Container Component
 * 
 * Provides consistent page width and padding across the application.
 * Supports multiple max-width variants and padding options.
 * 
 * @component
 * @example
 * ```jsx
 * <Container maxWidth="lg" padding="normal">
 *   <h1>Page Content</h1>
 * </Container>
 * ```
 */
const Container = ({
  children,
  maxWidth = 'xl',
  padding = 'normal',
  centered = true,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  // Max-width variants
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',    // 640px
    md: 'max-w-screen-md',    // 768px
    lg: 'max-w-screen-lg',    // 1024px
    xl: 'max-w-screen-xl',    // 1280px
    '2xl': 'max-w-screen-2xl', // 1536px
    full: 'max-w-full',       // 100%
  };

  // Padding variants
  const paddingClasses = {
    none: '',
    tight: 'px-2 sm:px-3',
    normal: 'px-4 sm:px-6 lg:px-8',
    relaxed: 'px-6 sm:px-8 lg:px-12',
    loose: 'px-8 sm:px-12 lg:px-16',
  };

  const containerClasses = cn(
    // Base styles
    'w-full',
    
    // Max-width
    maxWidthClasses[maxWidth],
    
    // Padding
    paddingClasses[padding],
    
    // Centering
    centered && 'mx-auto',
    
    // Custom classes
    className
  );

  return (
    <Component className={containerClasses} {...props}>
      {children}
    </Component>
  );
};

Container.propTypes = {
  /** Content to be contained */
  children: PropTypes.node.isRequired,
  
  /** Maximum width of the container */
  maxWidth: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', 'full']),
  
  /** Padding size */
  padding: PropTypes.oneOf(['none', 'tight', 'normal', 'relaxed', 'loose']),
  
  /** Whether to center the container horizontally */
  centered: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** HTML element or React component to render as */
  as: PropTypes.elementType,
};

export default Container;
