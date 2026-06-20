import { MarketEngine } from "./MarketEngine";

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

export const ChartFeedAdapter = {
  /**
   * SINGLE RESPONSIBILITY:
   * Convert MarketEngine → Lightweight Charts format
   */
  async getCandles(symbol: string, interval = "5min") {
    const raw = await MarketEngine.getCandles(symbol);

    // If backend already normalized
    if (Array.isArray(raw?.candles)) {
      return raw.candles;
    }

    // If TwelveData raw response
    if (raw?.values) {
      return normalizeTwelveData(raw.values);
    }

    return [];
  },

  async getLiveQuote(symbol: string) {
    const quote = await MarketEngine.getQuote(symbol);

    return {
      time: Math.floor(Date.now() / 1000),
      price: Number(quote?.close || quote?.price || 0),
    };
  },
};
