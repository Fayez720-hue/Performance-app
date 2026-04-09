import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canshift.performanceapp',
  appName: 'Performance App',
  webDir: 'out',
  server: {
    url: 'https://performance-app-chi.vercel.app',
    allowNavigation: ['performance-app-chi.vercel.app']
  }
};

export default config;
