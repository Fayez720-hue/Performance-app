"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export function useNotifications() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: notifications, mutate } = useSWR(
    session?.user?.email ? '/api/notifications' : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Setup permissions and notification listener (only once)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setup = async () => {
      // 1. Request Local Notification permissions
      let localPerm = await LocalNotifications.checkPermissions();
      if (localPerm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // 2. Schedule a background check (simulated via local interval for now)
      // Note: For true "app closed" polling without FCM, a native background service is used.
      console.log('Notification system initialized');

      // Listen for local notification taps
      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (notification) => {
          const taskId = notification.notification?.extra?.taskId;
          if (taskId) {
            router.push(`/tasks?taskId=${taskId}&t=${Date.now()}`);
          }
        }
      );
    };

    setup();

    return () => {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.removeAllListeners();
      }
    };
  }, [router]);

  // Check for new notifications and trigger local alerts
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    if (!Capacitor.isNativePlatform()) return;

    const lastCheck = localStorage.getItem('last_notification_time');
    const now = Date.now();

    if (!lastCheck) {
      localStorage.setItem('last_notification_time', now.toString());
      return;
    }

    const lastCheckTime = parseInt(lastCheck);
    const newNotifications = notifications.filter((n: any) => {
      const notificationTime = new Date(n.timestamp).getTime();
      return notificationTime > lastCheckTime && !n.read;
    });

    if (newNotifications.length > 0) {
      newNotifications.forEach(async (n: any) => {
        try {
          await LocalNotifications.schedule({
            notifications: [{
              title: 'Can Shift - Task Update',
              body: n.message,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 500) },
              sound: 'default',
              extra: { taskId: n.taskId }
            }],
          });
        } catch (err) {
          console.error('Failed to schedule local notification', err);
        }
      });
      localStorage.setItem('last_notification_time', now.toString());
    }
  }, [notifications]);

  return { notifications, mutate };
}