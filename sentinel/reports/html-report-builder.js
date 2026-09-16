// sentinel/reports/html-report-builder.js
export function buildHtmlReport(data) {
  return `
    <div style="background-color:#050505; color:#fff; padding:20px; font-family:monospace;">
      <h1>System Status Chronicle</h1>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}
