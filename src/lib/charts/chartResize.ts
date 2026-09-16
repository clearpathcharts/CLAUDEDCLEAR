/**
 * Fallback size when lightweight-charts `autoSize` is not active.
 * Returning null (instead of a stale fallback height) is required: applying
 * a 420px fallback when the flex parent is still 0px tall locks the canvas
 * small and it never grows.
 */
export function nextChartPixelSize(
  width: number,
  rectHeight: number,
): { width: number; height: number } | null {
  if (!(width > 0) || !(rectHeight > 0)) return null;
  return { width: Math.floor(width), height: Math.floor(rectHeight) };
}
