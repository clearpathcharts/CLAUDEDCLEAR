import { Candle } from '../types/indicators';
import { ChartPatternId } from './types';
import {
  consecutiveBearishEndingAt,
  consecutiveBearishFrom,
  consecutiveBullishEndingAt,
  findImpulseLegs,
  firstBullishWickLowAfter,
  isBearishBar,
  isBullishBar,
} from './barStructure';
import { findSwingPoints, pricesNear, slope } from './swings';

export type FormingPatternId = ChartPatternId;

export interface FormingPossibility {
  id: FormingPatternId;
  label: string;
  probability: number;
  status: 'forming' | 'possible' | 'watch';
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

const MAJOR_LABELS: Record<FormingPatternId, string> = {
  rising_wedge: 'Rising Wedge',
  falling_wedge: 'Falling Wedge',
  ascending_triangle: 'Ascending Triangle',
  descending_triangle: 'Descending Triangle',
  cup_and_handle: 'Cup and Handle',
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
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
        reason: '4th push ended at 3 bars (incomplete) — 12-bar retrace clock',
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
        reason: '4th drop ended at 3 bars (incomplete) — 16-bar clock',
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
          reason: 'Latest impulse leg is 3 bars — retrace watch',
        };
      }
    }
  }

  return { type: 'none', active: false, bar: 0, total: 0, reason: 'No bar clock active' };
}

function scoreWedgeTriangle(
  candles: Candle[],
  swings: ReturnType<typeof findSwingPoints>,
): Partial<Record<FormingPatternId, { p: number; detail: string }>> {
  const scores: Partial<Record<FormingPatternId, { p: number; detail: string }>> = {};
  const highs = swings.filter((s) => s.kind === 'high').slice(-4);
  const lows = swings.filter((s) => s.kind === 'low').slice(-4);
  if (highs.length < 2 || lows.length < 2) return scores;

  const h1 = highs[highs.length - 2];
  const h2 = highs[highs.length - 1];
  const l1 = lows[lows.length - 2];
  const l2 = lows[lows.length - 1];
  const highSlope = slope(h1, h2);
  const lowSlope = slope(l1, l2);

  if (highSlope > 0 && lowSlope > 0 && highSlope < lowSlope) {
    const gap = (lowSlope - highSlope) / Math.max(Math.abs(lowSlope), 1e-9);
    scores.rising_wedge = {
      p: clamp01(0.45 + gap * 2),
      detail: 'Converging upward slopes on swing highs/lows',
    };
  }

  if (highSlope < 0 && lowSlope < 0 && highSlope > lowSlope) {
    const gap = (highSlope - lowSlope) / Math.max(Math.abs(highSlope), 1e-9);
    scores.falling_wedge = {
      p: clamp01(0.45 + gap * 2),
      detail: 'Converging downward slopes — classic retrace wedge',
    };
  }

  if (Math.abs(highSlope) < Math.abs(lowSlope) * 0.3 && lowSlope > 0 && pricesNear(h1.price, h2.price, 0.025)) {
    scores.ascending_triangle = {
      p: clamp01(0.5 + lowSlope * 5),
      detail: 'Flat resistance + rising lows',
    };
  }

  if (Math.abs(lowSlope) < Math.abs(highSlope) * 0.3 && highSlope < 0 && pricesNear(l1.price, l2.price, 0.025)) {
    scores.descending_triangle = {
      p: clamp01(0.5 + Math.abs(highSlope) * 5),
      detail: 'Flat support + falling highs',
    };
  }

  return scores;
}

function scoreCupHandle(candles: Candle[], swings: ReturnType<typeof findSwingPoints>): { p: number; detail: string } | null {
  const lows = swings.filter((s) => s.kind === 'low');
  if (lows.length < 3 || candles.length < 40) return null;
  const recent = lows.slice(-5);
  const cupLow = recent.reduce((min, s) => (s.price < min.price ? s : min), recent[0]);
  const left = recent.find((s) => s.index < cupLow.index);
  const right = recent.find((s) => s.index > cupLow.index);
  if (!left || !right || right.index - left.index < 12) return null;
  return {
    p: 0.42,
    detail: 'U-shaped low structure with two rim highs forming',
  };
}

function buildNarrative(
  brief: Omit<FormingStructureBrief, 'narrativeLines' | 'updatedAt'>,
): string[] {
  const lines: string[] = [
    `${brief.symbol} · ${brief.timeframe} · ${brief.scannedBars} bars · trend bias: ${brief.trendBias}`,
  ];

  if (brief.clock.active) {
    lines.push(
      `${brief.clock.type === '16-bar-retrace' ? '16' : '12'}-bar clock: bar ${brief.clock.bar}/${brief.clock.total} — ${brief.clock.reason}`,
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
    lines.push('No major forming patterns above watch threshold.');
  } else {
    for (const p of brief.possibilities) {
      lines.push(
        `${p.status === 'forming' ? 'Forming' : 'Possible'} ${p.label} (~${Math.round(p.probability * 100)}%) — ${p.detail}`,
      );
    }
  }

  return lines;
}

/** Analyze live OHLC for forming pattern probabilities — color-agnostic, no harmonics. */
export function analyzeFormingStructure(
  candles: Candle[],
  symbol: string,
  timeframe: string,
): FormingStructureBrief | null {
  if (!candles || candles.length < 12) return null;

  const swings = findSwingPoints(candles, 3, 3);
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

  const rawScores = scoreWedgeTriangle(candles, swings);
  const cup = scoreCupHandle(candles, swings);
  if (cup) rawScores.cup_and_handle = cup;

  // Boost falling wedge during active 12-bar retrace clock
  if (clock.active && clock.type === '12-bar-retrace') {
    const cur = rawScores.falling_wedge?.p ?? 0.35;
    rawScores.falling_wedge = {
      p: clamp01(cur + 0.2 + (clock.bar / clock.total) * 0.15),
      detail: rawScores.falling_wedge?.detail ?? 'Retrace window active on bar grid',
    };
  }

  if (retraceEndingWithThreeBearish) {
    const cur = rawScores.ascending_triangle?.p ?? 0.3;
    rawScores.ascending_triangle = {
      p: clamp01(cur + 0.25),
      detail: 'Post-retrace breakout leg may build ascending structure',
    };
  }

  if (clock.active && legs.lastUpLegIncomplete) {
    const cur = rawScores.rising_wedge?.p ?? 0.25;
    rawScores.rising_wedge = {
      p: clamp01(cur + 0.15),
      detail: 'Compression after incomplete 4th push',
    };
  }

  const anchor = firstBullishWickLowAfter(candles, Math.max(0, candles.length - 30));
  if (anchor && trendBias === 'up') {
    const cur = rawScores.rising_wedge?.p ?? 0.3;
    rawScores.rising_wedge = {
      p: clamp01(Math.max(cur, 0.4)),
      detail: `Uptrend anchor wick set at bar ${anchor.index}`,
    };
  }

  const possibilities: FormingPossibility[] = (Object.keys(rawScores) as FormingPatternId[])
    .map((id) => {
      const s = rawScores[id]!;
      return {
        id,
        label: MAJOR_LABELS[id],
        probability: s.p,
        status: s.p >= 0.62 ? 'forming' as const : s.p >= 0.45 ? 'possible' as const : 'watch' as const,
        detail: s.detail,
      };
    })
    .filter((p) => p.probability >= 0.38)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);

  const normalizedTf = normalizeTimeframe(timeframe);
  const base = {
    symbol: symbol.toUpperCase(),
    timeframe: normalizedTf,
    scannedBars: candles.length,
    trendBias,
    clock,
    legs,
    possibilities,
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
    `=== LIVE CHART STRUCTURE · ${brief.symbol} ${brief.timeframe} (forming possibilities — not confirmed) ===`,
    ...brief.narrativeLines,
    '=== END LIVE CHART STRUCTURE ===',
    'Always describe these as possible or forming. Never state certainty. No harmonics.',
  ].join('\n');
}

export function formatAllFormingBriefsForChat(briefs: FormingStructureBrief[]): string {
  if (!briefs.length) return 'No live chart structure loaded on any open chart.';
  return [
    '=== LIVE CHART STRUCTURE — ALL OPEN CHARTS (forming possibilities — not confirmed) ===',
    ...briefs.flatMap((brief, i) => [
      i > 0 ? '' : undefined,
      `--- ${brief.symbol} · ${brief.timeframe} (${brief.scannedBars} bars) ---`,
      ...brief.narrativeLines,
    ].filter((line): line is string => line !== undefined)),
    '=== END LIVE CHART STRUCTURE ===',
    'Always describe these as possible or forming. Never state certainty. No harmonics.',
  ].join('\n');
}
