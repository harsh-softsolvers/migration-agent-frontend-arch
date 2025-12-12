import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { WorkflowStep } from '~/store/workflowSlice';

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  currentStepId: string | null;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    case 'in-progress':
      return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
    case 'pending':
    default:
      return <Circle className="w-6 h-6 text-gray-300" />;
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-50 border-green-200';
    case 'in-progress':
      return 'bg-blue-50 border-blue-200';
    case 'pending':
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

function getTextStyles(status: string) {
  switch (status) {
    case 'completed':
      return 'text-green-700';
    case 'in-progress':
      return 'text-blue-700';
    case 'pending':
    default:
      return 'text-gray-600';
  }
}

export function WorkflowProgress({ steps, currentStepId }: WorkflowProgressProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Workflow Progress</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-2 min-w-max">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isActive = step.id === currentStepId;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Step Item */}
                  <div className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                    getStatusStyles(step.status),
                    isActive && 'ring-2 ring-blue-500'
                  )}>
                    <div className="flex items-center justify-center">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-600">
                        Step {step.count}
                      </p>
                      <p className={cn(
                        'text-sm font-medium mt-1',
                        getTextStyles(step.status)
                      )}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {step.status === 'in-progress' ? 'In Progress' : step.status}
                      </p>
                    </div>
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className="flex items-center pt-6">
                      <div className={cn(
                        'w-8 h-0.5',
                        step.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
