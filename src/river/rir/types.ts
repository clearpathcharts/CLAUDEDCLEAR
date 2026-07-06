// River Intermediate Representation (RIR) v1 — Layer 3 of The River compiler.
// All imported indicator languages lower into this format before runtime execution.

export const RIR_VERSION = 1 as const;

export type RirInputType = 'float' | 'int' | 'bool';

export interface RirInputDef {
  name: string;
  type: RirInputType;
  defaultValue: number | boolean;
}

export interface RirSeriesDef {
  name: string;
  /** Pine `:=` reassignments are modeled as mutable series updated each bar */
  mutable: boolean;
}

export type RirBuiltin = 'close' | 'open' | 'high' | 'low';

export type RirExpr =
  | RirConstExpr
  | RirInputExpr
  | RirBuiltinExpr
  | RirSeriesExpr
  | RirRefExpr
  | RirUnaryExpr
  | RirBinaryExpr
  | RirLogicalExpr
  | RirTernaryExpr
  | RirCallExpr
  | RirHeikinAshiSrcExpr;

export interface RirConstExpr {
  kind: 'const';
  value: number | boolean | null;
}

export interface RirInputExpr {
  kind: 'input';
  name: string;
}

export interface RirBuiltinExpr {
  kind: 'builtin';
  name: RirBuiltin;
}

export interface RirSeriesExpr {
  kind: 'series';
  name: string;
}

export interface RirRefExpr {
  kind: 'ref';
  series: string;
  offset: number;
}

export interface RirUnaryExpr {
  kind: 'unary';
  op: string;
  operand: RirExpr;
}

export interface RirBinaryExpr {
  kind: 'binary';
  op: string;
  left: RirExpr;
  right: RirExpr;
}

export interface RirLogicalExpr {
  kind: 'logical';
  op: 'and' | 'or';
  left: RirExpr;
  right: RirExpr;
}

export interface RirTernaryExpr {
  kind: 'ternary';
  condition: RirExpr;
  consequent: RirExpr;
  alternate: RirExpr;
}

export interface RirCallArg {
  name?: string;
  value: RirExpr;
}

export interface RirCallExpr {
  kind: 'call';
  fn: string;
  args: RirCallArg[];
}

/** Models `h ? request.security(heikinashi, ..., close) : close` */
export interface RirHeikinAshiSrcExpr {
  kind: 'heikinashi_src';
  enabled: RirExpr;
  fallback: RirExpr;
}

export interface RirAssignStmt {
  kind: 'assign';
  target: string;
  operator: '=' | ':=';
  expr: RirExpr;
  line: number;
}

export interface RirBarColorOutput {
  kind: 'barcolor';
  conditionSeries: string;
  color: [number, number, number];
  line: number;
}

export interface RirPlotShapeOutput {
  kind: 'plotshape';
  conditionSeries: string;
  direction: 'buy' | 'sell';
  label: string;
  line: number;
}

export interface RirAlertOutput {
  kind: 'alert';
  conditionSeries: string;
  title: string;
  line: number;
}

export type RirOutput = RirBarColorOutput | RirPlotShapeOutput | RirAlertOutput;

export interface RirProgram {
  rirVersion: typeof RIR_VERSION;
  indicatorName: string;
  pineVersion: number | null;
  inputs: RirInputDef[];
  series: RirSeriesDef[];
  statements: RirAssignStmt[];
  outputs: RirOutput[];
}

export interface RirLowerError {
  message: string;
  line: number;
}

export interface RirLowerResult {
  program: RirProgram | null;
  errors: RirLowerError[];
  bytecodeId: string | null;
}

/** Stable short fingerprint for UI + runtime cache keys */
export function rirBytecodeId(program: RirProgram): string {
  const payload = JSON.stringify({
    v: program.rirVersion,
    n: program.indicatorName,
    i: program.inputs,
    s: program.series.map((x) => [x.name, x.mutable]),
    o: program.outputs.map((o) => o.kind),
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
  }
  return `RIR-${hash.toString(16).toUpperCase().padStart(8, '0')}`;
}
