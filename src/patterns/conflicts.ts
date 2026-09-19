import { ChartPatternId, DetectedPattern } from './types';

const STRUCTURE_PATTERN_IDS = new Set<ChartPatternId>([
  'rising_wedge',
  'falling_wedge',
  'ascending_triangle',
  'descending_triangle',
  'symmetrical_triangle',
  'broadening_formation',
]);

const MAX_MAJOR_CHART_PATTERNS = 3;
const MAX_NESTED_CHART_PATTERNS = 4;
const MAX_CANDLESTICK_PATTERNS = 3;
const MIN_DISPLAY_CONFIDENCE = 0.42;
const NESTED_VS_NESTED_OVERLAP = 0.55;

function overlapRatio(a: DetectedPattern, b: DetectedPattern): number {
  const start = Math.max(a.startIndex, b.startIndex);
  const end = Math.min(a.endIndex, b.endIndex);
  if (end < start) return 0;
  const overlap = end - start + 1;
  const aLen = a.endIndex - a.startIndex + 1;
  const bLen = b.endIndex - b.startIndex + 1;
  const denom = Math.min(aLen, bLen);
  return denom > 0 ? overlap / denom : 0;
}

function isStructurePattern(p: DetectedPattern): boolean {
  return p.category === 'chart' && STRUCTURE_PATTERN_IDS.has(p.id as ChartPatternId);
}

function isNested(p: DetectedPattern): boolean {
  return p.scale === 'nested';
}

/**
 * Prevent overlapping structure labels (e.g. wedge + triangle on the same bars).
 * Keeps the highest-confidence, non-conflicting set for HUD + mentor.
 */
export function resolvePatternConflicts(patterns: DetectedPattern[]): DetectedPattern[] {
  const chart = patterns
    .filter((p) => p.category === 'chart' && p.confidence >= MIN_DISPLAY_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence || b.endIndex - a.endIndex);

  const candlestick = patterns
    .filter((p) => p.category === 'candlestick' && p.confidence >= MIN_DISPLAY_CONFIDENCE)
    .sort((a, b) => b.endIndex - a.endIndex || b.confidence - a.confidence);

  const majorChart = chart.filter((p) => !isNested(p));
  const nestedChart = chart.filter((p) => isNested(p));

  // Prefer continuation structures over reversal wedges when both fire on the same bars.
  const continuationIds = new Set<ChartPatternId>([
    'ascending_triangle',
    'descending_triangle',
    'symmetrical_triangle',
  ]);
  const ranked = [...majorChart].sort((a, b) => {
    const aStruct = isStructurePattern(a) ? 1 : 0;
    const bStruct = isStructurePattern(b) ? 1 : 0;
    if (aStruct !== bStruct) return bStruct - aStruct;
    const aCont = continuationIds.has(a.id as ChartPatternId) ? 1 : 0;
    const bCont = continuationIds.has(b.id as ChartPatternId) ? 1 : 0;
    if (aCont !== bCont) return bCont - aCont;
    return b.confidence - a.confidence || b.endIndex - a.endIndex;
  });

  const keptChart: DetectedPattern[] = [];
  let structureKept = 0;

  for (const p of ranked) {
    if (keptChart.length >= MAX_MAJOR_CHART_PATTERNS) break;

    const structure = isStructurePattern(p);
    if (structure) {
      if (structureKept >= 2) continue;
      if (keptChart.some((k) => isStructurePattern(k) && overlapRatio(k, p) > 0.45)) continue;
      structureKept += 1;
    } else if (keptChart.some((k) => overlapRatio(k, p) > 0.75)) {
      continue;
    }

    keptChart.push(p);
  }

  const keptNested: DetectedPattern[] = [];
  const nestedRanked = [...nestedChart].sort(
    (a, b) => b.endIndex - a.endIndex || b.confidence - a.confidence,
  );
  for (const p of nestedRanked) {
    if (keptNested.length >= MAX_NESTED_CHART_PATTERNS) break;
    const insideKeptParent = keptChart.find(
      (parent) =>
        isStructurePattern(parent)
        && p.startIndex >= parent.startIndex
        && p.endIndex <= parent.endIndex,
    );
    if (!insideKeptParent) continue;
    if (
      insideKeptParent.direction !== 'neutral'
      && p.direction !== 'neutral'
      && p.direction !== insideKeptParent.direction
    ) {
      continue;
    }
    if (keptNested.some((k) => overlapRatio(k, p) > NESTED_VS_NESTED_OVERLAP)) continue;
    keptNested.push(p);
  }
  keptChart.push(...keptNested);

  const bestCandleById = new Map<string, DetectedPattern>();
  for (const p of candlestick) {
    const existing = bestCandleById.get(p.id);
    if (
      !existing
      || p.endIndex > existing.endIndex
      || (p.endIndex === existing.endIndex && p.confidence > existing.confidence)
    ) {
      bestCandleById.set(p.id, p);
    }
  }

  const keptCandles = [...bestCandleById.values()]
    .sort((a, b) => b.endIndex - a.endIndex || b.confidence - a.confidence)
    .slice(0, MAX_CANDLESTICK_PATTERNS);

  return [...keptChart, ...keptCandles].sort(
    (a, b) => b.endIndex - a.endIndex || b.confidence - a.confidence,
  );
}
