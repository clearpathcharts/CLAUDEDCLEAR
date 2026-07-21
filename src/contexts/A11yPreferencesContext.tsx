import React, { createContext, useContext, useEffect, useEffectEvent, useState } from 'react';
import {
  applyA11yPreferencesToDocument,
  persistA11yPreferences,
  readA11yPreferences,
  type A11yPreferences,
} from '../lib/a11yPreferences';

type A11yContextValue = A11yPreferences & {
  setHighContrast: (on: boolean) => void;
  setReducedSensory: (on: boolean) => void;
  toggleHighContrast: () => void;
  toggleReducedSensory: () => void;
};

const A11yPreferencesContext = createContext<A11yContextValue | null>(null);

export function A11yPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPreferences>(() => readA11yPreferences());

  const syncDocument = useEffectEvent((next: A11yPreferences) => {
    applyA11yPreferencesToDocument(next);
    persistA11yPreferences(next);
  });

  useEffect(() => {
    syncDocument(prefs);
  }, [prefs]);

  const value: A11yContextValue = {
    ...prefs,
    setHighContrast: (on) => setPrefs((p) => ({ ...p, highContrast: on })),
    setReducedSensory: (on) => setPrefs((p) => ({ ...p, reducedSensory: on })),
    toggleHighContrast: () => setPrefs((p) => ({ ...p, highContrast: !p.highContrast })),
    toggleReducedSensory: () => setPrefs((p) => ({ ...p, reducedSensory: !p.reducedSensory })),
  };

  return (
    <A11yPreferencesContext.Provider value={value}>
      {children}
    </A11yPreferencesContext.Provider>
  );
}

export function useA11yPreferences(): A11yContextValue {
  const ctx = useContext(A11yPreferencesContext);
  if (!ctx) {
    throw new Error('useA11yPreferences must be used within A11yPreferencesProvider');
  }
  return ctx;
}
