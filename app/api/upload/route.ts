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

    const uploadFormData = new FormData();
    const blob = new Blob([fileBuffer], { type: fileType });
    uploadFormData.append('file', blob, fileName);

    const response = await fetch('https://file.io', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload to temporary storage');
    }

    const data = await response.json();
    return NextResponse.json({ url: data.link });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}