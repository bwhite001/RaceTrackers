import React from 'react';
import { cn } from '../../utils/classNames';

/**
 * ButtonGroup Component
 * Groups multiple buttons together with proper spacing
 * 
 * @component
 * @example
 * <ButtonGroup>
 *   <Button>First</Button>
 *   <Button>Second</Button>
 * </ButtonGroup>
 */

const ButtonGroup = ({
  children,
  spacing = 'normal',
  orientation = 'horizontal',
  className = '',
}) => {
  const spacingClasses = {
    tight: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
    normal: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    relaxed: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
  };

  const orientationClasses = orientation === 'horizontal' ? 'flex flex-row' : 'flex flex-col';

  return (
    <div className={cn(orientationClasses, spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

export default ButtonGroup;
