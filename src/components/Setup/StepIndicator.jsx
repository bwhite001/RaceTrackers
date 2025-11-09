import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '../../design-system/components';
import { CheckIcon } from '@heroicons/react/24/solid';

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {/* Step Badge */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Badge
                variant={
                  index < currentStep ? 'success' :
                  index === currentStep ? 'primary' :
                  'default'
                }
                size="lg"
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-300 ease-in-out
                  ${index === currentStep ? 'ring-4 ring-primary-100 dark:ring-primary-900/30' : ''}
                `}
              >
                {index < currentStep ? (
                  <CheckIcon className="w-6 h-6 text-white" />
                ) : (
                  <span className="text-lg font-semibold">{step.number}</span>
                )}
              </Badge>
              {/* Pulse animation for current step */}
              {index === currentStep && (
                <div className="absolute inset-0 rounded-full animate-ping-slow opacity-75 bg-primary-500 dark:bg-primary-400" />
              )}
            </div>
            <div className="mt-3 text-center">
              <p className={`
                text-sm font-medium mb-1 transition-colors duration-200
                ${index === currentStep ? 'text-navy-900 dark:text-white' : 
                  index < currentStep ? 'text-green-700 dark:text-green-400' : 
                  'text-gray-500 dark:text-gray-400'}
              `}>
                {step.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[140px]">
                {step.description}
              </p>
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 mx-4 h-px bg-gray-200 dark:bg-gray-700 relative">
              <div
                className={`
                  h-full bg-green-500 transition-all duration-500 ease-out
                  ${index < currentStep ? 'w-full' : 'w-0'}
                `}
                style={{
                  transitionDelay: `${index * 100}ms`
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

StepIndicator.propTypes = {
  /** Array of step objects with number, label, and description */
  steps: PropTypes.arrayOf(PropTypes.shape({
    number: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
  })).isRequired,
  /** Current active step index */
  currentStep: PropTypes.number.isRequired
};

export default StepIndicator;
