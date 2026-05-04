import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canshift.performanceapp',
  appName: 'Performance App',
  webDir: '.next',
  server: {
    url: 'https://performance-app-ivory.vercel.app', // or your local IP for testing
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '423199982215-9f8naaojguulkgha5nmlpumpb00d6j3j.apps.googleusercontent.com',   // Web client ID
      androidClientId: '423199982215-uan3bkl02b9qu1dat3nj0lvgkhvndnba.apps.googleusercontent.com', // Android client ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;