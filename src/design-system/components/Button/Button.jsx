import React from 'react';
import { cn } from '../../utils/classNames';
import { getVariant, getSize, combineVariants } from '../../utils/variants';

/**
 * Button Component
 * A flexible button component following SOLID principles
 * 
 * @component
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 */

// Button variant styles
const buttonVariants = {
  primary: 'bg-navy-900 hover:bg-navy-800 active:bg-navy-900 text-white shadow-md hover:shadow-lg dark:bg-navy-800 dark:hover:bg-navy-700',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
  danger: 'bg-accent-red-600 hover:bg-accent-red-700 active:bg-accent-red-600 text-white shadow-md hover:shadow-lg',
  success: 'bg-green-600 hover:bg-green-700 active:bg-green-600 text-white shadow-md hover:shadow-lg',
  warning: 'bg-gold-500 hover:bg-gold-600 active:bg-gold-500 text-white shadow-md hover:shadow-lg',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-200',
  outline: 'border border-slate-300 bg-transparent hover:bg-slate-50 active:bg-slate-100 text-slate-900 dark:border-navy-600 dark:text-navy-400 dark:hover:bg-navy-800 dark:hover:text-white',
  subtle: 'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-900/40',
  link: 'bg-transparent hover:underline text-navy-900 dark:text-navy-400 p-0',
};

// Button size styles
const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

// Base button styles
const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none hover:-translate-y-px active:translate-y-0';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const variantClasses = getVariant(buttonVariants, variant, 'primary');
  const sizeClasses = getSize(buttonSizes, size, 'md');
  const widthClass = fullWidth ? 'w-full' : '';
  
  const buttonClasses = cn(
    baseStyles,
    variantClasses,
    sizeClasses,
    widthClass,
    className
  );

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
