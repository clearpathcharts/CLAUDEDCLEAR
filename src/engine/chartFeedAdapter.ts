import { MarketEngine } from "./MarketEngine";
import {
  aggregateCandles,
  resolveTimeframePlan,
  type NormalizedCandle,
} from "../services/marketData";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

function normalizeTwelveData(values: any[]): Candle[] {
  return values
    .slice()
    .reverse()
    .map((v) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
    }));
}

function applyPlan(candles: Candle[], uiInterval: string): Candle[] {
  const plan = resolveTimeframePlan(uiInterval);
  let next = aggregateCandles(
    candles as NormalizedCandle[],
    plan.aggregateBars
  ) as Candle[];
  if (plan.visibleBars && next.length > plan.visibleBars) {
    next = next.slice(next.length - plan.visibleBars);
  }
  return next;
}

export const ChartFeedAdapter = {
  /**
   * SINGLE RESPONSIBILITY:
   * Convert MarketEngine → Lightweight Charts format
   */
  async getCandles(symbol: string, interval = "5min") {
    const plan = resolveTimeframePlan(interval);
    const raw = await MarketEngine.getCandles(symbol, plan.fetchInterval);

    let candles: Candle[] = [];

    if (Array.isArray(raw?.candles)) {
      candles = raw.candles;
    } else if (raw?.values) {
      candles = normalizeTwelveData(raw.values);
    }

    return applyPlan(candles, interval);
  },

  async getLiveQuote(symbol: string) {
    const quote = await MarketEngine.getQuote(symbol);

    return {
      time: Math.floor(Date.now() / 1000),
      price: Number(quote?.close || quote?.price || 0),
    };
  },
};
