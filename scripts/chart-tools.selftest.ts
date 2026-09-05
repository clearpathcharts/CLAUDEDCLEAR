/**
 * Chart series styles + drawing catalog (trend lines, fibs, Elliott, cycles, annotations).
 * Run: npx tsx scripts/chart-tools.selftest.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  PRICE_SERIES_OPTIONS,
  isPriceSeriesType,
  toHeikinAshi,
  toLineBreak,
  toRenko,
  volumeAtPrice,
  showsVolumeOverlay,
  seriesFamily,
} from "../src/lib/charts/priceSeriesStyles.ts";
import { DRAWING_TOOLS, TOOL_GROUPS, CHART_EMOJIS, CHART_STICKERS, ELLIOTT_LABELS } from "../src/components/charts/drawings/toolCatalog.ts";
import { extendBoth, pitchforkLines, sinePoints, ghostFeedPoints } from "../src/components/charts/drawings/geometry.ts";
import { FIB_RATIOS, FIB_EXT_RATIOS, fibPrice } from "../src/components/charts/drawings/fibLevels.ts";
import { sanitizeDrawing } from "../src/components/charts/drawings/drawingStorage.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

assert.ok(PRICE_SERIES_OPTIONS.length >= 16, "chart style menu should match the candle/line/area/volume/alt set");
assert.equal(seriesFamily("candlestick"), "candlestick");
assert.equal(seriesFamily("step_line"), "line");
assert.equal(seriesFamily("baseline"), "baseline");
assert.equal(seriesFamily("columns"), "histogram");
assert.equal(seriesFamily("ohlc"), "bar");
assert.ok(showsVolumeOverlay("session_profile"));
assert.ok(showsVolumeOverlay("tpo"));
assert.ok(isPriceSeriesType("heikin_ashi"));
assert.ok(isPriceSeriesType("renko"));
assert.ok(isPriceSeriesType("line_break"));
assert.ok(isPriceSeriesType("hollow"));

const sample = [
  { time: 1, open: 10, high: 12, low: 9, close: 11, volume: 100 },
  { time: 2, open: 11, high: 14, low: 10.5, close: 13, volume: 120 },
  { time: 3, open: 13, high: 13.5, low: 11, close: 11.2, volume: 80 },
  { time: 4, open: 11.2, high: 12, low: 10, close: 10.4, volume: 90 },
  { time: 5, open: 10.4, high: 15, low: 10.2, close: 14.8, volume: 200 },
];

const ha = toHeikinAshi(sample);
assert.equal(ha.length, sample.length);
assert.ok(Math.abs(ha[0].close - (10 + 12 + 9 + 11) / 4) < 1e-9);
assert.ok(ha[1].open === (ha[0].open + ha[0].close) / 2);

const bricks = toRenko(sample, 1);
assert.ok(bricks.length >= 1);
assert.ok(bricks.every((b) => Math.abs(Math.abs(b.close - b.open) - 1) < 1e-9 || b.close === b.open));

const lb = toLineBreak(sample, 3);
assert.ok(lb.length >= 1);
assert.ok(lb[0].time === sample[0].time);

const profile = volumeAtPrice(sample, 8);
assert.ok(profile.length === 8);
assert.ok(profile.some((n) => n.isPoc));
assert.ok(profile.some((n) => n.letters.length > 0));

const groups = new Set(DRAWING_TOOLS.map((t) => t.group));
for (const need of ["lines", "channels", "pitchforks", "fibonacci", "elliott", "cycles", "forecast", "text", "stickers", "shapes"]) {
  assert.ok(groups.has(need as never), `missing tool group ${need}`);
}
assert.ok(DRAWING_TOOLS.some((t) => t.id === "elliott_impulse"));
assert.ok(DRAWING_TOOLS.some((t) => t.id === "fib_extension"));
assert.ok(DRAWING_TOOLS.some((t) => t.id === "cyclic_lines"));
assert.ok(DRAWING_TOOLS.some((t) => t.id === "long_position"));
assert.ok(DRAWING_TOOLS.some((t) => t.id === "emoji"));
assert.ok(DRAWING_TOOLS.some((t) => t.id === "sticker"));
assert.ok(DRAWING_TOOLS.some((t) => t.id === "info_line"));
assert.ok(DRAWING_TOOLS.some((t) => t.id === "extended"));
assert.equal(ELLIOTT_LABELS.elliott_impulse.length, 5);
assert.equal(ELLIOTT_LABELS.elliott_correction.length, 3);
assert.ok(CHART_EMOJIS.length >= 16);
assert.ok(CHART_STICKERS.length >= 8);
assert.ok(TOOL_GROUPS.length >= 12);

const ext = extendBoth({ time: 100, price: 10 }, { time: 200, price: 12 }, 4);
assert.ok(ext.a.time < 100 || ext.b.time > 200);
const pf = pitchforkLines(
  { time: 1, price: 10 },
  { time: 5, price: 14 },
  { time: 5, price: 8 },
  "schiff",
);
assert.ok(pf.median[0].time !== 1 || pf.median[0].price !== 10); // Schiff origin is shifted
assert.ok(sinePoints({ time: 0, price: 1 }, { time: 10, price: 3 }).length > 10);
assert.ok(ghostFeedPoints({ time: 0, price: 1 }, { time: 2, price: 2 }).length > 2);
assert.equal(fibPrice(100, 0, 0.618), 38.2);
assert.ok(FIB_RATIOS.includes(0.618));
assert.ok(FIB_EXT_RATIOS.includes(1.618));

const legacy = sanitizeDrawing({
  id: "d_old",
  kind: "trend",
  color: "#00D9FF",
  p1: { time: 1, price: 10 },
  p2: { time: 2, price: 12 },
});
assert.ok(legacy && legacy.kind === "trend" && legacy.points.length === 2);

const text = sanitizeDrawing({
  id: "d_txt",
  kind: "text",
  color: "#FFFFFF",
  point: { time: 1, price: 10 },
  text: "Hello chart",
});
assert.ok(text && text.text === "Hello chart");

const emoji = sanitizeDrawing({
  id: "d_em",
  kind: "emoji",
  color: "#FFD166",
  points: [{ time: 1, price: 10 }],
  text: "🚀",
});
assert.ok(emoji && emoji.kind === "emoji");

const lc = fs.readFileSync(path.join(root, "src/components/charts/LightweightCandles.tsx"), "utf8");
assert.match(lc, /ChartSeriesStylePicker/);
assert.match(lc, /heikin_ashi|seriesStyle/);
assert.match(lc, /annotationText/);
assert.match(lc, /PATTERN_HUD_OPEN_KEY/);
assert.match(lc, /data-chart-mobile-intel/);
assert.match(lc, /CHART-BUILD-2026-09-04-MOBILE/);

const toolbar = fs.readFileSync(path.join(root, "src/components/charts/drawings/ChartDrawingToolbar.tsx"), "utf8");
assert.match(toolbar, /elliott_impulse/);
assert.match(toolbar, /CHART_EMOJIS/);
assert.match(toolbar, /Write on the chart/);

const retail = fs.readFileSync(path.join(root, "src/components/desks/retail/RetailDashboard.tsx"), "utf8");
assert.match(retail, /priceSeriesType/);

const market = fs.readFileSync(path.join(root, "src/components/markets/LightweightMarketUI.tsx"), "utf8");
assert.match(market, /ChartSeriesStylePicker/);

console.log("chart-tools.selftest: ok");
