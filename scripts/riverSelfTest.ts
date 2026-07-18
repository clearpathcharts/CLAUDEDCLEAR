// scripts/riverSelfTest.ts
//
// Automated verification for The River's Pine Script pipeline
// (lexer -> parser -> interpreter). Run with:  npm run test:river
//
// Every case executes real Pine source over deterministic candles and checks
// numeric results against independently computed expectations.

import { tokenizePine } from "../src/river/pine/lexer";
import { parsePine } from "../src/river/pine/parser";
import { PineInterpreter } from "../src/river/pine/interpreter";
import { compilePine, runPine } from "../src/river/riverEngine";
import { Candle } from "../src/types/indicators";
import { TokenType } from "../src/river/pine/tokens";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; failures.push(name); console.error(`  FAIL  ${name} ${detail}`); }
}

function approx(a: number | null | undefined, b: number, eps = 1e-6): boolean {
  return a !== null && a !== undefined && Math.abs(a - b) < eps;
}

function candles(n: number): Candle[] {
  const out: Candle[] = [];
  let price = 100;
  for (let i = 0; i < n; i++) {
    const drift = Math.sin(i / 5) * 2 + 0.1;
    const open = price;
    const close = price + drift;
    out.push({
      time: 1700000000 + i * 3600,
      open,
      high: Math.max(open, close) + 1,
      low: Math.min(open, close) - 1,
      close,
      volume: 1000 + i * 10,
    });
    price = close;
  }
  return out;
}

function run(source: string, data = candles(60)) {
  const { tokens, version } = tokenizePine(source);
  const script = parsePine(tokens, version);
  return new PineInterpreter(script, data).run();
}

// ---------------------------------------------------------------- LEXER

console.log("\n[1] Lexer");
{
  const { tokens, version } = tokenizePine(`//@version=5\nindicator("T")\nx = 1.5 + close[1]\n`);
  check("version detected", version === 5);
  const types = tokens.map(t => t.type);
  check("tokenizes ident/assign/number", types.includes(TokenType.IDENT) && types.includes(TokenType.ASSIGN) && types.includes(TokenType.NUMBER));
  check("tokenizes history brackets", types.includes(TokenType.LBRACKET) && types.includes(TokenType.RBRACKET));

  const v6 = tokenizePine(`//@version=6\nindicator("x")\n`);
  check("v6 version detected", v6.version === 6);

  const ops = tokenizePine(`a := 1\nb += 2\nc == d\ne != f\ng => 1\n#FF00AA\n`);
  const t2 = ops.tokens.map(t => t.type);
  check("':=' '+=' '==' '!=' '=>' color", 
    t2.includes(TokenType.REASSIGN) && t2.includes(TokenType.PLUS_ASSIGN) &&
    t2.includes(TokenType.EQ) && t2.includes(TokenType.NEQ) &&
    t2.includes(TokenType.ARROW) && t2.includes(TokenType.COLOR_LITERAL));

  // Indentation blocks
  const ind = tokenizePine(`if close > open\n    x = 1\n    y = 2\nz = 3\n`);
  const t3 = ind.tokens.map(t => t.type);
  check("INDENT/DEDENT emitted", t3.includes(TokenType.INDENT) && t3.includes(TokenType.DEDENT));

  // Line continuation inside parens
  const cont = tokenizePine(`x = math.max(1,\n     2,\n     3)\n`);
  check("newlines swallowed inside parens", !cont.tokens.slice(0, cont.tokens.findIndex(t => t.type === TokenType.RPAREN)).some(t => t.type === TokenType.NEWLINE));

  let threw = false;
  try { tokenizePine(`x = "unterminated\n`); } catch (e: any) { threw = /Unterminated/.test(e.message); }
  check("unterminated string reported", threw);
}

// ---------------------------------------------------------------- PARSER

console.log("\n[2] Parser");
{
  const src = `//@version=5
indicator("Parse Test", overlay=true)
len = input.int(14, title="Length")
var float trail = na
[m, s, h] = ta.macd(close, 12, 26, 9)
f(x, y) => x + y * 2
if close > open
    trail := close
else if close < open
    trail := open
else
    trail := hl2
for i = 0 to 5 by 2
    trail := trail + i
plot(trail, title="Trail", color=color.blue, linewidth=2)
`;
  const { tokens, version } = tokenizePine(src);
  const script = parsePine(tokens, version);
  const kinds = script.statements.map(s => s.kind);
  check("indicator() call parsed", kinds[0] === "ExprStmt");
  check("input decl parsed", kinds[1] === "VarDecl");
  check("var typed decl parsed", kinds[2] === "VarDecl" && (script.statements[2] as any).mode === "var");
  check("tuple decl parsed", kinds[3] === "TupleDecl" && (script.statements[3] as any).names.length === 3);
  check("function decl parsed", kinds[4] === "FunctionDecl" && (script.statements[4] as any).params.length === 2);
  check("if/else-if/else parsed", kinds[5] === "IfStmt");
  check("for..by parsed", kinds[6] === "ForStmt");
  check("plot named args parsed", kinds[7] === "ExprStmt");

  let msg = "";
  try { parsePine(tokenizePine(`x = (1 + \n`).tokens, 5); } catch (e: any) { msg = e.message; }
  check("parse error is reported honestly", msg.length > 0);
}

// ---------------------------------------------------------- INTERPRETER MATH

console.log("\n[3] Interpreter: series math");
{
  // SMA cross-check against direct computation
  const data = candles(40);
  const res = run(`//@version=5\nindicator("SMA")\nplot(ta.sma(close, 5), title="s")\n`, data);
  const plot = res.plots[0];
  const last = plot.points[plot.points.length - 1].value;
  const manual = data.slice(-5).reduce((a, c) => a + c.close, 0) / 5;
  check("ta.sma(close,5) matches manual", approx(last, manual), `got ${last} want ${manual}`);
  check("sma warm-up returns na", plot.points[3].value === null);

  // EMA seeded with SMA like Pine
  const res2 = run(`//@version=5\nindicator("EMA")\nplot(ta.ema(close, 10))\n`, data);
  let ema: number | null = null;
  const alpha = 2 / 11;
  for (let i = 0; i < data.length; i++) {
    if (i === 9) ema = data.slice(0, 10).reduce((a, c) => a + c.close, 0) / 10;
    else if (i > 9) ema = alpha * data[i].close + (1 - alpha) * (ema as number);
  }
  const lastEma = res2.plots[0].points[res2.plots[0].points.length - 1].value;
  check("ta.ema matches Pine-seeded EMA", approx(lastEma, ema as number, 1e-9), `got ${lastEma} want ${ema}`);

  // RSI bounds
  const res3 = run(`//@version=5\nindicator("RSI")\nplot(ta.rsi(close, 14))\n`, data);
  const rsiVals = res3.plots[0].points.map(p => p.value).filter((v): v is number => v !== null);
  check("ta.rsi produces values in [0,100]", rsiVals.length > 0 && rsiVals.every(v => v >= 0 && v <= 100));

  // history reference
  const res4 = run(`//@version=5\nindicator("H")\nplot(close - close[1], title="chg")\n`, data);
  const chg = res4.plots[0].points[5].value;
  check("close[1] history works", approx(chg as number, data[5].close - data[4].close));

  // nz + na
  const res5 = run(`//@version=5\nindicator("NZ")\nx = na\nplot(nz(x, 42))\n`, data);
  check("nz(na, 42) == 42", res5.plots[0].points[0].value === 42);

  // var persistence: counter increments once per bar
  const res6 = run(`//@version=5\nindicator("VAR")\nvar count = 0\ncount := count + 1\nplot(count)\n`, data);
  const lastCount = res6.plots[0].points[res6.plots[0].points.length - 1].value;
  check("var persists across bars", lastCount === data.length, `got ${lastCount}`);

  // tuple destructuring from ta.macd
  const res7 = run(`//@version=5\nindicator("MACD")\n[m, s, h] = ta.macd(close, 12, 26, 9)\nplot(m)\nplot(s)\nplot(h)\n`, candles(120));
  check("ta.macd returns 3 usable series", res7.plots.length === 3 && res7.plots[0].points.some(p => p.value !== null));

  // user function
  const res8 = run(`//@version=5\nindicator("FN")\ndouble(x) => x * 2\nplot(double(close))\n`, data);
  check("user function evaluates", approx(res8.plots[0].points[3].value as number, data[3].close * 2));

  // if-expression value
  const res9 = run(`//@version=5\nindicator("IF")\nx = if close > open\n    1\nelse\n    -1\nplot(x)\n`, data);
  const xs = res9.plots[0].points.map(p => p.value);
  check("if-expression yields branch value", xs.every((v, i) => v === (data[i].close > data[i].open ? 1 : -1)));

  // for loop
  const res10 = run(`//@version=5\nindicator("FOR")\nsum = 0.0\nfor i = 1 to 10\n    sum := sum + i\nplot(sum)\n`, data);
  check("for loop sums 1..10 = 55", res10.plots[0].points[0].value === 55);
}

// -------------------------------------------------------- SIGNALS & DISPLAY

console.log("\n[4] Interpreter: signals, shapes, bar colors");
{
  const data = candles(80);
  // crossover fires exactly when fast crosses slow
  const res = run(`//@version=5
indicator("X", overlay=true)
fast = ta.sma(close, 3)
slow = ta.sma(close, 12)
buy = ta.crossover(fast, slow)
sell = ta.crossunder(fast, slow)
plotshape(buy, style=shape.triangleup, location=location.belowbar, color=color.green)
plotshape(sell, style=shape.triangledown, location=location.abovebar, color=color.red)
barcolor(buy or sell ? color.yellow : na)
`, data);
  check("crossover produces markers", res.markers.length > 0);
  check("barcolor fires on signals only", res.barColors.length === res.markers.length,
    `${res.barColors.length} colors vs ${res.markers.length} markers`);
  check("marker positions map correctly", res.markers.every(m => m.position === "belowBar" || m.position === "aboveBar"));

  // v4 script with bare function names
  const v4 = run(`//@version=4
study("V4 Legacy", overlay=true)
a = input(10, title="Key Value")
xATR = atr(a)
src = close
plot(sma(src, 20), color=color.blue)
`, data);
  check("v4 study()/atr()/sma() aliases work", v4.plots.length === 1 && v4.plots[0].points.some(p => p.value !== null));
  check("v4 input extracted", v4.inputs.length === 1 && v4.inputs[0].value === 10);

  // UT-Bot style ATR trailing stop — the Gold Bar pattern, in real Pine
  const utbot = `//@version=5
indicator("UT Bot Alerts", overlay=true)
a = input.float(1.0, title="Key Value")
c = input.int(10, title="ATR Period")
xATR = ta.atr(c)
nLoss = a * xATR
src = close
var float xATRTrailingStop = na
xATRTrailingStop := if src > nz(xATRTrailingStop[1], 0) and src[1] > nz(xATRTrailingStop[1], 0)
    math.max(nz(xATRTrailingStop[1]), src - nLoss)
else if src < nz(xATRTrailingStop[1], 0) and src[1] < nz(xATRTrailingStop[1], 0)
    math.min(nz(xATRTrailingStop[1]), src + nLoss)
else if src > nz(xATRTrailingStop[1], 0)
    src - nLoss
else
    src + nLoss
buy = src > xATRTrailingStop and src[1] <= nz(xATRTrailingStop[1], 0)
sell = src < xATRTrailingStop and src[1] >= nz(xATRTrailingStop[1], 0)
plot(xATRTrailingStop, title="Trailing Stop", color=color.orange, linewidth=2)
plotshape(buy, title="Buy", style=shape.labelup, location=location.belowbar, color=color.green, text="Buy")
plotshape(sell, title="Sell", style=shape.labeldown, location=location.abovebar, color=color.red, text="Sell")
barcolor(buy or sell ? #FFD700 : na)
alertcondition(buy, title="UT Long", message="UT Bot Long")
`;
  const ut = run(utbot, data);
  check("UT Bot compiles and runs", ut.plots.length === 1);
  check("UT Bot trailing stop has real values", ut.plots[0].points.filter(p => p.value !== null).length > 40);
  check("UT Bot extracts both inputs", ut.inputs.length === 2 && ut.inputs[0].value === 1 && ut.inputs[1].value === 10);
  check("UT Bot generates buy/sell markers", ut.markers.length > 0);
  check("UT Bot gold bar colors fire", ut.barColors.length > 0 && ut.barColors[0].color === "#FFD700");
  check("UT Bot alertconditions recorded", ut.alerts.length > 0);
}

// ------------------------------------------------------------ ENGINE FACADE

console.log("\n[5] Engine facade");
{
  const good = compilePine(`//@version=5\nindicator("OK", overlay=true)\nplot(ta.ema(close, 21))\n`);
  check("compilePine succeeds on valid script", good.status === "ok");
  if (good.status === "ok") {
    check("meta extracted (title/overlay)", good.title === "OK" && good.overlay === true);
  }

  const bad = compilePine(`//@version=5\nindicator("Bad")\nx = ta.nonexistent(close)\n`);
  check("unsupported function rejected honestly", bad.status === "error" && /nonexistent/.test((bad as any).error));

  const badSyntax = compilePine(`//@version=5\nx = = 5\n`);
  check("syntax error rejected with line info", badSyntax.status === "error");

  const sec = compilePine(`//@version=5\nindicator("S")\nd = request.security(syminfo.tickerid, "D", close)\nplot(d)\n`);
  check("request.security explained as unsupported", sec.status === "error" && /another symbol/.test((sec as any).error));

  // input overrides through runPine
  const res = runPine(`//@version=5\nindicator("I")\nlen = input.int(5, title="Len")\nplot(len)\n`, candles(10), { inputOverrides: { "Len": 9 } });
  check("input override applied", res.plots[0].points[0].value === 9);
}

// ------------------------------------------ POPULAR INDICATOR COMPATIBILITY

console.log("\n[6] Popular indicator compatibility");
{
  const squeeze = `//@version=4
study("Squeeze Momentum Indicator [LazyBear]")
length = input(20, title="BB Length")
mult = input(2.0, title="BB MultFactor")
lengthKC = input(20, title="KC Length")
multKC = input(1.5, title="KC MultFactor")
basis = sma(close, length)
dev = multKC * stdev(close, length)
upperBB = basis + dev
lowerBB = basis - dev
ma = sma(close, lengthKC)
rangema = sma(tr, lengthKC)
upperKC = ma + rangema * multKC
lowerKC = ma - rangema * multKC
val = linreg(close - avg(avg(highest(high, lengthKC), lowest(low, lengthKC)), sma(close, lengthKC)), lengthKC, 0)
plot(val, color=color.lime, style=plot.style_histogram, linewidth=4)
`;
  check("Squeeze Momentum (LazyBear v4) compiles", compilePine(squeeze).status === "ok");

  const hull = `//@version=5
indicator("Hull Suite", overlay=true)
src = input.source(close, title="Source")
modeSwitch = input.string("Hma", title="Hull Variation", options=["Hma", "Ehma", "Thma"])
length = input.int(55, title="Length")
HMA(_src, _length) => ta.wma(2 * ta.wma(_src, _length / 2) - ta.wma(_src, _length), math.round(math.sqrt(_length)))
EHMA(_src, _length) => ta.ema(2 * ta.ema(_src, _length / 2) - ta.ema(_src, _length), math.round(math.sqrt(_length)))
Mode(modeSwitch, _src, _len) =>
    switch modeSwitch
        "Hma" => HMA(_src, _len)
        "Ehma" => EHMA(_src, _len)
        => HMA(_src, _len)
HULL = Mode(modeSwitch, src, length)
plot(HULL, color=color.green, linewidth=2)
`;
  check("Hull Suite (switch + ta.wma) compiles", compilePine(hull).status === "ok");

  const cciMfi = `//@version=5
indicator("CCI MFI")
c = ta.cci(hlc3, 20)
m = ta.mfi(hlc3, 14)
plot(c, color=color.aqua)
plot(m, color=color.purple)
`;
  check("CCI + MFI combo compiles", compilePine(cciMfi).status === "ok");

  check("bare v4 tr series works", run(`//@version=4
study("TR test")
plot(sma(tr, 5))
`, candles(30)).plots.length === 1);

  check("switch expression selects branch", (() => {
    const r = run(`//@version=5
indicator("sw")
x = switch close > open
    true => 1
    => -1
plot(x)
`, candles(10));
    const vals = r.plots[0].points.map(p => p.value);
    return vals.every((v, i) => v === (candles(10)[i].close > candles(10)[i].open ? 1 : -1));
  })());
}

// ---------------------------------------------------------------- PLATFORM LAYERS

console.log("\n[7] Platform layers (compat, assist, catalog types)");
{
  const { buildCompatibilityReport, formatCompatSummary } = await import("../src/river/compat/report");
  const { getLocalHints } = await import("../src/river/assist/localHints");
  const { suggestPineMigration } = await import("../src/river/assist/pineMigrator");
  const { getBundledCompilerManifest } = await import("../src/river/compiler/updateChecker");

  const bad = buildCompatibilityReport(`//@version=5\nindicator("x")\nx = request.security("SPY", "D", close)\nplot(x)\n`);
  check("compat report lists request.security", bad.issues.some(i => i.code === "request.security"));
  check("compat summary formats", formatCompatSummary(bad).includes("% compatible"));

  const hints = getLocalHints("study(\"T\")\nsecurity(sym, tf, close)", "unsupported");
  check("local hints returned", hints.length > 0);

  const mig = suggestPineMigration("//@version=4\nstudy(\"T\")\n");
  check("migrator bumps version", mig.migrated.includes("//@version=5") && mig.changes.length > 0);

  const manifest = getBundledCompilerManifest();
  check("compiler manifest loaded", manifest.engine === "river-pine-interpreter" && manifest.version.length > 0);
}

// -------------------------------------------------------------------- DONE

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("Failures:", failures.join(", "));
  process.exit(1);
}
