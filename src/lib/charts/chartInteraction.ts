import type { HandleScaleOptions, HandleScrollOptions, IChartApi } from 'lightweight-charts';
import { scalePriceOnly } from './chartZoom';

/** Pinch + axis-drag scale. Time axis stretches bars; price axis lifts/squishes. */
export const CHART_HANDLE_SCALE: HandleScaleOptions = {
  mouseWheel: true,
  pinch: true,
  axisPressedMouseMove: { time: true, price: true },
  axisDoubleClickReset: { time: true, price: true },
};

export function chartHandleScroll(allowVertTouchDrag: boolean): HandleScrollOptions {
  return {
    mouseWheel: true,
    pressedMouseMove: true,
    horzTouchDrag: true,
    vertTouchDrag: allowVertTouchDrag,
  };
}

/** Wide enough to grab on phone/tablet; drag this column to lift or squish price. */
export const CHART_PRICE_SCALE_GESTURE = {
  minimumWidth: 64,
  borderVisible: true,
  entireTextOnly: false,
} as const;

/** Allow squeezing many bars in, or stretching them wide. */
export const CHART_TIME_SCALE_GESTURE = {
  timeVisible: true,
  secondsVisible: false,
  // false: a 0-size flex mount must not lock an empty window until the user scrolls.
  lockVisibleTimeRangeOnResize: false,
  minBarSpacing: 0.5,
  rightOffset: 4,
} as const;

/**
 * Shift+wheel scales price only (lift/squish). Plain wheel still scales time via the library.
 */
export function attachShiftWheelPriceScale(
  container: HTMLElement,
  getChart: () => IChartApi | null,
): () => void {
  const onWheel = (event: WheelEvent) => {
    if (!event.shiftKey) return;
    const chart = getChart();
    if (!chart) return;
    event.preventDefault();
    event.stopPropagation();
    scalePriceOnly(chart, event.deltaY < 0 ? 'squish' : 'lift');
  };
  container.addEventListener('wheel', onWheel, { passive: false });
  return () => container.removeEventListener('wheel', onWheel);
}
