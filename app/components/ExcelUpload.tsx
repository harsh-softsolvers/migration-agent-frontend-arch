'use client';

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUploadStore } from '~/store/uploadSlice';
import { config } from '~/config';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import type { UploadResponse } from '~/store/uploadSlice';

interface ExcelUploadProps {
  onFileSelect?: (file: File) => void;
}

export function ExcelUpload({ onFileSelect }: ExcelUploadProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand store
  const uploadStore = useUploadStore();

  const validExtensions = config.upload.supportedFormats;
  const maxFileSize = config.upload.maxSize;

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        uploadStore.setProgress((uploadStore.progress) + Math.random() * 30);
      }, 500);

      try {
        const response = await fetch(
          `${config.api.baseUrl}${config.api.endpoints.uploadExcel}`,
          {
            method: 'POST',
            body: formData,
          }
        );

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({}));
          throw {
            status: response.status,
            error: errorData.error || 'Unknown error',
            message: errorData.message || 'Upload failed',
            detail: errorData.detail,
          };
        }

        const data = await response.json();
        uploadStore.setProgress(100);
        return data;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      setUploadStatus('success');
      uploadStore.setUploadData(data);
      uploadStore.setIsLoading(false);
      
      toast.success(`File uploaded successfully!`, {
        description: `Session ID: ${data.session_id.slice(0, 16)}...`,
      });

      // Redirect to upload-preview screen after 2 seconds
      navigate('/upload-preview');
    },
    onError: (error: any) => {
      setUploadStatus('error');
      const errorMsg = error.message || 'Upload failed';
      setErrorMessage(errorMsg);
      uploadStore.setIsLoading(false);
      uploadStore.setError(errorMsg);
      uploadStore.setProgress(0);
      
      toast.error('Upload failed', {
        description: errorMsg,
      });
    },
  });

  const validateFile = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      const msg = `Invalid file type. Please upload: ${validExtensions.join(', ')}`;
      setErrorMessage(msg);
      setUploadStatus('error');
      toast.error('Invalid file type', { description: msg });
      return false;
    }

    if (file.size > maxFileSize) {
      const msg = `File size exceeds 50MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      setErrorMessage(msg);
      setUploadStatus('error');
      toast.error('File too large', { description: msg });
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage('');
      onFileSelect?.(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadStore.setIsLoading(true);
      uploadStore.setProgress(0);
      uploadMutation.mutate(selectedFile);
    }
  };

  const isUploading = uploadMutation.isPending || uploadStore.isLoading;
  const isRedirecting = uploadStatus === 'success' && uploadStore.uploadData;

  return (
    <>
      {/* Redirection Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{
          background: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))",
        }}>
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <Loader className="w-12 h-12 mx-auto text-primary animate-spin" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Processing Your File
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Redirecting to processing screen...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload Excel Document</CardTitle>
          <CardDescription>
            Supported formats: {config.upload.supportedFormats.join(', ')} (Max {config.upload.maxSizeMB}MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
            aria-label="Upload file"
            disabled={isUploading}
          />

          {!selectedFile ? (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drag and drop your Excel file here
                </p>
                <p className="text-sm text-gray-500 mt-1">or</p>
              </div>
              <Button onClick={handleButtonClick} type="button" disabled={isUploading}>
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isUploading ? (
                <>
                  <Loader className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Uploading File
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2 text-gray-700">
                      <File className="w-4 h-4" />
                      <p className="text-sm">{selectedFile.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadStore.progress)}%</span>
                    </div>
                    <Progress value={uploadStore.progress} className="h-2" />
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto text-blue-500" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      File Selected
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2 text-gray-700">
                      <File className="w-4 h-4" />
                      <p className="text-sm">{selectedFile.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      type="button"
                    >
                      {isUploading && (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {isUploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                    <Button
                      onClick={handleRemoveFile}
                      variant="outline"
                      type="button"
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Message Accordion */}
        {uploadStatus === 'error' && errorMessage && (
          <Accordion type="single" collapsible defaultValue="error-details">
            <AccordionItem value="error-details">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">Upload Failed</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-900">{errorMessage}</p>
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={handleButtonClick}
                      variant="outline"
                      size="sm"
                      type="button"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
    </>
  );
}
