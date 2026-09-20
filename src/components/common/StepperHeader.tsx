import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

export interface StepItem {
  number: number;
  title: string;
  subtitle?: string;
}

interface StepperHeaderProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  id?: string;
}

export const StepperHeader: React.FC<StepperHeaderProps> = ({
  steps,
  currentStep,
  onStepClick,
  id,
}) => {
  return (
    <div
      id={id || 'stepper-header'}
      className="w-full bg-white rounded-2xl border border-[#E5EAF3] p-3 sm:p-4 shadow-xs mb-6 select-none"
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2.5 overflow-x-auto custom-scrollbar py-0.5">
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isClickable = Boolean(onStepClick && isCompleted);

          return (
            <React.Fragment key={step.number}>
              {/* Step Item Pill */}
              <div
                onClick={() => isClickable && onStepClick?.(step.number)}
                className={`flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3.5 py-2 rounded-xl transition-all ${
                  isClickable
                    ? 'cursor-pointer hover:bg-gray-50 active:scale-98'
                    : ''
                } ${
                  isCurrent
                    ? 'bg-blue-50/70 border border-blue-200/80 shadow-2xs'
                    : ''
                }`}
              >
                {/* Step Badge */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 shadow-sm'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.8]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Step Text Labels */}
                <div className="min-w-0 text-left">
                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight block truncate leading-tight ${
                      isCurrent
                        ? 'text-[#0F1D3D]'
                        : isCompleted
                        ? 'text-gray-800'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.subtitle && (
                    <span
                      className={`text-[11px] font-medium hidden md:block truncate mt-0.5 leading-tight ${
                        isCurrent
                          ? 'text-blue-600 font-semibold'
                          : isCompleted
                          ? 'text-gray-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.subtitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Directional Arrow Divider (Only rendered between steps) */}
              {idx < steps.length - 1 && (
                <div className="flex items-center justify-center shrink-0 px-0.5 sm:px-1.5 text-gray-300">
                  <ChevronRight
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                      isCompleted
                        ? 'text-emerald-500 stroke-[2.4]'
                        : isCurrent
                        ? 'text-blue-500 stroke-[2.4]'
                        : 'text-gray-300 stroke-[1.8]'
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
