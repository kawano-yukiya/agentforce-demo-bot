'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import type { UploadResponse } from '@/lib/data/types';

interface FileUploaderProps {
  onSuccess: (data: UploadResponse) => void;
}

export function FileUploader({ onSuccess }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadedFile(file.name);
        onSuccess(data);
      } else {
        setError(data.error || 'アップロードに失敗しました');
      }
    } catch (err) {
      setError('アップロードに失敗しました。もう一度お試しください。');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploadedFile ? 'border-green-500 bg-green-50' : ''}
          ${error ? 'border-red-500 bg-red-50' : ''}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploadedFile ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-700">{uploadedFile}</p>
            </div>
            <p className="text-xs text-gray-500">クリックして別のファイルを選択</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-gray-500">クリックして再試行</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`h-8 w-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600">
              {uploading ? 'アップロード中...' : isDragActive ? 'ファイルをドロップ' : 'CSV/Excelをドラッグ&ドロップ'}
            </p>
            <p className="text-xs text-gray-400">または クリックして選択</p>
          </div>
        )}
      </div>
    </div>
  );
}
