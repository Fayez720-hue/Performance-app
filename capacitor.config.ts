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
    allowMixedContent: true,
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
  }
};

export default config;
