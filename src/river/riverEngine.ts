// /src/river/riverEngine.ts
//
// The River — public engine API.
//
// This is the front door the UI uses:
//   compilePine(source)  -> lex + parse + dry-run smoke test, returns honest
//                           success (with extracted inputs) or failure (with
//                           the exact line that broke)
//   runPine(...)         -> executes a compiled script bar-by-bar over REAL
//                           chart candles and returns plots/markers/bar-colors
//   setActiveRiverIndicator / getActiveRiverIndicator -> the bridge between
//                           the River Workstation and every chart on the site
//                           (localStorage + 'river-indicator-updated' event)

import { tokenizePine } from "./pine/lexer";
import { parsePine } from "./pine/parser";
import { PineInterpreter, RiverRunResult, RiverInputMeta, RunOptions, Value } from "./pine/interpreter";
import { PineError } from "./pine/tokens";
import { Script } from "./pine/ast";
import { Candle } from "../types/indicators";

// Note: a string discriminant ("ok"/"error") is used instead of a boolean
// because this repo compiles without strictNullChecks, where boolean literal
// discriminated unions do not narrow.
export interface RiverCompileSuccess {
  status: "ok";
  script: Script;
  title: string;
  overlay: boolean;
  version: number;
  inputs: RiverInputMeta[];
  warnings: string[];
  stats: { totalLines: number; tokens: number; statements: number };
}

export interface RiverCompileFailure {
  status: "error";
  error: string;
  line: number | null;
}

export type RiverCompileResult = RiverCompileSuccess | RiverCompileFailure;

/**
 * Internal-only candles used to smoke-test a script at compile time so the
 * user learns about unsupported functions or runtime errors immediately, in
 * the workstation, instead of on a live chart. These bars are NEVER rendered
 * or presented as market data — they exist purely to exercise the code paths.
 */
function smokeTestCandles(count = 80): Candle[] {
  const out: Candle[] = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    const drift = Math.sin(i / 7) * 1.5 + (i % 13 === 0 ? -2 : 0.15);
    const open = price;
    const close = price + drift;
    out.push({
      time: 1700000000 + i * 3600,
      open,
      high: Math.max(open, close) + 0.8,
      low: Math.min(open, close) - 0.8,
      close,
      volume: 1000 + (i % 10) * 250,
    });
    price = close;
  }
  return out;
}

export function compilePine(source: string): RiverCompileResult {
  const totalLines = source.split("\n").filter(l => l.trim().length > 0).length;
  try {
    const { tokens, version } = tokenizePine(source);
    const script = parsePine(tokens, version);

    // Dry run: catches unsupported built-ins and runtime errors right away.
    const probe = new PineInterpreter(script, smokeTestCandles());
    const result = probe.run();

    return {
      status: "ok",
      script,
      title: result.meta.title,
      overlay: result.meta.overlay,
      version,
      inputs: result.inputs,
      warnings: result.warnings,
      stats: { totalLines, tokens: tokens.length, statements: script.statements.length },
    };
  } catch (err: any) {
    if (err instanceof PineError) {
      return { status: "error", error: err.message, line: err.line || null };
    }
    return { status: "error", error: err?.message || "Unknown compile error", line: null };
  }
}

/** Compile + execute over real candles. Throws PineError on failure. */
export function runPine(source: string, candles: Candle[], opts: RunOptions = {}): RiverRunResult {
  const { tokens, version } = tokenizePine(source);
  const script = parsePine(tokens, version);
  return new PineInterpreter(script, candles, opts).run();
}

// ---------------------------------------------------------------------------
// Active-indicator bridge (Workstation -> every chart)
// ---------------------------------------------------------------------------

export interface ActiveRiverIndicator {
  name: string;
  source: string;
  /** User-edited input values keyed by input id (title). */
  inputs: Record<string, Value>;
  savedAt: number;
}

export const ACTIVE_RIVER_KEY = "clearpath_active_river_indicator";
// Legacy key some chart components already read for the display name.
const ACTIVE_RIVER_NAME_KEY = "clearpath_active_river_indicator_name";

export function setActiveRiverIndicator(indicator: Omit<ActiveRiverIndicator, "savedAt">): void {
  const payload: ActiveRiverIndicator = { ...indicator, savedAt: Date.now() };
  try {
    localStorage.setItem(ACTIVE_RIVER_KEY, JSON.stringify(payload));
    localStorage.setItem(ACTIVE_RIVER_NAME_KEY, indicator.name);
  } catch (e) {
    console.warn("[The River] Could not persist active indicator:", e);
  }
  window.dispatchEvent(new CustomEvent("river-indicator-updated", { detail: { name: indicator.name } }));
}

export function getActiveRiverIndicator(): ActiveRiverIndicator | null {
  try {
    const raw = localStorage.getItem(ACTIVE_RIVER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.source === "string" && parsed.source.trim()) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearActiveRiverIndicator(): void {
  try {
    localStorage.removeItem(ACTIVE_RIVER_KEY);
    localStorage.removeItem(ACTIVE_RIVER_NAME_KEY);
  } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent("river-indicator-updated", { detail: { name: null } }));
}
