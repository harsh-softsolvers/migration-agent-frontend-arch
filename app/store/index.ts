import type { UploadState, UploadResponse } from './uploadSlice';
import { useUploadStore } from './uploadSlice';
import type { PreviewState, PreviewData } from './previewSlice';
import { usePreviewStore } from './previewSlice';
import type { AnalysisState, AnalysisResponse } from './analysisSlice';
import { useAnalysisStore } from './analysisSlice';
import type { TemplateState, TemplateMatchResponse } from './templateSlice';
import { useTemplateStore } from './templateSlice';
import type { WorkflowState } from './workflowSlice';
import { useWorkflowStore } from './workflowSlice';

export interface AppState {
  // Upload state
  upload: UploadState;
  // Preview state
  preview: PreviewState;
  // Analysis state
  analysis: AnalysisState;
  // Template state
  template: TemplateState;
  // Workflow state
  workflow: WorkflowState;
}

// Export individual stores for easy access
export { useUploadStore, usePreviewStore, useAnalysisStore, useTemplateStore, useWorkflowStore };
export type { UploadResponse, PreviewData, TemplateMatchResponse };

// You can create additional slices here and combine them if needed
