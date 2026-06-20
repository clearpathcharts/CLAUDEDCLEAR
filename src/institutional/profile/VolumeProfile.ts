import { Candle } from "../../types/indicators";

export interface VolumeProfileNode {
  price: number;
  volume: number;
  isPOC: boolean;
}

export function calculateVolumeProfile(candles: Candle[], priceBins: number = 24): VolumeProfileNode[] {
  if (candles.length === 0) return [];
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  
  const range = maxPrice - minPrice;
  if (range <= 0) return [];

  const binStep = range / priceBins;
  const bins: {[key: number]: number} = {};

  // Accumulate volume into equal-spaced price bands
  candles.forEach(candle => {
    const avgPrice = (candle.high + candle.low + candle.close) / 3;
    const binIdx = Math.floor((avgPrice - minPrice) / binStep);
    bins[binIdx] = (bins[binIdx] || 0) + candle.volume;
  });

  // Convert to nodes list
  const nodes: VolumeProfileNode[] = [];
  let maxVolume = 0;
  let pocBinIdx = 0;

  for (let idx = 0; idx < priceBins; idx++) {
    const vol = bins[idx] || 0;
    if (vol > maxVolume) {
      maxVolume = vol;
      pocBinIdx = idx;
    }
    nodes.push({
      price: Number((minPrice + idx * binStep).toFixed(4)),
      volume: vol,
      isPOC: false
    });
  }

  // Mark Point of Control (POC) Node
  if (nodes[pocBinIdx]) {
    nodes[pocBinIdx].isPOC = true;
  }

  return nodes;
}
