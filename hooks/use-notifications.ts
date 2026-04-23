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
    const newNotifications = lastCheck
      ? notifications.filter((n: any) => new Date(n.timestamp).getTime() > parseInt(lastCheck))
      : [notifications[0]];

    if (newNotifications.length > 0) {
      newNotifications.forEach(async (n: any, i: number) => {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Task Update',
              body: n.message,
              id: Math.floor(Math.random() * 10000),
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'default',
            },
          ],
        });
      });
      localStorage.setItem('last_notification_time', Date.now().toString());
    }
  }, [notifications]);

  return { notifications, mutate };
}
