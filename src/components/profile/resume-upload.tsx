'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, Trash2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumeUploadProps {
  initialResumeName?: string | null;
  initialResumeUrl?: string | null;
  initialUploadedAt?: string | null;
}

export function ResumeUpload({
  initialResumeName,
  initialResumeUrl,
  initialUploadedAt,
}: ResumeUploadProps) {
  const [resumeName, setResumeName] = useState<string>(initialResumeName || '');
  const [resumeUrl, setResumeUrl] = useState<string>(initialResumeUrl || '');
  const [uploadedAt, setUploadedAt] = useState<string>(initialUploadedAt || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB max
    if (file.size > 5 * 1024 * 1024) {
      alert('Resume file size must be under 5MB.');
      return;
    }

    const now = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    setResumeName(file.name);
    setUploadedAt(now);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setResumeUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setResumeName('');
    setResumeUrl('');
    setUploadedAt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="resumeName" value={resumeName} />
      <input type="hidden" name="resumeUrl" value={resumeUrl} />
      <input type="hidden" name="resumeUploadedAt" value={uploadedAt} />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        id="resumeFileInput"
      />

      {resumeName ? (
        /* Currently Uploaded Resume Card */
        <div className="p-3.5 rounded-md border border-[#222222] bg-[#0A0A0A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-[#121212] border border-[#222222] shrink-0 text-[#FF6B00]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-[#EDEDED] flex items-center gap-1.5">
                <span>{resumeName}</span>
                <span className="text-sm text-emerald-400 font-normal flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Ready for Drives</span>
                </span>
              </div>
              <div className="text-sm text-[#9AA1AA]">
                Uploaded on {uploadedAt || 'Recently'} • PDF Document
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {resumeUrl && (
              <a
                href={resumeUrl}
                download={resumeName}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center text-sm h-9 px-2.5 rounded border border-[#222222] bg-transparent text-[#EDEDED] hover:bg-[#121212] transition-colors"
              >
                <Download className="h-3.5 w-3.5 mr-1 text-[#9AA1AA]" />
                <span>Download</span>
              </a>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm h-9 font-normal"
            >
              Replace
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-sm h-9 text-[#9AA1AA] hover:text-red-400 font-normal"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Empty Upload Trigger */
        <div className="p-5 rounded-md border border-dashed border-[#222222] bg-[#0A0A0A] flex flex-col items-center justify-center text-center space-y-2">
          <FileText className="h-9 w-8 text-[#9AA1AA]" />
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-[#EDEDED]">No resume uploaded yet</div>
            <p className="text-sm text-[#9AA1AA]">
              Upload your official campus placement CV (PDF or DOCX, max 5MB).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm h-9 gap-1.5 font-normal mt-1"
          >
            <Upload className="h-3.5 w-3.5 text-[#9AA1AA]" />
            <span>Select Resume Document</span>
          </Button>
        </div>
      )}

      <p className="text-sm text-[#9AA1AA] leading-relaxed">
        This resume document is automatically linked and accessible across your placement applications, recruiter evaluations, and the dedicated Resume Module.
      </p>
    </div>
  );
}
