import { useState, useEffect } from 'react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useUploadStore } from '~/store/uploadSlice';
import { usePreviewStore } from '~/store/previewSlice';
import { useAnalysisStore } from '~/store/analysisSlice';
import { useWorkflowStore } from '~/store/workflowSlice';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { config } from '~/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { useNavigate } from 'react-router';
import { FileCheck, Loader, AlertCircle } from 'lucide-react';
import type { ColDef } from 'ag-grid-community';
import type { PreviewData } from '~/store/previewSlice';
import type { AnalysisResponse } from '~/store/analysisSlice';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export function meta() {
  return [
    { title: 'Upload Preview - Excel Migration Tool' },
    { name: 'description', content: 'Preview your uploaded Excel file' },
  ];
}

export default function UploadPreview() {
  const navigate = useNavigate();
  const uploadData = useUploadStore((state) => state.uploadData);
  const previewStore = usePreviewStore();
  const analysisStore = useAnalysisStore();
  const workflowStore = useWorkflowStore();
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Enable workflow progress and set current step on mount
  useEffect(() => {
    workflowStore.setShowProgress(true);
    workflowStore.setCurrentStep('preview');
  }, []);

  // If no upload data, redirect back to home
  if (!uploadData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No File Selected</CardTitle>
            <CardDescription>Please upload a file first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch preview data
  const previewMutation = useMutation({
    mutationFn: async (): Promise<PreviewData> => {
      const endpoint = `${config.api.baseUrl}/api/v1/uploads/${uploadData.session_id}/preview`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          error: errorData.error || 'Unknown error',
          message: errorData.message || 'Failed to fetch preview',
        };
      }

      return await response.json();
    },
    onSuccess: (data) => {
      previewStore.setPreviewData(data);
      previewStore.setSelectedSheet(data.sheet_name);
      setSelectedSheet(data.sheet_name);
      toast.success('Preview loaded successfully');
    },
    onError: (error: any) => {
      const errorMsg = error.message || 'Failed to load preview';
      previewStore.setError(errorMsg);
      toast.error('Failed to load preview', { description: errorMsg });
    },
  });

  // Analyze file
  const analysisMutation = useMutation({
    mutationFn: async (): Promise<AnalysisResponse> => {
      const endpoint = `${config.api.baseUrl}/api/v1/uploads/${uploadData.session_id}/analyze?sample_size=100&use_cache=true`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          error: errorData.error || 'Unknown error',
          message: errorData.message || 'Failed to analyze file',
          session_id: errorData.session_id,
        };
      }

      return await response.json();
    },
    onSuccess: (data) => {
      analysisStore.setAnalysisData(data);
      toast.success('File analysis completed successfully');
      // Redirect to template selection screen after 1 second
      setTimeout(() => {
        navigate('/template-selection');
      }, 1000);
    },
    onError: (error: any) => {
      const errorMsg =
        error.error === 'SESSION_NOT_FOUND'
          ? 'Session expired. Please upload the file again.'
          : error.message || 'Failed to analyze file';
      analysisStore.setError(errorMsg);
      toast.error('Analysis failed', { description: errorMsg });
    },
  });

  // Load preview on mount
  useEffect(() => {
    previewStore.setIsLoading(true);
    previewMutation.mutate();
  }, [uploadData.session_id]);

  // Prepare column definitions for ag-grid (read-only)
  const columnDefs: ColDef[] =
    previewStore.previewData?.columns.map((col) => ({
      field: col,
      headerName: col,
      flex: 1,
      minWidth: 150,
      editable: false,
      resizable: true,
      sortable: true,
      filter: 'agTextColumnFilter',
      // Value getter to handle mixed types and null values
      valueGetter: (params) => {
        const value = params.data?.[col];
        if (value === null || value === undefined) {
          return '';
        }
        // Convert all values to string for display
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      },
    })) || [];

  // Row data
  const rowData = previewStore.previewData?.rows || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-full mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FileCheck className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Preview</h1>
          <p className="text-gray-600">
            Preview your uploaded Excel file and its details before proceeding
          </p>
        </div>

        {/* Upload Details Card with Accordion */}
        <Accordion type="single" collapsible className="mb-6">
          <AccordionItem value="upload-details" className="border rounded-lg">
            <AccordionTrigger className="hover:no-underline px-6 py-4 bg-white hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-blue-500" />
                <span className="text-lg font-semibold text-gray-900">Upload Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 bg-gray-50">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Filename</p>
                    <p className="text-lg text-gray-900 mt-1">{uploadData.filename}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">File Type</p>
                    <p className="text-lg text-gray-900 mt-1 uppercase">{uploadData.file_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">File Size</p>
                    <p className="text-lg text-gray-900 mt-1">
                      {(uploadData.file_size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Sheet Count</p>
                    <p className="text-lg text-gray-900 mt-1">{uploadData.sheet_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Session ID</p>
                    <p className="text-sm text-gray-900 mt-1 break-all font-mono">
                      {uploadData.session_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Upload Time</p>
                    <p className="text-lg text-gray-900 mt-1">
                      {new Date(uploadData.upload_timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Sheet Names */}
                {uploadData.sheet_names.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 font-medium mb-3">Sheet Names</p>
                    <div className="flex flex-wrap gap-2">
                      {uploadData.sheet_names.map((name) => (
                        <span
                          key={name}
                          className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Details */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 font-medium mb-3">Verification</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          uploadData.verification_details.format_verified
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      ></div>
                      <span className="text-sm text-gray-700">
                        Format Verified:{' '}
                        <span className="font-medium">
                          {uploadData.verification_details.format_verified ? 'Yes' : 'No'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          !uploadData.verification_details.password_protected
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                      ></div>
                      <span className="text-sm text-gray-700">
                        Password Protected:{' '}
                        <span className="font-medium">
                          {uploadData.verification_details.password_protected ? 'Yes' : 'No'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Error State */}
        {previewStore.error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-5 h-5" />
                Failed to Load Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="text-red-800">
              <p>{previewStore.error}</p>
              <Button
                onClick={() => previewMutation.mutate()}
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {previewMutation.isPending && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Loader className="w-5 h-5 animate-spin" />
                Loading Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <p>Fetching file preview and data...</p>
            </CardContent>
          </Card>
        )}

        {/* Preview Data Card */}
        {previewStore.previewData && !previewMutation.isPending && (
          <>
            {/* Preview Info */}
            <Card className="mb-6 bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <FileCheck className="w-5 h-5" />
                  Preview Ready
                </CardTitle>
                <CardDescription className="text-green-800">
                  Sheet: <span className="font-semibold">{previewStore.previewData.sheet_name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-green-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Columns</p>
                    <p className="text-2xl font-bold mt-1">
                      {previewStore.previewData.total_columns}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Rows</p>
                    <p className="text-2xl font-bold mt-1">
                      {previewStore.previewData.total_rows}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Preview Rows</p>
                    <p className="text-2xl font-bold mt-1">{rowData.length}</p>
                  </div>
                </div>
                {previewStore.previewData.preview_truncated && (
                  <p className="text-sm mt-4 italic">
                    ℹ️ Showing first {rowData.length} rows (preview truncated)
                  </p>
                )}
              </CardContent>
            </Card>

            {/* AG-Grid */}
            <Card className="mb-6 overflow-hidden">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>Read-only preview of your file data</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="ag-theme-quartz" style={{ height: '500px' }}>
                  <AgGridReact
                    columnDefs={columnDefs}
                    rowData={rowData}
                    theme="legacy"
                    defaultColDef={{
                      resizable: true,
                      sortable: true,
                      filter: true,
                    }}
                    domLayout="normal"
                    pagination={true}
                    paginationPageSize={20}
                    paginationPageSizeSelector={[10, 20, 50]}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <Button
            variant="default"
            disabled={previewMutation.isPending || !!previewStore.error || analysisMutation.isPending}
            onClick={() => analysisMutation.mutate()}
          >
            {analysisMutation.isPending && (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            )}
            {analysisMutation.isPending ? 'Analyzing...' : 'Continue to Processing'}
          </Button>
          <Button onClick={() => navigate('/')} variant="outline">
            Upload Another File
          </Button>
        </div>
      </div>
    </div>
  );
}
