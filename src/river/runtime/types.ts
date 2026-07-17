// Layer 4 — RIR runtime execution results.

import { RirProgram } from '../rir/types';
import { Candle } from '../../types/indicators';

export interface RirBarColor {
  r: number;
  g: number;
  b: number;
}

export interface RirBarResult {
  time: number;
  barColors: RirBarColor[];
  plotShapes: Array<{ direction: 'buy' | 'sell'; label: string }>;
  alerts: string[];
  buyActive: boolean;
  sellActive: boolean;
}

export interface RirExecutionResult {
  bytecodeId: string;
  indicatorName: string;
  barsProcessed: number;
  buySignals: number;
  sellSignals: number;
  goldBarHits: number;
  bars: RirBarResult[];
  isLive: boolean;
}

export interface RirRuntimeError {
  message: string;
  line?: number;
}

export interface RirExecuteResult {
  execution: RirExecutionResult | null;
  errors: RirRuntimeError[];
}

export interface RirInputOverrides {
  [name: string]: number | boolean;
}

export function isGoldBarRir(program: RirProgram): boolean {
  const hasTrailing = program.series.some((s) => /trailingstop/i.test(s.name) && s.mutable);
  const hasBuySell = program.series.some((s) => s.name === 'buy') && program.series.some((s) => s.name === 'sell');
  const hasGold = program.outputs.some(
    (o) => o.kind === 'barcolor' && o.color[0] === 255 && o.color[1] === 215 && o.color[2] === 0,
  );
  return hasTrailing && hasBuySell && hasGold;
}

export function buildInputMap(
  program: RirProgram,
  overrides: RirInputOverrides = {},
): Record<string, number | boolean> {
  const map: Record<string, number | boolean> = {};
  for (const input of program.inputs) {
    map[input.name] = overrides[input.name] ?? input.defaultValue;
  }
  return map;
}

export type { Candle };
