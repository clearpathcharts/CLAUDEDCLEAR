// Lowers a Pine Script AST into River Intermediate Representation (RIR).

import {
  PineExpr,
  PineProgram,
  PineStmt,
  PineCallArg,
} from '../pine/ast';
import {
  RirAssignStmt,
  RirExpr,
  RirInputDef,
  RirLowerError,
  RirLowerResult,
  RirOutput,
  RirProgram,
  RirSeriesDef,
  RIR_VERSION,
  rirBytecodeId,
} from './types';

function memberPath(expr: PineExpr): string | null {
  if (expr.kind === 'Var') return expr.name;
  if (expr.kind === 'Member') {
    const base = memberPath(expr.object);
    return base ? `${base}.${expr.property}` : expr.property;
  }
  return null;
}

function isHeikinAshiSrcTernary(expr: PineExpr): boolean {
  if (expr.kind !== 'Ternary') return false;
  const consPath = expr.consequent.kind === 'Call' ? memberPath(expr.consequent.callee) : null;
  return consPath === 'request.security';
}

function rgbFromCall(expr: PineExpr): [number, number, number] | null {
  if (expr.kind !== 'Call') return null;
  const path = memberPath(expr.callee);
  if (path !== 'color.rgb') return null;
  const nums = expr.args
    .filter((a) => a.name === undefined)
    .map((a) => a.value)
    .filter((v): v is Extract<PineExpr, { kind: 'Number' }> => v.kind === 'Number')
    .map((v) => v.value);
  if (nums.length < 3) return null;
  return [nums[0], nums[1], nums[2]];
}

function seriesFromExpr(expr: PineExpr): string | null {
  if (expr.kind === 'Var') return expr.name;
  return null;
}

function inferInputType(name: string, value: PineExpr): RirInputDef['type'] {
  if (value.kind === 'Bool') return 'bool';
  if (value.kind === 'Number' && Number.isInteger(value.value)) return 'int';
  return 'float';
}

function inferInputDefault(value: PineExpr): number | boolean {
  if (value.kind === 'Number') return value.value;
  if (value.kind === 'Bool') return value.value;
  return 0;
}

export class RirLowerer {
  private readonly errors: RirLowerError[] = [];
  private readonly seriesNames = new Set<string>();
  private readonly inputNames = new Set<string>();

  constructor(private readonly program: PineProgram) {}

  lower(): RirLowerResult {
    const indicatorName = this.extractIndicatorName();
    const statements: RirAssignStmt[] = [];
    const outputs: RirOutput[] = [];
    const inputs: RirInputDef[] = [];

    for (const decl of this.program.declarations) {
      if (decl.kind === 'IndicatorDecl') continue;

      if (decl.kind === 'Assign') {
        const expr = this.lowerExpr(decl.value, decl.line);
        if (!expr) continue;

        if (decl.operator === '=' && ['a', 'c', 'h'].includes(decl.name)) {
          this.inputNames.add(decl.name);
          inputs.push({
            name: decl.name,
            type: inferInputType(decl.name, decl.value),
            defaultValue: inferInputDefault(decl.value),
          });
        }

        this.seriesNames.add(decl.name);
        statements.push({
          kind: 'assign',
          target: decl.name,
          operator: decl.operator,
          expr,
          line: decl.line,
        });
        continue;
      }

      if (decl.kind === 'ExprStmt') {
        const out = this.lowerOutput(decl.expression, decl.line);
        if (out) outputs.push(out);
      }
    }

    if (this.errors.length > 0) {
      return { program: null, errors: this.errors, bytecodeId: null };
    }

    const series: RirSeriesDef[] = [...this.seriesNames].map((name) => ({
      name,
      mutable: statements.some((s) => s.target === name && s.operator === ':='),
    }));

    const rir: RirProgram = {
      rirVersion: RIR_VERSION,
      indicatorName,
      pineVersion: this.program.version,
      inputs,
      series,
      statements,
      outputs,
    };

    return { program: rir, errors: [], bytecodeId: rirBytecodeId(rir) };
  }

  private extractIndicatorName(): string {
    for (const decl of this.program.declarations) {
      if (decl.kind !== 'IndicatorDecl') continue;
      const title = decl.args.find((a) => a.name === undefined && a.value.kind === 'String');
      if (title && title.value.kind === 'String') return title.value.value;
    }
    return 'Unnamed Indicator';
  }

  private lowerOutput(expr: PineExpr, line: number): RirOutput | null {
    if (expr.kind !== 'Call') {
      this.error('Expected top-level plot/output call.', line);
      return null;
    }

    const path = memberPath(expr.callee);
    if (!path) {
      this.error('Unknown output call.', line);
      return null;
    }

    if (path === 'barcolor') {
      const condExpr = expr.args[0]?.value;
      if (!condExpr) {
        this.error('barcolor() missing condition.', line);
        return null;
      }

      if (condExpr.kind === 'Ternary') {
        const condSeries = seriesFromExpr(condExpr.condition);
        if (!condSeries) {
          this.error('barcolor() ternary condition must reference a series.', line);
          return null;
        }
        const color = rgbFromCall(condExpr.consequent) ?? [255, 215, 0];
        return { kind: 'barcolor', conditionSeries: condSeries, color, line };
      }

      const lowered = this.lowerExpr(condExpr, line);
      if (!lowered) return null;
      const condSeries = this.exprToConditionSeries(lowered, line);
      if (!condSeries) return null;
      return { kind: 'barcolor', conditionSeries: condSeries, color: [255, 215, 0], line };
    }

    if (path === 'plotshape') {
      const cond = expr.args[0]?.value;
      if (!cond) {
        this.error('plotshape() missing condition.', line);
        return null;
      }
      const condSeries = this.exprToConditionSeries(this.lowerExpr(cond, line), line);
      if (!condSeries) return null;

      const titleArg = expr.args.find((a) => a.name === 'title' || a.name === 'text');
      const label =
        titleArg?.value.kind === 'String'
          ? titleArg.value.value
          : condSeries === 'sell'
            ? 'Sell'
            : 'Buy';
      const direction: 'buy' | 'sell' =
        label.toLowerCase().includes('sell') || condSeries === 'sell' ? 'sell' : 'buy';

      return { kind: 'plotshape', conditionSeries: condSeries, direction, label, line };
    }

    if (path === 'alertcondition') {
      const cond = expr.args[0]?.value;
      const titleArg = expr.args.find((a) => a.name === undefined && a.value.kind === 'String');
      if (!cond || !titleArg || titleArg.value.kind !== 'String') {
        this.error('alertcondition() missing condition or title.', line);
        return null;
      }
      const condSeries = this.exprToConditionSeries(this.lowerExpr(cond, line), line);
      if (!condSeries) return null;
      return { kind: 'alert', conditionSeries: condSeries, title: titleArg.value.value, line };
    }

    this.error(`Unsupported output call '${path}'.`, line);
    return null;
  }

  private exprToConditionSeries(expr: RirExpr | null, line: number): string | null {
    if (!expr) return null;
    if (expr.kind === 'series') return expr.name;
    this.error('Output condition must reference a named series.', line);
    return null;
  }

  private lowerExpr(expr: PineExpr, line: number): RirExpr | null {
    switch (expr.kind) {
      case 'Number':
        return { kind: 'const', value: expr.value };
      case 'Bool':
        return { kind: 'const', value: expr.value };
      case 'Na':
        return { kind: 'const', value: null };
      case 'Var': {
        if (expr.name === 'close' || expr.name === 'open' || expr.name === 'high' || expr.name === 'low') {
          return { kind: 'builtin', name: expr.name };
        }
        if (this.inputNames.has(expr.name)) return { kind: 'input', name: expr.name };
        return { kind: 'series', name: expr.name };
      }
      case 'Unary':
        return {
          kind: 'unary',
          op: expr.operator,
          operand: this.lowerExpr(expr.operand, line)!,
        };
      case 'Binary':
        return {
          kind: 'binary',
          op: expr.operator,
          left: this.lowerExpr(expr.left, line)!,
          right: this.lowerExpr(expr.right, line)!,
        };
      case 'Logical':
        return {
          kind: 'logical',
          op: expr.operator,
          left: this.lowerExpr(expr.left, line)!,
          right: this.lowerExpr(expr.right, line)!,
        };
      case 'Ternary':
        if (isHeikinAshiSrcTernary(expr)) {
          return {
            kind: 'heikinashi_src',
            enabled: this.lowerExpr(expr.condition, line)!,
            fallback: this.lowerExpr(expr.alternate, line)!,
          };
        }
        return {
          kind: 'ternary',
          condition: this.lowerExpr(expr.condition, line)!,
          consequent: this.lowerExpr(expr.consequent, line)!,
          alternate: this.lowerExpr(expr.alternate, line)!,
        };
      case 'Grouping':
        return this.lowerExpr(expr.expression, line);
      case 'Index': {
        const seriesName = seriesFromExpr(expr.object);
        const offset = expr.index.kind === 'Number' ? expr.index.value : null;
        if (!seriesName || offset === null || !Number.isInteger(offset)) {
          this.error('Only integer literal history offsets are supported.', line);
          return null;
        }
        return { kind: 'ref', series: seriesName, offset };
      }
      case 'Member':
      case 'Call':
        return this.lowerCall(expr, line);
      default:
        this.error(`Unsupported expression kind '${(expr as PineExpr).kind}'.`, line);
        return null;
    }
  }

  private lowerCall(expr: PineExpr, line: number): RirExpr | null {
    let fn: string | null = null;
    let args: PineCallArg[] = [];

    if (expr.kind === 'Call') {
      fn = memberPath(expr.callee);
      args = expr.args;
    } else if (expr.kind === 'Member') {
      fn = memberPath(expr);
      args = [];
    }

    if (!fn) {
      this.error('Could not resolve call target.', line);
      return null;
    }

    return {
      kind: 'call',
      fn,
      args: args.map((a) => ({
        name: a.name,
        value: this.lowerExpr(a.value, line)!,
      })),
    };
  }

  private error(message: string, line: number): void {
    this.errors.push({ message, line });
  }
}

export function lowerPineToRir(program: PineProgram): RirLowerResult {
  return new RirLowerer(program).lower();
}
