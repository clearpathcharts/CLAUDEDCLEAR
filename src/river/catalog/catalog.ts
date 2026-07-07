// The River Catalog — filing system for community indicators.
// Anyone's compiled Pine → RIR indicator can be saved and applied to any chart.

import { RirProgram } from '../rir/types';
import { RirInputOverrides } from '../runtime/types';
import { activateRirProgram } from '../runtime/activeRuntime';

export type CatalogSource = 'pine' | 'community' | 'builtin';

export interface RiverCatalogEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  source: CatalogSource;
  bytecodeId: string;
  pineVersion: number | null;
  /** Original Pine source when imported from TradingView */
  pineSource?: string;
  /** Serialized RIR program */
  rir: RirProgram;
  defaultInputs: RirInputOverrides;
  tags: string[];
  addedAt: number;
  applyCount: number;
}

const STORAGE_KEY = 'clearpath_river_catalog_v1';

function readStore(): RiverCatalogEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiverCatalogEntry[];
  } catch {
    return [];
  }
}

function writeStore(entries: RiverCatalogEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listCatalogEntries(): RiverCatalogEntry[] {
  return readStore().sort((a, b) => b.addedAt - a.addedAt);
}

export function getCatalogEntry(id: string): RiverCatalogEntry | null {
  return readStore().find((e) => e.id === id) ?? null;
}

export function saveToCatalog(entry: Omit<RiverCatalogEntry, 'id' | 'addedAt' | 'applyCount'>): RiverCatalogEntry {
  const full: RiverCatalogEntry = {
    ...entry,
    id: `river-${entry.bytecodeId.toLowerCase()}-${Date.now().toString(36)}`,
    addedAt: Date.now(),
    applyCount: 0,
  };
  const store = readStore();
  const dupe = store.findIndex((e) => e.bytecodeId === entry.bytecodeId && e.name === entry.name);
  if (dupe >= 0) {
    store[dupe] = { ...full, id: store[dupe].id, applyCount: store[dupe].applyCount };
  } else {
    store.unshift(full);
  }
  writeStore(store);
  return full;
}

export function removeFromCatalog(id: string): boolean {
  const store = readStore();
  const next = store.filter((e) => e.id !== id);
  if (next.length === store.length) return false;
  writeStore(next);
  return true;
}

export function applyCatalogEntry(id: string, inputOverrides: RirInputOverrides = {}): boolean {
  const entry = getCatalogEntry(id);
  if (!entry) return false;

  const merged = { ...entry.defaultInputs, ...inputOverrides };
  activateRirProgram(entry.rir, merged);

  const store = readStore();
  const idx = store.findIndex((e) => e.id === id);
  if (idx >= 0) {
    store[idx].applyCount += 1;
    writeStore(store);
  }
  return true;
}

export function searchCatalog(query: string): RiverCatalogEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return listCatalogEntries();
  return listCatalogEntries().filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.author.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.bytecodeId.toLowerCase().includes(q),
  );
}
