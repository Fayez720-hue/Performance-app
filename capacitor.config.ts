import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canshift.performanceapp',
  appName: 'Performance App v1.0',
  webDir: 'out',
  server: {
    // Replace with your ACTUAL live Vercel URL
    url: 'https://performance-app-chi.vercel.app',
    cleartext: true,
    allowNavigation: ['performance-app-chi.vercel.app']
  }
};

export default config;
