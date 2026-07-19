/** Default dashboard tab for web vs native. */
import { Capacitor } from '@capacitor/core';

export function getDefaultDashboardTab(): string {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('cinema') === '1') return 'CpmsApk';
    } catch {
      /* ignore */
    }
  }
  // Native APK builds open straight into the cinema experience.
  if (Capacitor.isNativePlatform()) return 'CpmsApk';
  // Web default: Home / Discovery (not cinema) for faster first paint.
  return 'Discovery';
}
