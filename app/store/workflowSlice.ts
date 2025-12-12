import { create } from 'zustand';

export type StepStatus = 'pending' | 'in-progress' | 'completed';

export interface WorkflowStep {
  id: string;
  count: number;
  label: string;
  status: StepStatus;
}

export interface WorkflowState {
  steps: WorkflowStep[];
  currentStepId: string | null;
  showProgress: boolean;

  // Actions
  setSteps: (steps: WorkflowStep[]) => void;
  setCurrentStep: (stepId: string) => void;
  updateStepStatus: (stepId: string, status: StepStatus) => void;
  setShowProgress: (show: boolean) => void;
  resetWorkflow: () => void;
}

const defaultSteps: WorkflowStep[] = [
  { id: 'upload', count: 1, label: 'Upload File', status: 'pending' },
  { id: 'preview', count: 2, label: 'Preview Data', status: 'pending' },
  { id: 'analysis', count: 3, label: 'Analyze File', status: 'pending' },
  { id: 'template', count: 4, label: 'Select Template', status: 'pending' },
  { id: 'mapping', count: 5, label: 'Field Mapping', status: 'pending' },
  { id: 'process', count: 6, label: 'Process Data', status: 'pending' },
];

export const useWorkflowStore = create<WorkflowState>((set) => ({
  steps: defaultSteps,
  currentStepId: null,
  showProgress: false,

  setSteps: (steps: WorkflowStep[]) => set({ steps }),
  setCurrentStep: (stepId: string) =>
    set((state) => ({
      currentStepId: stepId,
      steps: state.steps.map((step) => ({
        ...step,
        status:
          step.id === stepId
            ? 'in-progress'
            : step.count < (state.steps.find((s) => s.id === stepId)?.count || 0)
            ? 'completed'
            : 'pending',
      })),
    })),
  updateStepStatus: (stepId: string, status: StepStatus) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === stepId ? { ...step, status } : step
      ),
    })),
  setShowProgress: (show: boolean) => set({ showProgress: show }),
  resetWorkflow: () =>
    set({
      steps: defaultSteps,
      currentStepId: null,
      showProgress: false,
    }),
}));
