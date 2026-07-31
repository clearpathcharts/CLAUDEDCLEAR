import { getCandleLimit } from "../config/tierLimits";

/**
 * Historical market data service.
 *
 * SECURITY: This file runs in the browser. It must NEVER contain an API key
 * and must NEVER call api.twelvedata.com directly. All requests go through the
 * server proxy at /api/market/history, where the Twelve Data key stays secret
 * and where caching / rate-limit handling lives.
 */

export interface NormalizedCandle {
  time: number; // Unix seconds, oldest -> newest
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Twelve Data native time_series intervals:
 * 1min, 5min, 15min, 30min, 45min, 1h, 2h, 4h, 8h, 1day, 1week, 1month
 *
 * UI buttons that are NOT native must be built by aggregating a finer interval
 * (or by capping daily history for range views). Otherwise multiple buttons
 * silently fetch the same candles and look identical.
 */
export type TimeframePlan = {
  /** Interval string sent to Twelve Data */
  fetchInterval: string;
  /** Merge every N fetched bars into one UI candle (1 = native) */
  aggregateBars: number;
  /** Optional final bar count (3M / 6M / YTD range windows) */
  visibleBars?: number;
  mode: "native" | "aggregate" | "range";
  /** Short human note for tooltips / diagnostics */
  note: string;
};

const TWELVE_NATIVE = new Set([
  "1min",
  "5min",
  "15min",
  "30min",
  "45min",
  "1h",
  "2h",
  "4h",
  "8h",
  "1day",
  "1week",
  "1month",
]);

function estimateYtdTradingDays(): number {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const calendarDays = Math.max(
    1,
    Math.ceil((now.getTime() - start) / 86_400_000)
  );
  return Math.min(260, Math.max(10, Math.round(calendarDays * (252 / 365))));
}

/**
 * Resolve a UI timeframe into a fetch plan so each button produces distinct bars.
 *
 * Collision matrix that this replaces:
 *   1m/2m/3m → all were 1min (identical)
 *   10m/15m → all were 15min (identical)
 *   2h/3h → all were 2h (identical)
 *   1D/3M/6M/YTD → all were 1day with the same limit (identical)
 */
export function resolveTimeframePlan(interval: string): TimeframePlan {
  const raw = (interval || "").trim();

  if (raw === "1M") {
    return {
      fetchInterval: "1month",
      aggregateBars: 1,
      mode: "native",
      note: "Twelve Data 1month",
    };
  }
  if (raw === "3M") {
    return {
      fetchInterval: "1day",
      aggregateBars: 1,
      visibleBars: 66,
      mode: "range",
      note: "Daily bars · last ~3 months",
    };
  }
  if (raw === "6M") {
    return {
      fetchInterval: "1day",
      aggregateBars: 1,
      visibleBars: 132,
      mode: "range",
      note: "Daily bars · last ~6 months",
    };
  }

  const v = raw.toLowerCase();

  switch (v) {
    case "1m":
    case "1min":
      return {
        fetchInterval: "1min",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 1min",
      };
    case "2m":
    case "2min":
      return {
        fetchInterval: "1min",
        aggregateBars: 2,
        mode: "aggregate",
        note: "Built from 1min × 2 (Twelve Data has no 2min)",
      };
    case "3m":
    case "3min":
      return {
        fetchInterval: "1min",
        aggregateBars: 3,
        mode: "aggregate",
        note: "Built from 1min × 3 (Twelve Data has no 3min)",
      };
    case "5m":
    case "5min":
      return {
        fetchInterval: "5min",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 5min",
      };
    case "10m":
    case "10min":
      return {
        fetchInterval: "5min",
        aggregateBars: 2,
        mode: "aggregate",
        note: "Built from 5min × 2 (Twelve Data has no 10min)",
      };
    case "15m":
    case "15min":
      return {
        fetchInterval: "15min",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 15min",
      };
    case "30m":
    case "30min":
      return {
        fetchInterval: "30min",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 30min",
      };
    case "45m":
    case "45min":
      return {
        fetchInterval: "45min",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 45min",
      };
    case "1h":
    case "60min":
      return {
        fetchInterval: "1h",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 1h",
      };
    case "2h":
      return {
        fetchInterval: "2h",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 2h",
      };
    case "3h":
      return {
        fetchInterval: "1h",
        aggregateBars: 3,
        mode: "aggregate",
        note: "Built from 1h × 3 (Twelve Data has no 3h)",
      };
    case "4h":
      return {
        fetchInterval: "4h",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 4h",
      };
    case "8h":
      return {
        fetchInterval: "8h",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 8h",
      };
    case "1d":
    case "day":
    case "1day":
      return {
        fetchInterval: "1day",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 1day",
      };
    case "1w":
    case "week":
    case "1week":
      return {
        fetchInterval: "1week",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 1week",
      };
    case "1mo":
    case "month":
    case "1month":
      return {
        fetchInterval: "1month",
        aggregateBars: 1,
        mode: "native",
        note: "Twelve Data 1month",
      };
    case "ytd":
      return {
        fetchInterval: "1day",
        aggregateBars: 1,
        visibleBars: estimateYtdTradingDays(),
        mode: "range",
        note: "Daily bars · year-to-date window",
      };
    default:
      console.warn(
        `[marketData] Unknown interval "${interval}", defaulting to 1day.`
      );
      return {
        fetchInterval: "1day",
        aggregateBars: 1,
        mode: "native",
        note: "Fallback 1day",
      };
  }
}

/** Native Twelve Data interval used for the HTTP call (smoke / gateway). */
export function resolveTwelveDataInterval(interval: string): string {
  const plan = resolveTimeframePlan(interval);
  if (!TWELVE_NATIVE.has(plan.fetchInterval)) {
    console.warn(
      `[marketData] Non-native fetch interval "${plan.fetchInterval}" — check plan.`
    );
  }
  return plan.fetchInterval;
}

/** Tooltip / diagnostic label for a UI timeframe button. */
export function describeTimeframe(interval: string): string {
  return resolveTimeframePlan(interval).note;
}

/**
 * Collapse every `factor` sequential candles into one OHLC bar.
 * Groups align to the newest bar so the live candle stays correct.
 */
export function aggregateCandles(
  candles: NormalizedCandle[],
  factor: number
): NormalizedCandle[] {
  if (factor <= 1 || candles.length === 0) return candles;
  const out: NormalizedCandle[] = [];
  const remainder = candles.length % factor;
  for (let i = remainder; i < candles.length; i += factor) {
    const chunk = candles.slice(i, i + factor);
    if (chunk.length < factor) continue;
    let high = chunk[0].high;
    let low = chunk[0].low;
    for (let j = 1; j < chunk.length; j++) {
      if (chunk[j].high > high) high = chunk[j].high;
      if (chunk[j].low < low) low = chunk[j].low;
    }
    out.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high,
      low,
      close: chunk[chunk.length - 1].close,
    });
  }
  return out;
}

const TWELVEDATA_MAX_OUTPUTSIZE = 5000;

export const fetchTieredHistoricalData = async (
  symbol: string,
  interval: string,
  userTier: string
): Promise<NormalizedCandle[]> => {
  const plan = resolveTimeframePlan(interval);
  const tierCap = Math.min(getCandleLimit(userTier), TWELVEDATA_MAX_OUTPUTSIZE);
  const desiredFinal = plan.visibleBars
    ? Math.min(plan.visibleBars, tierCap)
    : tierCap;
  const fetchLimit = Math.min(
    TWELVEDATA_MAX_OUTPUTSIZE,
    Math.max(plan.aggregateBars, desiredFinal * plan.aggregateBars)
  );

  const proxyUrl =
    `/api/market/history` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(plan.fetchInterval)}` +
    `&limit=${encodeURIComponent(String(fetchLimit))}`;

  let response: Response;
  try {
    response = await fetch(proxyUrl);
  } catch (networkErr: any) {
    console.error("[marketData] Network error reaching proxy:", networkErr);
    throw new Error(
      `Real-time market fetch failed: ${
        networkErr?.message || "no connection to data server"
      }.`
    );
  }

  if (!response.ok) {
    let detail = `status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) detail = body.message;
      else if (body?.error) detail = body.error;
    } catch {
      /* response had no JSON body */
    }
    console.error(`[marketData] Proxy responded ${response.status}: ${detail}`);
    if (response.status === 429) {
      throw new Error(`Real-time market fetch failed: 429 rate limited — ${detail}.`);
    }
    throw new Error(`Real-time market fetch failed: ${detail}.`);
  }

  const rawData = await response.json();

  if (!Array.isArray(rawData)) {
    throw new Error(
      "Real-time market fetch failed: unexpected response format from data server."
    );
  }

  let candles: NormalizedCandle[] = rawData
    .map((v: any[]) => ({
      time: Math.floor(Number(v[0]) / 1000),
      open: Number(v[1]),
      high: Number(v[2]),
      low: Number(v[3]),
      close: Number(v[4]),
    }))
    .filter(
      (c) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    )
    .sort((a, b) => a.time - b.time);

  candles = aggregateCandles(candles, plan.aggregateBars);

  if (plan.visibleBars && candles.length > plan.visibleBars) {
    candles = candles.slice(candles.length - plan.visibleBars);
  }

  return candles;
};
