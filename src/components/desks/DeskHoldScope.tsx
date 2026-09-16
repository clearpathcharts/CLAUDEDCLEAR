import React, { createContext, useContext, useMemo } from 'react';
import DeskHeldFile from './DeskHeldFile';
import { useDeskHeldPanels, type HeldMeta } from './deskHeldPanels';

type HoldApi = {
  hold: (id: string) => void;
  isHeld: (id: string) => boolean;
};

const HoldCtx = createContext<HoldApi | null>(null);

export function useDeskHold(): HoldApi | null {
  return useContext(HoldCtx);
}

export function DeskHoldScope({
  desk,
  storageKey,
  meta,
  defaultHeld,
  children,
}: {
  desk: string;
  storageKey: string;
  meta: Record<string, HeldMeta>;
  defaultHeld?: readonly string[];
  children: React.ReactNode;
}) {
  const ids = useMemo(() => Object.keys(meta), [meta]);
  const panels = useDeskHeldPanels(storageKey, ids, defaultHeld ?? []);
  const api = useMemo<HoldApi>(
    () => ({ hold: panels.hold, isHeld: panels.isHeld }),
    [panels.hold, panels.isHeld],
  );

  return (
    <HoldCtx.Provider value={api}>
      {children}
      <DeskHeldFile
        desk={desk}
        held={panels.held}
        meta={meta}
        open={panels.fileOpen}
        justHeld={panels.justHeld}
        onOpenChange={panels.setFileOpen}
        onRestore={panels.restore}
        onRestoreAll={panels.restoreAll}
      />
    </HoldCtx.Provider>
  );
}
