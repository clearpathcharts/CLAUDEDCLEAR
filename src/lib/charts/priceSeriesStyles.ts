/**
 * Chart price-series styles — candle variants, lines, areas, and brick charts.
 * Transforms run on OHLC (and optional volume) before lightweight-charts setData.
 */

export type PriceSeriesType =
  | "candlestick"
  | "hollow"
  | "volume_candles"
  | "line"
  | "line_markers"
  | "step_line"
  | "area"
  | "hlc_area"
  | "baseline"
  | "columns"
  | "ohlc"
  | "volume_footprint"
  | "tpo"
  | "session_profile"
  | "heikin_ashi"
  | "renko"
  | "line_break";

export type PriceSeriesFamily = "candlestick" | "bar" | "line" | "area" | "baseline" | "histogram";

export type PriceSeriesGroupId = "candles" | "lines" | "areas" | "bars" | "volume" | "alt";

export type OhlcBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type PriceSeriesOption = {
  id: PriceSeriesType;
  label: string;
  group: PriceSeriesGroupId;
  hint: string;
};

export const PRICE_SERIES_GROUPS: { id: PriceSeriesGroupId; label: string }[] = [
  { id: "candles", label: "Candles" },
  { id: "lines", label: "Lines" },
  { id: "areas", label: "Areas" },
  { id: "bars", label: "Bars" },
  { id: "volume", label: "Volume" },
  { id: "alt", label: "Alternative" },
];

export const PRICE_SERIES_OPTIONS: PriceSeriesOption[] = [
  { id: "candlestick", label: "Candles", group: "candles", hint: "Classic open-high-low-close bodies" },
  { id: "hollow", label: "Hollow candles", group: "candles", hint: "Up bars keep an unfilled body" },
  { id: "volume_candles", label: "Volume candles", group: "candles", hint: "Body tint follows relative bar volume" },
  { id: "line", label: "Line", group: "lines", hint: "Close plotted as a continuous line" },
  { id: "line_markers", label: "Line with markers", group: "lines", hint: "Close line with a marker on each bar" },
  { id: "step_line", label: "Step line", group: "lines", hint: "Close held until the next bar" },
  { id: "area", label: "Area", group: "areas", hint: "Close with a fill to the baseline" },
  { id: "hlc_area", label: "HLC area", group: "areas", hint: "High / low band with close through the middle" },
  { id: "baseline", label: "Baseline", group: "areas", hint: "Close painted above and below the first print" },
  { id: "columns", label: "Columns", group: "bars", hint: "Close as a histogram" },
  { id: "ohlc", label: "High-low", group: "bars", hint: "OHLC bars (open tick, close tick)" },
  { id: "volume_footprint", label: "Volume footprint", group: "volume", hint: "Candles plus volume-at-price on the right" },
  { id: "tpo", label: "Time price opportunity", group: "volume", hint: "TPO letters stacked at price from time buckets" },
  { id: "session_profile", label: "Session volume profile", group: "volume", hint: "Horizontal volume histogram for the loaded window" },
  { id: "heikin_ashi", label: "Heikin Ashi", group: "alt", hint: "Averaged candles that smooth noise" },
  { id: "renko", label: "Renko", group: "alt", hint: "Fixed-size bricks, time ignored" },
  { id: "line_break", label: "Line break", group: "alt", hint: "Three-line break of closes" },
];

export const DEFAULT_PRICE_SERIES: PriceSeriesType = "candlestick";

const VALID = new Set<PriceSeriesType>(PRICE_SERIES_OPTIONS.map((o) => o.id));

export function isPriceSeriesType(v: unknown): v is PriceSeriesType {
  return typeof v === "string" && VALID.has(v as PriceSeriesType);
}

export function priceSeriesLabel(type: PriceSeriesType): string {
  return PRICE_SERIES_OPTIONS.find((o) => o.id === type)?.label ?? "Candles";
}

export function seriesFamily(type: PriceSeriesType): PriceSeriesFamily {
  switch (type) {
    case "line":
    case "line_markers":
    case "step_line":
      return "line";
    case "area":
    case "hlc_area":
      return "area";
    case "baseline":
      return "baseline";
    case "columns":
      return "histogram";
    case "ohlc":
      return "bar";
    default:
      return "candlestick";
  }
}

export function isBrickTransform(type: PriceSeriesType): boolean {
  return type === "renko" || type === "line_break";
}

export function showsVolumeOverlay(type: PriceSeriesType): boolean {
  return type === "volume_footprint" || type === "tpo" || type === "session_profile";
}

export function toHeikinAshi(data: OhlcBar[]): OhlcBar[] {
  if (data.length === 0) return [];
  const out: OhlcBar[] = [];
  let prevOpen = (data[0].open + data[0].close) / 2;
  let prevClose = (data[0].open + data[0].high + data[0].low + data[0].close) / 4;
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevOpen + prevClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out.push({ ...c, open: haOpen, high: haHigh, low: haLow, close: haClose });
    prevOpen = haOpen;
    prevClose = haClose;
  }
  return out;
}

function typicalVolume(c: OhlcBar): number {
  if (typeof c.volume === "number" && c.volume > 0) return c.volume;
  return Math.max(0, c.high - c.low);
}

export function relativeVolumes(data: OhlcBar[]): number[] {
  if (data.length === 0) return [];
  const vols = data.map(typicalVolume);
  const mean = vols.reduce((a, b) => a + b, 0) / vols.length || 1;
  return vols.map((v) => Math.min(2.4, Math.max(0.25, v / mean)));
}

/** ATR-like brick size from recent true range, floored to a readable increment. */
export function renkoBrickSize(data: OhlcBar[]): number {
  if (data.length < 2) {
    const p = Math.abs(data[0]?.close || 1);
    return Math.max(p * 0.002, 1e-8);
  }
  const n = Math.min(14, data.length - 1);
  let sum = 0;
  for (let i = data.length - n; i < data.length; i++) {
    const c = data[i];
    const prev = data[i - 1] ?? c;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    sum += tr;
  }
  const atr = sum / n;
  const p = Math.abs(data[data.length - 1].close) || 1;
  return Math.max(atr * 0.6, p * 0.0008, 1e-8);
}

export function toRenko(data: OhlcBar[], brickSize?: number): OhlcBar[] {
  if (data.length === 0) return [];
  const size = brickSize && brickSize > 0 ? brickSize : renkoBrickSize(data);
  const out: OhlcBar[] = [];
  let lastClose = data[0].open;
  let t = data[0].time;
  const step = Math.max(1, Math.round((data[data.length - 1].time - data[0].time) / Math.max(data.length, 1)));
  for (const c of data) {
    let price = lastClose;
    while (c.close - price >= size) {
      const open = price;
      const close = price + size;
      t += step;
      out.push({ time: t, open, high: close, low: open, close, volume: c.volume });
      price = close;
      lastClose = close;
    }
    while (price - c.close >= size) {
      const open = price;
      const close = price - size;
      t += step;
      out.push({ time: t, open, high: open, low: close, close, volume: c.volume });
      price = close;
      lastClose = close;
    }
  }
  return out.length ? out : [{ ...data[data.length - 1], open: lastClose, high: lastClose, low: lastClose, close: lastClose }];
}

/** Three-line break: a new white (black) line prints only beyond the last three highs (lows). */
export function toLineBreak(data: OhlcBar[], lookback = 3): OhlcBar[] {
  if (data.length === 0) return [];
  const lines: OhlcBar[] = [];
  for (const c of data) {
    if (lines.length === 0) {
      lines.push({ ...c, open: c.open, close: c.close, high: Math.max(c.open, c.close), low: Math.min(c.open, c.close) });
      continue;
    }
    const window = lines.slice(-lookback);
    const high = Math.max(...window.map((l) => Math.max(l.open, l.close)));
    const low = Math.min(...window.map((l) => Math.min(l.open, l.close)));
    const last = lines[lines.length - 1];
    if (c.close > high) {
      lines.push({
        time: c.time,
        open: Math.max(last.open, last.close),
        close: c.close,
        high: c.close,
        low: Math.max(last.open, last.close),
        volume: c.volume,
      });
    } else if (c.close < low) {
      lines.push({
        time: c.time,
        open: Math.min(last.open, last.close),
        close: c.close,
        high: Math.min(last.open, last.close),
        low: c.close,
        volume: c.volume,
      });
    }
  }
  return lines.length ? lines : [data[0]];
}

export function transformOhlc(data: OhlcBar[], type: PriceSeriesType): OhlcBar[] {
  if (type === "heikin_ashi") return toHeikinAshi(data);
  if (type === "renko") return toRenko(data);
  if (type === "line_break") return toLineBreak(data);
  return data;
}

export type VolumeAtPriceNode = {
  price: number;
  volume: number;
  buy: number;
  sell: number;
  letters: string;
  isPoc: boolean;
};

const TPO_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function volumeAtPrice(data: OhlcBar[], bins = 28): VolumeAtPriceNode[] {
  if (data.length === 0) return [];
  const minPrice = Math.min(...data.map((c) => c.low));
  const maxPrice = Math.max(...data.map((c) => c.high));
  const range = maxPrice - minPrice;
  if (!(range > 0)) return [];
  const step = range / bins;
  const nodes: VolumeAtPriceNode[] = Array.from({ length: bins }, (_, i) => ({
    price: minPrice + (i + 0.5) * step,
    volume: 0,
    buy: 0,
    sell: 0,
    letters: "",
    isPoc: false,
  }));
  const span = Math.max(1, data[data.length - 1].time - data[0].time);
  for (const c of data) {
    const vol = typicalVolume(c);
    const mid = (c.high + c.low + c.close) / 3;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((mid - minPrice) / step)));
    const bull = c.close >= c.open;
    nodes[idx].volume += vol;
    if (bull) nodes[idx].buy += vol;
    else nodes[idx].sell += vol;
    const letterIdx = Math.min(TPO_LETTERS.length - 1, Math.floor(((c.time - data[0].time) / span) * 12));
    const letter = TPO_LETTERS[letterIdx];
    if (!nodes[idx].letters.includes(letter)) nodes[idx].letters += letter;
  }
  let poc = 0;
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i].volume > nodes[poc].volume) poc = i;
  }
  if (nodes[poc]) nodes[poc].isPoc = true;
  return nodes;
}
