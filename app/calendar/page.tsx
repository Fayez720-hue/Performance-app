// app/calendar/page.tsx
import { Suspense } from 'react';
import CalendarPageClient from '@/components/calendar/calendar-page-client';

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CalendarPageClient />
    </Suspense>
  );
}