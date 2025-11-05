import React from 'react';
import { cn } from '../../utils/classNames';

/**
 * CardBody Component
 * Main content area for Card component
 */

const CardBody = ({
  children,
  className = '',
}) => {
  return (
    <div className={cn('text-gray-700 dark:text-gray-300', className)}>
      {children}
    </div>
  );
};

export default CardBody;
