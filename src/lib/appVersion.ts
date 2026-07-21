import { Capacitor } from '@capacitor/core';

/** Baked into the web/native bundle at build time (public, not a secret). */
export const CLIENT_WEB_VERSION =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_APP_VERSION) ||
  '1.0.0';

/**
 * Must stay in sync with android/app/build.gradle versionCode.
 * Native builds can override via VITE_ANDROID_VERSION_CODE at cap sync time.
 */
export const CLIENT_ANDROID_VERSION_CODE = Number.parseInt(
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_ANDROID_VERSION_CODE) ||
    '1',
  10,
) || 1;

export const CLIENT_ANDROID_VERSION_NAME =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_ANDROID_VERSION_NAME) ||
  '1.0';

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Compare dotted numeric versions: 1.2.10 > 1.2.9. Non-numeric → 0. */
export function compareSemverLike(a: string, b: string): number {
  const pa = String(a || '0')
    .split(/[.+-]/)
    .map((p) => Number.parseInt(p.replace(/\D/g, ''), 10) || 0);
  const pb = String(b || '0')
    .split(/[.+-]/)
    .map((p) => Number.parseInt(p.replace(/\D/g, ''), 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}

export type AppUpdateManifest = {
  schemaVersion: number;
  checkedAt: string;
  web: {
    latestVersion: string;
    minSupportedVersion: string;
    releaseNotes: string;
  };
  android: {
    latestVersionName: string;
    latestVersionCode: number;
    minSupportedVersionCode: number;
    storeUrl: string | null;
    apkUrl: string | null;
    apkSha256: string | null;
    releaseNotes: string;
  };
  policy: {
    defaultSeverity: 'soft' | 'hard';
    allowApkSideload: boolean;
    snoozeHours: number;
  };
};

export type UpdateOffer = {
  platform: 'web' | 'android';
  severity: 'soft' | 'hard';
  currentLabel: string;
  latestLabel: string;
  notes: string;
  primaryAction: 'reload' | 'store' | 'apk';
  primaryUrl: string | null;
  /** Optional sideload when store is primary (still user-initiated). */
  secondaryApkUrl: string | null;
  apkSha256: string | null;
};

export function evaluateUpdateOffer(
  manifest: AppUpdateManifest,
): UpdateOffer | null {
  if (isNativeApp()) {
    const current = CLIENT_ANDROID_VERSION_CODE;
    const latest = manifest.android.latestVersionCode;
    const min = manifest.android.minSupportedVersionCode;
    if (current >= latest) return null;

    const belowMin = current < min;
    const hasStore = Boolean(manifest.android.storeUrl);
    const hasApk =
      manifest.policy.allowApkSideload && Boolean(manifest.android.apkUrl);

    let primaryAction: UpdateOffer['primaryAction'] = 'store';
    let primaryUrl: string | null = manifest.android.storeUrl;
    let secondaryApkUrl: string | null = null;
    if (hasStore && hasApk) {
      secondaryApkUrl = manifest.android.apkUrl;
    } else if (!hasStore && hasApk) {
      primaryAction = 'apk';
      primaryUrl = manifest.android.apkUrl;
    } else if (!hasStore && !hasApk) {
      primaryAction = 'store';
      primaryUrl = null;
    }

    return {
      platform: 'android',
      severity:
        belowMin || manifest.policy.defaultSeverity === 'hard'
          ? 'hard'
          : 'soft',
      currentLabel: `${CLIENT_ANDROID_VERSION_NAME} (${current})`,
      latestLabel: `${manifest.android.latestVersionName} (${latest})`,
      notes: manifest.android.releaseNotes,
      primaryAction,
      primaryUrl,
      secondaryApkUrl,
      apkSha256: manifest.android.apkSha256,
    };
  }

  const current = CLIENT_WEB_VERSION;
  const latest = manifest.web.latestVersion;
  const min = manifest.web.minSupportedVersion;
  if (compareSemverLike(current, latest) >= 0) return null;

  const belowMin = compareSemverLike(current, min) < 0;
  return {
    platform: 'web',
    severity:
      belowMin || manifest.policy.defaultSeverity === 'hard' ? 'hard' : 'soft',
    currentLabel: current,
    latestLabel: latest,
    notes: manifest.web.releaseNotes,
    primaryAction: 'reload',
    primaryUrl: null,
    secondaryApkUrl: null,
    apkSha256: null,
  };
}
