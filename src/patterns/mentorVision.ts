import type { DetectedPattern } from './types';
import type { FormingStructureBrief } from './forming';
import { formatAllFormingBriefsForChat } from './forming';
import type { ChartPatternScanBrief } from './activeScan';

const CHART_PATTERN_NOTES: Partial<Record<string, string>> = {
  'Rising Wedge': 'Highs and lows both climb while the lines squeeze together — often a tiring uptrend.',
  'Falling Wedge': 'Highs and lows slide down while the lines pinch — often ends with a push back up.',
  'Ascending Triangle': 'Flat ceiling with rising lows — buyers pressing upward.',
  'Descending Triangle': 'Flat floor with falling highs — sellers pressing downward.',
  'Cup and Handle': 'Rounded bottom recovered near the old high, then a small pause (handle).',
};

function patternNote(p: DetectedPattern): string {
  if (p.detail?.trim()) return p.detail.trim();
  return CHART_PATTERN_NOTES[p.label] ?? 'Measured from live OHLC geometry on this chart.';
}

export function formatPatternScanForChat(brief: ChartPatternScanBrief | null): string {
  if (!brief) return 'No live pattern scan loaded for this chart.';

  const chartPatterns = brief.patterns
    .filter((p) => p.category === 'chart')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);

  const candlePatterns = brief.patterns
    .filter((p) => p.category === 'candlestick')
    .slice(-6);

  const lines: string[] = [
    `=== LIVE PATTERN SCAN · ${brief.symbol} ${brief.timeframe} — MEASURED FROM REAL CANDLES ===`,
    `${brief.scannedBars} bars · ${brief.swingHighs} swing highs · ${brief.swingLows} swing lows`,
  ];

  if (chartPatterns.length === 0 && candlePatterns.length === 0) {
    lines.push('No classical chart pattern or recent candlestick hit measured on this window right now.');
    lines.push('Do NOT invent a pattern. If asked, say structure looks unclear or ranging on this timeframe.');
  } else {
    if (chartPatterns.length > 0) {
      lines.push('Classical chart geometry:');
      for (const p of chartPatterns) {
        lines.push(
          `- ${p.label} (${p.direction}, ${Math.round(p.confidence * 100)}% geometric confidence): ${patternNote(p)}`,
        );
      }
    }
    if (candlePatterns.length > 0) {
      lines.push(
        `Recent candlestick hits: ${candlePatterns
          .map((p) => `${p.label} (${p.direction})`)
          .join('; ')}`,
      );
    }
  }

  lines.push('=== END PATTERN SCAN ===');
  lines.push(
    'Speak about these as "possible" or "measured" — never "confirmed." Only discuss patterns listed here.',
  );
  return lines.join('\n');
}

export function formatAllPatternScansForChat(briefs: ChartPatternScanBrief[]): string {
  if (!briefs.length) {
    return '=== LIVE PATTERN SCAN ===\nNo open charts with measured pattern data yet. Open a chart first.\n=== END PATTERN SCAN ===';
  }

  return briefs
    .map((brief) => formatPatternScanForChat(brief))
    .join('\n\n');
}

/** Combined eyes for C.P.T. — measured patterns + forming structure on every open chart. */
export function buildMentorChartVision(
  patternScans: ChartPatternScanBrief[],
  formingBriefs: FormingStructureBrief[],
): string {
  const patternBlock = formatAllPatternScansForChat(patternScans);
  const formingBlock = formingBriefs.length
    ? formatAllFormingBriefsForChat(formingBriefs)
    : '';

  if (!formingBlock) {
    return patternBlock;
  }

  return `${patternBlock}\n\n${formingBlock}`;
}
