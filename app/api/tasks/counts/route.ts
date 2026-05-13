// app/api/tasks/counts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma'; // Adjust to your setup

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status === 'Review') {
      const count = await prisma.task.count({
        where: {
          userId: session.user.id,
          progress: 'Review',
        },
      });
      return NextResponse.json({ count });
    }

    return NextResponse.json({ count: 0 });
  } catch (error) {
    console.error('Failed to fetch task counts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}