import type { CapacitorConfig } from '@capacitor/cli';

/** Set in CI / release APK builds so the WebView loads clearpathtrader.com APIs (not localhost). */
const productionServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.clearpath.cpms',
  appName: 'ClearPath Cinema',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    ...(productionServerUrl
      ? { url: productionServerUrl, cleartext: false }
      : {}),
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
