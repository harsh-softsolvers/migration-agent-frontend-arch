/**
 * Application Configuration
 * Centralized configuration from environment variables
 */

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    version: import.meta.env.VITE_API_VERSION || 'v1',
    endpoints: {
      uploadExcel: '/api/v1/uploads/excel',
      previewExcel: (sessionId: string) => `/api/v1/uploads/${sessionId}/preview`,
    },
  },
  upload: {
    maxSize: (import.meta.env.VITE_UPLOAD_MAX_SIZE || 50) * 1024 * 1024, // Convert MB to bytes
    maxSizeMB: import.meta.env.VITE_UPLOAD_MAX_SIZE || 50,
    supportedFormats: ['.xlsx', '.xls', '.csv'],
  },
};

/**
 * Get full API endpoint URL
 * @param endpoint - The endpoint path
 * @returns Full URL to the API endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint}`;
};

export default config;
