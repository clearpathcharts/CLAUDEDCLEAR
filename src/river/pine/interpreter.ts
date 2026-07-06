// /src/river/pine/interpreter.ts
//
// The River's Pine Script runtime. Executes a parsed Script bar-by-bar over
// real OHLCV candles, reproducing Pine's execution model:
//
//   - the entire script re-runs once per bar, oldest to newest
//   - `x[1]` reads the value a variable/call had at the END of the previous bar
//   - `var` / `varip` declarations initialize once and persist across bars
//   - stateful built-ins (ta.ema, ta.atr, ta.crossover, ...) keep independent
//     state per syntactic call site, keyed by the call-instantiation path
//
// Output is a RiverRunResult: plots, shape markers, bar colors, hlines and
// alerts — everything a chart needs to render the indicator faithfully.

import { PineError } from "./tokens";
import {
  Script, Stmt, Expr, Call, IfExpr, FunctionDecl,
} from "./ast";
import { Candle } from "../../types/indicators";

// --------------------------------------------------------------- value model

/** null represents Pine's `na`. Tuples are Value[]. */
export type Value = number | boolean | string | null | Value[];

function isNa(v: Value): boolean {
  return v === null || v === undefined || (typeof v === "number" && !Number.isFinite(v));
}

/** Normalizes NaN/undefined/Infinity into canonical na (null). */
function norm(v: Value): Value {
  if (v === undefined) return null;
  if (typeof v === "number" && !Number.isFinite(v)) return null;
  return v;
}

function asNumber(v: Value): number | null {
  if (isNa(v)) return null;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return null;
}

function truthy(v: Value): boolean {
  if (isNa(v)) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return true;
}

// ------------------------------------------------------------- output model

export interface RiverInputMeta {
  id: string;
  title: string;
  type: "int" | "float" | "bool" | "string" | "source" | "color" | "timeframe";
  defval: Value;
  value: Value;
  options?: string[];
}

export interface RiverPlotPoint { time: number; value: number | null; }

export interface RiverPlot {
  id: string;
  title: string;
  color: string;
  lineWidth: number;
  style: string; // line | stepline | histogram | area | circles | cross | columns
  points: RiverPlotPoint[];
}

export interface RiverMarker {
  time: number;
  position: "aboveBar" | "belowBar" | "inBar";
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  color: string;
  text: string;
}

export interface RiverBarColor { time: number; color: string; }
export interface RiverHLine { value: number; title: string; color: string; }
export interface RiverAlert { time: number; title: string; message: string; }

export interface RiverRunResult {
  meta: { title: string; overlay: boolean; version: number };
  inputs: RiverInputMeta[];
  plots: RiverPlot[];
  markers: RiverMarker[];
  barColors: RiverBarColor[];
  hlines: RiverHLine[];
  alerts: RiverAlert[];
  warnings: string[];
  barsProcessed: number;
}

// ------------------------------------------------------------------- colors

const COLOR_CONSTANTS: Record<string, string> = {
  "color.red": "#F23645", "color.green": "#089981", "color.blue": "#2962FF",
  "color.white": "#FFFFFF", "color.black": "#000000", "color.yellow": "#FDD835",
  "color.orange": "#FF9800", "color.purple": "#9C27B0", "color.fuchsia": "#E040FB",
  "color.lime": "#00E676", "color.teal": "#00897B", "color.aqua": "#00BCD4",
  "color.navy": "#311B92", "color.maroon": "#880E4F", "color.olive": "#808000",
  "color.silver": "#B2B5BE", "color.gray": "#787B86", "color.grey": "#787B86",
  // v4 bare names
  "red": "#F23645", "green": "#089981", "blue": "#2962FF", "white": "#FFFFFF",
  "black": "#000000", "yellow": "#FDD835", "orange": "#FF9800", "purple": "#9C27B0",
  "fuchsia": "#E040FB", "lime": "#00E676", "teal": "#00897B", "aqua": "#00BCD4",
  "navy": "#311B92", "maroon": "#880E4F", "olive": "#808000", "silver": "#B2B5BE",
  "gray": "#787B86", "grey": "#787B86",
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

// -------------------------------------------------------- constant namespaces

const MEMBER_CONSTANTS: Record<string, Value> = {
  "math.pi": Math.PI, "math.e": Math.E,
  "shape.triangleup": "triangleup", "shape.triangledown": "triangledown",
  "shape.arrowup": "arrowup", "shape.arrowdown": "arrowdown",
  "shape.labelup": "labelup", "shape.labeldown": "labeldown",
  "shape.circle": "circle", "shape.square": "square", "shape.diamond": "diamond",
  "shape.cross": "cross", "shape.xcross": "xcross", "shape.flag": "flag",
  "location.abovebar": "abovebar", "location.belowbar": "belowbar",
  "location.absolute": "absolute", "location.top": "top", "location.bottom": "bottom",
  "size.tiny": "tiny", "size.small": "small", "size.normal": "normal",
  "size.large": "large", "size.huge": "huge", "size.auto": "auto",
  "plot.style_line": "line", "plot.style_stepline": "stepline",
  "plot.style_histogram": "histogram", "plot.style_cross": "cross",
  "plot.style_area": "area", "plot.style_columns": "columns",
  "plot.style_circles": "circles", "plot.style_linebr": "line",
  "plot.style_areabr": "area", "plot.style_steplinebr": "stepline",
  "hline.style_solid": "solid", "hline.style_dotted": "dotted", "hline.style_dashed": "dashed",
  "line.style_solid": "solid", "line.style_dotted": "dotted", "line.style_dashed": "dashed",
  "extend.none": "none", "extend.left": "left", "extend.right": "right", "extend.both": "both",
  "display.all": "all", "display.none": "none",
  "format.price": "price", "format.volume": "volume", "format.percent": "percent",
  "barmerge.gaps_off": "gaps_off", "barmerge.gaps_on": "gaps_on",
  "barmerge.lookahead_off": "lookahead_off", "barmerge.lookahead_on": "lookahead_on",
  "xloc.bar_index": "bar_index", "xloc.bar_time": "bar_time",
  "yloc.price": "price", "yloc.abovebar": "abovebar", "yloc.belowbar": "belowbar",
  "strategy.long": "long", "strategy.short": "short",
  "alert.freq_once_per_bar": "once_per_bar", "alert.freq_once_per_bar_close": "once_per_bar_close",
  "alert.freq_all": "all",
  // v4 input type constants (accepted, ignored)
  "input.integer": "integer", "input.float": "float", "input.bool": "bool",
  "input.string": "string", "input.source": "source", "input.resolution": "resolution",
  // v4 style constants
  "label.style_labelup": "labelup", "label.style_labeldown": "labeldown",
};

// v4 bare function names -> v5 namespaced equivalents
const V4_ALIASES: Record<string, string> = {
  sma: "ta.sma", ema: "ta.ema", rma: "ta.rma", wma: "ta.wma", vwma: "ta.vwma",
  hma: "ta.hma", atr: "ta.atr", tr: "ta.tr", rsi: "ta.rsi", stdev: "ta.stdev",
  variance: "ta.variance", highest: "ta.highest", lowest: "ta.lowest",
  highestbars: "ta.highestbars", lowestbars: "ta.lowestbars",
  crossover: "ta.crossover", crossunder: "ta.crossunder", cross: "ta.cross",
  change: "ta.change", mom: "ta.mom", roc: "ta.roc", macd: "ta.macd", bb: "ta.bb",
  stoch: "ta.stoch", cum: "ta.cum", sum: "ta.sum", vwap: "ta.vwap",
  barssince: "ta.barssince", valuewhen: "ta.valuewhen",
  pivothigh: "ta.pivothigh", pivotlow: "ta.pivotlow",
  abs: "math.abs", max: "math.max", min: "math.min", round: "math.round",
  floor: "math.floor", ceil: "math.ceil", sqrt: "math.sqrt", pow: "math.pow",
  exp: "math.exp", log: "math.log", log10: "math.log10", sign: "math.sign",
  avg: "math.avg", study: "indicator", tostring: "str.tostring",
};

// Functions that are intentionally accepted as silent no-ops (drawing objects
// and strategy plumbing that don't affect indicator series output).
const NOOP_FUNCTIONS = new Set([
  "fill", "label.new", "label.set_text", "label.set_xy", "label.set_x", "label.set_y",
  "label.set_color", "label.set_textcolor", "label.set_style", "label.delete",
  "line.new", "line.set_xy1", "line.set_xy2", "line.set_color", "line.delete",
  "box.new", "box.delete", "table.new", "table.cell", "table.delete",
  "strategy.exit", "strategy.cancel", "strategy.cancel_all", "strategy.risk.max_drawdown",
  "strategy.risk.max_intraday_loss", "strategy.risk.allow_entry_in",
  "alert", "max_bars_back", "barcolor_noop", "plotcandle", "plotbar",
  "array.new_float", "array.push", "array.pop", "array.get", "array.set",
  "timeframe.change",
]);

// --------------------------------------------------------------- flow signals

class BreakSignal { }
class ContinueSignal { }

// ---------------------------------------------------------------- interpreter

interface Scope { vars: Map<string, Value>; }

export interface RunOptions {
  /** Override input values, keyed by input id (title). */
  inputOverrides?: Record<string, Value>;
  /** Symbol name used for syminfo.* */
  symbol?: string;
  /** Timeframe string for timeframe.period */
  timeframe?: string;
}

export class PineInterpreter {
  private script: Script;
  private candles: Candle[];
  private opts: RunOptions;

  private bar = 0;
  private globals: Scope = { vars: new Map() };
  private scopes: Scope[] = [];
  private varOnce = new Set<string>();          // var/varip decls already initialized
  private varSeries = new Map<string, Value[]>(); // end-of-bar global variable history
  private callSeries = new Map<string, Value[]>(); // per call-site output history
  private exprSeries = new Map<Expr, Value[]>();   // history for misc [] bases
  private callState = new Map<string, any>();      // stateful builtin state
  private callPath: number[] = [];
  private functions = new Map<string, FunctionDecl>();

  // outputs
  private inputMetas = new Map<string, RiverInputMeta>();
  private plotDefs = new Map<string, RiverPlot>();
  private markers: RiverMarker[] = [];
  private barColors: RiverBarColor[] = [];
  private hlines = new Map<string, RiverHLine>();
  private alerts: RiverAlert[] = [];
  private warnings = new Set<string>();
  private meta = { title: "Imported Script", overlay: true, version: 5 };

  constructor(script: Script, candles: Candle[], opts: RunOptions = {}) {
    this.script = script;
    this.candles = candles;
    this.opts = opts;
    this.meta.version = script.version;
  }

  run(): RiverRunResult {
    // Register user functions up front so calls before the decl line work too.
    for (const s of this.script.statements) {
      if (s.kind === "FunctionDecl") this.functions.set(s.name, s);
    }

    for (this.bar = 0; this.bar < this.candles.length; this.bar++) {
      for (const stmt of this.script.statements) {
        try {
          this.execStmt(stmt);
        } catch (e) {
          if (e instanceof BreakSignal || e instanceof ContinueSignal) continue;
          throw e;
        }
      }
      // End-of-bar snapshot: this is what `x[1]` sees on the next bar.
      for (const [name, v] of this.globals.vars) {
        let arr = this.varSeries.get(name);
        if (!arr) { arr = []; this.varSeries.set(name, arr); }
        arr[this.bar] = v;
      }
    }

    return {
      meta: this.meta,
      inputs: [...this.inputMetas.values()],
      plots: [...this.plotDefs.values()],
      markers: this.markers,
      barColors: this.barColors,
      hlines: [...this.hlines.values()],
      alerts: this.alerts,
      warnings: [...this.warnings],
      barsProcessed: this.candles.length,
    };
  }

  // ---------------------------------------------------------------- statements

  /** Executes a statement; returns its value (Pine blocks yield their last value). */
  private execStmt(stmt: Stmt): Value {
    switch (stmt.kind) {
      case "VarDecl": {
        if (stmt.mode === "var" || stmt.mode === "varip") {
          // Global 'var': initialize once on the first bar, then persist.
          if (this.scopes.length === 0) {
            if (!this.varOnce.has(stmt.name)) {
              this.varOnce.add(stmt.name);
              const v = this.evalExpr(stmt.init);
              this.setVar(stmt.name, v, true);
              return v;
            }
            return this.lookupVar(stmt.name);
          }
          // 'var' inside a function/block: Pine keeps per-instantiation state.
          // The River approximates it as a plain declaration and says so.
          this.warnOnce("'var' inside a function body re-initializes on each call in The River (persistent local state isn't supported yet).");
        }
        const v = this.evalExpr(stmt.init);
        this.setVar(stmt.name, v, true);
        return v;
      }

      case "TupleDecl": {
        const v = this.evalExpr(stmt.init);
        if (!Array.isArray(v)) {
          throw new PineError(`Right side of [${stmt.names.join(", ")}] = ... did not produce a tuple`, stmt.line);
        }
        stmt.names.forEach((name, i) => this.setVar(name, norm(v[i]), true));
        return v;
      }

      case "Assign": {
        const rhs = this.evalExpr(stmt.value);
        if (stmt.op === ":=") {
          this.assignVar(stmt.name, rhs, stmt.line);
          return rhs;
        }
        const cur = asNumber(this.lookupVar(stmt.name));
        const r = asNumber(rhs);
        let out: Value = null;
        if (cur !== null && r !== null) {
          if (stmt.op === "+=") out = cur + r;
          else if (stmt.op === "-=") out = cur - r;
          else if (stmt.op === "*=") out = cur * r;
          else out = r === 0 ? null : cur / r;
        }
        this.assignVar(stmt.name, norm(out), stmt.line);
        return out;
      }

      case "ExprStmt":
        return this.evalExpr(stmt.expr);

      case "IfStmt":
        return this.execIf({ kind: "IfExpr", cond: stmt.cond, thenBranch: stmt.thenBranch, elseBranch: stmt.elseBranch, line: stmt.line });

      case "ForStmt": {
        const from = asNumber(this.evalExpr(stmt.from));
        const to = asNumber(this.evalExpr(stmt.to));
        const by = stmt.by ? asNumber(this.evalExpr(stmt.by)) : null;
        if (from === null || to === null) return null;
        const step = by !== null && by !== 0 ? by : (from <= to ? 1 : -1);
        let last: Value = null;
        this.pushScope();
        try {
          let guard = 0;
          for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
            if (++guard > 100000) { this.warn("for-loop exceeded 100000 iterations; stopped"); break; }
            this.scopes[this.scopes.length - 1].vars.set(stmt.varName, i);
            try {
              for (const s of stmt.body) last = this.execStmt(s);
            } catch (e) {
              if (e instanceof ContinueSignal) continue;
              if (e instanceof BreakSignal) break;
              throw e;
            }
          }
        } finally {
          this.popScope();
        }
        return last;
      }

      case "WhileStmt": {
        let last: Value = null;
        let guard = 0;
        this.pushScope();
        try {
          while (truthy(this.evalExpr(stmt.cond))) {
            if (++guard > 100000) { this.warn("while-loop exceeded 100000 iterations; stopped"); break; }
            try {
              for (const s of stmt.body) last = this.execStmt(s);
            } catch (e) {
              if (e instanceof ContinueSignal) continue;
              if (e instanceof BreakSignal) break;
              throw e;
            }
          }
        } finally {
          this.popScope();
        }
        return last;
      }

      case "FunctionDecl":
        this.functions.set(stmt.name, stmt);
        return null;

      case "BreakStmt": throw new BreakSignal();
      case "ContinueStmt": throw new ContinueSignal();
    }
  }

  private execIf(node: IfExpr): Value {
    if (truthy(this.evalExpr(node.cond))) {
      return this.execBlockScoped(node.thenBranch);
    }
    if (node.elseBranch) {
      if (Array.isArray(node.elseBranch)) return this.execBlockScoped(node.elseBranch);
      return this.execIf(node.elseBranch);
    }
    return null;
  }

  private execBlockScoped(stmts: Stmt[]): Value {
    this.pushScope();
    try {
      let last: Value = null;
      for (const s of stmts) last = this.execStmt(s);
      return last;
    } finally {
      this.popScope();
    }
  }

  // --------------------------------------------------------------- expressions

  private evalExpr(expr: Expr): Value {
    switch (expr.kind) {
      case "NumberLit": return expr.value;
      case "StringLit": return expr.value;
      case "BoolLit": return expr.value;
      case "ColorLit": return expr.value;
      case "NaLit": return null;

      case "Identifier": return this.lookupVar(expr.name, expr.line);

      case "MemberAccess": {
        if (expr.path in MEMBER_CONSTANTS) return MEMBER_CONSTANTS[expr.path];
        if (expr.path in COLOR_CONSTANTS) return COLOR_CONSTANTS[expr.path];
        const v = this.builtinSource(expr.path);
        if (v !== undefined) return v;
        throw new PineError(`Unknown name '${expr.path}'`, expr.line);
      }

      case "Call": return this.evalCall(expr);

      case "Unary": {
        const v = this.evalExpr(expr.operand);
        if (expr.op === "not") return !truthy(v);
        const n = asNumber(v);
        if (n === null) return null;
        return expr.op === "-" ? -n : n;
      }

      case "Binary": {
        const l = this.evalExpr(expr.left);
        const r = this.evalExpr(expr.right);
        return this.binaryOp(expr.op, l, r);
      }

      case "Logical": {
        // Pine evaluates both sides; na acts as false.
        const l = truthy(this.evalExpr(expr.left));
        if (expr.op === "and") return l && truthy(this.evalExpr(expr.right));
        return l || truthy(this.evalExpr(expr.right));
      }

      case "Ternary": {
        return truthy(this.evalExpr(expr.cond))
          ? this.evalExpr(expr.thenExpr)
          : this.evalExpr(expr.elseExpr);
      }

      case "HistoryRef": return this.evalHistory(expr);

      case "IfExpr": return this.execIf(expr);

      case "TupleExpr": return expr.elements.map(e => norm(this.evalExpr(e)));
    }
  }

  private binaryOp(op: string, l: Value, r: Value): Value {
    if (op === "==") {
      if (isNa(l) && isNa(r)) return true;
      if (isNa(l) || isNa(r)) return false;
      return l === r;
    }
    if (op === "!=") {
      if (isNa(l) && isNa(r)) return false;
      if (isNa(l) || isNa(r)) return true;
      return l !== r;
    }
    if (op === "+" && (typeof l === "string" || typeof r === "string")) {
      if (isNa(l) || isNa(r)) return null;
      return String(l) + String(r);
    }
    const a = asNumber(l);
    const b = asNumber(r);
    if (a === null || b === null) return null;
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? null : a / b;
      case "%": return b === 0 ? null : a % b;
      case "<": return a < b;
      case "<=": return a <= b;
      case ">": return a > b;
      case ">=": return a >= b;
    }
    return null;
  }

  // ------------------------------------------------------------------ history

  private evalHistory(expr: Extract<Expr, { kind: "HistoryRef" }>): Value {
    const off = asNumber(this.evalExpr(expr.offset));
    if (off === null || off < 0) return null;
    const offset = Math.round(off);
    const base = expr.base;

    // close[1], high[2] ... straight off the candle array
    if (base.kind === "Identifier" && this.isBuiltinSourceName(base.name)) {
      return this.builtinSourceAt(base.name, this.bar - offset);
    }

    // userVar[1] -> end-of-previous-bar snapshots
    if (base.kind === "Identifier") {
      if (offset === 0) return this.lookupVar(base.name, base.line);
      const arr = this.varSeries.get(base.name);
      const idx = this.bar - offset;
      if (!arr || idx < 0) return null;
      return norm(arr[idx] as Value);
    }

    // someCall(...)[1] -> per-call-site output history
    if (base.kind === "Call") {
      const v = this.evalCall(base); // records this bar's output
      if (offset === 0) return v;
      const key = this.siteKey(base.siteId);
      const arr = this.callSeries.get(key);
      const idx = this.bar - offset;
      if (!arr || idx < 0) return null;
      return norm(arr[idx] as Value);
    }

    // Anything else: record its value each bar under the AST node identity.
    const v = norm(this.evalExpr(base));
    let arr = this.exprSeries.get(base);
    if (!arr) { arr = []; this.exprSeries.set(base, arr); }
    arr[this.bar] = v;
    if (offset === 0) return v;
    const idx = this.bar - offset;
    if (idx < 0) return null;
    return norm(arr[idx] as Value);
  }

  // -------------------------------------------------------------------- calls

  private evalCall(call: Call): Value {
    let name = call.callee;
    if (name in V4_ALIASES) name = V4_ALIASES[name];

    // User-defined function?
    const fn = this.functions.get(name);
    if (fn) return this.callUserFunction(fn, call);

    const key = this.siteKey(call.siteId);
    const out = this.callBuiltin(name, call, key);
    const v = norm(out);

    // Record output history so `f(...)[]` works.
    if (!Array.isArray(v)) {
      let arr = this.callSeries.get(key);
      if (!arr) { arr = []; this.callSeries.set(key, arr); }
      arr[this.bar] = v;
    }
    return v;
  }

  private callUserFunction(fn: FunctionDecl, call: Call): Value {
    const args = call.args.map(a => this.evalExpr(a));
    this.callPath.push(call.siteId);
    this.pushScope();
    try {
      const scope = this.scopes[this.scopes.length - 1];
      fn.params.forEach((p, i) => scope.vars.set(p, norm(args[i] ?? null)));
      let last: Value = null;
      for (const s of fn.body) last = this.execStmt(s);
      return norm(last);
    } finally {
      this.popScope();
      this.callPath.pop();
    }
  }

  // ------------------------------------------------------- builtin dispatcher

  private arg(call: Call, index: number, name: string): Expr | undefined {
    const named = call.namedArgs.find(n => n.name === name);
    if (named) return named.value;
    return call.args[index];
  }

  private argVal(call: Call, index: number, name: string, fallback: Value = null): Value {
    const e = this.arg(call, index, name);
    if (!e) return fallback;
    return norm(this.evalExpr(e));
  }

  private argNum(call: Call, index: number, name: string, fallback: number | null = null): number | null {
    const v = this.argVal(call, index, name, fallback);
    return asNumber(v) ?? fallback;
  }

  private argStr(call: Call, index: number, name: string, fallback: string): string {
    const v = this.argVal(call, index, name, fallback);
    return typeof v === "string" ? v : fallback;
  }

  private callBuiltin(name: string, call: Call, key: string): Value {
    // ---------------- script metadata
    if (name === "indicator" || name === "strategy") {
      if (this.bar === 0) {
        const title = this.argStr(call, 0, "title", this.meta.title);
        const overlayVal = this.argVal(call, -1, "overlay", null);
        this.meta.title = title;
        if (overlayVal !== null) this.meta.overlay = truthy(overlayVal);
      }
      return null;
    }

    // ---------------- inputs
    if (name === "input" || name.startsWith("input.")) return this.builtinInput(name, call, key);

    // ---------------- na helpers
    if (name === "na") return isNa(this.argVal(call, 0, "x"));
    if (name === "nz") {
      const x = this.argVal(call, 0, "x");
      if (!isNa(x)) return x;
      const repl = this.argVal(call, 1, "replacement", 0);
      return isNa(repl) ? 0 : repl;
    }
    if (name === "fixnan") {
      const x = this.argVal(call, 0, "x");
      const st = this.state(key, () => ({ last: null as Value }));
      if (!isNa(x)) st.last = x;
      return st.last;
    }
    if (name === "iff") {
      return truthy(this.argVal(call, 0, "condition"))
        ? this.argVal(call, 1, "then")
        : this.argVal(call, 2, "_else");
    }

    // ---------------- math namespace
    if (name.startsWith("math.")) return this.builtinMath(name, call);

    // ---------------- ta namespace
    if (name.startsWith("ta.")) return this.builtinTa(name, call, key);

    // ---------------- colors
    if (name === "color.new") {
      const base = this.argVal(call, 0, "color");
      const transp = this.argNum(call, 1, "transp", 0) ?? 0;
      const hex = typeof base === "string" ? (COLOR_CONSTANTS[base] || base) : "#FFFFFF";
      if (hex.startsWith("#") && (hex.length === 7 || hex.length === 9)) {
        return hexToRgba(hex.slice(0, 7), 1 - transp / 100);
      }
      return hex;
    }
    if (name === "color.rgb") {
      const r = this.argNum(call, 0, "red", 0) ?? 0;
      const g = this.argNum(call, 1, "green", 0) ?? 0;
      const b = this.argNum(call, 2, "blue", 0) ?? 0;
      const t = this.argNum(call, 3, "transp", 0) ?? 0;
      return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${(1 - t / 100).toFixed(3)})`;
    }
    if (name === "color.from_gradient") {
      // Approximation: pick midpoint of the two colors by value ratio.
      const value = this.argNum(call, 0, "value", 0) ?? 0;
      const bottom = this.argNum(call, 1, "bottom_value", 0) ?? 0;
      const top = this.argNum(call, 2, "top_value", 1) ?? 1;
      const c1 = this.argVal(call, 3, "bottom_color");
      const c2 = this.argVal(call, 4, "top_color");
      return (top - bottom) === 0 || value < (bottom + top) / 2 ? c1 : c2;
    }

    // ---------------- display functions
    if (name === "plot") return this.builtinPlot(call, key);
    if (name === "plotshape") return this.builtinPlotShape(call, key);
    if (name === "plotchar") return this.builtinPlotChar(call, key);
    if (name === "plotarrow") return this.builtinPlotArrow(call);
    if (name === "barcolor") return this.builtinBarColor(call);
    if (name === "bgcolor") return null; // accepted; backgrounds not rendered yet
    if (name === "hline") {
      if (this.bar === 0) {
        const price = this.argNum(call, 0, "price", 0) ?? 0;
        const title = this.argStr(call, 1, "title", `hline ${this.hlines.size + 1}`);
        const colorV = this.argVal(call, 2, "color", "#787B86");
        this.hlines.set(key, { value: price, title, color: typeof colorV === "string" ? colorV : "#787B86" });
      }
      return null;
    }
    if (name === "alertcondition") {
      const cond = this.argVal(call, 0, "condition");
      if (truthy(cond)) {
        this.alerts.push({
          time: this.candles[this.bar].time,
          title: this.argStr(call, 1, "title", "Alert"),
          message: this.argStr(call, 2, "message", ""),
        });
      }
      return null;
    }

    // ---------------- strategy entries as chart markers
    if (name === "strategy.entry" || name === "strategy.order") {
      const id = this.argStr(call, 0, "id", "entry");
      const dir = this.argVal(call, 1, "direction");
      const isLong = dir === "long" || dir === true || asNumber(dir) === 1;
      this.markers.push({
        time: this.candles[this.bar].time,
        position: isLong ? "belowBar" : "aboveBar",
        shape: isLong ? "arrowUp" : "arrowDown",
        color: isLong ? "#089981" : "#F23645",
        text: id,
      });
      return null;
    }
    if (name === "strategy.close" || name === "strategy.close_all") {
      this.markers.push({
        time: this.candles[this.bar].time,
        position: "aboveBar", shape: "square", color: "#787B86",
        text: this.argStr(call, 0, "id", "close"),
      });
      return null;
    }

    // ---------------- strings
    if (name === "str.tostring") {
      const v = this.argVal(call, 0, "value");
      return isNa(v) ? "NaN" : String(v);
    }
    if (name === "str.format") return this.argStr(call, 0, "formatString", "");
    if (name === "str.length") { const s = this.argVal(call, 0, "string"); return typeof s === "string" ? s.length : null; }

    // ---------------- misc environment
    if (name === "timestamp") return this.candles[this.bar].time * 1000;
    if (name === "time") return this.candles[this.bar].time * 1000;

    // ---------------- explicit unsupported (honest failure)
    if (name.startsWith("request.") || name === "security") {
      throw new PineError(
        `'${name}' pulls data from another symbol/timeframe, which The River can't do yet. Remove it or replace it with the chart's own series.`,
        call.line
      );
    }

    // ---------------- tolerated no-ops
    if (NOOP_FUNCTIONS.has(name)) {
      this.warnOnce(`'${name}' is accepted but has no visual effect in The River yet.`);
      return null;
    }

    throw new PineError(`The River doesn't support the function '${name}' yet. It reports this honestly instead of guessing.`, call.line);
  }

  // ---------------------------------------------------------------- inputs

  private builtinInput(name: string, call: Call, key: string): Value {
    const defval = this.argVal(call, 0, "defval");
    const title = this.argStr(call, 1, "title", `Input ${this.inputMetas.size + 1}`);

    let type: RiverInputMeta["type"] = "float";
    if (name === "input.int") type = "int";
    else if (name === "input.bool") type = "bool";
    else if (name === "input.string") type = "string";
    else if (name === "input.source") type = "source";
    else if (name === "input.color") type = "color";
    else if (name === "input.timeframe" || name === "input.resolution") type = "timeframe";
    else if (name === "input") {
      if (typeof defval === "boolean") type = "bool";
      else if (typeof defval === "string") type = "string";
      else if (typeof defval === "number") type = Number.isInteger(defval) ? "int" : "float";
    }

    if (!this.inputMetas.has(key)) {
      const id = title;
      const override = this.opts.inputOverrides?.[id];
      this.inputMetas.set(key, {
        id, title, type, defval,
        value: override !== undefined ? override : defval,
      });
    }
    const meta = this.inputMetas.get(key)!;

    // input.source: the value flows through per bar (default arg already
    // evaluates to the current bar's value of that series).
    if (type === "source") return defval;
    return meta.value;
  }

  // ------------------------------------------------------------------ math.*

  private builtinMath(name: string, call: Call): Value {
    const nums = () => call.args.map(a => asNumber(this.evalExpr(a)));
    const one = (f: (x: number) => number): Value => {
      const x = this.argNum(call, 0, "number");
      return x === null ? null : norm(f(x));
    };

    switch (name) {
      case "math.abs": return one(Math.abs);
      case "math.sqrt": return one(Math.sqrt);
      case "math.floor": return one(Math.floor);
      case "math.ceil": return one(Math.ceil);
      case "math.exp": return one(Math.exp);
      case "math.log": return one(Math.log);
      case "math.log10": return one(Math.log10);
      case "math.sign": return one(Math.sign);
      case "math.sin": return one(Math.sin);
      case "math.cos": return one(Math.cos);
      case "math.tan": return one(Math.tan);
      case "math.asin": return one(Math.asin);
      case "math.acos": return one(Math.acos);
      case "math.atan": return one(Math.atan);
      case "math.round": {
        const x = this.argNum(call, 0, "number");
        const p = this.argNum(call, 1, "precision", 0) ?? 0;
        if (x === null) return null;
        const f = Math.pow(10, p);
        return Math.round(x * f) / f;
      }
      case "math.round_to_mintick": return this.argNum(call, 0, "number");
      case "math.pow": {
        const b = this.argNum(call, 0, "base");
        const e = this.argNum(call, 1, "exponent");
        return b === null || e === null ? null : norm(Math.pow(b, e));
      }
      // Pine semantics: na propagates through max/min/avg — any na argument
      // makes the result na (it is NOT ignored).
      case "math.max": {
        const vals = nums();
        if (!vals.length || vals.some(n => n === null)) return null;
        return Math.max(...(vals as number[]));
      }
      case "math.min": {
        const vals = nums();
        if (!vals.length || vals.some(n => n === null)) return null;
        return Math.min(...(vals as number[]));
      }
      case "math.avg": {
        const vals = nums();
        if (!vals.length || vals.some(n => n === null)) return null;
        return (vals as number[]).reduce((a, b) => a + b, 0) / vals.length;
      }
      case "math.sum": return this.builtinTa("ta.sum", call, `math.sum:${call.siteId}`);
    }
    throw new PineError(`The River doesn't support '${name}' yet.`, call.line);
  }

  // -------------------------------------------------------------------- ta.*

  /** Per-call-site mutable state store. */
  private state<T>(key: string, init: () => T): T {
    let st = this.callState.get(key);
    if (st === undefined) { st = init(); this.callState.set(key, st); }
    return st;
  }

  /** Rolling window helper — push a value, keep at most `len`. */
  private pushWindow(st: { buf: (number | null)[] }, v: number | null, len: number) {
    st.buf.push(v);
    if (st.buf.length > len) st.buf.shift();
  }

  private smaOf(buf: (number | null)[], len: number): number | null {
    if (buf.length < len) return null;
    let sum = 0;
    for (const v of buf) {
      if (v === null) return null;
      sum += v;
    }
    return sum / len;
  }

  private builtinTa(name: string, call: Call, key: string): Value {
    const candle = this.candles[this.bar];

    switch (name) {
      case "ta.sma": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        const st = this.state(key, () => ({ buf: [] as (number | null)[] }));
        this.pushWindow(st, src, len);
        return this.smaOf(st.buf, len);
      }

      case "ta.ema": return this.emaLike(call, key, (len) => 2 / (len + 1));
      case "ta.rma": return this.emaLike(call, key, (len) => 1 / len);

      case "ta.wma": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        const st = this.state(key, () => ({ buf: [] as (number | null)[] }));
        this.pushWindow(st, src, len);
        if (st.buf.length < len) return null;
        let num = 0, den = 0;
        for (let i = 0; i < len; i++) {
          const v = st.buf[i];
          if (v === null) return null;
          num += v * (i + 1);
          den += (i + 1);
        }
        return num / den;
      }

      case "ta.vwma": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        const vol = candle.volume ?? null;
        const st = this.state(key, () => ({ pv: [] as (number | null)[], v: [] as (number | null)[] }));
        st.pv.push(src !== null && vol !== null ? src * vol : null);
        st.v.push(vol);
        if (st.pv.length > len) { st.pv.shift(); st.v.shift(); }
        if (st.pv.length < len) return null;
        let spv = 0, sv = 0;
        for (let i = 0; i < len; i++) {
          if (st.pv[i] === null || st.v[i] === null) return null;
          spv += st.pv[i]!; sv += st.v[i]!;
        }
        return sv === 0 ? null : spv / sv;
      }

      case "ta.hma": {
        // HMA(n) = WMA(2*WMA(n/2) - WMA(n), sqrt(n)) — implemented inline.
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        const half = Math.max(1, Math.round(len / 2));
        const rt = Math.max(1, Math.round(Math.sqrt(len)));
        const st = this.state(key, () => ({ buf: [] as (number | null)[], diff: [] as (number | null)[] }));
        this.pushWindow(st as any, src, len);
        const wma = (buf: (number | null)[], n: number): number | null => {
          if (buf.length < n) return null;
          let num = 0, den = 0;
          const s = buf.slice(-n);
          for (let i = 0; i < n; i++) { if (s[i] === null) return null; num += s[i]! * (i + 1); den += i + 1; }
          return num / den;
        };
        const w1 = wma(st.buf, half);
        const w2 = wma(st.buf, len);
        st.diff.push(w1 !== null && w2 !== null ? 2 * w1 - w2 : null);
        if (st.diff.length > rt) st.diff.shift();
        return wma(st.diff, rt);
      }

      case "ta.tr": {
        const prev = this.candles[this.bar - 1];
        if (!prev) {
          const handleNa = this.argVal(call, 0, "handle_na", true);
          return truthy(handleNa) ? candle.high - candle.low : null;
        }
        return Math.max(
          candle.high - candle.low,
          Math.abs(candle.high - prev.close),
          Math.abs(candle.low - prev.close),
        );
      }

      case "ta.atr": {
        const len = Math.max(1, Math.round(this.argNum(call, 0, "length", 14) ?? 14));
        const prev = this.candles[this.bar - 1];
        const tr = prev
          ? Math.max(candle.high - candle.low, Math.abs(candle.high - prev.close), Math.abs(candle.low - prev.close))
          : candle.high - candle.low;
        return this.rmaStep(key, tr, len);
      }

      case "ta.rsi": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        const st = this.state(key, () => ({ prev: null as number | null, gainKey: key + ":g", lossKey: key + ":l" }));
        if (src === null) { st.prev = null; return null; }
        if (st.prev === null) { st.prev = src; return null; }
        const chg = src - st.prev;
        st.prev = src;
        const gain = this.rmaStep(st.gainKey, Math.max(chg, 0), len);
        const loss = this.rmaStep(st.lossKey, Math.max(-chg, 0), len);
        if (gain === null || loss === null) return null;
        if (loss === 0) return gain === 0 ? 50 : 100;
        return 100 - 100 / (1 + gain / loss);
      }

      case "ta.stdev":
      case "ta.variance": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        const st = this.state(key, () => ({ buf: [] as (number | null)[] }));
        this.pushWindow(st, src, len);
        if (st.buf.length < len) return null;
        let sum = 0;
        for (const v of st.buf) { if (v === null) return null; sum += v; }
        const mean = sum / len;
        let sq = 0;
        for (const v of st.buf) sq += (v! - mean) * (v! - mean);
        const variance = sq / len;
        return name === "ta.variance" ? variance : Math.sqrt(variance);
      }

      case "ta.highest":
      case "ta.lowest": {
        // Forms: (length) using high/low, or (source, length)
        let src: number | null;
        let len: number;
        if (call.args.length + call.namedArgs.length >= 2) {
          src = asNumber(this.argVal(call, 0, "source"));
          len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        } else {
          src = name === "ta.highest" ? candle.high : candle.low;
          len = Math.max(1, Math.round(this.argNum(call, 0, "length", 14) ?? 14));
        }
        const st = this.state(key, () => ({ buf: [] as (number | null)[] }));
        this.pushWindow(st, src, len);
        if (st.buf.length < len) return null;
        const vals = st.buf.filter((v): v is number => v !== null);
        if (!vals.length) return null;
        return name === "ta.highest" ? Math.max(...vals) : Math.min(...vals);
      }

      case "ta.change":
      case "ta.mom": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const n = Math.max(1, Math.round(this.argNum(call, 1, "length", 1) ?? 1));
        const st = this.state(key, () => ({ hist: [] as (number | null)[] }));
        st.hist.push(src);
        const idx = st.hist.length - 1 - n;
        if (idx < 0) return null;
        const past = st.hist[idx];
        if (src === null || past === null) return null;
        return src - past;
      }

      case "ta.roc": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const n = Math.max(1, Math.round(this.argNum(call, 1, "length", 1) ?? 1));
        const st = this.state(key, () => ({ hist: [] as (number | null)[] }));
        st.hist.push(src);
        const idx = st.hist.length - 1 - n;
        if (idx < 0) return null;
        const past = st.hist[idx];
        if (src === null || past === null || past === 0) return null;
        return 100 * (src - past) / past;
      }

      case "ta.cum": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const st = this.state(key, () => ({ sum: 0 }));
        if (src !== null) st.sum += src;
        return st.sum;
      }

      case "ta.sum": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
        const st = this.state(key, () => ({ buf: [] as (number | null)[] }));
        this.pushWindow(st, src, len);
        if (st.buf.length < len) return null;
        let sum = 0;
        for (const v of st.buf) { if (v === null) return null; sum += v; }
        return sum;
      }

      case "ta.crossover":
      case "ta.crossunder":
      case "ta.cross": {
        const a = asNumber(this.argVal(call, 0, "source1"));
        const b = asNumber(this.argVal(call, 1, "source2"));
        const st = this.state(key, () => ({ pa: null as number | null, pb: null as number | null }));
        const { pa, pb } = st;
        st.pa = a; st.pb = b;
        if (a === null || b === null || pa === null || pb === null) return false;
        const over = pa <= pb && a > b;
        const under = pa >= pb && a < b;
        if (name === "ta.crossover") return over;
        if (name === "ta.crossunder") return under;
        return over || under;
      }

      case "ta.macd": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const fast = Math.max(1, Math.round(this.argNum(call, 1, "fastlen", 12) ?? 12));
        const slow = Math.max(1, Math.round(this.argNum(call, 2, "slowlen", 26) ?? 26));
        const siglen = Math.max(1, Math.round(this.argNum(call, 3, "siglen", 9) ?? 9));
        const fastEma = this.emaStep(key + ":f", src, fast);
        const slowEma = this.emaStep(key + ":s", src, slow);
        const macd = fastEma !== null && slowEma !== null ? fastEma - slowEma : null;
        const signal = this.emaStep(key + ":sig", macd, siglen);
        const hist = macd !== null && signal !== null ? macd - signal : null;
        return [macd, signal, hist];
      }

      case "ta.bb": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 20) ?? 20));
        const mult = this.argNum(call, 2, "mult", 2) ?? 2;
        const st = this.state(key, () => ({ buf: [] as (number | null)[] }));
        this.pushWindow(st, src, len);
        const basis = this.smaOf(st.buf, len);
        if (basis === null) return [null, null, null];
        let sq = 0;
        for (const v of st.buf) sq += (v! - basis) * (v! - basis);
        const dev = mult * Math.sqrt(sq / len);
        return [basis, basis + dev, basis - dev];
      }

      case "ta.stoch": {
        const src = asNumber(this.argVal(call, 0, "source"));
        const hi = asNumber(this.argVal(call, 1, "high"));
        const lo = asNumber(this.argVal(call, 2, "low"));
        const len = Math.max(1, Math.round(this.argNum(call, 3, "length", 14) ?? 14));
        const st = this.state(key, () => ({ his: [] as (number | null)[], los: [] as (number | null)[] }));
        st.his.push(hi); st.los.push(lo);
        if (st.his.length > len) { st.his.shift(); st.los.shift(); }
        if (st.his.length < len || src === null) return null;
        const hv = st.his.filter((v): v is number => v !== null);
        const lv = st.los.filter((v): v is number => v !== null);
        if (!hv.length || !lv.length) return null;
        const hh = Math.max(...hv), ll = Math.min(...lv);
        return hh === ll ? null : 100 * (src - ll) / (hh - ll);
      }

      case "ta.vwap": {
        const src = asNumber(this.argVal(call, 0, "source")) ?? (candle.high + candle.low + candle.close) / 3;
        const vol = candle.volume;
        if (vol === undefined || vol === null) {
          this.warnOnce("ta.vwap needs volume data; this feed has none, so vwap returns na.");
          return null;
        }
        const st = this.state(key, () => ({ pv: 0, v: 0 }));
        st.pv += src * vol;
        st.v += vol;
        return st.v === 0 ? null : st.pv / st.v;
      }

      case "ta.barssince": {
        const cond = this.argVal(call, 0, "condition");
        const st = this.state(key, () => ({ since: null as number | null }));
        if (truthy(cond)) st.since = 0;
        else if (st.since !== null) st.since++;
        return st.since;
      }

      case "ta.valuewhen": {
        const cond = this.argVal(call, 0, "condition");
        const src = this.argVal(call, 1, "source");
        const occ = Math.max(0, Math.round(this.argNum(call, 2, "occurrence", 0) ?? 0));
        const st = this.state(key, () => ({ values: [] as Value[] }));
        if (truthy(cond)) st.values.unshift(src);
        return norm(st.values[occ] ?? null);
      }

      case "ta.pivothigh":
      case "ta.pivotlow": {
        // Forms: (left, right) on high/low, or (source, left, right)
        const argc = call.args.length + call.namedArgs.length;
        let srcNow: number | null;
        let left: number, right: number;
        const isHigh = name === "ta.pivothigh";
        if (argc >= 3) {
          srcNow = asNumber(this.argVal(call, 0, "source"));
          left = Math.max(1, Math.round(this.argNum(call, 1, "leftbars", 5) ?? 5));
          right = Math.max(1, Math.round(this.argNum(call, 2, "rightbars", 5) ?? 5));
        } else {
          srcNow = isHigh ? candle.high : candle.low;
          left = Math.max(1, Math.round(this.argNum(call, 0, "leftbars", 5) ?? 5));
          right = Math.max(1, Math.round(this.argNum(call, 1, "rightbars", 5) ?? 5));
        }
        const st = this.state(key, () => ({ hist: [] as (number | null)[] }));
        st.hist.push(srcNow);
        const centerIdx = st.hist.length - 1 - right;
        if (centerIdx < left) return null;
        const center = st.hist[centerIdx];
        if (center === null) return null;
        for (let i = centerIdx - left; i < st.hist.length; i++) {
          if (i === centerIdx) continue;
          const v = st.hist[i];
          if (v === null) return null;
          if (isHigh ? v >= center : v <= center) return null;
        }
        return center;
      }

      case "ta.supertrend": {
        const factor = this.argNum(call, 0, "factor", 3) ?? 3;
        const atrLen = Math.max(1, Math.round(this.argNum(call, 1, "atrPeriod", 10) ?? 10));
        const prev = this.candles[this.bar - 1];
        const tr = prev
          ? Math.max(candle.high - candle.low, Math.abs(candle.high - prev.close), Math.abs(candle.low - prev.close))
          : candle.high - candle.low;
        const atr = this.rmaStep(key + ":atr", tr, atrLen);
        const st = this.state(key, () => ({ upper: null as number | null, lower: null as number | null, dir: 1, prevClose: null as number | null, st: null as number | null }));
        if (atr === null) { st.prevClose = candle.close; return [null, null]; }
        const hl2 = (candle.high + candle.low) / 2;
        let upper = hl2 + factor * atr;
        let lower = hl2 - factor * atr;
        if (st.lower !== null && st.prevClose !== null && (lower <= st.lower && st.prevClose >= st.lower)) lower = Math.max(lower, st.lower);
        if (st.upper !== null && st.prevClose !== null && (upper >= st.upper && st.prevClose <= st.upper)) upper = Math.min(upper, st.upper);
        let dir: number;
        if (st.st === null) dir = 1;
        else if (st.st === st.upper) dir = candle.close > upper ? -1 : 1;
        else dir = candle.close < lower ? 1 : -1;
        const stVal = dir === -1 ? lower : upper;
        st.upper = upper; st.lower = lower; st.dir = dir; st.prevClose = candle.close; st.st = stVal;
        return [stVal, dir];
      }

      case "ta.highestbars":
      case "ta.lowestbars": {
        const len = Math.max(1, Math.round(this.argNum(call, 0, "length", 14) ?? 14));
        const st = this.state(key, () => ({ buf: [] as (number | null)[] }));
        const src = name === "ta.highestbars" ? candle.high : candle.low;
        this.pushWindow(st, src, len);
        if (st.buf.length < len) return null;
        let bestIdx = 0;
        for (let i = 1; i < st.buf.length; i++) {
          const v = st.buf[i], b = st.buf[bestIdx];
          if (v === null || b === null) continue;
          if (name === "ta.highestbars" ? v >= b : v <= b) bestIdx = i;
        }
        return bestIdx - (st.buf.length - 1); // offset (0 or negative), like Pine
      }
    }

    throw new PineError(`The River doesn't support '${name}' yet. It reports this honestly instead of guessing.`, call.line);
  }

  /** ta.ema / ta.rma with Pine's SMA warm-up seed. */
  private emaLike(call: Call, key: string, alphaOf: (len: number) => number): Value {
    const src = asNumber(this.argVal(call, 0, "source"));
    const len = Math.max(1, Math.round(this.argNum(call, 1, "length", 14) ?? 14));
    return this.recursiveAvgStep(key, src, len, alphaOf(len));
  }

  private emaStep(key: string, src: number | null, len: number): number | null {
    return this.recursiveAvgStep(key, src, len, 2 / (len + 1));
  }

  private rmaStep(key: string, src: number | null, len: number): number | null {
    return this.recursiveAvgStep(key, src, len, 1 / len);
  }

  private recursiveAvgStep(key: string, src: number | null, len: number, alpha: number): number | null {
    const st = this.state(key, () => ({ seedBuf: [] as number[], value: null as number | null }));
    if (src === null) return st.value;
    if (st.value === null) {
      st.seedBuf.push(src);
      if (st.seedBuf.length < len) return null;
      st.value = st.seedBuf.reduce((a, b) => a + b, 0) / len;
      return st.value;
    }
    st.value = alpha * src + (1 - alpha) * st.value;
    return st.value;
  }

  // ------------------------------------------------------------ plot builtins

  private resolveColor(v: Value, fallback: string): string {
    if (typeof v === "string") {
      if (v in COLOR_CONSTANTS) return COLOR_CONSTANTS[v];
      return v;
    }
    return fallback;
  }

  private builtinPlot(call: Call, key: string): Value {
    const series = asNumber(this.argVal(call, 0, "series"));
    const title = this.argStr(call, 1, "title", `Plot ${this.plotDefs.size + 1}`);
    const colorV = this.argVal(call, 2, "color", null);
    const lineWidth = this.argNum(call, 3, "linewidth", 2) ?? 2;
    const styleV = this.argVal(call, 4, "style", "line");

    let def = this.plotDefs.get(key);
    if (!def) {
      def = {
        id: key, title,
        color: this.resolveColor(colorV, "#00D9FF"),
        lineWidth: Math.max(1, Math.min(4, Math.round(lineWidth))),
        style: typeof styleV === "string" ? styleV : "line",
        points: [],
      };
      this.plotDefs.set(key, def);
    }
    // Series colors: adopt the latest non-na color so conditional colors show.
    if (!isNa(colorV)) def.color = this.resolveColor(colorV, def.color);
    def.points.push({ time: this.candles[this.bar].time, value: series });
    return null;
  }

  private shapeToMarker(style: string): RiverMarker["shape"] {
    if (["triangleup", "arrowup", "labelup"].includes(style)) return "arrowUp";
    if (["triangledown", "arrowdown", "labeldown"].includes(style)) return "arrowDown";
    if (["square", "diamond", "flag"].includes(style)) return "square";
    return "circle";
  }

  private builtinPlotShape(call: Call, key: string): Value {
    const cond = this.argVal(call, 0, "series");
    if (!truthy(cond)) return null;
    const title = this.argStr(call, 1, "title", "");
    const style = this.argStr(call, 2, "style", "circle");
    const location = this.argStr(call, 3, "location", "abovebar");
    const colorV = this.argVal(call, 4, "color", null);
    const text = this.argStr(call, 6, "text", title);

    const position: RiverMarker["position"] =
      location === "belowbar" ? "belowBar" : location === "absolute" ? "inBar" : "aboveBar";

    this.markers.push({
      time: this.candles[this.bar].time,
      position,
      shape: this.shapeToMarker(style),
      color: this.resolveColor(colorV, position === "belowBar" ? "#089981" : "#F23645"),
      text,
    });
    return null;
  }

  private builtinPlotChar(call: Call, key: string): Value {
    const cond = this.argVal(call, 0, "series");
    if (!truthy(cond)) return null;
    const title = this.argStr(call, 1, "title", "");
    const char = this.argStr(call, 2, "char", "•");
    const location = this.argStr(call, 3, "location", "abovebar");
    const colorV = this.argVal(call, 4, "color", null);
    const position: RiverMarker["position"] =
      location === "belowbar" ? "belowBar" : location === "absolute" ? "inBar" : "aboveBar";
    this.markers.push({
      time: this.candles[this.bar].time,
      position,
      shape: "circle",
      color: this.resolveColor(colorV, "#00D9FF"),
      text: char || title,
    });
    return null;
  }

  private builtinPlotArrow(call: Call): Value {
    const v = asNumber(this.argVal(call, 0, "series"));
    if (v === null || v === 0) return null;
    this.markers.push({
      time: this.candles[this.bar].time,
      position: v > 0 ? "belowBar" : "aboveBar",
      shape: v > 0 ? "arrowUp" : "arrowDown",
      color: v > 0 ? "#089981" : "#F23645",
      text: "",
    });
    return null;
  }

  private builtinBarColor(call: Call): Value {
    const colorV = this.argVal(call, 0, "color");
    if (isNa(colorV)) return null;
    this.barColors.push({
      time: this.candles[this.bar].time,
      color: this.resolveColor(colorV, "#FFD700"),
    });
    return null;
  }

  // ------------------------------------------------------------------- scopes

  private pushScope() { this.scopes.push({ vars: new Map() }); }
  private popScope() { this.scopes.pop(); }

  private lookupVar(name: string, line = 0): Value {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].vars.has(name)) return this.scopes[i].vars.get(name)!;
    }
    if (this.globals.vars.has(name)) return this.globals.vars.get(name)!;
    const src = this.builtinSource(name);
    if (src !== undefined) return src;
    throw new PineError(`Unknown variable '${name}'`, line);
  }

  private setVar(name: string, v: Value, declare: boolean) {
    if (this.scopes.length > 0) {
      this.scopes[this.scopes.length - 1].vars.set(name, norm(v));
      return;
    }
    this.globals.vars.set(name, norm(v));
  }

  private assignVar(name: string, v: Value, line: number) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].vars.has(name)) { this.scopes[i].vars.set(name, norm(v)); return; }
    }
    if (this.globals.vars.has(name)) { this.globals.vars.set(name, norm(v)); return; }
    throw new PineError(`Cannot ':=' assign to undeclared variable '${name}'`, line);
  }

  // ---------------------------------------------------------- builtin sources

  private isBuiltinSourceName(name: string): boolean {
    return ["open", "high", "low", "close", "volume", "hl2", "hlc3", "ohlc4", "hlcc4", "time", "bar_index"].includes(name);
  }

  private builtinSourceAt(name: string, barIdx: number): Value {
    if (barIdx < 0 || barIdx >= this.candles.length) return null;
    const c = this.candles[barIdx];
    switch (name) {
      case "open": return c.open;
      case "high": return c.high;
      case "low": return c.low;
      case "close": return c.close;
      case "volume": return c.volume ?? null;
      case "hl2": return (c.high + c.low) / 2;
      case "hlc3": return (c.high + c.low + c.close) / 3;
      case "ohlc4": return (c.open + c.high + c.low + c.close) / 4;
      case "hlcc4": return (c.high + c.low + c.close + c.close) / 4;
      case "time": return c.time * 1000;
      case "bar_index": return barIdx;
    }
    return null;
  }

  /** Returns undefined when the name is not a known builtin. */
  private builtinSource(name: string): Value | undefined {
    if (this.isBuiltinSourceName(name)) return this.builtinSourceAt(name, this.bar);
    switch (name) {
      case "na": return null;
      case "last_bar_index": return this.candles.length - 1;
      case "syminfo.ticker":
      case "syminfo.tickerid": return this.opts.symbol || "UNKNOWN";
      case "syminfo.mintick": return 0.01;
      case "timeframe.period": return this.opts.timeframe || "60";
      case "timeframe.isdaily": return (this.opts.timeframe || "").toLowerCase().includes("d");
      case "timeframe.isintraday": return !(this.opts.timeframe || "1h").toLowerCase().includes("d");
      case "barstate.isconfirmed": return true;
      case "barstate.isfirst": return this.bar === 0;
      case "barstate.islast": return this.bar === this.candles.length - 1;
      case "barstate.isrealtime": return false;
      case "barstate.ishistory": return true;
      case "strategy.position_size": return 0;
      case "strategy.position_avg_price": return null;
      case "dayofweek": return new Date(this.candles[this.bar].time * 1000).getUTCDay() + 1;
      case "hour": return new Date(this.candles[this.bar].time * 1000).getUTCHours();
      case "minute": return new Date(this.candles[this.bar].time * 1000).getUTCMinutes();
      case "year": return new Date(this.candles[this.bar].time * 1000).getUTCFullYear();
      case "month": return new Date(this.candles[this.bar].time * 1000).getUTCMonth() + 1;
    }
    if (name in COLOR_CONSTANTS) return COLOR_CONSTANTS[name];
    return undefined;
  }

  // ---------------------------------------------------------------- warnings

  private siteKey(siteId: number): string {
    return this.callPath.length ? `${this.callPath.join("/")}#${siteId}` : String(siteId);
  }

  private warn(msg: string) { this.warnings.add(msg); }
  private warnOnce(msg: string) { this.warnings.add(msg); }
}
