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

export const DESKS: Record<DeskId, DeskMeta> = {
  institutional: {
    id: "institutional",
    title: "Institutional",
    short: "INST",
    tagline: "Give me the information",
    tone: "Dense intel panels. Positioning, flows, and levels first.",
    chartBg: "#0a0e14",
    candleUp: "#2dd4a8",
    candleDown: "#f07178",
    grid: "rgba(148, 163, 184, 0.12)",
  },
  fundamental: {
    id: "fundamental",
    title: "Fundamental",
    short: "FUND",
    tagline: "What is this business doing financially?",
    tone: "Balance-sheet and macro context beside the tape.",
    chartBg: "#0c1018",
    candleUp: "#3ecf8e",
    candleDown: "#e85d4c",
    grid: "rgba(200, 150, 80, 0.14)",
  },
  retail: {
    id: "retail",
    title: "Retail",
    short: "RETAIL",
    tagline: "Make trading understandable",
    tone: "Clear labels, guided tools, less jargon on the desk.",
    chartBg: "#0b1220",
    candleUp: "#34d399",
    candleDown: "#fb7185",
    grid: "rgba(100, 140, 180, 0.14)",
  },
  neurodivergent: {
    id: "neurodivergent",
    title: "Neurodivergent",
    short: "NEURO",
    tagline: "Built for different minds. Made for real traders.",
    tone: "Calmer contrast, wider spacing, reduced visual noise.",
    chartBg: "#12161c",
    candleUp: "#6bbf8a",
    candleDown: "#c97b7b",
    grid: "rgba(160, 160, 160, 0.08)",
    calm: true,
  },
};

export function isDeskId(value: string | null | undefined): value is DeskId {
  return !!value && (DESK_IDS as readonly string[]).includes(value);
}
