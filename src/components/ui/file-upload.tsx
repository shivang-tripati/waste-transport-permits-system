"use client"
import { useState, useRef } from 'react';
import { Button } from './button';
import { cn } from '@/lib/cn';
import { post, uploadFile } from '@/lib/api/client';

interface FileUploadProps {
  onUploadComplete: (data: any) => void;
  label?: string;
  accept?: string;
  className?: string;
  helperText?: string;
  existingFilesCount?: number;
  uploadType?: string;
}

export function FileUpload({
  onUploadComplete,
  label = 'Upload File',
  accept = 'image/*,application/pdf',
  className,
  helperText,
  existingFilesCount = 0,
  uploadType = 'waste_evidence',
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 3 - existingFilesCount;
    const filesToUpload = files.slice(0, remainingSlots);

    setError(null);
    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => setPreview(e.target?.result as string);
          reader.readAsDataURL(file);
        } else {
          setPreview(null);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType);

        const res = await uploadFile('/upload', formData);

        if (!res.success) {
          throw new Error(res.error?.message || 'Upload failed');
        }

        onUploadComplete(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during upload');
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  return (
    <div className={cn("w-full", className)}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />

        <div className="flex-1">
          {preview ? (
            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">Click to upload image</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
