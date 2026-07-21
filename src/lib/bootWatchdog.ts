/**
 * HTML-level boot watchdog helpers.
 * The companion inline script in index.html shows a recovery panel if React never signals ready.
 */
export const BOOT_WATCHDOG_MS = 12_000;

export function markBootOk() {
  try {
    const w = window as Window & { __CP_BOOT_OK?: boolean; __CP_BOOT_AT?: number };
    w.__CP_BOOT_OK = true;
    w.__CP_BOOT_AT = Date.now();
    document.documentElement.setAttribute('data-cp-boot', 'ok');
  } catch {
    /* ignore */
  }
}

export function markBootFailed(reason: string) {
  try {
    const w = window as Window & { __CP_BOOT_FAILED?: string };
    w.__CP_BOOT_FAILED = reason;
    document.documentElement.setAttribute('data-cp-boot', 'failed');
  } catch {
    /* ignore */
  }
}
