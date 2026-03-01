import React from 'react';
import { cn } from '../../utils/classNames';

/**
 * Card Component
 * A flexible card container following SOLID principles
 * 
 * @component
 * @example
 * <Card variant="elevated" hoverable>
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 * </Card>
 */

const cardVariants = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-md',
  bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
  flat: 'bg-gray-50 dark:bg-gray-900',
};

const Card = ({
  children,
  variant = 'default',
  hoverable = false,
  clickable = false,
  padding = 'normal',
  className = '',
  onClick,
  ...props
}) => {
  const variantClass = cardVariants[variant] || cardVariants.default;
  
  const paddingClasses = {
    none: '',
    tight: 'p-3',
    normal: 'p-6',
    relaxed: 'p-8',
  };

  const interactiveClasses = cn(
    hoverable && 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
    clickable && 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200'
  );

  return (
    <div
      className={cn(
        'rounded-lg',
        variantClass,
        paddingClasses[padding],
        interactiveClasses,
        className
      )}
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
