import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let fileName: string;
    let fileBuffer: Buffer;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
    } else {
      const json = await request.json();
      if (!json.file) {
        return NextResponse.json({ error: 'No file data' }, { status: 400 });
      }
      fileBuffer = Buffer.from(json.file, 'base64');
      fileName = json.name || `upload_${Date.now()}`;
    }

    const blob = await put(fileName, fileBuffer, {
        access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN,
});

    return NextResponse.json({ Aurl: blob.url });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}