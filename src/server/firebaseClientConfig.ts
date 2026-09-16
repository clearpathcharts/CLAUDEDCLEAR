/**
 * Runtime Firebase web client config for SPA boot.
 * Cloud Run can set these as *service* env vars (no Vite rebuild required).
 * Prefer VITE_FIREBASE_* (same names as local .env) or FIREBASE_WEB_* aliases.
 */
function env(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

export type FirebaseWebClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId: string;
  storageBucket: string;
};

export function resolveFirebaseWebClientConfig(): FirebaseWebClientConfig | null {
  const apiKey = env('VITE_FIREBASE_API_KEY') || env('FIREBASE_WEB_API_KEY');
  if (!apiKey) return null;

  return {
    apiKey,
    authDomain:
      env('VITE_FIREBASE_AUTH_DOMAIN') ||
      env('FIREBASE_WEB_AUTH_DOMAIN') ||
      'gen-lang-client-0282858983.firebaseapp.com',
    projectId:
      env('VITE_FIREBASE_PROJECT_ID') ||
      env('FIREBASE_WEB_PROJECT_ID') ||
      'gen-lang-client-0282858983',
    appId:
      env('VITE_FIREBASE_APP_ID') ||
      env('FIREBASE_WEB_APP_ID') ||
      '1:806874867326:web:58d1bed65aed85f6015a2f',
    messagingSenderId:
      env('VITE_FIREBASE_MESSAGING_SENDER_ID') ||
      env('FIREBASE_WEB_MESSAGING_SENDER_ID') ||
      '806874867326',
    storageBucket:
      env('VITE_FIREBASE_STORAGE_BUCKET') ||
      env('FIREBASE_WEB_STORAGE_BUCKET') ||
      'gen-lang-client-0282858983.firebasestorage.app',
  };
}

/** Inject window.__CLEARPATH_FIREBASE_CONFIG__ before </head> (or after <head>). */
export function injectFirebaseClientConfig(html: string): string {
  const config = resolveFirebaseWebClientConfig();
  if (!config) return html;

  // Escape </ to avoid breaking out of the script tag
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  const snippet = `<script>window.__CLEARPATH_FIREBASE_CONFIG__=${json};</script>`;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${snippet}</head>`);
  }
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${snippet}`);
  }
  return `${snippet}${html}`;
}

export function firebaseWebClientConfigured(): boolean {
  return resolveFirebaseWebClientConfig() !== null;
}
