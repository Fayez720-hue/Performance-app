import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canshift.performanceapp',
  appName: 'Performance App v1.0',
  webDir: 'out',
  server: {
    // Pointing to your live Cloudflare backend
    url: 'https://performance-app-6yb.pages.dev',
    cleartext: true,
    allowNavigation: ['performance-app-6yb.pages.dev']
  }
};

export default config;
