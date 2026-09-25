import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePathParam = searchParams.get('path');

    // 1. Try local uploaded file first (works for demo mode and local file storage)
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

    // 2. Try looking in public/uploads/resumes directory if path or file exists there
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    if (fs.existsSync(uploadsDir)) {
      if (filePathParam) {
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

      // If specific path wasn't found, find the most recently uploaded file in the resumes directory
      const localFiles = await fs.promises.readdir(uploadsDir);
      if (localFiles.length > 0) {
        // Sort by creation/modification time descending
        const sortedFiles = localFiles
          .map((file) => ({
            file,
            time: fs.statSync(path.join(uploadsDir, file)).mtime.getTime(),
          }))
          .sort((a, b) => b.time - a.time);

        const latestFile = sortedFiles[0].file;
        const latestDiskPath = path.join(uploadsDir, latestFile);
        const fileBuffer = await fs.promises.readFile(latestDiskPath);

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${latestFile}"`,
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // 3. Try Supabase Storage (Live Mode)
    if (filePathParam) {
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

    return new NextResponse('Uploaded resume file not found. Please upload your resume again.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err) {
    console.error('Resume preview API error:', err);
    return new NextResponse('Error loading uploaded resume preview.', { status: 500 });
  }
}
