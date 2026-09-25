'use client';

import { useState } from 'react';
import { Resume } from '@/lib/types/resume.types';
import { ResumeView } from './resume-view';
import { ResumeUpload } from './resume-upload';

interface ResumeManagerProps {
  initialResume: Resume | null;
}

export function ResumeManager({ initialResume }: ResumeManagerProps) {
  const [isReplacing, setIsReplacing] = useState(false);

  // Since we use Server Actions with revalidatePath, the initialResume 
  // will automatically update on success from the server side.
  // We just need to manage the UI state for replacing.

  if (!initialResume) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-[#EDEDED]">No resume uploaded</h2>
          <p className="text-sm text-[#9AA1AA] mt-1">
            Upload your current resume to use it for placement applications.
          </p>
        </div>
        
        <ResumeUpload />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-[#EDEDED]">Current Resume</h2>
        <p className="text-sm text-[#9AA1AA] mt-1">
          This is the resume that will be used for your placement applications.
        </p>
      </div>

      <ResumeView 
        resume={initialResume} 
        onReplace={() => setIsReplacing(true)} 
      />

      {isReplacing && (
        <div className="mt-8 pt-8 border-t border-[#222222]">
          <h3 className="text-base font-medium text-[#EDEDED] mb-4">Upload New Resume</h3>
          <ResumeUpload 
            isReplacing={true} 
            onCancel={() => setIsReplacing(false)} 
            onSuccess={() => setIsReplacing(false)}
          />
        </div>
      )}
    </div>
  );
}
