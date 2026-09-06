/**
 * Chart intel overlays (Pattern Scanner HUD, Forming Watch).
 * Bump storage keys when changing first-visit defaults so an existing
 * localStorage "1" / [] does not keep the packed-on-candles phone layout.
 */

export const PATTERN_HUD_OPEN_KEY = "cp_chart_pattern_hud_open_v2";
export const FORMING_WATCH_OPEN_KEY = "cp_chart_forming_watch_open_v2";

export const NARROW_CHART_MQ = "(max-width: 767px)";
export const TOUCH_HINT_MQ = "(pointer: coarse), (hover: none)";

export function isNarrowChartViewport(
  win: { innerWidth?: number; matchMedia?: (q: string) => { matches: boolean } } | undefined =
    typeof window !== "undefined" ? window : undefined,
): boolean {
  if (!win) return false;
  if (typeof win.matchMedia === "function") {
    return win.matchMedia(NARROW_CHART_MQ).matches;
  }
  return typeof win.innerWidth === "number" && win.innerWidth < 768;
}

export function hideDesktopAxisHints(
  win: { matchMedia?: (q: string) => { matches: boolean } } | undefined =
    typeof window !== "undefined" ? window : undefined,
): boolean {
  if (!win?.matchMedia) return isNarrowChartViewport(win);
  return win.matchMedia(NARROW_CHART_MQ).matches || win.matchMedia(TOUCH_HINT_MQ).matches;
}

/** First visit after a key bump: phones start closed so candles stay readable. Desktop stays open. */
export function defaultChartOverlayOpen(narrow: boolean): boolean {
  return !narrow;
}

export function readOverlayOpen(key: string, fallbackOpen: boolean): boolean {
  if (typeof localStorage === "undefined") return fallbackOpen;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallbackOpen;
    return stored === "1";
  } catch {
    return fallbackOpen;
  }
}

export function writeOverlayOpen(key: string, open: boolean): void {
  try {
    localStorage.setItem(key, open ? "1" : "0");
  } catch {
    /* private mode / quota */
  }
}
