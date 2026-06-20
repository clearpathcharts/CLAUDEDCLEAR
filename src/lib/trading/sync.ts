import { setClearState } from './clearState';

/**
 * SYNC SYSTEM (File 143)
 */

// when user selects asset
export function selectAsset(symbol: string) {
  setClearState({ selectedAsset: symbol });
  console.log(`[SYNC] Asset selected: ${symbol}`);
}

// when user runs screener
export function updateScreenerSync(results: any[]) {
  setClearState({ screenerResults: results });
  console.log(`[SYNC] Screener updated with ${results.length} nodes`);
}

// More synching logic can be added here
