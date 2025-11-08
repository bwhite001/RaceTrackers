import React from 'react';
import { Badge } from '../../design-system/components';
import { CheckIcon } from '@heroicons/react/24/solid';

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {/* Step Badge */}
          <div className="flex flex-col items-center">
            <Badge
              variant={
                index < currentStep ? 'success' :
                index === currentStep ? 'primary' :
                'default'
              }
              size="lg"
              className="w-12 h-12 rounded-full flex items-center justify-center"
            >
              {index < currentStep ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                <span className="text-lg font-semibold">{step.number}</span>
              )}
            </Badge>
            <div className="mt-2 text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {step.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-[140px]">
                {step.description}
              </p>
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 mx-4 h-px bg-gray-300 dark:bg-gray-600 relative top-6">
              <div
                className={`h-full transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-green-500'
                    : 'bg-transparent'
                }`}
                style={{
                  width: index < currentStep ? '100%' : '0%'
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
