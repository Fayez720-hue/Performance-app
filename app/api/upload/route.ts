import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    let fileBuffer: Buffer;
    let fileName: string;
    let fileType: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      fileType = file.type;
    } else {
      const json = await request.json();
      if (!json.file) {
        return NextResponse.json({ error: 'No file data' }, { status: 400 });
      }
      fileBuffer = Buffer.from(json.file, 'base64');
      fileName = json.name || `upload_${Date.now()}`;
      fileType = json.type || 'image/jpeg';
    }

    // Since we don't have a storage provider configured yet,
    // we use a temporary public upload service.
    // NOTE: For production, you should use R2, S3, or Google Drive.

    const uploadFormData = new FormData();
    const blob = new Blob([fileBuffer], { type: fileType });
    uploadFormData.append('file', blob, fileName);

    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload to temporary storage');
    }

    const data = await response.json();

    // tmpfiles.org returns a URL like https://tmpfiles.org/XXXX/name
    // We need to convert it to a direct link if possible, but the default is usually fine for viewing.
    // For tmpfiles.org, we need to insert /dl/ between domain and ID to get direct link?
    // Actually, their API response usually has the URL.

    let url = data.data.url;
    // tmpfiles.org/123/name -> tmpfiles.org/dl/123/name for direct download/view
    url = url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
