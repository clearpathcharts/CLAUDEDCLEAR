import { getPatternScan } from "./activeScan";
import type { PatternScanResult } from "./types";

/**
 * Scanner UI must only show hits for the symbol+timeframe on the panel.
 * Falling back to the globally latest scan painted EURUSD geometry under an
 * XAUUSD header whenever the keyed scan had not published yet.
 */
export function resolvePanelScan(symbol: string, timeframe: string): PatternScanResult | null {
  if (!symbol || symbol === "—") return null;
  return getPatternScan(symbol, timeframe)?.scan ?? null;
}
