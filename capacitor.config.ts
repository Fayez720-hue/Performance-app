import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canshift.performanceapp',
  appName: 'Performance App',
  webDir: 'out',
  server: {
    // Pointing to your live Vercel production deployment
    url: 'https://performance-app-ivory.vercel.app',
    cleartext: true,
    allowNavigation: [
      'performance-app-ivory.vercel.app',
      '*.google.com',
      '*.googleapis.com',
      '*.googleusercontent.com'
    ]
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
