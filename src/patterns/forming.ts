import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern } from './types';
import {
  consecutiveBearishEndingAt,
  consecutiveBearishFrom,
  findImpulseLegs,
} from './barStructure';

export type FormingPatternId = ChartPatternId;

export type FormingLifecycleStatus = 'possible' | 'forming' | 'confirmed' | 'triggered' | 'watch';

export interface FormingPossibility {
  id: FormingPatternId;
  label: string;
  probability: number;
  /** Structure lifecycle — watch retained as early Possible alias for legacy watches. */
  status: FormingLifecycleStatus;
  detail: string;
}

export interface FormingClock {
  type: '12-bar-retrace' | '16-bar-retrace' | 'none';
  active: boolean;
  bar: number;
  total: number;
  reason: string;
}

export interface FormingStructureBrief {
  symbol: string;
  timeframe: string;
  scannedBars: number;
  trendBias: 'up' | 'down' | 'neutral';
  clock: FormingClock;
  legs: {
    upPushCount: number;
    lastUpLegBars: number;
    lastUpLegIncomplete: boolean;
    retraceOpenedWithFourBearish: boolean;
    retraceEndingWithThreeBearish: boolean;
  };
  possibilities: FormingPossibility[];
  narrativeLines: string[];
  updatedAt: number;
  /** Unix seconds of the latest bar open — for candle-close countdown UI. */
  lastBarTime?: number;
  /** Educational market structure classification (optional). */
  marketStateId?: string;
  marketStateLabel?: string;
  /** Educational MTF agreement badge (optional). */
  mtfBadge?: string;
  /** One-line structure read headline (optional). */
  structureReadHeadline?: string;
}

/** Normalize UI timeframe labels to a stable key (works on every chart interval). */
export function normalizeTimeframe(tf: string): string {
  const raw = (tf || '1h').trim();
  const lower = raw.toLowerCase();
  const map: Record<string, string> = {
    '1': '1m', '2': '2m', '3': '3m', '5': '5m', '10': '10m', '15': '15m', '30': '30m',
    '60': '1h', '120': '2h', '180': '3h', '240': '4h',
    d: '1d', w: '1w', m: '1M',
    '12m': 'ytd', ytd: 'ytd',
  };
  if (map[lower]) return map[lower];
  if (/^\d+[mhdw]$/i.test(lower)) return lower;
  if (lower === '1h' || lower === '2h' || lower === '3h' || lower === '4h') return lower;
  if (lower === '1d' || lower === '1w') return lower;
  return lower;
}

/**
 * Plain-language duration for N bars on the active chart timeframe.
 * "12 bars" on H1 ≈ 12 hours — users often confuse this with a 12H chart.
 */
export function describeBarWindow(barCount: number, timeframe: string): string {
  const tf = normalizeTimeframe(timeframe);
  const key = tf === "1M" ? "1M" : tf.toLowerCase();
  const n = Math.max(0, barCount);
  if (key === "1m" || key === "1min") return `${n} one-minute candles (~${n} min)`;
  if (key === "2m") return `${n} candles on 2m (~${n * 2} min)`;
  if (key === "3m") return `${n} candles on 3m (~${n * 3} min)`;
  if (key === "5m" || key === "5min") return `${n} five-minute candles (~${n * 5} min)`;
  if (key === "10m") return `${n} candles on 10m (~${n * 10} min)`;
  if (key === "15m" || key === "15min") return `${n} fifteen-minute candles (~${Math.round((n * 15) / 60)} hr)`;
  if (key === "30m" || key === "30min") return `${n} thirty-minute candles (~${n / 2} hr)`;
  if (key === "1h" || key === "60min") return `${n} hourly candles (~${n} hr)`;
  if (key === "2h") return `${n} two-hour candles (~${n * 2} hr)`;
  if (key === "3h") return `${n} candles on 3H (~${n * 3} hr)`;
  if (key === "4h") return `${n} four-hour candles (~${n * 4} hr)`;
  if (key === "1d" || key === "1day") return `${n} daily candles (~${n} trading days)`;
  if (key === "1w" || key === "1week") return `${n} weekly candles`;
  if (key === "1M" || key === "1month") return `${n} monthly candles`;
  return `${n} candles on this chart's timeframe (${tf})`;
}

function detectClock(
  candles: Candle[],
  upLegs: ReturnType<typeof findImpulseLegs>,
  trendBias: 'up' | 'down' | 'neutral',
): FormingClock {
  const upImpulses = upLegs.filter((l) => l.direction === 'up');
  const downImpulses = upLegs.filter((l) => l.direction === 'down');

  if (trendBias === 'up' && upImpulses.length >= 4) {
    const fourth = upImpulses[upImpulses.length - 1];
    if (fourth.barCount === 3) {
      const elapsed = candles.length - 1 - fourth.startIndex + 1;
      return {
        type: '12-bar-retrace',
        active: elapsed <= 16,
        bar: Math.min(elapsed, 12),
        total: 12,
        reason: 'After an incomplete 3-candle push, ClearPath watches the next 12 candles for a retrace / continuation setup',
      };
    }
  }

  if (trendBias === 'down' && downImpulses.length >= 4) {
    const fourth = downImpulses[downImpulses.length - 1];
    if (fourth.barCount === 3) {
      const elapsed = candles.length - 1 - fourth.startIndex + 1;
      return {
        type: '16-bar-retrace',
        active: elapsed <= 20,
        bar: Math.min(elapsed, 16),
        total: 16,
        reason: 'After an incomplete 3-candle drop, ClearPath watches the next 16 candles for continuation structure',
      };
    }
  }

  // Active 12-bar window after any 3-bar up leg at end of multi-push run
  if (upImpulses.length >= 3) {
    const last = upImpulses[upImpulses.length - 1];
    if (last.barCount === 3) {
      const elapsed = candles.length - 1 - last.startIndex + 1;
      if (elapsed <= 14) {
        return {
          type: '12-bar-retrace',
          active: true,
          bar: Math.min(elapsed, 12),
          total: 12,
          reason: 'Latest impulse was only 3 candles (incomplete vs a full 4) — retrace watch on this timeframe',
        };
      }
    }
  }

  return { type: 'none', active: false, bar: 0, total: 0, reason: 'No bar clock active' };
}

function possibilitiesFromMeasured(patterns: DetectedPattern[]): FormingPossibility[] {
  return patterns
    .filter((p) => p.category === 'chart')
    .map((p) => ({
      id: p.id as FormingPatternId,
      label: p.label,
      probability: p.confidence,
      status: (p.confidence >= 0.62 ? 'forming' : p.confidence >= 0.5 ? 'possible' : 'watch') as FormingPossibility['status'],
      detail: p.detail || `${p.label} measured on latest candles.`,
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 4);
}

/** Restore 4-up / 3-down methodology watches even when geometry scan is quiet. */
function possibilitiesFromImpulse(
  legs: FormingStructureBrief['legs'],
  clock: FormingClock,
  trendBias: FormingStructureBrief['trendBias'],
): FormingPossibility[] {
  const out: FormingPossibility[] = [];

  if (clock.active && clock.type === '12-bar-retrace') {
    out.push({
      id: 'ascending_triangle',
      label: '4-Up / 3-Bar Retrace',
      probability: 0.68,
      status: 'forming',
      detail: `${clock.reason}. Watch for continuation structure (often ascending triangle / rising base) into bar ${clock.total}.`,
    });
  }

  if (clock.active && clock.type === '16-bar-retrace') {
    out.push({
      id: 'descending_triangle',
      label: '4-Down / 3-Bar Retrace',
      probability: 0.68,
      status: 'forming',
      detail: `${clock.reason}. Watch for continuation structure (often descending triangle) into bar ${clock.total}.`,
    });
  }

  if (legs.upPushCount >= 4 && legs.lastUpLegIncomplete && trendBias !== 'down') {
    out.push({
      id: 'ascending_triangle',
      label: 'Incomplete 4th Push',
      probability: 0.6,
      status: 'possible',
      detail: `Four up impulses with latest leg at ${legs.lastUpLegBars} bars (incomplete vs full 4) — classic ClearPath 4-up / 3-down watch.`,
    });
  }

  if (legs.retraceOpenedWithFourBearish) {
    out.push({
      id: 'falling_wedge',
      label: '4-Bar Bear Retrace Open',
      probability: 0.58,
      status: 'watch',
      detail: 'Retrace opened with a full 4-bar bearish leg — map support and watch for 3-bar stall at the low.',
    });
  }

  if (legs.retraceEndingWithThreeBearish) {
    out.push({
      id: 'double_bottom',
      label: '3-Bar Stall at Retrace Low',
      probability: 0.62,
      status: 'forming',
      detail: '3-bar bearish leg at the retrace low (incomplete) — breakout / double-bottom style resolution watch.',
    });
  }

  // Deduplicate by label, keep highest probability
  const best = new Map<string, FormingPossibility>();
  for (const p of out) {
    const prev = best.get(p.label);
    if (!prev || p.probability > prev.probability) best.set(p.label, p);
  }
  return [...best.values()].sort((a, b) => b.probability - a.probability).slice(0, 4);
}

function buildNarrative(
  brief: Omit<FormingStructureBrief, 'narrativeLines' | 'updatedAt'>,
): string[] {
  const lines: string[] = [
    `${brief.symbol} · ${brief.timeframe} · ${brief.scannedBars} bars · trend bias: ${brief.trendBias}`,
  ];

  if (brief.clock.active) {
    lines.push(
      `${brief.clock.type === '16-bar-retrace' ? '16' : '12'}-candle clock: ${brief.clock.bar}/${brief.clock.total} on ${brief.timeframe} (${describeBarWindow(brief.clock.total, brief.timeframe)}) — ${brief.clock.reason}`,
    );
  }

  if (brief.legs.retraceOpenedWithFourBearish) {
    lines.push('Retrace opened with a full 4-bar bearish leg.');
  }
  if (brief.legs.retraceEndingWithThreeBearish) {
    lines.push('3-bar bearish leg at retrace low — incomplete leg, breakout watch.');
  }
  if (brief.legs.lastUpLegIncomplete) {
    lines.push(`Latest up impulse: ${brief.legs.lastUpLegBars} bars (incomplete vs 4).`);
  }

  if (brief.possibilities.length === 0) {
    lines.push('No measured chart patterns in the latest window.');
  } else {
    for (const p of brief.possibilities) {
      lines.push(
        `Measured ${p.label} (${Math.round(p.probability * 100)}% confidence) — ${p.detail}`,
      );
    }
  }

  return lines;
}

/** Analyze live OHLC for methodology context. Pattern labels come from measured scan when provided. */
export function analyzeFormingStructure(
  candles: Candle[],
  symbol: string,
  timeframe: string,
  measuredPatterns: DetectedPattern[] = [],
): FormingStructureBrief | null {
  if (!candles || candles.length < 12) return null;

  const upLegs = findImpulseLegs(candles, 56);
  const upImpulses = upLegs.filter((l) => l.direction === 'up');
  const downImpulses = upLegs.filter((l) => l.direction === 'down');

  const last = candles[candles.length - 1];
  const prior = candles[Math.max(0, candles.length - 20)];
  let trendBias: 'up' | 'down' | 'neutral' = 'neutral';
  if (last.close > prior.close * 1.004) trendBias = 'up';
  else if (last.close < prior.close * 0.996) trendBias = 'down';

  const clock = detectClock(candles, upLegs, trendBias);
  const endIdx = candles.length - 1;

  const retraceOpenedWithFourBearish = consecutiveBearishFrom(candles, Math.max(0, endIdx - 8)) >= 4
    || consecutiveBearishEndingAt(candles, endIdx - 3) >= 4;

  const retraceEndingWithThreeBearish = consecutiveBearishEndingAt(candles, endIdx) === 3
    || consecutiveBearishEndingAt(candles, endIdx - 1) === 3;

  const lastUp = upImpulses[upImpulses.length - 1];
  const legs = {
    upPushCount: upImpulses.length,
    lastUpLegBars: lastUp?.barCount ?? 0,
    lastUpLegIncomplete: lastUp?.barCount === 3,
    retraceOpenedWithFourBearish,
    retraceEndingWithThreeBearish,
  };

  const measured = possibilitiesFromMeasured(measuredPatterns);
  const impulse = possibilitiesFromImpulse(legs, clock, trendBias);
  // Measured geometry first, then methodology watches fill gaps on any symbol.
  const merged = new Map<string, FormingPossibility>();
  for (const p of [...measured, ...impulse]) {
    const key = `${p.id}:${p.label}`;
    const prev = merged.get(key);
    if (!prev || p.probability > prev.probability) merged.set(key, p);
  }
  const possibilities = [...merged.values()]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);

  const normalizedTf = normalizeTimeframe(timeframe);
  const base = {
    symbol: symbol.toUpperCase(),
    timeframe: normalizedTf,
    scannedBars: candles.length,
    trendBias,
    clock,
    legs,
    possibilities,
    lastBarTime: last.time,
  };

  return {
    ...base,
    narrativeLines: buildNarrative(base),
    updatedAt: Date.now(),
  };
}

export function formatFormingBriefForChat(brief: FormingStructureBrief | null): string {
  if (!brief) return 'No live chart structure loaded.';
  return [
    `=== LIVE CHART STRUCTURE · ${brief.symbol} ${brief.timeframe} (educational literacy) ===`,
    brief.structureReadHeadline ? `Structure read: ${brief.structureReadHeadline}` : undefined,
    ...brief.narrativeLines,
    '=== END LIVE CHART STRUCTURE ===',
    'Describe Possible/Forming/Confirmed/Triggered as geometry lifecycle states only. Never recommend buy/sell/enter/exit. No harmonics. Not financial advice.',
  ].filter((line): line is string => line !== undefined).join('\n');
}

export function formatAllFormingBriefsForChat(briefs: FormingStructureBrief[]): string {
  if (!briefs.length) return 'No live chart structure loaded on any open chart.';
  return [
    '=== LIVE CHART STRUCTURE — ALL OPEN CHARTS (educational literacy) ===',
    ...briefs.flatMap((brief, i) => [
      i > 0 ? '' : undefined,
      `--- ${brief.symbol} · ${brief.timeframe} (${brief.scannedBars} bars) ---`,
      brief.structureReadHeadline ? `Structure read: ${brief.structureReadHeadline}` : undefined,
      ...brief.narrativeLines,
    ].filter((line): line is string => line !== undefined)),
    '=== END LIVE CHART STRUCTURE ===',
    'Describe Possible/Forming/Confirmed/Triggered as geometry lifecycle states only. Never recommend buy/sell/enter/exit. No harmonics. Not financial advice.',
  ].join('\n');
}
