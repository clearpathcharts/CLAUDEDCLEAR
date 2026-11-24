import type { Candle } from "@/lib/marketData";

export const CLEARPATH_LIVE_ORIGIN =
  process.env.CLEARPATH_LIVE_API_BASE?.replace(/\/$/, "") ||
  "https://clearpathtrader.com";

export type LiveQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  vendor?: string;
  unavailable?: boolean;
  error?: string;
};

export type LiveSeries = LiveQuote & {
  candles: Candle[];
  source: "clearpathtrader.com";
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export async function fetchLiveQuote(symbol: string): Promise<LiveQuote> {
  const url = `${CLEARPATH_LIVE_ORIGIN}/api/quote?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return {
      symbol,
      name: "DATA UNAVAILABLE",
      price: 0,
      change: 0,
      changePct: 0,
      unavailable: true,
      error: typeof body?.message === "string" ? body.message : `HTTP ${res.status}`,
    };
  }
  const data = (await res.json()) as Record<string, unknown>;
  const price = num(data.price ?? data.close);
  const change = num(data.change);
  const changePct = num(data.percent_change ?? data.percentChange);
  return {
    symbol: String(data.symbol || symbol),
    name: String(data.name || symbol),
    price: Number.isFinite(price) ? price : 0,
    change: Number.isFinite(change) ? change : 0,
    changePct: Number.isFinite(changePct) ? changePct : 0,
    vendor: typeof data.vendor === "string" ? data.vendor : undefined,
    unavailable: !Number.isFinite(price) || price <= 0,
  };
}

export async function fetchLiveCandles(
  symbol: string,
  interval = "1h",
  limit = 100,
): Promise<{ candles: Candle[]; vendor?: string; error?: string }> {
  const url = `${CLEARPATH_LIVE_ORIGIN}/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return {
      candles: [],
      error: typeof body?.message === "string" ? body.message : `HTTP ${res.status}`,
    };
  }
  const data = (await res.json()) as {
    values?: Array<Record<string, unknown>>;
    vendor?: string;
    provenance?: { provider?: string };
  };
  const values = Array.isArray(data.values) ? data.values : [];
  const candles: Candle[] = values
    .map((row) => {
      const t = Date.parse(String(row.datetime || row.date || ""));
      return {
        t: Number.isFinite(t) ? t : 0,
        o: num(row.open),
        h: num(row.high),
        l: num(row.low),
        c: num(row.close),
      };
    })
    .filter((c) => c.t > 0 && [c.o, c.h, c.l, c.c].every((n) => Number.isFinite(n)))
    .sort((a, b) => a.t - b.t);

  return {
    candles,
    vendor: data.vendor || data.provenance?.provider,
  };
}

export async function fetchLiveSeries(symbol: string): Promise<LiveSeries> {
  const [quote, series] = await Promise.all([
    fetchLiveQuote(symbol),
    fetchLiveCandles(symbol, "1h", 100),
  ]);
  return {
    ...quote,
    candles: series.candles,
    vendor: quote.vendor || series.vendor,
    source: "clearpathtrader.com",
    unavailable: quote.unavailable || series.candles.length === 0,
    error: quote.error || series.error,
  };
}
