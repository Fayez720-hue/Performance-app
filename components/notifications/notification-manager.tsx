'use client';

import { useNotifications } from '@/hooks/use-notifications';

export function NotificationManager() {
  useNotifications();
  return null; // This component just runs the hook
}
