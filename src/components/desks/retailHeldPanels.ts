import { useCallback, useState } from 'react';

export const RETAIL_HELD_STORAGE_KEY = 'clearpath_retail_held_panels';

export const RETAIL_PANEL_IDS = [
  'watchlist',
  'snapshot',
  'context',
  'volume',
  'movers',
  'news',
  'calendar',
  'alerts',
  'changed',
  'education',
  'fundamental',
  'simulation',
  'workspace',
] as const;

export type RetailPanelId = (typeof RETAIL_PANEL_IDS)[number];

/** Panels below the chart — holding these is what lets the candles grow. */
export const RETAIL_BELOW_CHART_IDS = [
  'context',
  'volume',
  'movers',
  'news',
  'calendar',
  'alerts',
  'changed',
  'education',
  'fundamental',
  'simulation',
  'workspace',
] as const satisfies readonly RetailPanelId[];

export const RETAIL_PANEL_META: Record<RetailPanelId, { title: string; blurb: string }> = {
  watchlist: { title: 'My Watchlist', blurb: 'Lists and add-asset search' },
  snapshot: { title: 'Market Snapshot', blurb: 'Price, change, OHLC, volume' },
  context: { title: 'Market Context', blurb: 'Trend, session, ATR, range' },
  volume: { title: 'Volume / Price', blurb: 'Bar volume, VWAP, relative volume' },
  movers: { title: 'Market Movers', blurb: 'Gainers and decliners in the loaded set' },
  news: { title: 'News', blurb: 'Latest wire headlines' },
  calendar: { title: 'Economic Calendar', blurb: 'Economic wire — not a timed calendar' },
  alerts: { title: 'Alerts / Events', blurb: 'Price reminders you set' },
  changed: { title: 'What changed?', blurb: 'Since last stored view' },
  education: { title: 'Education', blurb: 'What am I looking at?' },
  fundamental: { title: 'Fundamental Snapshot', blurb: 'Statement metrics when available' },
  simulation: { title: 'Simulation Lab', blurb: 'Hypothetical notes — no real money' },
  workspace: { title: 'Workspace', blurb: 'Focus mode and blackout' },
};

const PANEL_SET = new Set<string>(RETAIL_PANEL_IDS);

export function parseHeldPanels(raw: string | null | undefined): RetailPanelId[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<RetailPanelId>();
    const out: RetailPanelId[] = [];
    for (const item of parsed) {
      if (typeof item !== 'string' || !PANEL_SET.has(item) || seen.has(item as RetailPanelId)) continue;
      const id = item as RetailPanelId;
      seen.add(id);
      out.push(id);
    }
    return out;
  } catch {
    return [];
  }
}

function readHeld(): RetailPanelId[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseHeldPanels(localStorage.getItem(RETAIL_HELD_STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeHeld(ids: RetailPanelId[]) {
  try {
    localStorage.setItem(RETAIL_HELD_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function useRetailHeldPanels() {
  const [held, setHeld] = useState<RetailPanelId[]>(readHeld);
  const [fileOpen, setFileOpen] = useState(() => readHeld().length > 0);
  const [justHeld, setJustHeld] = useState<RetailPanelId | null>(null);

  const hold = useCallback((id: RetailPanelId) => {
    setHeld((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeHeld(next);
      return next;
    });
    setJustHeld(id);
    setFileOpen(true);
  }, []);

  const restore = useCallback((id: RetailPanelId) => {
    setHeld((prev) => {
      const next = prev.filter((x) => x !== id);
      writeHeld(next);
      if (next.length === 0) setFileOpen(false);
      return next;
    });
    setJustHeld((cur) => (cur === id ? null : cur));
  }, []);

  const restoreAll = useCallback(() => {
    writeHeld([]);
    setHeld([]);
    setJustHeld(null);
    setFileOpen(false);
  }, []);

  const isHeld = useCallback((id: RetailPanelId) => held.includes(id), [held]);

  return { held, fileOpen, setFileOpen, justHeld, hold, restore, restoreAll, isHeld };
}
