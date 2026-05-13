// app/api/tasks/counts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status === 'Review') {
      // Fetch from your existing tasks API
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/tasks`, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });
      
      if (response.ok) {
        const tasks = await response.json();
        const reviewCount = tasks.filter((task: any) => task.progress === 'Review').length;
        return NextResponse.json({ count: reviewCount });
      }
    }

    return NextResponse.json({ count: 0 });
  } catch (error) {
    console.error('Failed to fetch task counts:', error);
    return NextResponse.json({ count: 0 });
  }
}