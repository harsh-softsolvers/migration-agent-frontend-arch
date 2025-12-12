import { create } from 'zustand';

export interface UploadResponse {
  session_id: string;
  upload_id: string | null;
  filename: string;
  file_size: number;
  file_type: string;
  sheet_count: number;
  sheet_names: string[];
  status: string;
  upload_timestamp: string;
  expiration_time: string;
  message: string;
  verification_details: {
    format_verified: boolean;
    password_protected: boolean;
  };
}

export interface UploadState {
  uploadData: UploadResponse | null;
  isLoading: boolean;
  error: string | null;
  progress: number;

  // Actions
  setUploadData: (data: UploadResponse) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProgress: (progress: number) => void;
  resetUpload: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploadData: null,
  isLoading: false,
  error: null,
  progress: 0,

  setUploadData: (data: UploadResponse) => set({ uploadData: data, error: null }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setProgress: (progress: number) => set({ progress }),
  resetUpload: () =>
    set({
      uploadData: null,
      isLoading: false,
      error: null,
      progress: 0,
    }),
}));
