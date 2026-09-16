export function calculateFundingRate(coin: string = "BTC") {
  return [
    { date: "2026-02", value: 0.010, description: "Baseline optimism with minor spot premium" },
    { date: "2026-03", value: 0.025, description: "Leverage spike as retail buys momentum" },
    { date: "2026-04", value: 0.005, description: "Funding resets close to neutral" },
    { date: "2026-05", value: 0.015, description: "Healthy leverage buildup during recovery" },
    { date: "2026-06", value: 0.038, description: "Overheated pricing requiring caution" }
  ];
}
