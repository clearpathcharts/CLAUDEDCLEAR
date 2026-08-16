import type { ChartPatternScan } from './activeScan';
import { formingChartKey } from './activeForming';
import { normalizeTimeframe } from './forming';
import type { DetectedPattern } from './types';

export interface MtfAlignment {
  symbol: string;
  primaryTimeframe: string;
  comparedTimeframes: string[];
  agreementCount: number;
  comparedCount: number;
  /** Educational badge — not a signal stack. */
  badge: string;
  sharedFamily: string | null;
  sharedDirection: 'bullish' | 'bearish' | 'neutral' | null;
  detail: string;
}

function topChartPattern(patterns: DetectedPattern[]): DetectedPattern | null {
  const chart = patterns
    .filter((p) => p.category === 'chart')
    .sort((a, b) => b.confidence - a.confidence);
  return chart[0] ?? null;
}

function patternFamily(id: string): string {
  if (id.includes('wedge')) return 'wedge';
  if (id.includes('triangle')) return 'triangle';
  if (id.includes('double')) return 'double';
  if (id.includes('cup')) return 'cup';
  if (id.includes('broadening')) return 'broadening';
  return id;
}

/**
 * Cross-timeframe structure agreement for literacy.
 * Uses scans already published for the same symbol (open charts + sibling fan-out).
 */
export function alignPatternsAcrossTimeframes(
  symbol: string,
  primaryTimeframe: string,
  scans: ChartPatternScan[],
): MtfAlignment {
  const sym = symbol.toUpperCase();
  const primaryTf = normalizeTimeframe(primaryTimeframe);
  const sameSymbol = scans.filter((s) => s.symbol.toUpperCase() === sym);
  const byTf = new Map<string, ChartPatternScan>();
  for (const s of sameSymbol) {
    byTf.set(normalizeTimeframe(s.timeframe), s);
  }

  const primary = byTf.get(primaryTf);
  const primaryTop = primary ? topChartPattern(primary.scan.patterns) : null;

  const others = [...byTf.entries()].filter(([tf]) => tf !== primaryTf);
  const comparedTimeframes = others.map(([tf]) => tf);

  if (!primaryTop || others.length === 0) {
    return {
      symbol: sym,
      primaryTimeframe: primaryTf,
      comparedTimeframes,
      agreementCount: primaryTop ? 1 : 0,
      comparedCount: Math.max(1, others.length + 1),
      badge: others.length === 0 ? 'MTF structure: single timeframe' : 'MTF structure agreement 0/' + (others.length + 1),
      sharedFamily: primaryTop ? patternFamily(primaryTop.id) : null,
      sharedDirection: primaryTop?.direction ?? null,
      detail: others.length === 0
        ? 'Open or scan another timeframe on this symbol to compare structure.'
        : 'No matching pattern family / resolution bias across compared timeframes yet.',
    };
  }

  const family = patternFamily(primaryTop.id);
  const direction = primaryTop.direction;
  let agreement = 1;
  for (const [, scan] of others) {
    const top = topChartPattern(scan.scan.patterns);
    if (!top) continue;
    const sameFamily = patternFamily(top.id) === family;
    const sameDir = top.direction === direction || direction === 'neutral' || top.direction === 'neutral';
    if (sameFamily && sameDir) agreement++;
  }

  const comparedCount = others.length + 1;
  return {
    symbol: sym,
    primaryTimeframe: primaryTf,
    comparedTimeframes,
    agreementCount: agreement,
    comparedCount,
    badge: `MTF structure agreement ${agreement}/${comparedCount}`,
    sharedFamily: family,
    sharedDirection: direction,
    detail: `Primary ${primaryTf} ${primaryTop.label} compared with ${comparedTimeframes.join(', ') || 'none'}.`,
  };
}

export function mtfCacheKey(symbol: string, timeframe: string): string {
  return formingChartKey(symbol, timeframe);
}
