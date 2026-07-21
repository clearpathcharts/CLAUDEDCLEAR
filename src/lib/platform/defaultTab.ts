/** Default dashboard tab for web vs native / lean app shell. */
import { Capacitor } from '@capacitor/core';
import { isAppShell } from '../appShell';

export function getDefaultDashboardTab(): string {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('cinema') === '1') return 'CpmsApk';
    } catch {
      /* ignore */
    }
  }
  // Lean APK / installed PWA → charts first (trading-focused shell).
  if (isAppShell()) return 'StrictlyCharts';
  // Legacy native without appshell detection still opens cinema.
  if (Capacitor.isNativePlatform()) return 'CpmsApk';
  // Web default: Home / Discovery (not cinema) for faster first paint.
  return 'Discovery';
}
