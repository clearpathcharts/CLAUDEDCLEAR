export function calculatePE(ticker: string = "SPY") {
  return [
    { date: "2025-10", value: 24.2, description: "Historical high valuation threshold" },
    { date: "2025-12", value: 23.5, description: "Earning reports consolidation" },
    { date: "2026-02", value: 22.8, description: "Healthy adjustments downward" },
    { date: "2026-04", value: 21.9, description: "Earnings expand faster than price growth" },
    { date: "2026-06", value: 21.1, description: "Support level multiple alignment" }
  ];
}
