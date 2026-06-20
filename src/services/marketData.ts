import { getCandleLimit } from "../config/tierLimits";

const API_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY || import.meta.env.VITE_TWELVE_DATA_API_KEY || "a8a0bc68821948ea9d44d335a77a4631";
const BASE_URL = 'https://api.twelvedata.com';

export interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export const fetchTieredHistoricalData = async (
  symbol: string,
  interval: string, // e.g., '1min', '5min', '1day'
  userTier: string
) => {
  // Determine if the tier gets 5k, 10k, 20k, or 40k candles
  const limit = getCandleLimit(userTier);

  // Normalize interval for Twelve Data format if needed
  let resolvedInterval = interval;
  if (interval === '1m' || interval === '1min') resolvedInterval = '1min';
  else if (interval === '5m' || interval === '5min') resolvedInterval = '5min';
  else if (interval === '15m' || interval === '15min') resolvedInterval = '15min';
  else if (interval === '30m' || interval === '30min') resolvedInterval = '30min';
  else if (interval === '45m' || interval === '45min') resolvedInterval = '45min';
  else if (interval === '1h') resolvedInterval = '1h';
  else if (interval === '4h' || interval === '4H') resolvedInterval = '4h';
  else if (interval === '1d' || interval === '1D' || interval === 'day' || interval === '1day') resolvedInterval = '1day';
  else if (interval === 'week' || interval === '1week') resolvedInterval = '1week';
  else if (interval === 'month' || interval === '1month') resolvedInterval = '1month';

  // 1. Try to fetch directly from Twelve Data if client API key exists
  if (API_KEY) {
    try {
      const response = await fetch(
        `${BASE_URL}/time_series?symbol=${symbol}&interval=${resolvedInterval}&outputsize=${limit}&apikey=${API_KEY}`
      );
      const data = await response.json();

      if (data.values && Array.isArray(data.values)) {
        return data.values
          .map((candle: TwelveDataCandle) => ({
            time: new Date(candle.datetime).getTime() / 1000, // Unix timestamp
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
          }))
          .sort((a: any, b: any) => a.time - b.time); // Lightweight Charts requires oldest to newest
      }
    } catch (err) {
      console.warn('Twelve Data direct query failed, trying backend proxy:', err);
    }
  }

  // 2. Fall back to secure backend proxy to protect keys / handle quota fallback
  try {
    const proxyUrl = `/api/market/history?symbol=${encodeURIComponent(symbol)}&interval=${resolvedInterval}&limit=${limit}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const rawData = await response.json();
      if (Array.isArray(rawData)) {
        return rawData.map((v: any) => ({
          time: Math.floor(v[0] / 1000),
          open: Number(v[1]),
          high: Number(v[2]),
          low: Number(v[3]),
          close: Number(v[4])
        })).sort((a: any, b: any) => a.time - b.time);
      }
    } else {
      throw new Error(`Upstream proxy responded with non-ok status: ${response.status}`);
    }
  } catch (proxyErr: any) {
    console.error('Data pipeline error:', proxyErr);
    throw new Error(`Real-time Market Fetch Failed: ${proxyErr.message || 'No live connection available.'}. Mock data is prohibited.`);
  }
};
