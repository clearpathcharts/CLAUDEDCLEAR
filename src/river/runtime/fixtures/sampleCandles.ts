/** Synthetic OHLC data for River runtime self-tests (no network required). */
import { Candle } from '../../../types/indicators';

export function generateSampleCandles(count = 80, startTime = 1_700_000_000): Candle[] {
  const candles: Candle[] = [];
  let price = 100;

  for (let i = 0; i < count; i++) {
    const drift = Math.sin(i / 8) * 0.6 + (i > count * 0.55 ? 0.25 : -0.05);
    const open = price;
    const close = Math.max(1, open + drift + (Math.random() - 0.5) * 0.8);
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    candles.push({
      time: startTime + i * 3600,
      open,
      high,
      low,
      close,
      volume: 1000 + i * 10,
    });
    price = close;
  }

  return candles;
}
