#!/usr/bin/env tsx
/**
 * Seed the public River catalog with starter Pine scripts.
 * Run: npm run river:seed-public
 */
import fs from "node:fs";
import path from "node:path";
import { seedPublicCatalog } from "../src/server/riverCatalogService";

const GOLD_BAR = `//@version=5
indicator("Gold Bar — ATR Trailing Stop", overlay=true)
a = input.float(1.0, title="Sensitivity")
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
`;

const RSI_PANEL = `//@version=5
indicator("River RSI Panel", overlay=false)
len = input.int(14, title="Length")
src = close
rsi = ta.rsi(src, len)
plot(rsi, title="RSI", color=color.purple)
hline(70, title="Overbought", color=color.red)
hline(30, title="Oversold", color=color.green)
`;

const EMA_CROSS = `//@version=5
indicator("EMA Cross Overlay", overlay=true)
fastLen = input.int(9, title="Fast EMA")
slowLen = input.int(21, title="Slow EMA")
fast = ta.ema(close, fastLen)
slow = ta.ema(close, slowLen)
plot(fast, title="Fast", color=color.teal)
plot(slow, title="Slow", color=color.orange)
plotshape(ta.crossover(fast, slow), title="Golden Cross", style=shape.triangleup, location=location.belowbar, color=color.green, size=size.tiny)
plotshape(ta.crossunder(fast, slow), title="Death Cross", style=shape.triangledown, location=location.abovebar, color=color.red, size=size.tiny)
`;

const fixturePath = path.join(process.cwd(), "src/river/pine/fixtures/goldBarAlpha.pine");
const alphaSource = fs.existsSync(fixturePath)
  ? fs.readFileSync(fixturePath, "utf8").replace(/request\.security[^)]*\)/g, "close")
  : GOLD_BAR;

const entries = [
  {
    name: "Gold Bar — ATR Trailing Stop",
    author: "ClearPath",
    description: "Classic UT-style ATR trailing stop with buy/sell shapes and gold signal bars.",
    pineSource: GOLD_BAR,
    pineVersion: 5,
    tags: ["trend", "atr", "signals", "overlay"],
  },
  {
    name: "River RSI Panel",
    author: "ClearPath",
    description: "Simple RSI oscillator pane with 30/70 guides.",
    pineSource: RSI_PANEL,
    pineVersion: 5,
    tags: ["momentum", "rsi", "oscillator"],
  },
  {
    name: "EMA Cross Overlay",
    author: "ClearPath",
    description: "Dual EMA crossover with triangle markers on price.",
    pineSource: EMA_CROSS,
    pineVersion: 5,
    tags: ["ema", "crossover", "overlay"],
  },
  {
    name: "Trading Anarchy Alpha (compat sample)",
    author: "Community",
    description: "Popular UT variant — request.security stripped for River compatibility.",
    pineSource: alphaSource,
    pineVersion: 5,
    tags: ["community", "atr", "signals"],
  },
];

const count = seedPublicCatalog(entries);
console.log(`[river:seed-public] Seeded ${count} public catalog entries.`);
