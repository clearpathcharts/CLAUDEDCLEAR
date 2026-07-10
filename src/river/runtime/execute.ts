// Layer 4 — executes RIR bytecode bar-by-bar on real OHLC candles.

import { calculateATR } from '../../indicators/volatility/ATR';
import { RirProgram, RirOutput } from '../rir/types';
import { rirBytecodeId } from '../rir/types';
import { toHeikinAshiCloses } from './builtins';
import { evaluateExpr } from './interpreter';
import { SeriesStore, isTruthy } from './seriesStore';
import {
  buildInputMap,
  Candle,
  RirBarColor,
  RirBarResult,
  RirExecuteResult,
  RirExecutionResult,
  RirInputOverrides,
} from './types';

function precomputeAtr(candles: Candle[], period: number): number[] {
  const atrSeries = calculateATR(candles, period);
  const byTime = new Map(atrSeries.map((a) => [a.time, a.value]));
  return candles.map((c) => byTime.get(c.time) ?? NaN);
}

function resolveOutputs(
  outputs: RirOutput[],
  store: SeriesStore,
  bar: number,
): Pick<RirBarResult, 'barColors' | 'plotShapes' | 'alerts' | 'buyActive' | 'sellActive'> {
  const barColors: RirBarColor[] = [];
  const plotShapes: RirBarResult['plotShapes'] = [];
  const alerts: string[] = [];
  let buyActive = false;
  let sellActive = false;

  for (const output of outputs) {
    const active = isTruthy(store.get(output.conditionSeries, bar, 0));
    if (!active) continue;

    if (output.kind === 'barcolor') {
      barColors.push({ r: output.color[0], g: output.color[1], b: output.color[2] });
      if (output.conditionSeries === 'buy') buyActive = true;
      if (output.conditionSeries === 'sell') sellActive = true;
    } else if (output.kind === 'plotshape') {
      plotShapes.push({ direction: output.direction, label: output.label });
      if (output.direction === 'buy') buyActive = true;
      if (output.direction === 'sell') sellActive = true;
    } else if (output.kind === 'alert') {
      alerts.push(output.title);
    }
  }

  return { barColors, plotShapes, alerts, buyActive, sellActive };
}

export function executeRir(
  program: RirProgram,
  candles: Candle[],
  overrides: RirInputOverrides = {},
): RirExecuteResult {
  if (candles.length === 0) {
    return { execution: null, errors: [{ message: 'No candle data to execute against.' }] };
  }

  const inputs = buildInputMap(program, overrides);
  const atrPeriod = Math.max(1, Math.round(Number(inputs.c ?? 10)));
  const haCloses = toHeikinAshiCloses(candles);
  const atrValues = precomputeAtr(candles, atrPeriod);
  const store = new SeriesStore();
  const bars: RirBarResult[] = [];

  let buySignals = 0;
  let sellSignals = 0;
  let goldBarHits = 0;
  let liveBars = 0;

  for (let bar = 0; bar < candles.length; bar++) {
    const ctx = {
      bar,
      candles,
      haCloses,
      inputs,
      store,
      atrValues,
      scratchSrc: [],
    };

    for (const stmt of program.statements) {
      const value = evaluateExpr(stmt.expr, ctx);
      store.set(stmt.target, bar, value);
    }

    const resolved = resolveOutputs(program.outputs, store, bar);
    const atrLive = !Number.isNaN(atrValues[bar]);

    if (atrLive) liveBars++;
    if (resolved.buyActive) buySignals++;
    if (resolved.sellActive) sellSignals++;
    if (resolved.barColors.some((c) => c.r === 255 && c.g === 215 && c.b === 0)) goldBarHits++;

    bars.push({
      time: candles[bar].time,
      ...resolved,
    });
  }

  const bytecodeId = rirBytecodeId(program);

  return {
    execution: {
      bytecodeId,
      indicatorName: program.indicatorName,
      barsProcessed: candles.length,
      buySignals,
      sellSignals,
      goldBarHits,
      bars,
      isLive: liveBars > 0,
    },
    errors: [],
  };
}

/** Apply gold RIR bar colors to lightweight-charts candle payloads */
export function applyRirColorsToCandles<T extends { time: number | string }>(
  candles: T[],
  execution: RirExecutionResult,
): Array<T & { color?: string; borderColor?: string; wickColor?: string }> {
  const colorByTime = new Map<number, string>();
  for (const bar of execution.bars) {
    const gold = bar.barColors.find((c) => c.r === 255 && c.g === 215 && c.b === 0);
    if (gold) {
      colorByTime.set(bar.time, `rgb(${gold.r}, ${gold.g}, ${gold.b})`);
    }
  }

  return candles.map((c) => {
    const t = typeof c.time === 'number' ? c.time : parseInt(String(c.time), 10);
    const color = colorByTime.get(t);
    if (!color) return c;
    return { ...c, color, borderColor: color, wickColor: color };
  });
}
