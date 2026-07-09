import { formingChartKey } from './activeForming';
import type { ChartPatternScan } from './activeScan';
import type { FormingStructureBrief } from './forming';
import type { DetectedPattern } from './types';

function formatMeasuredPattern(p: DetectedPattern): string {
  const pct = Math.round(p.confidence * 100);
  const note = p.detail || `${p.label} measured on the latest candles.`;
  return `- ${p.label} (${p.direction}, ${pct}% geometric confidence): ${note}`;
}

function formatMethodologyContext(brief: FormingStructureBrief): string[] {
  const lines: string[] = [
    `Trend bias: ${brief.trendBias} · ${brief.scannedBars} bars scanned`,
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

  return lines;
}

function formatChartSection(
  symbol: string,
  timeframe: string,
  patterns: DetectedPattern[],
  brief: FormingStructureBrief | null,
): string {
  const chartPatterns = patterns.filter((p) => p.category === 'chart');
  const candlePatterns = patterns.filter((p) => p.category === 'candlestick');

  const lines: string[] = [`--- ${symbol} · ${timeframe} ---`];

  if (brief) {
    lines.push(...formatMethodologyContext(brief));
  }

  if (chartPatterns.length > 0) {
    lines.push('Measured chart patterns (latest window):');
    lines.push(...chartPatterns.slice(0, 3).map(formatMeasuredPattern));
  } else {
    lines.push('Measured chart patterns: none forming in the latest window.');
  }

  if (candlePatterns.length > 0) {
    lines.push('Measured candlestick patterns (latest candles only):');
    lines.push(...candlePatterns.slice(0, 3).map(formatMeasuredPattern));
  } else {
    lines.push('Measured candlestick patterns: none on the latest candles.');
  }

  return lines.join('\n');
}

/**
 * Build the chart-vision block injected into the mentor system prompt.
 * Only includes geometry-measured patterns — never heuristic guesses.
 */
export function formatChartVisionForMentor(
  briefs: FormingStructureBrief[],
  scans: ChartPatternScan[],
): string {
  if (!briefs.length && !scans.length) {
    return `=== LIVE CHART VISION ===
No chart is open right now. If the user asks what pattern is forming, tell them to open a chart first. Do NOT invent patterns.
=== END CHART VISION ===`;
  }

  const keys = new Set<string>([
    ...briefs.map((b) => formingChartKey(b.symbol, b.timeframe)),
    ...scans.map((s) => formingChartKey(s.symbol, s.timeframe)),
  ]);

  const sections = [...keys].map((key) => {
    const brief = briefs.find((b) => formingChartKey(b.symbol, b.timeframe) === key) ?? null;
    const scan = scans.find((s) => formingChartKey(s.symbol, s.timeframe) === key) ?? null;
    const symbol = brief?.symbol ?? scan?.symbol ?? 'UNKNOWN';
    const timeframe = brief?.timeframe ?? scan?.timeframe ?? '';
    const patterns = scan?.scan.patterns ?? [];
    return formatChartSection(symbol, timeframe, patterns, brief);
  });

  return `=== LIVE CHART VISION — MEASURED FROM REAL CANDLES (latest window only) ===
${sections.join('\n\n')}

These patterns were measured by ClearPath's geometry engine from actual OHLC data on the RIGHT EDGE of the chart — not guessed from history. Speak about them as "possible" or "forming," never "confirmed." Only discuss patterns listed above. If the user asks about a pattern NOT listed, explain it in general, then say it is not currently measured on this chart. Never invent percentages or pattern names.
=== END CHART VISION ===`;
}
