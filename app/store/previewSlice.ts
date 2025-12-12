import { create } from 'zustand';

export interface PreviewData {
  columns: string[];
  preview_row_limit: number;
  preview_truncated: boolean;
  rows: Record<string, any>[];
  session_id: string;
  sheet_name: string;
  sheets_info: {
    sheet_count: number;
    sheet_names: string[];
  };
  total_columns: number;
  total_rows: number;
}

export interface PreviewState {
  previewData: PreviewData | null;
  isLoading: boolean;
  error: string | null;
  selectedSheet: string;

  // Actions
  setPreviewData: (data: PreviewData) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSheet: (sheet: string) => void;
  resetPreview: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  previewData: null,
  isLoading: false,
  error: null,
  selectedSheet: '',

  setPreviewData: (data: PreviewData) => set({ previewData: data, error: null }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setSelectedSheet: (sheet: string) => set({ selectedSheet: sheet }),
  resetPreview: () =>
    set({
      previewData: null,
      isLoading: false,
      error: null,
      selectedSheet: '',
    }),
}));
