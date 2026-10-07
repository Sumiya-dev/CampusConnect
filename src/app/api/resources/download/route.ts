import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return new NextResponse('Resource ID is required', { status: 400 });
    }

    const supabase = await createClient();

    // Query resource
    const { data: resource, error: dbError } = await supabase
      .from('faculty_resources')
      .select(`
        id,
        file_path,
        file_name,
        file_type,
        is_published,
        faculty_id,
        faculty:faculty_members (
          user_id
        )
      `)
      .eq('id', resourceId)
      .maybeSingle();

    interface DownloadResourceRow {
      id: string;
      file_path: string;
      file_name: string;
      file_type: string;
      is_published: boolean;
      faculty_id: string;
      faculty?: { user_id?: string } | null;
    }

    const row = resource as unknown as DownloadResourceRow | null;

    if (dbError || !row) {
      return new NextResponse('Resource not found', { status: 404 });
    }

    // Access control:
    // If student, the resource must be published.
    if (user.role === 'student' && !row.is_published) {
      return new NextResponse('Resource is not published', { status: 403 });
    }

    // Download from Supabase Storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('faculty-resources')
      .download(row.file_path);

    if (storageError || !fileData) {
      console.error('Storage download error:', storageError);
      return new NextResponse('File could not be retrieved from storage', { status: 404 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const contentType = row.file_type || fileData.type || 'application/octet-stream';
    const isInlineViewable = contentType.startsWith('text/') || contentType === 'application/pdf';
    const dispositionType = isInlineViewable ? 'inline' : 'attachment';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${dispositionType}; filename="${encodeURIComponent(row.file_name)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Resource download error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
