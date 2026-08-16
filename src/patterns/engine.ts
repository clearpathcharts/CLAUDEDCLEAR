import { formingChartKey } from './activeForming';
import { setActiveFormingBrief, clearFormingBrief } from './activeForming';
import { setActivePatternScan, clearPatternScan, getAllPatternScans } from './activeScan';
import { analyzeFormingStructure } from './forming';
import { annotatePatternsWithLifecycle } from './lifecycle';
import { analyzeMarketStructure } from './marketState';
import { alignPatternsAcrossTimeframes } from './mtfAlign';
import { scanAllPatterns } from './scan';
import { analysisWindow, candleFingerprint, sanitizeCandles } from './sanitize';
import { synthesizeStructureRead } from './structureRead';
import type { Candle } from './types';
import type { FormingStructureBrief } from './forming';
import type { PatternScanResult } from './types';
import type { StructureRead } from './structureRead';
import type { MarketStructureState } from './marketState';
import type { MtfAlignment } from './mtfAlign';

export interface ChartVisionInput {
  candles: Candle[];
  symbol: string;
  timeframe: string;
}

export interface ChartVisionOutput {
  symbol: string;
  timeframe: string;
  scan: PatternScanResult;
  forming: FormingStructureBrief;
  fingerprint: string;
  analyzedAt: number;
  structureRead: StructureRead;
  marketState: MarketStructureState;
  mtf: MtfAlignment;
}

const fingerprintCache = new Map<string, string>();

function buildScan(candles: Candle[]): PatternScanResult {
  const raw = scanAllPatterns(analysisWindow(candles));
  return {
    ...raw,
    patterns: annotatePatternsWithLifecycle(raw.patterns, candles),
  };
}

/**
 * Single entry point for all chart vision — patterns, geometry, methodology context.
 * Never throws; returns null on invalid input or unchanged fingerprint.
 */
export function runChartVisionPipeline(
  input: ChartVisionInput,
  options?: { force?: boolean },
): ChartVisionOutput | null {
  try {
    const { symbol, timeframe } = input;
    if (!symbol?.trim() || !timeframe?.trim()) return null;

    const safe = sanitizeCandles(input.candles);
    if (safe.length < 12) return null;

    const key = formingChartKey(symbol, timeframe);
    const fingerprint = candleFingerprint(safe);

    if (!options?.force && fingerprintCache.get(key) === fingerprint) {
      return null;
    }
    fingerprintCache.set(key, fingerprint);

    const scan = buildScan(safe);
    const formingBase = analyzeFormingStructure(safe, symbol, timeframe, scan.patterns);
    if (!formingBase) return null;

    const marketState = analyzeMarketStructure(safe);
    // Include this scan in MTF compare by merging with published peers.
    const peerScans = getAllPatternScans().filter(
      (s) => formingChartKey(s.symbol, s.timeframe) !== key,
    );
    const selfScan = {
      symbol: formingBase.symbol,
      timeframe: formingBase.timeframe,
      scan,
      updatedAt: Date.now(),
    };
    const mtf = alignPatternsAcrossTimeframes(formingBase.symbol, formingBase.timeframe, [
      ...peerScans,
      selfScan,
    ]);

    const structureRead = synthesizeStructureRead(scan.patterns, formingBase, {
      marketState,
      mtf,
    });

    const forming: FormingStructureBrief = {
      ...formingBase,
      marketStateId: marketState.id,
      marketStateLabel: marketState.displayLabel,
      mtfBadge: mtf.badge,
      structureReadHeadline: structureRead.headline,
      possibilities: formingBase.possibilities.map((p) => {
        const measured = scan.patterns.find(
          (x) => x.category === 'chart' && x.id === p.id && x.label === p.label,
        );
        if (measured?.lifecycle) {
          return { ...p, status: measured.lifecycle };
        }
        if (p.status === 'watch') return { ...p, status: 'possible' as const };
        return p;
      }),
    };

    return {
      symbol: forming.symbol,
      timeframe: forming.timeframe,
      scan,
      forming,
      fingerprint,
      analyzedAt: Date.now(),
      structureRead,
      marketState,
      mtf,
    };
  } catch (err) {
    console.error('[ChartVision] pipeline error (recovered):', err);
    return null;
  }
}

/** Publish to global stores — HUD, mentor, and overlays all read the same snapshot. */
export function publishChartVision(output: ChartVisionOutput): void {
  setActivePatternScan(output.scan, output.symbol, output.timeframe);
  setActiveFormingBrief(output.forming);
}

export function clearChartVisionCache(symbol: string, timeframe: string): void {
  fingerprintCache.delete(formingChartKey(symbol, timeframe));
}
