import { normalizeTimeframe } from './forming';

/** Seconds per bar for a chart timeframe label. */
export function timeframeStepSeconds(timeframe: string): number {
  const raw = (timeframe || '1h').trim();
  if (raw === '1M') return 30 * 86400;
  const tf = normalizeTimeframe(raw).toLowerCase();
  const stepMap: Record<string, string | number> = {
    '1m': 60,
    '2m': 120,
    '3m': 180,
    '5m': 300,
    '10m': 600,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '2h': 7200,
    '3h': 10800,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
    ytd: 86400,
  };
  const mapped = stepMap[tf];
  return typeof mapped === 'number' ? mapped : 3600;
}

/** Unix seconds when the current (open) candle is expected to close. */
export function candleCloseAtUnix(barOpenTimeUnix: number, timeframe: string): number {
  return barOpenTimeUnix + timeframeStepSeconds(timeframe);
}

export function secondsUntilCandleClose(barOpenTimeUnix: number, timeframe: string, nowMs = Date.now()): number {
  const closeAt = candleCloseAtUnix(barOpenTimeUnix, timeframe);
  return Math.max(0, closeAt - Math.floor(nowMs / 1000));
}

/** Compact countdown for UI: mm:ss or hh:mm:ss. */
export function formatCandleCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** HTF / LTF siblings for multi-timeframe structure literacy (not trade signals). */
export function siblingTimeframes(timeframe: string): { htf: string | null; ltf: string | null } {
  const tf = normalizeTimeframe(timeframe).toLowerCase();
  if (['1m', '2m', '3m', '5m', '10m'].includes(tf)) return { htf: '15m', ltf: null };
  if (['15m', '30m'].includes(tf)) return { htf: '1h', ltf: '5m' };
  if (['1h', '2h', '3h'].includes(tf)) return { htf: '4h', ltf: '15m' };
  if (tf === '4h') return { htf: '1d', ltf: '1h' };
  if (tf === '1d') return { htf: '1w', ltf: '4h' };
  if (tf === '1w' || tf === '1m') return { htf: null, ltf: '1d' };
  return { htf: '4h', ltf: '15m' };
}
