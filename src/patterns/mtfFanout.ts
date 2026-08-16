import { fetchTieredHistoricalData } from '../services/marketData';
import { publishChartVision, runChartVisionPipeline } from './engine';
import { siblingTimeframes } from './timeframeDuration';

const recentFanout = new Map<string, number>();
const FANOUT_COOLDOWN_MS = 45_000;

/**
 * Background educational MTF fan-out: scan one HTF and one LTF for the same symbol.
 * Never used as a trade signal stack — literacy confluence only.
 */
export async function scheduleMtfSiblingScans(params: {
  symbol: string;
  timeframe: string;
  userTier?: string;
}): Promise<void> {
  const { symbol, timeframe } = params;
  const userTier = params.userTier || 'BRONZE';
  if (!symbol?.trim()) return;

  const key = `${symbol.toUpperCase()}|${timeframe}`;
  const last = recentFanout.get(key) ?? 0;
  if (Date.now() - last < FANOUT_COOLDOWN_MS) return;
  recentFanout.set(key, Date.now());

  const { htf, ltf } = siblingTimeframes(timeframe);
  const targets = [htf, ltf].filter((tf): tf is string => Boolean(tf) && tf !== timeframe);

  await Promise.all(
    targets.map(async (tf) => {
      try {
        const candles = await fetchTieredHistoricalData(symbol, tf, userTier);
        if (!candles || candles.length < 12) return;
        const output = runChartVisionPipeline(
          { candles, symbol, timeframe: tf },
          { force: true },
        );
        if (output) publishChartVision(output);
      } catch (err) {
        console.warn('[MTF] sibling scan skipped:', symbol, tf, err);
      }
    }),
  );
}
