import { calculateBOS } from '../../institutional/marketstructure/BOS';
import { calculateCHOCH } from '../../institutional/marketstructure/CHOCH';
import { calculateFVG } from '../../institutional/smartmoney/FairValueGap';
import { calculateOrderBlock } from '../../institutional/smartmoney/OrderBlock';
import { calculateLiquiditySweep } from '../../institutional/liquidity/LiquiditySweep';
import { calculateVolumeProfile } from '../../institutional/profile/VolumeProfile';
import { calculateCumulativeDelta } from '../../institutional/orderflow/CumulativeDelta';
import type { Candle } from '../../types/indicators';
import type { StructureBreak } from '../../institutional/marketstructure/BOS';
import type { CharacterShift } from '../../institutional/marketstructure/CHOCH';
import type { FairValueGap } from '../../institutional/smartmoney/FairValueGap';
import type { OrderBlock } from '../../institutional/smartmoney/OrderBlock';
import type { LiquiditySweep } from '../../institutional/liquidity/LiquiditySweep';
import type { VolumeProfileNode } from '../../institutional/profile/VolumeProfile';
import type { CumulativeVolumeDeltaPoint } from '../../institutional/orderflow/CumulativeDelta';

export type VolumeMode = 'vendor' | 'range-proxy';

export type StructureEventKind =
  | StructureBreak['type']
  | CharacterShift['type']
  | FairValueGap['type']
  | OrderBlock['type']
  | LiquiditySweep['type'];

export type StructureEvent = {
  kind: StructureEventKind;
  family: 'BOS' | 'CHOCH' | 'FVG' | 'OB' | 'SWEEP';
  time: number;
  label: string;
  price: number;
};

export type InstitutionalStructureReport = {
  bos: StructureBreak[];
  choch: CharacterShift[];
  fvg: FairValueGap[];
  orderBlocks: OrderBlock[];
  sweeps: LiquiditySweep[];
  volumeProfile: VolumeProfileNode[];
  cvd: CumulativeVolumeDeltaPoint[];
  lastCvd: number | null;
  events: StructureEvent[];
  volumeMode: VolumeMode;
};

function asUnix(time: string | number): number {
  const n = typeof time === 'number' ? time : Number(time);
  return Number.isFinite(n) ? n : 0;
}

function withVolume(candles: Candle[]): { candles: Candle[]; volumeMode: VolumeMode } {
  const hasVendor = candles.some((c) => typeof c.volume === 'number' && c.volume > 0);
  if (hasVendor) return { candles, volumeMode: 'vendor' };
  return {
    volumeMode: 'range-proxy',
    candles: candles.map((c) => ({
      ...c,
      volume: Math.max(0, c.high - c.low),
    })),
  };
}

export function analyzeInstitutionalStructure(raw: Candle[]): InstitutionalStructureReport {
  const { candles, volumeMode } = withVolume(raw);
  const bos = calculateBOS(candles);
  const choch = calculateCHOCH(candles);
  const fvg = calculateFVG(candles);
  const orderBlocks = calculateOrderBlock(candles);
  const sweeps = calculateLiquiditySweep(candles);
  const volumeProfile = calculateVolumeProfile(candles);
  const cvd = calculateCumulativeDelta(candles);
  const lastCvd = cvd.length ? cvd[cvd.length - 1].cumulativeDelta : null;

  const events: StructureEvent[] = [
    ...bos.map((e) => ({
      kind: e.type,
      family: 'BOS' as const,
      time: asUnix(e.time),
      label: e.type.replace(/_/g, ' '),
      price: e.price,
    })),
    ...choch.map((e) => ({
      kind: e.type,
      family: 'CHOCH' as const,
      time: asUnix(e.time),
      label: e.type.replace(/_/g, ' '),
      price: e.price,
    })),
    ...fvg.map((e) => ({
      kind: e.type,
      family: 'FVG' as const,
      time: asUnix(e.time),
      label: e.type.replace(/_/g, ' '),
      price: (e.top + e.bottom) / 2,
    })),
    ...orderBlocks.map((e) => ({
      kind: e.type,
      family: 'OB' as const,
      time: asUnix(e.time),
      label: e.type.replace(/_/g, ' '),
      price: (e.high + e.low) / 2,
    })),
    ...sweeps.map((e) => ({
      kind: e.type,
      family: 'SWEEP' as const,
      time: asUnix(e.time),
      label: e.type.replace(/_/g, ' '),
      price: e.priceLevel,
    })),
  ].sort((a, b) => b.time - a.time);

  return {
    bos,
    choch,
    fvg,
    orderBlocks,
    sweeps,
    volumeProfile,
    cvd,
    lastCvd,
    events,
    volumeMode,
  };
}

export function closeLocationFlow(
  candles: Candle[],
  lookback = 20,
): { buyPct: number; sellPct: number; bars: number } | null {
  const slice = candles.slice(-Math.max(5, lookback));
  if (slice.length < 5) return null;
  let buy = 0;
  let sell = 0;
  for (const c of slice) {
    const range = c.high - c.low;
    if (range <= 0) continue;
    const buyer = (c.close - c.low) / range;
    buy += buyer;
    sell += 1 - buyer;
  }
  const tot = buy + sell;
  if (tot <= 0) return null;
  return {
    buyPct: (buy / tot) * 100,
    sellPct: (sell / tot) * 100,
    bars: slice.length,
  };
}

export function formatStructurePrice(price: number): string {
  if (!Number.isFinite(price)) return '—';
  const abs = Math.abs(price);
  if (abs >= 1000) return price.toFixed(2);
  if (abs >= 10) return price.toFixed(3);
  if (abs >= 1) return price.toFixed(4);
  return price.toFixed(5);
}
