/**
 * Hard-coded Gold Bar — the TradingView look: a bright gold candlestick
 * on the regular chart. No buy/sell markers. No ATR trail line.
 *
 * On by default on every chart. Opt out with the Gold Bar switch.
 */

export const GOLD_BAR_COLOR = "#FFCC00";
export const GOLD_BAR_STORAGE_KEY = "cpt-gold-bar-on";
export const GOLD_BAR_EVENT = "cpt-gold-bar";

type PaintableBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  color?: string;
  wickColor?: string;
  borderColor?: string;
};

export function readGoldBarEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(GOLD_BAR_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeGoldBarEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GOLD_BAR_STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(GOLD_BAR_EVENT, { detail: on }));
}

export function subscribeGoldBarEnabled(listener: (on: boolean) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === GOLD_BAR_STORAGE_KEY) listener(event.newValue !== "0");
  };
  const onCustom = (event: Event) => listener(Boolean((event as CustomEvent).detail));
  window.addEventListener("storage", onStorage);
  window.addEventListener(GOLD_BAR_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(GOLD_BAR_EVENT, onCustom);
  };
}

/** Paint wide-range candles bright gold. That is the bar — nothing else. */
export function applyHardcodedGoldBar<T extends PaintableBar>(
  bars: T[],
  enabled: boolean,
): T[] {
  if (!enabled || bars.length === 0) return bars;
  return bars.map((bar, index) => {
    const range = bar.high - bar.low;
    const start = Math.max(0, index - 14);
    const prior = bars.slice(start, index);
    if (prior.length < 5) return bar;
    const typical = prior.reduce((sum, item) => sum + (item.high - item.low), 0) / prior.length;
    if (typical <= 0 || range < typical * 1.65) return bar;
    return {
      ...bar,
      color: GOLD_BAR_COLOR,
      wickColor: GOLD_BAR_COLOR,
      borderColor: GOLD_BAR_COLOR,
    };
  });
}
