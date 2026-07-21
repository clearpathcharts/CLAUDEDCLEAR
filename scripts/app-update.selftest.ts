/**
 * Self-test for safe app-update manifest rules (no network).
 * Run: npm run test:app-update
 */
import assert from 'node:assert/strict';
import { buildAppUpdateManifest } from '../src/server/appUpdate';

function withEnv(vars: Record<string, string>, fn: () => void): void {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, old] of Object.entries(prev)) {
      if (old === undefined) delete process.env[k];
      else process.env[k] = old;
    }
  }
}

withEnv(
  {
    APP_UPDATE_WEB_VERSION: '1.2.0',
    APP_UPDATE_WEB_MIN_VERSION: '1.0.0',
    APP_UPDATE_ANDROID_VERSION_CODE: '5',
    APP_UPDATE_ANDROID_MIN_VERSION_CODE: '2',
    APP_UPDATE_ANDROID_VERSION_NAME: '1.2.0',
    APP_UPDATE_PLAY_STORE_URL:
      'https://play.google.com/store/apps/details?id=com.clearpath.cpms',
    APP_UPDATE_ALLOW_APK: 'true',
    APP_UPDATE_APK_URL:
      'https://github.com/clearpathcharts/CLAUDEDCLEAR/releases/download/v1.2.0/app.apk',
    APP_UPDATE_APK_SHA256:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  () => {
    const ok = buildAppUpdateManifest();
    assert.equal(ok.web.latestVersion, '1.2.0');
    assert.equal(ok.android.latestVersionCode, 5);
    assert.ok(ok.android.storeUrl?.startsWith('https://'));
    assert.ok(ok.android.apkUrl);
    assert.equal(ok.policy.allowApkSideload, true);
  },
);

withEnv(
  {
    APP_UPDATE_ALLOW_APK: 'true',
    APP_UPDATE_APK_URL: 'http://evil.example/app.apk',
    APP_UPDATE_APK_SHA256:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  () => {
    assert.equal(buildAppUpdateManifest().android.apkUrl, null);
  },
);

withEnv(
  {
    APP_UPDATE_ALLOW_APK: 'true',
    APP_UPDATE_APK_URL:
      'https://github.com/clearpathcharts/CLAUDEDCLEAR/releases/download/v1.2.0/app.apk',
    APP_UPDATE_APK_SHA256: 'nope',
  },
  () => {
    assert.equal(buildAppUpdateManifest().android.apkUrl, null);
  },
);

withEnv(
  {
    APP_UPDATE_ALLOW_APK: 'true',
    APP_UPDATE_APK_URL: 'https://evil.example/app.apk',
    APP_UPDATE_APK_SHA256:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  () => {
    assert.equal(buildAppUpdateManifest().android.apkUrl, null);
  },
);

withEnv(
  {
    APP_UPDATE_ALLOW_APK: 'false',
    APP_UPDATE_APK_URL:
      'https://github.com/clearpathcharts/CLAUDEDCLEAR/releases/download/v1.2.0/app.apk',
    APP_UPDATE_APK_SHA256:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  () => {
    const disabled = buildAppUpdateManifest();
    assert.equal(disabled.android.apkUrl, null);
    assert.equal(disabled.policy.allowApkSideload, false);
  },
);

console.log('app-update.selftest: OK');
