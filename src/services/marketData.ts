import { getCandleLimit } from "../config/tierLimits";

/**
 * Historical market data service.
 *
 * SECURITY: This file runs in the browser. It must NEVER contain an API key
 * and must NEVER call api.twelvedata.com directly. All requests go through the
 * server proxy at /api/market/history, where the Twelve Data key stays secret
 * and where caching / rate-limit handling lives. Calling Twelve Data straight
 * from the browser both exposes the key and multiplies requests per chart,
 * which is what was tripping the Grow-plan rate limit and blanking the charts.
 */

export interface NormalizedCandle {
  time: number; // Unix seconds, oldest -> newest
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Maps every UI timeframe string the app can emit to the exact interval string
 * Twelve Data expects. Anything unrecognized falls back to '1day' rather than
 * being passed through raw (a raw/unknown string is what made non-1H buttons
 * return "no data").
 */
export function resolveTwelveDataInterval(interval: string): string {
  const raw = (interval || "").trim();

  // Monthly UI tokens ("1M", "3M", "6M") must be handled before lowercasing,
  // otherwise "1M" becomes "1m" and is misread as one-minute candles.
  if (raw === "1M") return "1month";
  if (raw === "3M" || raw === "6M") return "1month";

  const v = raw.toLowerCase();

  switch (v) {
    case "1m":
    case "1min":
      return "1min";
    case "5m":
    case "5min":
      return "5min";
    case "10m":
    case "10min":
      // Twelve Data has no native 10min; 15min is the closest supported step.
      return "15min";
    case "15m":
    case "15min":
      return "15min";
    case "30m":
    case "30min":
      return "30min";
    case "45m":
    case "45min":
      return "45min";
    case "1h":
    case "60min":
      return "1h";
    case "2h":
      return "2h";
    case "4h":
      return "4h";
    case "1d":
    case "day":
    case "1day":
      return "1day";
    case "1w":
    case "week":
    case "1week":
      return "1week";
    case "1mo":
    case "month":
    case "1month":
      return "1month";
    case "ytd":
      // Year-to-date is best represented as daily candles; the caller/limit
      // controls how many days come back.
      return "1day";
    default:
      console.warn(
        `[marketData] Unknown interval "${interval}", defaulting to 1day.`
      );
      return "1day";
  }
}

/**
 * Fetch historical candles for a symbol/timeframe via the secure server proxy.
 * Returns candles sorted oldest -> newest (required by lightweight-charts).
 * Throws on failure. Never returns mock/simulated data.
 */
export const fetchTieredHistoricalData = async (
  symbol: string,
  interval: string,
  userTier: string
): Promise<NormalizedCandle[]> => {
  const limit = getCandleLimit(userTier);
  const resolvedInterval = resolveTwelveDataInterval(interval);

  const proxyUrl =
    `/api/market/history` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(resolvedInterval)}` +
    `&limit=${encodeURIComponent(String(limit))}`;

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
    // Surface the real upstream status so the chart can show an honest error
    // (e.g. 429 = rate limited, 503 = key not configured) instead of fake data.
    let detail = `status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) detail = body.message;
      else if (body?.error) detail = body.error;
    } catch {
      /* response had no JSON body */
    }
    console.error(`[marketData] Proxy responded ${response.status}: ${detail}`);
    throw new Error(`Real-time market fetch failed: ${detail}.`);
  }

  const rawData = await response.json();

  if (!Array.isArray(rawData)) {
    throw new Error(
      "Real-time market fetch failed: unexpected response format from data server."
    );
  }

  // Server returns rows shaped [timestampMs, open, high, low, close].
  const candles: NormalizedCandle[] = rawData
    .map((v: any[]) => ({
      time: Math.floor(Number(v[0]) / 1000),
      open: Number(v[1]),
      high: Number(v[2]),
      low: Number(v[3]),
      close: Number(v[4]),
    }))
    // Drop any malformed rows rather than rendering NaN candles.
    .filter(
      (c) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    )
    .sort((a, b) => a.time - b.time);

  return candles;
};
