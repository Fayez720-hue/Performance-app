import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications() {
  const { data: session } = useSession();
  const { data: notifications, mutate } = useSWR(
    session?.user?.email ? '/api/notifications' : null,
    fetcher,
    { refreshInterval: 30000 } // Poll every 30 seconds
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupNotifications = async () => {
      try {
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          perm = await LocalNotifications.requestPermissions();
        }

        // Push notifications setup (optional, requires Firebase)
        // For now, we use local notifications based on the polled data
      } catch (e) {
        console.error('Notification setup failed', e);
      }
    };

    setupNotifications();
  }, []);

  // Check for new notifications and trigger local alert
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    if (!Capacitor.isNativePlatform()) return;

    const lastCheck = localStorage.getItem('last_notification_time');
    const now = Date.now();

    // If it's the first time checking, just set the benchmark and return
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
            notifications: [
              {
                title: 'Can Shift - Task Update',
                body: n.message,
                id: Math.floor(Math.random() * 1000000),
                schedule: { at: new Date(Date.now() + 500) },
                sound: 'default',
                extra: { taskId: n.taskId }
              },
            ],
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
