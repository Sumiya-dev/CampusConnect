'use client';

import { useState } from 'react';
import { FileText, Download, Trash2, Eye, Calendar, RefreshCw } from 'lucide-react';
import { Resume } from '@/lib/types/resume.types';
import { getResumeUrl, deleteResume } from '@/lib/resume/actions';

interface ResumeViewProps {
  resume: Resume;
  onReplace: () => void;
}

export function ResumeView({ resume, onReplace }: ResumeViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const [isViewing, setIsViewing] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleView = async () => {
    if (isViewing) {
      setIsViewing(false);
      setViewUrl(null);
      return;
    }

    setIsLoadingView(true);
    try {
      const url = await getResumeUrl(resume.file_path);
      if (url) {
        setViewUrl(url);
        setIsViewing(true);
      } else {
        alert('Could not generate view link.');
      }
    } catch (err) {
      console.error('Error opening resume:', err);
      alert('Error opening resume.');
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const url = await getResumeUrl(resume.file_path);
      if (url) {
        // Fetch the file to force a download instead of navigating
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = resume.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        alert('Could not generate download link.');
      }
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert('Error downloading resume.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete your current resume? This action cannot be undone.')) {
      setIsDeleting(true);
      const result = await deleteResume(resume.id, resume.file_path);
      if (result.error) {
        alert(result.error);
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="border border-[#222222] rounded-md overflow-hidden bg-[#0A0A0A]">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#121212] border border-[#222222] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#EDEDED] break-all">
                {resume.file_name}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#9AA1AA]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Uploaded {formatDate(resume.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#9AA1AA]">
                  <span>{(resume.file_size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
            <button
              onClick={handleView}
              disabled={isLoadingView}
              className={`flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                isViewing 
                  ? 'bg-[#1A1A1A] border-[#444444] text-white' 
                  : 'bg-[#121212] border-[#333333] text-[#EDEDED] hover:bg-[#1A1A1A]'
              }`}
            >
              <Eye className="w-4 h-4" />
              {isViewing ? 'Hide' : (isLoadingView ? 'Loading...' : 'View')}
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-[#333333] text-[#EDEDED] text-sm font-medium rounded-md hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            <button
              onClick={onReplace}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-[#333333] text-[#EDEDED] text-sm font-medium rounded-md hover:bg-[#1A1A1A] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Replace
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-red-900/30 text-red-500 text-sm font-medium rounded-md hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
        
        {isViewing && viewUrl && (
          <div className="mt-6 pt-6 border-t border-[#222222]">
            <h4 className="text-sm font-medium text-[#EDEDED] mb-3">Resume Preview</h4>
            <div className="w-full h-[600px] rounded border border-[#333333] overflow-hidden bg-white">
              {resume.file_type === 'application/pdf' ? (
                <iframe 
                  src={`${viewUrl}#toolbar=0`} 
                  className="w-full h-full"
                  title="Resume Preview"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-[#0A0A0A]">
                  <FileText className="w-12 h-12 text-[#9AA1AA] mb-4" />
                  <p className="text-[#EDEDED] font-medium mb-2">Preview not available</p>
                  <p className="text-[#9AA1AA] text-sm mb-4">This file type cannot be previewed directly in the browser.</p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white text-sm font-medium rounded-md hover:bg-[#FF6B00]/90 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download to view
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
