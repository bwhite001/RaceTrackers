import React from 'react';
import { cn } from '../../utils/classNames';

/**
 * CardFooter Component
 * Footer section for Card component, typically for actions
 */

const CardFooter = ({
  children,
  className = '',
  align = 'right',
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn(
      'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center',
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

export default CardFooter;
