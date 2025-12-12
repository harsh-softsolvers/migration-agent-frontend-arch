import { create } from 'zustand';

export interface ColumnMatch {
  uploaded_column: string;
  template_column_name: string;
  display_name: string;
  match_score: number;
  match_strategy: string;
  confidence: number;
}

export interface MatchingMetadata {
  fuzzy_threshold: number;
  columns_analyzed: number;
  match_strategies_used: string[];
}

export interface TemplateMatch {
  template_id: string;
  template_name: string;
  format_type: string;
  version: string;
  overall_match_score: number;
  field_match_percentage: number;
  matched_columns: number;
  total_columns: number;
  column_matches: ColumnMatch[];
  unmatched_template_columns: string[];
  confidence_level: string;
  matching_metadata: MatchingMetadata;
}

export interface TemplateMatchResponse {
  session_id: string;
  uploaded_columns: string[];
  total_candidates: number;
  matches_found: number;
  matches: TemplateMatch[];
}

export interface TemplateState {
  templateData: TemplateMatchResponse | null;
  selectedTemplate: TemplateMatch | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTemplateData: (data: TemplateMatchResponse) => void;
  setSelectedTemplate: (template: TemplateMatch | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetTemplate: () => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templateData: null,
  selectedTemplate: null,
  isLoading: false,
  error: null,

  setTemplateData: (data: TemplateMatchResponse) =>
    set({
      templateData: data,
      error: null,
      selectedTemplate: data.matches.length > 0 ? data.matches[0] : null,
    }),
  setSelectedTemplate: (template: TemplateMatch | null) =>
    set({ selectedTemplate: template }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  resetTemplate: () =>
    set({
      templateData: null,
      selectedTemplate: null,
      isLoading: false,
      error: null,
    }),
}));
