/**
 * Public Stripe Buy Button config for /plans.
 * The publishable key is designed for the browser. Prefer Cloud Run
 * STRIPE_PUBLISHABLE_KEY / STRIPE_BUY_BUTTON_ID so the image can change
 * without a source edit.
 */
function env(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

export type StripeBuyButtonConfig = {
  buyButtonId: string;
  publishableKey: string;
};

export function resolveStripeBuyButtonConfig(): StripeBuyButtonConfig {
  return {
    buyButtonId: env('STRIPE_BUY_BUTTON_ID') || 'buy_btn_1UHW1BGrAwpKZWrlh5sraF2b',
    publishableKey:
      env('STRIPE_PUBLISHABLE_KEY') ||
      'pk_live_51TBjpsGrAwpKZWrlEFcDjyrwA0KIdRqHw98nJrjGbgE5WrsviNaXE1AoteIVtSs2CkBLSMkTjsO05EsrDRskWKvK00o7BxzbFe',
  };
}

export function injectStripeBuyButtonConfig(html: string): string {
  const config = resolveStripeBuyButtonConfig();
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  const snippet = `<script>window.__CLEARPATH_STRIPE_BUY_BUTTON__=${json};</script>`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${snippet}</head>`);
  }
  return `${snippet}${html}`;
}
