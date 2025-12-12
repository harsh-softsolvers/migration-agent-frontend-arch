import { create } from 'zustand';

export interface ColumnInfo {
  column_index: number;
  column_name: string;
  original_name: string;
  normalized_name: string;
  detected_type: string;
  quality_score: number;
  data_completeness: number;
  uniqueness: number;
  consistency_score: number;
  primary_format: string | null;
  format_variants: number;
  detected_patterns: string[];
  sample_values: string[];
  null_count: number;
  unique_count: number;
  duplicate_count: number;
  numeric_statistics: {
    min: number | null;
    max: number | null;
    avg: number | null;
  };
  quality_issues: {
    has_issues: boolean;
    issue_types: string[];
    issue_count: number;
  };
  suggested_transformations: string[];
  transformation_priority: string;
  cardinality: string;
}

export interface DatasetSchema {
  sheet_name: string;
  total_columns: number;
  total_rows: number;
  columns: ColumnInfo[];
  summary: {
    average_quality: number;
    columns_with_issues: number;
    columns_needing_transformation: number;
    data_quality_grade: string;
  };
  critical_actions: string[];
}

export interface HeaderInfo { 
  header_row_index: number;
  headers: string[];
  original_headers: string[];
  has_headers: boolean;
  header_confidence: number;
  duplicate_columns: string[];
  has_duplicates: boolean;
}

export interface SheetAnalysis {
  sheet_name: string;
  headers: string[];
  header_info: HeaderInfo;
  column_count: number;
  data_row_count: number;
  column_data_types: Record<string, string>;
  column_type_analysis: Record<string, any>;
  dataset_schema: DatasetSchema;
  has_merged_cells: boolean;
  merged_cell_count: number;
  empty_columns: string[];
  empty_rows: string[];
  sample_rows: Record<string, any>[];
  sample_size: number;
  summary: {
    total_rows: number;
    total_columns: number;
    empty_columns_count: number;
    empty_rows_count: number;
    data_completeness: number;
    duplicate_columns_count: number;
  };
  quality_report: {
    total_columns: number;
    average_completeness: number;
    average_uniqueness: number;
    primary_key_candidates: string[];
    columns_with_issues: Array<{
      column: string;
      issues: string[];
    }>;
  };
}

export interface AnalysisResponse {
  session_id: string;
  filename: string;
  file_type: string;
  analysis_timestamp: string;
  sheets_analyzed: number;
  sheets: Record<string, SheetAnalysis>;
  summary: {
    sheets_count: number;
    total_rows: number;
    total_columns: number;
    average_completeness: number;
    has_merged_cells: boolean;
    total_merged_cells: number;
  };
}

export interface AnalysisState {
  analysisData: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedSheet: string | null;

  // Actions
  setAnalysisData: (data: AnalysisResponse) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSheet: (sheet: string) => void;
  resetAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysisData: null,
  isLoading: false,
  error: null,
  selectedSheet: null,

  setAnalysisData: (data: AnalysisResponse) =>
    set({
      analysisData: data,
      error: null,
      selectedSheet: Object.keys(data.sheets)[0] || null,
    }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setSelectedSheet: (sheet: string) => set({ selectedSheet: sheet }),
  resetAnalysis: () =>
    set({
      analysisData: null,
      isLoading: false,
      error: null,
      selectedSheet: null,
    }),
}));
