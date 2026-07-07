// Active RIR program store — charts execute bytecode on their own OHLC data.

import { RirProgram } from '../rir/types';
import { executeRir } from './execute';
import { RirExecutionResult, RirInputOverrides } from './types';
import { Candle } from '../../types/indicators';

let activeProgram: RirProgram | null = null;
let activeOverrides: RirInputOverrides = {};
let lastExecution: RirExecutionResult | null = null;

export function activateRirProgram(program: RirProgram, overrides: RirInputOverrides = {}): string {
  activeProgram = program;
  activeOverrides = overrides;
  lastExecution = null;
  return program.indicatorName;
}

export function executeActiveRirOnCandles(candles: Candle[]): RirExecutionResult | null {
  if (!activeProgram || candles.length === 0) return null;
  const result = executeRir(activeProgram, candles, activeOverrides);
  if (result.execution) {
    lastExecution = result.execution;
  }
  return result.execution;
}

export function getActiveRirProgram(): RirProgram | null {
  return activeProgram;
}

export function getActiveRirOverrides(): RirInputOverrides {
  return activeOverrides;
}

export function getLastRirExecution(): RirExecutionResult | null {
  return lastExecution;
}

export function getGoldBarColorForTime(time: number): string | null {
  if (!lastExecution) return null;
  const bar = lastExecution.bars.find((b) => b.time === time);
  if (!bar) return null;
  const gold = bar.barColors.find((c) => c.r === 255 && c.g === 215 && c.b === 0);
  if (!gold) return null;
  return `rgb(${gold.r}, ${gold.g}, ${gold.b})`;
}

export function clearActiveRirProgram(): void {
  activeProgram = null;
  activeOverrides = {};
  lastExecution = null;
}
