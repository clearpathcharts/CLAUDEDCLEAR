/**
 * MARKET SCREENER ENGINE (File 98)
 */

export interface ScreenerResult {
  symbol: string;
  pe: number;
  margin: number;
  volume: number;
  price: number;
  change: number;
}

export interface ScreenerFilters {
  maxPe: number;
  minMargin: number;
  minVolume: number;
}

export function runScreener(data: ScreenerResult[], filters: ScreenerFilters): ScreenerResult[] {
  return data.filter(asset => {
    if (filters.maxPe > 0 && asset.pe > filters.maxPe) return false;
    if (filters.minMargin > 0 && asset.margin < filters.minMargin) return false;
    if (filters.minVolume > 0 && asset.volume < filters.minVolume) return false;
    return true;
  });
}
