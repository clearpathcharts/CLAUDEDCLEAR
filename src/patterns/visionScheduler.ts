import { cancelAnimation, requestAnimation } from './raf';
import { clearChartVisionCache, publishChartVision, runChartVisionPipeline } from './engine';
import type { ChartVisionInput, ChartVisionOutput } from './engine';
import { formingChartKey } from './activeForming';
import { clearFormingBrief } from './activeForming';
import { clearPatternScan } from './activeScan';

type VisionCallback = (output: ChartVisionOutput) => void;

interface PendingVision {
  input: ChartVisionInput;
  callback?: VisionCallback;
}

const pending = new Map<string, PendingVision>();
const rafIds = new Map<string, number>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 100;

function flush(): void {
  debounceTimer = null;

  for (const [key, job] of pending.entries()) {
    pending.delete(key);
    const rafId = rafIds.get(key);
    if (rafId != null) {
      cancelAnimation(rafId);
      rafIds.delete(key);
    }

    const output = runChartVisionPipeline(job.input);
    if (!output) continue;

    publishChartVision(output);
    job.callback?.(output);
  }
}

/**
 * Coalesce rapid chart updates into one vision pass per animation frame batch.
 * Safe to call on every render — will not stack overlapping scans.
 */
export function scheduleChartVision(
  input: ChartVisionInput,
  callback?: VisionCallback,
): void {
  const key = formingChartKey(input.symbol, input.timeframe);
  pending.set(key, { input, callback });

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flush, DEBOUNCE_MS);
}

/** Run immediately on the next animation frame (e.g. first chart paint). */
export function scheduleChartVisionImmediate(
  input: ChartVisionInput,
  callback?: VisionCallback,
): void {
  const key = formingChartKey(input.symbol, input.timeframe);
  pending.set(key, { input, callback });

  const existing = rafIds.get(key);
  if (existing != null) cancelAnimation(existing);

  const rafId = requestAnimation(() => {
    rafIds.delete(key);
    const job = pending.get(key);
    if (!job) return;
    pending.delete(key);

    const output = runChartVisionPipeline(job.input, { force: true });
    if (!output) return;

    publishChartVision(output);
    job.callback?.(output);
  });

  rafIds.set(key, rafId);
}

export function cancelChartVision(symbol: string, timeframe: string): void {
  const key = formingChartKey(symbol, timeframe);
  pending.delete(key);

  const rafId = rafIds.get(key);
  if (rafId != null) {
    cancelAnimation(rafId);
    rafIds.delete(key);
  }

  clearChartVisionCache(symbol, timeframe);
  clearFormingBrief(symbol, timeframe);
  clearPatternScan(symbol, timeframe);
}