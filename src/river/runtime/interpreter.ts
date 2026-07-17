// Evaluates RIR expression trees bar-by-bar during Layer 4 execution.

import { RirCallArg, RirExpr } from '../rir/types';
import { Candle } from '../../types/indicators';
import { crossover, nz, emaAtBar } from './builtins';
import { SeriesStore, isTruthy, toBoolNum } from './seriesStore';

export interface EvalContext {
  bar: number;
  candles: Candle[];
  haCloses: number[];
  inputs: Record<string, number | boolean>;
  store: SeriesStore;
  atrValues: number[];
  /** Scratch buffer for ta.ema when evaluating a source expression */
  scratchSrc: number[];
}

export function evaluateExpr(expr: RirExpr, ctx: EvalContext): number {
  switch (expr.kind) {
    case 'const':
      if (expr.value === null) return NaN;
      if (typeof expr.value === 'boolean') return expr.value ? 1 : 0;
      return expr.value;

    case 'input': {
      const v = ctx.inputs[expr.name];
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    }

    case 'builtin':
      return ctx.candles[ctx.bar]?.[expr.name] ?? NaN;

    case 'series':
      return ctx.store.get(expr.name, ctx.bar, 0);

    case 'ref':
      return ctx.store.get(expr.series, ctx.bar, expr.offset);

    case 'unary': {
      const v = evaluateExpr(expr.operand, ctx);
      if (expr.op === '-') return -v;
      if (expr.op === '!' || expr.op === 'not') return toBoolNum(v) ? 0 : 1;
      return v;
    }

    case 'binary': {
      const left = evaluateExpr(expr.left, ctx);
      const right = evaluateExpr(expr.right, ctx);
      switch (expr.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right === 0 ? NaN : left / right;
        case '%': return right === 0 ? NaN : left % right;
        case '>': return left > right ? 1 : 0;
        case '<': return left < right ? 1 : 0;
        case '>=': return left >= right ? 1 : 0;
        case '<=': return left <= right ? 1 : 0;
        case '==': return left === right ? 1 : 0;
        case '!=': return left !== right ? 1 : 0;
        default: return NaN;
      }
    }

    case 'logical': {
      const left = isTruthy(evaluateExpr(expr.left, ctx));
      const right = isTruthy(evaluateExpr(expr.right, ctx));
      if (expr.op === 'and') return left && right ? 1 : 0;
      return left || right ? 1 : 0;
    }

    case 'ternary': {
      const cond = isTruthy(evaluateExpr(expr.condition, ctx));
      return cond
        ? evaluateExpr(expr.consequent, ctx)
        : evaluateExpr(expr.alternate, ctx);
    }

    case 'heikinashi_src': {
      const enabled = isTruthy(evaluateExpr(expr.enabled, ctx));
      if (enabled) return ctx.haCloses[ctx.bar] ?? NaN;
      return evaluateExpr(expr.fallback, ctx);
    }

    case 'call':
      return evaluateCall(expr.fn, expr.args, ctx);

    default:
      return NaN;
  }
}

export function evaluateExprAtOffset(expr: RirExpr, ctx: EvalContext, offset: number): number {
  if (offset === 0) return evaluateExpr(expr, ctx);
  if (ctx.bar - offset < 0) return NaN;
  return evaluateExpr(expr, { ...ctx, bar: ctx.bar - offset });
}

function evaluateCall(fn: string, args: RirCallArg[], ctx: EvalContext): number {
  const pos = (idx: number) => evaluateExpr(args[idx]?.value ?? { kind: 'const', value: 0 }, ctx);

  switch (fn) {
    case 'ta.atr':
      return ctx.atrValues[ctx.bar] ?? NaN;

    case 'ta.ema': {
      const period = Math.max(1, Math.round(pos(1)));
      if (period === 1) return pos(0);
      const srcValues = buildSrcSeries(args[0]?.value, ctx);
      return emaAtBar(srcValues, ctx.bar, period);
    }

    case 'ta.crossover': {
      const aNow = pos(0);
      const bNow = pos(1);
      const aPrev = evaluateExprAtOffset(args[0]?.value ?? { kind: 'const', value: 0 }, ctx, 1);
      const bPrev = evaluateExprAtOffset(args[1]?.value ?? { kind: 'const', value: 0 }, ctx, 1);
      return crossover(aNow, bNow, aPrev, bPrev);
    }

    case 'ta.crossunder': {
      const aNow = pos(0);
      const bNow = pos(1);
      const aPrev = evaluateExprAtOffset(args[0]?.value ?? { kind: 'const', value: 0 }, ctx, 1);
      const bPrev = evaluateExprAtOffset(args[1]?.value ?? { kind: 'const', value: 0 }, ctx, 1);
      if (Number.isNaN(aNow) || Number.isNaN(bNow) || Number.isNaN(aPrev) || Number.isNaN(bPrev)) return 0;
      return aPrev >= bPrev && aNow < bNow ? 1 : 0;
    }

    case 'nz':
      return nz(pos(0), pos(1));

    case 'math.max':
      return Math.max(pos(0), pos(1));

    case 'math.min':
      return Math.min(pos(0), pos(1));

    default:
      return NaN;
  }
}

function buildSrcSeries(expr: RirExpr | undefined, ctx: EvalContext): number[] {
  if (!expr) return [];
  const values: number[] = [];
  for (let i = 0; i <= ctx.bar; i++) {
    values.push(evaluateExpr(expr, { ...ctx, bar: i }));
  }
  return values;
}
