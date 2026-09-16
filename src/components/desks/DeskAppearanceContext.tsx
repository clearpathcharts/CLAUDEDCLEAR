import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { readDeskPaper, rememberDeskPaper, type DeskPaper, type TraderDeskId } from '../../lib/traderDesks';
import {
  broadcastDeskColorChart,
  clearDeskColorOverrides,
  cloneStore,
  copyDeskColorsToAll,
  deskCssVars,
  loadDeskColorChartStore,
  normalizeOverrides,
  overridesEqual,
  resolveDeskOverrides,
  resolveDeskVisualPaint,
  saveDeskColorChartStore,
  setDeskColorOpacity,
  setDeskColorOverride,
  stampDeskSavedAt,
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
  saveDesk: () => void;
  saveAllDesks: () => void;
  discardDraft: () => void;
  isDirty: boolean;
  savedAt: string | null;
  lastSaveScope: 'desk' | 'all' | null;
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
  const [saved, setSaved] = useState<DeskColorChartStore>(() => loadDeskColorChartStore());
  const [draft, setDraft] = useState<DeskColorChartStore>(() => cloneStore(loadDeskColorChartStore()));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [target, setTarget] = useState<DeskColorTarget>('background');
  const [lastSaveScope, setLastSaveScope] = useState<'desk' | 'all' | null>(null);

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

  const persist = useCallback((next: DeskColorChartStore, scope: 'desk' | 'all' | null) => {
    saveDeskColorChartStore(next);
    broadcastDeskColorChart();
    setSaved(cloneStore(next));
    setDraft(cloneStore(next));
    setLastSaveScope(scope);
  }, []);

  const applyColor = useCallback(
    (hex: string) => {
      setDraft((prev) => setDeskColorOverride(prev, deskId, target, hex));
      setLastSaveScope(null);
    },
    [deskId, target],
  );

  const setOpacity = useCallback(
    (value: number) => {
      setDraft((prev) => setDeskColorOpacity(prev, deskId, value));
      setLastSaveScope(null);
    },
    [deskId],
  );

  const saveDesk = useCallback(() => {
    persist(stampDeskSavedAt(draft, deskId), 'desk');
  }, [draft, deskId, persist]);

  const saveAllDesks = useCallback(() => {
    persist(copyDeskColorsToAll(draft, deskId), 'all');
  }, [draft, deskId, persist]);

  const resetVisual = useCallback(() => {
    const cleared = stampDeskSavedAt(clearDeskColorOverrides(draft, deskId), deskId);
    persist(cleared, 'desk');
  }, [draft, deskId, persist]);

  const discardDraft = useCallback(() => {
    setDraft(cloneStore(saved));
    setLastSaveScope(null);
  }, [saved]);

  const overrides = useMemo(() => resolveDeskOverrides(draft, deskId), [draft, deskId]);
  const savedOverrides = useMemo(() => resolveDeskOverrides(saved, deskId), [saved, deskId]);
  const isDirty = useMemo(
    () => !overridesEqual(overrides, savedOverrides) || draft.recents.join() !== saved.recents.join(),
    [overrides, savedOverrides, draft.recents, saved.recents],
  );
  const visualPaint = useMemo(() => resolveDeskVisualPaint(overrides), [overrides]);
  const cssVars = useMemo(() => deskCssVars(overrides), [overrides]);
  const savedAt =
    saved.savedAt?.[deskId] ??
    (Object.keys(normalizeOverrides(savedOverrides)).length ? 'device-local' : null);

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
      recents: draft.recents,
      applyColor,
      setOpacity,
      resetVisual,
      saveDesk,
      saveAllDesks,
      discardDraft,
      isDirty,
      savedAt,
      lastSaveScope,
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
      draft.recents,
      applyColor,
      setOpacity,
      resetVisual,
      saveDesk,
      saveAllDesks,
      discardDraft,
      isDirty,
      savedAt,
      lastSaveScope,
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
