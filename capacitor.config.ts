import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canshift.performanceapp',
  appName: 'Performance App v1.0',
  webDir: 'out',
  server: {
    // Switched to your live Wasmer backend
    url: 'https://performance-app-fayez720-hue.wasmer.app',
    cleartext: true,
    allowNavigation: [
      'performance-app-fayez720-hue.wasmer.app',
      'performance-app-6yb.pages.dev'
    ]
  }
};

export default config;
