import { formingChartKey } from './activeForming';
import { setActiveFormingBrief, clearFormingBrief } from './activeForming';
import { setActivePatternScan, clearPatternScan } from './activeScan';
import { resolvePatternConflicts } from './conflicts';
import { analyzeFormingStructure } from './forming';
import { scanAllPatterns } from './scan';
import { analysisWindow, candleFingerprint, sanitizeCandles } from './sanitize';
import type { Candle } from './types';
import type { FormingStructureBrief } from './forming';
import type { PatternScanResult } from './types';
import { LruMap } from '../lib/lruMap';

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
}

const FINGERPRINT_CACHE_MAX = 48;
const fingerprintCache = new LruMap<string, string>(FINGERPRINT_CACHE_MAX);

function buildScan(candles: Candle[]): PatternScanResult {
  return scanAllPatterns(analysisWindow(candles));
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
    const forming = analyzeFormingStructure(safe, symbol, timeframe, scan.patterns);
    if (!forming) return null;

    return {
      symbol: forming.symbol,
      timeframe: forming.timeframe,
      scan,
      forming,
      fingerprint,
      analyzedAt: Date.now(),
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
