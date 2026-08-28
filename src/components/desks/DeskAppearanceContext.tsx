import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { readDeskPaper, rememberDeskPaper, type DeskPaper } from '../../lib/traderDesks';

type DeskAppearanceValue = {
  paper: DeskPaper;
  setPaper: (paper: DeskPaper) => void;
  togglePaper: () => void;
};

const DeskAppearanceContext = createContext<DeskAppearanceValue | null>(null);

export function DeskAppearanceProvider({ children }: { children: React.ReactNode }) {
  const [paper, setPaperState] = useState<DeskPaper>(() => readDeskPaper());

  const setPaper = useCallback((next: DeskPaper) => {
    setPaperState(next);
    rememberDeskPaper(next);
  }, []);

  const togglePaper = useCallback(() => {
    setPaperState((prev) => {
      const next: DeskPaper = prev === 'white' ? 'black' : 'white';
      rememberDeskPaper(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ paper, setPaper, togglePaper }),
    [paper, setPaper, togglePaper],
  );

  return <DeskAppearanceContext.Provider value={value}>{children}</DeskAppearanceContext.Provider>;
}

export function useDeskAppearance(): DeskAppearanceValue {
  const ctx = useContext(DeskAppearanceContext);
  if (!ctx) {
    throw new Error('useDeskAppearance must be used inside DeskAppearanceProvider');
  }
  return ctx;
}
