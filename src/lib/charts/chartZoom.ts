import type { IChartApi } from 'lightweight-charts';

const TIME_ZOOM_STEP = 0.22;
const MIN_LOGICAL_SPAN = 6;
const PRICE_ZOOM_STEP = 0.18;

function logicalCenter(range: { from: number; to: number }): number {
  return (range.from + range.to) / 2;
}

function zoomLogicalRange(
  chart: IChartApi,
  direction: 'in' | 'out',
): void {
  const timeScale = chart.timeScale();
  const range = timeScale.getVisibleLogicalRange();
  if (!range) return;

  const center = logicalCenter(range);
  const span = Math.max(range.to - range.from, MIN_LOGICAL_SPAN);
  const factor = direction === 'in' ? 1 - TIME_ZOOM_STEP : 1 + TIME_ZOOM_STEP;
  const nextSpan = Math.max(span * factor, MIN_LOGICAL_SPAN);
  const half = nextSpan / 2;

  timeScale.setVisibleLogicalRange({
    from: center - half,
    to: center + half,
  });
}

function zoomPriceRange(
  chart: IChartApi,
  direction: 'in' | 'out',
): void {
  const priceScale = chart.priceScale('right');
  const range = priceScale.getVisibleRange();

  if (!range) {
    priceScale.setAutoScale(false);
    return;
  }

  const center = (range.from + range.to) / 2;
  const span = Math.max(range.to - range.from, 1e-9);
  const factor = direction === 'in' ? 1 - PRICE_ZOOM_STEP : 1 + PRICE_ZOOM_STEP;
  const nextSpan = span * factor;
  const half = nextSpan / 2;

  priceScale.setVisibleRange({
    from: center - half,
    to: center + half,
  });
}

/** Zoom in on time and price around the current viewport center. */
export function zoomChartIn(chart: IChartApi | null | undefined): void {
  if (!chart) return;
  try {
    zoomLogicalRange(chart, 'in');
    zoomPriceRange(chart, 'in');
  } catch (err) {
    console.warn('[ChartZoom] zoom in failed:', err);
  }
}

/** Zoom out on time and price around the current viewport center. */
export function zoomChartOut(chart: IChartApi | null | undefined): void {
  if (!chart) return;
  try {
    zoomLogicalRange(chart, 'out');
    zoomPriceRange(chart, 'out');
  } catch (err) {
    console.warn('[ChartZoom] zoom out failed:', err);
  }
}

/** Fit all candles and restore automatic price scaling. */
export function resetChartZoom(chart: IChartApi | null | undefined): void {
  if (!chart) return;
  try {
    chart.priceScale('right').setAutoScale(true);
    chart.timeScale().fitContent();
  } catch (err) {
    console.warn('[ChartZoom] reset failed:', err);
  }
}
