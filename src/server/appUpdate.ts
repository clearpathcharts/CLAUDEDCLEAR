/**
 * Safe app / APK update manifest.
 *
 * Design rules (intentional):
 * - Never silently download or install binaries.
 * - Prefer Play Store / web reload over APK sideload.
 * - APK URLs only when HTTPS + host allowlist + sha256 are all set.
 * - Clients must require an explicit user gesture to act.
 */

const DEFAULT_APK_HOST_ALLOWLIST = [
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'storage.googleapis.com',
];

function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}

function envInt(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parseAllowlist(raw: string): string[] {
  const parts = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 0 ? parts : DEFAULT_APK_HOST_ALLOWLIST;
}

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

function hostAllowed(urlStr: string, allowlist: string[]): boolean {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return allowlist.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

function isSha256Hex(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

export type AppUpdateManifest = {
  schemaVersion: 1;
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
    /** Preferred: Google Play (or other store) listing */
    storeUrl: string | null;
    /**
     * Optional sideload APK. Only populated when allow-apk is enabled and
     * URL is https + allowlisted + sha256 provided.
     */
    apkUrl: string | null;
    apkSha256: string | null;
    releaseNotes: string;
  };
  policy: {
    /** soft = dismissible banner; hard = blocking until user acts (still no silent install) */
    defaultSeverity: 'soft' | 'hard';
    allowApkSideload: boolean;
    snoozeHours: number;
  };
};

export function buildAppUpdateManifest(): AppUpdateManifest {
  const allowApk = ['1', 'true', 'yes', 'on'].includes(
    env('APP_UPDATE_ALLOW_APK', 'false').toLowerCase(),
  );
  const allowlist = parseAllowlist(env('APP_UPDATE_APK_HOST_ALLOWLIST'));

  const storeUrlRaw = env('APP_UPDATE_PLAY_STORE_URL');
  const storeUrl =
    storeUrlRaw && isHttpsUrl(storeUrlRaw) ? storeUrlRaw : null;

  let apkUrl: string | null = null;
  let apkSha256: string | null = null;

  if (allowApk) {
    const candidateUrl = env('APP_UPDATE_APK_URL');
    const candidateSha = env('APP_UPDATE_APK_SHA256');
    if (
      candidateUrl &&
      isHttpsUrl(candidateUrl) &&
      hostAllowed(candidateUrl, allowlist) &&
      isSha256Hex(candidateSha)
    ) {
      apkUrl = candidateUrl;
      apkSha256 = candidateSha.toLowerCase();
    }
  }

  const severityRaw = env('APP_UPDATE_DEFAULT_SEVERITY', 'soft').toLowerCase();
  const defaultSeverity: 'soft' | 'hard' =
    severityRaw === 'hard' ? 'hard' : 'soft';

  return {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    web: {
      latestVersion: env('APP_UPDATE_WEB_VERSION', '1.0.0'),
      minSupportedVersion: env('APP_UPDATE_WEB_MIN_VERSION', '1.0.0'),
      releaseNotes: env(
        'APP_UPDATE_WEB_NOTES',
        'Refresh for the latest ClearPath Trader web build.',
      ),
    },
    android: {
      latestVersionName: env('APP_UPDATE_ANDROID_VERSION_NAME', '1.0'),
      latestVersionCode: envInt('APP_UPDATE_ANDROID_VERSION_CODE', 1),
      minSupportedVersionCode: envInt('APP_UPDATE_ANDROID_MIN_VERSION_CODE', 1),
      storeUrl,
      apkUrl,
      apkSha256,
      releaseNotes: env(
        'APP_UPDATE_ANDROID_NOTES',
        'A newer ClearPath Cinema / Trader Android build is available.',
      ),
    },
    policy: {
      defaultSeverity,
      allowApkSideload: Boolean(apkUrl),
      snoozeHours: envInt('APP_UPDATE_SNOOZE_HOURS', 24),
    },
  };
}
