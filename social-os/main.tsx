import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import SocialOsPage from '../src/components/SocialOsPage';
import '../src/index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('ClearPath Social OS boot failed: #root missing');
}

createRoot(rootEl).render(
  <StrictMode>
    <HelmetProvider>
      <SocialOsPage standalone />
    </HelmetProvider>
  </StrictMode>
);
