import { isTraderDeskId, type TraderDeskId } from './traderDesks';

export const DESK_SCREEN_PANES = ['chart', 'watchlist', 'scanner', 'news', 'calendar'] as const;
export type DeskScreenPane = (typeof DESK_SCREEN_PANES)[number];

export const DESK_SCREEN_PANE_LABEL: Record<DeskScreenPane, string> = {
  chart: 'Chart',
  watchlist: 'Watchlist',
  scanner: 'Pattern scanner',
  news: 'News',
  calendar: 'Economic wire',
};

export type MonitorTreePreset = 2 | 3 | 4;

export const MONITOR_TREE_PRESETS: Record<MonitorTreePreset, DeskScreenPane[]> = {
  2: ['chart', 'news'],
  3: ['chart', 'watchlist', 'news'],
  4: ['chart', 'watchlist', 'scanner', 'news'],
};

export type DeskMonitorSnapshot = {
  deskId: TraderDeskId;
  symbol: string;
  timeframe: string;
  at: number;
  /** Per-tab sender id so a tab never applies its own broadcast (no ping-pong). */
  origin?: string;
};

export const DESK_MONITOR_STORAGE_KEY = 'clearpath_desk_monitor_v1';
export const DESK_MONITOR_CHANNEL = 'clearpath-desk-monitor-v1';

const satelliteHandles = new Map<string, Window>();

export function isDeskScreenPane(value: string | null | undefined): value is DeskScreenPane {
  return !!value && (DESK_SCREEN_PANES as readonly string[]).includes(value);
}

/** `/desk/retail/screen/chart` → `chart`. Main desk paths return null. */
export function parseDeskScreenPane(pathname: string): DeskScreenPane | null {
  const p = pathname.toLowerCase().split('?')[0].replace(/\/$/, '') || '/';
  const parts = p.split('/').filter(Boolean);
  if (parts.length < 4 || parts[0] !== 'desk' || parts[2] !== 'screen') return null;
  if (!isTraderDeskId(parts[1])) return null;
  return isDeskScreenPane(parts[3]) ? parts[3] : null;
}

export function deskScreenHref(
  deskId: TraderDeskId,
  pane: DeskScreenPane,
  symbol?: string,
  timeframe?: string,
): string {
  const q = new URLSearchParams();
  if (symbol) q.set('symbol', symbol);
  if (timeframe) q.set('tf', timeframe);
  const qs = q.toString();
  return `/desk/${deskId}/screen/${pane}${qs ? `?${qs}` : ''}`;
}

export function readDeskMonitorQuery(search: string): { symbol?: string; timeframe?: string } {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const symbol = q.get('symbol')?.trim().toUpperCase() || undefined;
  const timeframe = q.get('tf')?.trim() || undefined;
  return { symbol, timeframe };
}

export function readDeskMonitorSnapshot(deskId: TraderDeskId): DeskMonitorSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DESK_MONITOR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeskMonitorSnapshot;
    if (parsed.deskId !== deskId) return null;
    if (!parsed.symbol || !parsed.timeframe) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDeskMonitorSnapshot(next: DeskMonitorSnapshot): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DESK_MONITOR_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function popupFeaturesForScreen(screen: {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
}): string {
  const w = Math.max(480, Math.floor(screen.availWidth));
  const h = Math.max(420, Math.floor(screen.availHeight));
  return `left=${Math.floor(screen.availLeft)},top=${Math.floor(screen.availTop)},width=${w},height=${h}`;
}

export function staggerPopupFeatures(index: number): string {
  const left = 48 + index * 48;
  const top = 48 + index * 36;
  return `left=${left},top=${top},width=1100,height=780`;
}

type ScreenRect = {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  left?: number;
  top?: number;
  isPrimary?: boolean;
};

async function requestOtherScreens(): Promise<ScreenRect[] | null> {
  const w = window as Window & {
    getScreenDetails?: () => Promise<{
      screens: ScreenRect[];
      currentScreen?: ScreenRect;
    }>;
  };
  if (typeof w.getScreenDetails !== 'function') return null;
  try {
    const details = await w.getScreenDetails();
    const screens = Array.isArray(details.screens) ? details.screens : [];
    if (screens.length <= 1) return [];
    const current = details.currentScreen;
    const others = screens.filter((s) => {
      if (!current) return !s.isPrimary;
      return s.availLeft !== current.availLeft || s.availTop !== current.availTop;
    });
    others.sort((a, b) => a.availLeft - b.availLeft || a.availTop - b.availTop);
    return others;
  } catch {
    return null;
  }
}

function satelliteName(deskId: TraderDeskId, pane: DeskScreenPane): string {
  return `cp-desk-${deskId}-${pane}`;
}

export type LaunchMonitorResult = {
  opened: DeskScreenPane[];
  blocked: DeskScreenPane[];
  placedOnOtherScreens: boolean;
  screenCountKnown: number | null;
};

function openSatellite(
  deskId: TraderDeskId,
  pane: DeskScreenPane,
  symbol: string | undefined,
  timeframe: string | undefined,
  features: string,
): Window | null {
  const href = new URL(deskScreenHref(deskId, pane, symbol, timeframe), window.location.origin).href;
  const name = satelliteName(deskId, pane);
  const existing = satelliteHandles.get(name);
  if (existing && !existing.closed) {
    try {
      existing.location.href = href;
      existing.focus();
      return existing;
    } catch {
      /* cross-origin or closed mid-flight */
    }
  }
  const opened = window.open(href, name, features);
  if (opened) satelliteHandles.set(name, opened);
  return opened;
}

export async function launchDeskPane(
  deskId: TraderDeskId,
  pane: DeskScreenPane,
  ctx?: { symbol?: string; timeframe?: string },
): Promise<LaunchMonitorResult> {
  const snap = readDeskMonitorSnapshot(deskId);
  const symbol = ctx?.symbol || snap?.symbol;
  const timeframe = ctx?.timeframe || snap?.timeframe;
  const others = await requestOtherScreens();
  const features =
    others && others[0]
      ? popupFeaturesForScreen(others[0])
      : staggerPopupFeatures(DESK_SCREEN_PANES.indexOf(pane));
  const win = openSatellite(deskId, pane, symbol, timeframe, features);
  return {
    opened: win ? [pane] : [],
    blocked: win ? [] : [pane],
    placedOnOtherScreens: Boolean(others && others.length > 0),
    screenCountKnown: others == null ? null : others.length + 1,
  };
}

export async function launchMonitorTree(
  deskId: TraderDeskId,
  preset: MonitorTreePreset,
  ctx?: { symbol?: string; timeframe?: string },
): Promise<LaunchMonitorResult> {
  const panes = MONITOR_TREE_PRESETS[preset];
  const snap = readDeskMonitorSnapshot(deskId);
  const symbol = ctx?.symbol || snap?.symbol;
  const timeframe = ctx?.timeframe || snap?.timeframe;
  const others = await requestOtherScreens();
  const opened: DeskScreenPane[] = [];
  const blocked: DeskScreenPane[] = [];
  panes.forEach((pane, i) => {
    const features =
      others && others[i]
        ? popupFeaturesForScreen(others[i])
        : staggerPopupFeatures(i);
    const win = openSatellite(deskId, pane, symbol, timeframe, features);
    if (win) opened.push(pane);
    else blocked.push(pane);
  });
  return {
    opened,
    blocked,
    placedOnOtherScreens: Boolean(others && others.length > 0),
    screenCountKnown: others == null ? null : others.length + 1,
  };
}

export function closeDeskSatellites(): number {
  let n = 0;
  for (const win of satelliteHandles.values()) {
    if (!win.closed) {
      try {
        win.close();
        n += 1;
      } catch {
        /* ignore */
      }
    }
  }
  satelliteHandles.clear();
  return n;
}
