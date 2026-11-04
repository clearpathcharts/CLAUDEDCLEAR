/**
 * Metricool web analytics (tracker.metricool.com/be.js).
 * Public site hash — set METRICOOL_WEB_TRACKER_HASH on Cloud Run to override or disable (empty / "0").
 */

const DEFAULT_HASH = '87d90095f246ade12a9caaf38296b391';

export function resolveMetricoolWebTrackerHash(): string | null {
  const raw = (process.env.METRICOOL_WEB_TRACKER_HASH ?? DEFAULT_HASH).trim();
  if (!raw || raw === '0' || raw.toLowerCase() === 'disabled') return null;
  if (!/^[a-f0-9]{32}$/i.test(raw)) return null;
  return raw.toLowerCase();
}

export function injectMetricoolWebTracker(html: string, cspNonce?: string): string {
  const hash = resolveMetricoolWebTrackerHash();
  if (!hash || !html.includes('</head>')) return html;

  const safeNonce = (cspNonce || '').replace(/[^A-Za-z0-9+/=_-]/g, '');
  const nonceAttr = safeNonce ? ` nonce="${safeNonce}"` : '';
  const snippet = `<script${nonceAttr}>function loadScript(a){var b=document.getElementsByTagName("head")[0],c=document.createElement("script");c.type="text/javascript",c.src="https://tracker.metricool.com/resources/be.js",c.onreadystatechange=a,c.onload=a,b.appendChild(c)}loadScript(function(){beTracker.t({hash:"${hash}"})});</script>`;

  return html.replace('</head>', `${snippet}\n</head>`);
}
