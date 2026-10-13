/** Default dashboard tab for web vs native / lean app shell. */
import { Capacitor } from '@capacitor/core';
import { isAppShell } from '../appShell';

export function getDefaultDashboardTab(): string {
  // Lean APK / installed PWA → charts first (trading-focused shell).
  if (isAppShell()) return 'StrictlyCharts';
  if (Capacitor.isNativePlatform()) return 'StrictlyCharts';
  // Web default: Home / Discovery for faster first paint.
  return 'Discovery';
}
