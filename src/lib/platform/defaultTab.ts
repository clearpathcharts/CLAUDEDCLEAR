import { Capacitor } from '@capacitor/core';

/** Default dashboard tab — ClearPath Cinema for launch (APK + first visits). */
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
  // Web launch default: financial live streams front and center for new visitors.
  return 'CpmsApk';
}
