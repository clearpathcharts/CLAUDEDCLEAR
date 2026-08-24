import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface ExplainModeContextType {
  explainMode: boolean;
  toggleExplainMode: () => void;
}

const ExplainModeContext = createContext<ExplainModeContextType | undefined>(undefined);

const STORAGE_KEY = 'clearpath_explain_mode';

function readStored(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function ExplainModeProvider({ children }: { children: ReactNode }) {
  const [explainMode, setExplainMode] = useState<boolean>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(explainMode));
    } catch {
      /* storage not available */
    }
  }, [explainMode]);

  const toggleExplainMode = () => setExplainMode((prev) => !prev);

  return (
    <ExplainModeContext.Provider value={{ explainMode, toggleExplainMode }}>
      {children}
    </ExplainModeContext.Provider>
  );
}

export function useExplainMode() {
  const ctx = useContext(ExplainModeContext);
  if (!ctx) {
    throw new Error('useExplainMode must be used inside <ExplainModeProvider>');
  }
  return ctx;
}

/** Safe for tests / trees that forgot the provider — badges stay hidden. */
export function useExplainModeOptional(): ExplainModeContextType {
  return (
    useContext(ExplainModeContext) ?? {
      explainMode: false,
      toggleExplainMode: () => {},
    }
  );
}
