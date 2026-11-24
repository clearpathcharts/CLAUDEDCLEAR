import type { DeskMeta } from "@/lib/desks";

export const CHART_STYLES = ["desk", "classic", "bars", "line"] as const;
export type ChartStyle = (typeof CHART_STYLES)[number];

export const CHART_STYLE_LABELS: Record<ChartStyle, string> = {
  desk: "Desk candles",
  classic: "Green / red",
  bars: "Bar chart",
  line: "Line chart",
};

export const CLASSIC_BULL = "#22c55e";
export const CLASSIC_BEAR = "#ef4444";

export function resolveCandleColors(
  desk: DeskMeta,
  style: ChartStyle,
): { up: string; down: string; line: string } {
  if (style === "classic") {
    return { up: CLASSIC_BULL, down: CLASSIC_BEAR, line: CLASSIC_BULL };
  }
  return {
    up: desk.candleUp,
    down: desk.candleDown,
    line: desk.candleUp,
  };
}

export function isChartStyle(v: string | null | undefined): v is ChartStyle {
  return !!v && (CHART_STYLES as readonly string[]).includes(v);
}
