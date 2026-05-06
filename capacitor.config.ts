import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canshift.performanceapp',
  appName: 'Performance App',
  webDir: 'out',
  server: {
    url: 'https://performance-app-ivory.vercel.app',
    cleartext: true,
    allowNavigation: [
      'performance-app-ivory.vercel.app',
      '*.google.com',
      '*.googleapis.com',
      '*.youtube.com',
      '*.googleusercontent.com',
      'accounts.google.com',
      'accounts.youtube.com',
      'ssl.gstatic.com',
      'www.gstatic.com',
      'fonts.gstatic.com'
    ]
  },
  android: {
    allowMixedContent: true,
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 CSPerformanceApp'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '423199982215-9f8naaojguulkgha5nmlpumpb00d6j3j.apps.googleusercontent.com',
      clientId: '423199982215-9f8naaojguulkgha5nmlpumpb00d6j3j.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
