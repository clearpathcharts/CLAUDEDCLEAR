"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { DrawingColor, DrawingToolId } from "./types";

export type ChartDrawingSessionApi = {
  symbol: string;
  timeframe: string;
  activeTool: DrawingToolId;
  setActiveTool: (tool: DrawingToolId) => void;
  drawColor: DrawingColor;
  setDrawColor: (c: DrawingColor) => void;
  hint: string;
  canUndo: boolean;
  undo: () => void;
  clearAll: () => void;
  annotationText: string;
  setAnnotationText: (text: string) => void;
  annotationGlyph: string;
  setAnnotationGlyph: (glyph: string) => void;
};

type ChartDrawingSessionContextValue = {
  session: ChartDrawingSessionApi | null;
  registerSession: (api: ChartDrawingSessionApi) => () => void;
};

const ChartDrawingSessionContext = createContext<ChartDrawingSessionContextValue | null>(null);

export function ChartDrawingSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ChartDrawingSessionApi | null>(null);
  const ownerRef = useRef<string | null>(null);

  const registerSession = useCallback((api: ChartDrawingSessionApi) => {
    const owner = `${api.symbol.toUpperCase()}:${api.timeframe}`;
    ownerRef.current = owner;
    setSession(api);
    return () => {
      if (ownerRef.current === owner) {
        ownerRef.current = null;
        setSession(null);
      }
    };
  }, []);

  const value = useMemo(() => ({ session, registerSession }), [session, registerSession]);

  return (
    <ChartDrawingSessionContext.Provider value={value}>
      {children}
    </ChartDrawingSessionContext.Provider>
  );
}

export function useChartDrawingSession(): ChartDrawingSessionApi | null {
  return useContext(ChartDrawingSessionContext)?.session ?? null;
}

export function useRegisterChartDrawingSession():
  | ((api: ChartDrawingSessionApi) => () => void)
  | null {
  return useContext(ChartDrawingSessionContext)?.registerSession ?? null;
}
