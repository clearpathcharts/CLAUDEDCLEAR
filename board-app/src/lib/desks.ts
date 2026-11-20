export const DESK_IDS = [
  "institutional",
  "fundamental",
  "retail",
  "neurodivergent",
] as const;

export type DeskId = (typeof DESK_IDS)[number];

export type DeskMeta = {
  id: DeskId;
  title: string;
  short: string;
  tagline: string;
  tone: string;
  chartBg: string;
  candleUp: string;
  candleDown: string;
  grid: string;
  calm?: boolean;
};

/** Candle colors follow ClearPath Trader brand (clearpathtrader.com). */
export const DESKS: Record<DeskId, DeskMeta> = {
  institutional: {
    id: "institutional",
    title: "Institutional",
    short: "INST",
    tagline: "Give me the information",
    tone: "Dense intel panels. Positioning, flows, and levels first.",
    chartBg: "#050505",
    candleUp: "#00E5FF",
    candleDown: "#FF007F",
    grid: "rgba(91, 0, 255, 0.18)",
  },
  fundamental: {
    id: "fundamental",
    title: "Fundamental",
    short: "FUND",
    tagline: "What is this business doing financially?",
    tone: "Balance-sheet and macro context beside the tape.",
    chartBg: "#07050c",
    candleUp: "#00E5FF",
    candleDown: "#FF6A00",
    grid: "rgba(255, 106, 0, 0.16)",
  },
  retail: {
    id: "retail",
    title: "Retail",
    short: "RETAIL",
    tagline: "Make trading understandable",
    tone: "Clear labels, guided tools, less jargon on the desk.",
    chartBg: "#050508",
    candleUp: "#00E5FF",
    candleDown: "#C44DFF",
    grid: "rgba(0, 229, 255, 0.14)",
  },
  neurodivergent: {
    id: "neurodivergent",
    title: "Neurodivergent",
    short: "NEURO",
    tagline: "Built for different minds. Made for real traders.",
    tone: "Calmer contrast, wider spacing, reduced visual noise.",
    chartBg: "#08080f",
    candleUp: "#00E5FF",
    candleDown: "#FF2BD6",
    grid: "rgba(0, 229, 255, 0.1)",
    calm: true,
  },
};

export function isDeskId(value: string | null | undefined): value is DeskId {
  return !!value && (DESK_IDS as readonly string[]).includes(value);
}
