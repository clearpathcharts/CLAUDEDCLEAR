export type PlanId = "basic" | "silver" | "gold" | "platinum";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  eyebrow: string;
  featured?: boolean;
  features: string[];
};

/** Mirrors founder package sheet used on clearpathtrader.com (board-demo comparison only). */
export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    priceLabel: "Free",
    eyebrow: "Start here",
    features: [
      "1 chart/window",
      "High Speed Charting",
      "5 Basic Indicators",
      "Basic Drawing Tools",
      "Alerts (up to 3)",
      "Watchlist (up to 5)",
      "Neuro-Divergent layouts",
      "Real Time News",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    priceLabel: "$5.99",
    eyebrow: "Build your workspace",
    features: [
      "4 chart/window",
      "15 Basic Indicators",
      "All Drawing Tools",
      "Unlimited alerts & watchlist",
      "Market Replay",
      "Education + Encyclopedia",
      "No Ads",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    priceLabel: "$9.99",
    eyebrow: "Create and replay",
    features: [
      "10 chart/window",
      "All Indicators",
      "Pattern Overlay",
      "IndaCreator",
      "Everything in Silver",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    priceLabel: "$14.99",
    eyebrow: "Everything together",
    featured: true,
    features: [
      "Unlimited Charts",
      "AI Pattern Scanner",
      "Ability to add Bots",
      "Everything in Gold",
    ],
  },
];
