import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const stepNumber = index + 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{stepNumber}</span>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-center max-w-[120px]">
                  <div
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-8">
                  <div
                    className={`h-full transition-all ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
