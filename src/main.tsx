import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { A11yPreferencesProvider } from './contexts/A11yPreferencesContext';
import { ExplainModeProvider } from './components/explain';
import { BootErrorBoundary, BootReadySignal } from './components/BootErrorBoundary';
import { markBootFailed } from './lib/bootWatchdog';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  markBootFailed('missing #root');
  throw new Error('ClearPath boot failed: #root element missing');
}

try {
  createRoot(rootEl).render(
    <StrictMode>
      <BootErrorBoundary>
        <HelmetProvider>
          <A11yPreferencesProvider>
            <ExplainModeProvider>
            <FirebaseProvider>
              <BootReadySignal />
              <App />
            </FirebaseProvider>
            </ExplainModeProvider>
          </A11yPreferencesProvider>
        </HelmetProvider>
      </BootErrorBoundary>
    </StrictMode>
  );
  // Do not mark boot OK here — BootReadySignal / BootErrorBoundary own that flag
  // so the HTML watchdog only fires when nothing rendered at all.
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  markBootFailed(message);
  console.error('[main] createRoot failed:', err);
  rootEl.innerHTML = `
    <div role="alert" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:1.5rem;background:#050505;color:#fff;font-family:system-ui,sans-serif;text-align:center">
      <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#fb7185">ClearPath failed to start</p>
      <p style="max-width:28rem;color:#a1a1aa;font-size:14px">The terminal could not mount. Reload the page. If this persists, the deploy may be missing client configuration.</p>
      <pre style="max-width:36rem;overflow:auto;padding:1rem;border:1px solid #27272a;border-radius:12px;background:#000;color:#fecdd3;font-size:11px;text-align:left">${message.replace(/[<>&]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c] as string))}</pre>
      <button type="button" onclick="location.reload()" style="padding:0.65rem 1.25rem;border-radius:999px;border:1px solid #22d3ee55;background:#083344;color:#a5f3fc;font-size:12px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer">Reload</button>
    </div>
  `;
}
