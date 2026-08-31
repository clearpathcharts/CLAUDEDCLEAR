import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { readDeskPaper, rememberDeskPaper, type DeskPaper, type TraderDeskId } from '../../lib/traderDesks';
import {
  broadcastDeskColorChart,
  clearDeskColorOverrides,
  deskCssVars,
  loadDeskColorChartStore,
  resolveDeskOverrides,
  resolveDeskVisualPaint,
  saveDeskColorChartStore,
  setDeskColorOpacity,
  setDeskColorOverride,
  type DeskColorChartStore,
  type DeskColorOverrides,
  type DeskColorTarget,
  type DeskVisualPaint,
} from '../../lib/deskColorChart';

type DeskAppearanceValue = {
  paper: DeskPaper;
  setPaper: (paper: DeskPaper) => void;
  togglePaper: () => void;
  deskId: TraderDeskId;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  target: DeskColorTarget;
  setTarget: (target: DeskColorTarget) => void;
  overrides: DeskColorOverrides;
  recents: string[];
  applyColor: (hex: string) => void;
  setOpacity: (value: number) => void;
  resetVisual: () => void;
  visualPaint: DeskVisualPaint;
  cssVars: Record<string, string>;
};

const DeskAppearanceContext = createContext<DeskAppearanceValue | null>(null);

export function DeskAppearanceProvider({
  deskId,
  children,
}: {
  deskId: TraderDeskId;
  children: React.ReactNode;
}) {
  const [paper, setPaperState] = useState<DeskPaper>(() => readDeskPaper());
  const [store, setStore] = useState<DeskColorChartStore>(() => loadDeskColorChartStore());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [target, setTarget] = useState<DeskColorTarget>('background');

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

  const commit = useCallback((next: DeskColorChartStore) => {
    setStore(next);
    saveDeskColorChartStore(next);
    broadcastDeskColorChart();
  }, []);

  const applyColor = useCallback(
    (hex: string) => {
      commit(setDeskColorOverride(store, deskId, target, hex));
    },
    [commit, deskId, store, target],
  );

  const setOpacity = useCallback(
    (value: number) => {
      commit(setDeskColorOpacity(store, deskId, value));
    },
    [commit, deskId, store],
  );

  const resetVisual = useCallback(() => {
    commit(clearDeskColorOverrides(store, deskId));
  }, [commit, deskId, store]);

  const overrides = useMemo(() => resolveDeskOverrides(store, deskId), [store, deskId]);
  const visualPaint = useMemo(() => resolveDeskVisualPaint(overrides), [overrides]);
  const cssVars = useMemo(() => deskCssVars(overrides), [overrides]);

  const value = useMemo(
    () => ({
      paper,
      setPaper,
      togglePaper,
      deskId,
      pickerOpen,
      setPickerOpen,
      target,
      setTarget,
      overrides,
      recents: store.recents,
      applyColor,
      setOpacity,
      resetVisual,
      visualPaint,
      cssVars,
    }),
    [
      paper,
      setPaper,
      togglePaper,
      deskId,
      pickerOpen,
      target,
      overrides,
      store.recents,
      applyColor,
      setOpacity,
      resetVisual,
      visualPaint,
      cssVars,
    ],
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

export function useOptionalDeskAppearance(): DeskAppearanceValue | null {
  return useContext(DeskAppearanceContext);
}
