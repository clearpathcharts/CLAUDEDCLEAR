// sentinel/reports/json-report-builder.js
export function buildJsonReport(data) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    system: "ClearPath Sentinel Daily",
    data: data
  }, null, 2);
}
