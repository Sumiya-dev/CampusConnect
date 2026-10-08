import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePathParam = searchParams.get('path');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

    // 1. Try Supabase Storage (Live Mode)
    if (isLiveSupabase && filePathParam) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.storage.from('resumes').download(filePathParam);

        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': data.type || 'application/pdf',
              'Content-Disposition': 'inline; filename="resume.pdf"',
              'Cache-Control': 'no-cache',
            },
          });
        }
      } catch (storageErr) {
        console.error('Supabase storage download error:', storageErr);
      }
    }

    // 2. Try local uploaded file (works for demo mode and local file storage)
    if (filePathParam && (filePathParam.startsWith('/uploads/') || filePathParam.startsWith('uploads/'))) {
      const cleanPath = filePathParam.startsWith('/') ? filePathParam.slice(1) : filePathParam;
      const fullDiskPath = path.join(process.cwd(), 'public', cleanPath);

      if (fs.existsSync(fullDiskPath)) {
        const fileBuffer = await fs.promises.readFile(fullDiskPath);
        const ext = path.extname(fullDiskPath).toLowerCase();
        let contentType = 'application/pdf';
        if (ext === '.doc') contentType = 'application/msword';
        if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${path.basename(fullDiskPath)}"`,
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // 3. Fallback: Check specific named file in public/uploads/resumes
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    if (fs.existsSync(uploadsDir) && filePathParam) {
      const baseName = path.basename(filePathParam);
      const directDiskPath = path.join(uploadsDir, baseName);
      if (fs.existsSync(directDiskPath)) {
        const fileBuffer = await fs.promises.readFile(directDiskPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${baseName}"`,
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    return new NextResponse('Uploaded resume file not found. Please upload your resume again.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err) {
    console.error('Resume preview API error:', err);
    return new NextResponse('Error loading uploaded resume preview.', { status: 500 });
  }
}
