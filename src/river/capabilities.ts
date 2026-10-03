// Machine-readable contract for what INDACREATOR actually runs.
// Statuses are verified against src/river/pine/interpreter.ts by source markers.
// A wish-list entry fails the selftest. The model is not allowed to outrank this file.

export type CapabilityStatus = "runs" | "draws" | "noop" | "unsupported";

export interface Capability {
  id: string;
  status: CapabilityStatus;
  /** Text that must appear in interpreter.ts. For unsupported rows, this text must be absent. */
  sourceMarker: string;
  absent?: boolean;
  note: string;
  alternative?: string;
}

export const CAPABILITIES: Capability[] = [
  { id: "open", status: "runs", sourceMarker: 'case "open"', note: "Chart series." },
  { id: "high", status: "runs", sourceMarker: 'case "high"', note: "Chart series." },
  { id: "low", status: "runs", sourceMarker: 'case "low"', note: "Chart series." },
  { id: "close", status: "runs", sourceMarker: 'case "close"', note: "Chart series." },
  { id: "volume", status: "runs", sourceMarker: 'case "volume"', note: "Chart series. Missing volume stays missing." },
  { id: "hl2", status: "runs", sourceMarker: 'case "hl2"', note: "Chart series." },
  { id: "ta.sma", status: "runs", sourceMarker: 'case "ta.sma"', note: "Simple average." },
  { id: "ta.ema", status: "runs", sourceMarker: 'case "ta.ema"', note: "Exponential average." },
  { id: "ta.rma", status: "runs", sourceMarker: 'case "ta.rma"', note: "Wilder average." },
  { id: "ta.wma", status: "runs", sourceMarker: 'case "ta.wma"', note: "Weighted average." },
  { id: "ta.vwma", status: "runs", sourceMarker: 'case "ta.vwma"', note: "Volume-weighted average." },
  { id: "ta.hma", status: "runs", sourceMarker: 'case "ta.hma"', note: "Hull average." },
  { id: "ta.tr", status: "runs", sourceMarker: 'case "ta.tr"', note: "True range." },
  { id: "ta.atr", status: "runs", sourceMarker: 'case "ta.atr"', note: "Average true range." },
  { id: "ta.rsi", status: "runs", sourceMarker: 'case "ta.rsi"', note: "RSI." },
  { id: "ta.stdev", status: "runs", sourceMarker: 'case "ta.stdev"', note: "Standard deviation." },
  { id: "ta.cci", status: "runs", sourceMarker: 'case "ta.cci"', note: "CCI." },
  { id: "ta.mfi", status: "runs", sourceMarker: 'case "ta.mfi"', note: "Money flow index. Needs volume." },
  { id: "ta.linreg", status: "runs", sourceMarker: 'case "ta.linreg"', note: "Linear regression." },
  { id: "ta.highest", status: "runs", sourceMarker: 'case "ta.highest"', note: "Highest value over N bars on this chart." },
  { id: "ta.lowest", status: "runs", sourceMarker: 'case "ta.lowest"', note: "Lowest value over N bars on this chart." },
  { id: "ta.macd", status: "runs", sourceMarker: 'case "ta.macd"', note: "MACD tuple." },
  { id: "ta.bb", status: "runs", sourceMarker: 'case "ta.bb"', note: "Bollinger tuple." },
  { id: "ta.stoch", status: "runs", sourceMarker: 'case "ta.stoch"', note: "Stochastic." },
  { id: "ta.vwap", status: "runs", sourceMarker: 'case "ta.vwap"', note: "Session-cumulative VWAP on this chart's volume. This is supported." },
  { id: "ta.roc", status: "runs", sourceMarker: 'case "ta.roc"', note: "Rate of change." },
  { id: "ta.mom", status: "runs", sourceMarker: 'case "ta.mom"', note: "Momentum." },
  { id: "ta.crossover", status: "runs", sourceMarker: 'case "ta.crossover"', note: "Cross up." },
  { id: "ta.crossunder", status: "runs", sourceMarker: 'case "ta.crossunder"', note: "Cross down." },
  { id: "ta.pivothigh", status: "runs", sourceMarker: 'case "ta.pivothigh"', note: "Swing high. It prints only after later bars confirm it." },
  { id: "ta.pivotlow", status: "runs", sourceMarker: 'case "ta.pivotlow"', note: "Swing low. It prints only after later bars confirm it." },
  { id: "ta.supertrend", status: "runs", sourceMarker: 'case "ta.supertrend"', note: "Supertrend is implemented. Returns the line and the direction." },
  { id: "math.abs", status: "runs", sourceMarker: 'case "math.abs"', note: "Math helpers through math.avg exist beside this case." },
  { id: "array.new_float", status: "runs", sourceMarker: 'name.startsWith("array.")', note: "array.new_float, get, set, push, pop, size, and the common array.* calls store real values." },
  { id: "plot", status: "draws", sourceMarker: 'name === "plot"', note: "Line series." },
  { id: "plotshape", status: "draws", sourceMarker: 'name === "plotshape"', note: "Marker." },
  { id: "plotchar", status: "draws", sourceMarker: 'name === "plotchar"', note: "Character marker." },
  { id: "plotarrow", status: "draws", sourceMarker: 'name === "plotarrow"', note: "Arrow marker." },
  { id: "barcolor", status: "draws", sourceMarker: 'name === "barcolor"', note: "Candle color." },
  { id: "hline", status: "draws", sourceMarker: 'name === "hline"', note: "Horizontal line." },
  { id: "alertcondition", status: "draws", sourceMarker: 'name === "alertcondition"', note: "Records an alert. It does not send an order." },
  { id: "strategy.entry", status: "draws", sourceMarker: 'name === "strategy.entry"', note: "Draws a marker. Does not send an order and does not run a commission or slippage backtest." },
  { id: "bgcolor", status: "draws", sourceMarker: 'name === "bgcolor"', note: "Painted as the candle border. The pane behind the candle is not washed." },
  { id: "fill", status: "noop", sourceMarker: 'name === "fill"', note: "Both plot() lines draw. The shaded band between them is not painted." },
  { id: "label.new", status: "draws", sourceMarker: 'name === "label.new"', note: "Drawn as a marker with the label text." },
  { id: "line.new", status: "draws", sourceMarker: 'name === "line.new"', note: "Drawn as a segment between the two points. A vertical line has no width on this chart." },
  { id: "box.new", status: "draws", sourceMarker: 'name === "box.new"', note: "Drawn as the top and bottom edges of the box." },
  { id: "table.new", status: "noop", sourceMarker: '"table.new"', note: "Accepted. Tables are not painted." },
  { id: "request.security", status: "unsupported", sourceMarker: 'case "request.security"', absent: true, note: "Another symbol or a higher timeframe is rejected at compile time.", alternative: "A longer lookback on this chart's own series. That is not a higher timeframe." },
  { id: "ta.adx", status: "unsupported", sourceMarker: 'case "ta.adx"', absent: true, note: "ADX is not implemented. Do not draft ta.adx.", alternative: "State trend with ta.ema, ta.macd, or ta.supertrend." },
  { id: "ta.dmi", status: "unsupported", sourceMarker: 'case "ta.dmi"', absent: true, note: "DMI is not implemented." },
  { id: "ta.sar", status: "unsupported", sourceMarker: 'case "ta.sar"', absent: true, note: "Parabolic SAR is aliased in the v4 name map and then rejected, because there is no implementation." },
  { id: "ta.wpr", status: "unsupported", sourceMarker: 'case "ta.wpr"', absent: true, note: "Williams %R is aliased and then rejected." },
];

const BY_ID = new Map(CAPABILITIES.map((c) => [c.id, c]));

export function lookupCapability(name: string): Capability | undefined {
  const raw = name.trim().toLowerCase();
  if (BY_ID.has(raw)) return BY_ID.get(raw);
  const ta = `ta.${raw}`;
  if (BY_ID.has(ta)) return BY_ID.get(ta);
  return undefined;
}

export function renderCapabilityBlock(): string {
  const line = (status: CapabilityStatus) =>
    CAPABILITIES.filter((c) => c.status === status).map((c) => c.id).join(", ");
  const blocked = CAPABILITIES.filter((c) => c.status === "unsupported")
    .map((c) => `${c.id}: ${c.note}${c.alternative ? ` Alternative: ${c.alternative}` : ""}`)
    .join("\n");
  return [
    "CAPABILITY REGISTRY (INDACREATOR interpreter — obey this, do not extend it):",
    `Runs: ${line("runs")}`,
    `Draws: ${line("draws")}`,
    `Accepted but does not paint or trade: ${line("noop")}`,
    "Unsupported:",
    blocked,
    "If a name is not in this registry, treat it as unsupported. Do not guess.",
  ].join("\n");
}

const CALL_RE = /\b([A-Za-z_][\w.]*)\s*\(/g;

export interface PineInventory {
  runs: string[];
  draws: string[];
  noop: string[];
  unsupported: string[];
  unknown: string[];
}

export function inventoryPine(source: string): PineInventory {
  const found = new Set<string>();
  for (const match of source.matchAll(CALL_RE)) found.add(match[1]);
  const out: PineInventory = { runs: [], draws: [], noop: [], unsupported: [], unknown: [] };
  for (const name of found) {
    const cap = lookupCapability(name);
    if (!cap) {
      if (name.includes(".") || name.startsWith("ta")) out.unknown.push(name);
      continue;
    }
    out[cap.status === "unsupported" ? "unsupported" : cap.status].push(cap.id);
  }
  return out;
}

export function formatInventory(inv: PineInventory): string {
  const row = (label: string, items: string[]) => (items.length ? `${label}: ${items.join(", ")}` : "");
  return [
    row("Runs", inv.runs),
    row("Draws", inv.draws),
    row("No visual effect", inv.noop),
    row("Rejected", inv.unsupported),
    row("Not in the registry", inv.unknown),
  ].filter(Boolean).join("\n");
}

/** Returns human-readable drift. Empty means the registry still matches the interpreter. */
export function assertCapabilityRegistry(interpreterSource: string): string[] {
  const errors: string[] = [];
  for (const cap of CAPABILITIES) {
    const present = interpreterSource.includes(cap.sourceMarker);
    if (cap.absent && present) errors.push(`${cap.id} is marked unsupported but interpreter contains ${cap.sourceMarker}`);
    if (!cap.absent && !present) errors.push(`${cap.id} claims support but interpreter has no ${cap.sourceMarker}`);
  }
  return errors;
}
