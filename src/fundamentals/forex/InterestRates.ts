export function calculateInterestRates() {
  return [
    { date: "2025-10", value: 5.25, description: "Fed holds to control inflation" },
    { date: "2025-12", value: 5.00, description: "First easing cut of 25bps" },
    { date: "2026-02", value: 4.75, description: "Secondary cut on softer jobs data" },
    { date: "2026-04", value: 4.75, description: "Monetary pause to balance goals" },
    { date: "2026-06", value: 4.50, description: "Further cut matching inflation CPI drop" }
  ];
}
