import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clearpath.cpms',
  appName: 'ClearPath CPMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
