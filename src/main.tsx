import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { A11yPreferencesProvider } from './contexts/A11yPreferencesContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <A11yPreferencesProvider>
        <FirebaseProvider>
          <App />
        </FirebaseProvider>
      </A11yPreferencesProvider>
    </HelmetProvider>
  </StrictMode>
);

