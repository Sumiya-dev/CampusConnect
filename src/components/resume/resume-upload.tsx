'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { uploadResume } from '@/lib/resume/actions';

interface ResumeUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isReplacing?: boolean;
}

export function ResumeUpload({ onSuccess, onCancel, isReplacing }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError(null);
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(selected.type)) {
      setError('Invalid file type. Please upload a PDF or Word document.');
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadResume(formData);

    setIsUploading(false);

    if (result.error) {
      setError(result.error);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="border border-[#222222] rounded-md p-6 bg-[#0A0A0A]">
      <div className="flex flex-col items-center justify-center space-y-4">
        {!file ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#121212] flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#9AA1AA]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#EDEDED]">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[#9AA1AA] mt-1">
                PDF, DOC, DOCX (max. 5MB)
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#FF6B00] text-white text-sm font-medium rounded-md hover:bg-[#FF6B00]/90 transition-colors"
            >
              Select File
            </button>
            {isReplacing && onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
              >
                Cancel replacement
              </button>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-3 p-4 border border-[#222222] rounded-md bg-[#121212] w-full max-w-sm mb-4">
              <FileText className="w-6 h-6 text-[#FF6B00]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#EDEDED] truncate">
                  {file.name}
                </p>
                <p className="text-xs text-[#9AA1AA]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFile(null)}
                disabled={isUploading}
                className="px-4 py-2 bg-transparent border border-[#333333] text-[#EDEDED] text-sm font-medium rounded-md hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
              >
                Remove
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-[#FF6B00] text-white text-sm font-medium rounded-md hover:bg-[#FF6B00]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Resume'
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
      </div>
    </div>
  );
}
