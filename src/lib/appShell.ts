import { Capacitor } from '@capacitor/core';

/** True inside the Capacitor Android/iOS wrapper (APK). */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Installed PWA / add-to-home-screen — treat like the lean app shell. */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).get('appshell') === '1') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Lean trading-app mode: APK or installed PWA.
 * Website (desktop + mobile browser) stays full-featured.
 */
export function isAppShell(): boolean {
  return isNativeApp() || isStandalonePwa();
}

/** Timeframes most day/swing traders actually use — app shell only. */
export const APP_ESSENTIAL_TIMEFRAMES = ['5m', '15m', '30m', '1H', '4H', '1D'] as const;
