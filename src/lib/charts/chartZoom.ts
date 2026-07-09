type TimeScaleZoomApi = {
  setVisibleLogicalRange(range: { from: number; to: number }): void;
  getVisibleLogicalRange(): { from: number; to: number } | null;
};

export const DEFAULT_VISIBLE_BARS = {
  desktop: 120,
  mobile: 72,
  expanded: 160,
} as const;

export function visibleBarTarget(isMobile: boolean, isExpanded: boolean): number {
  if (isExpanded) return DEFAULT_VISIBLE_BARS.expanded;
  return isMobile ? DEFAULT_VISIBLE_BARS.mobile : DEFAULT_VISIBLE_BARS.desktop;
}

/** Focus the time scale on the most recent N bars instead of fitting the entire buffer. */
export function focusRecentBars(
  timeScale: TimeScaleZoomApi,
  totalBars: number,
  visibleBars: number,
): void {
  if (totalBars <= 0) return;

  const count = Math.min(Math.max(visibleBars, 20), totalBars);
  const from = Math.max(0, totalBars - count);
  const to = totalBars + 2;

  timeScale.setVisibleLogicalRange({ from, to });
}

/** Zoom in/out around the center of the current window. factor < 1 zooms in, > 1 zooms out. */
export function zoomTimeScale(timeScale: TimeScaleZoomApi, factor: number): void {
  const range = timeScale.getVisibleLogicalRange();
  if (!range) return;

  const span = range.to - range.from;
  if (span <= 0) return;

  const center = (range.from + range.to) / 2;
  const nextSpan = Math.max(12, span * factor);
  const half = nextSpan / 2;

  timeScale.setVisibleLogicalRange({
    from: center - half,
    to: center + half,
  });
}
