// The River Catalog — local filing system wired to the Pine interpreter.
// Saves compiled Pine source and applies via setActiveRiverIndicator (not RIR).

import type { Value } from "../pine/interpreter";
import {
  setActiveRiverIndicator,
  compilePine,
  type ActiveRiverIndicator,
} from "../riverEngine";

export type CatalogSource = "pine" | "community" | "builtin" | "public" | "private" | "local";

export interface RiverCatalogEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  source: CatalogSource;
  /** SHA-256 prefix for dedup */
  fingerprint: string;
  pineSource: string;
  pineVersion: number | null;
  defaultInputs: Record<string, Value>;
  tags: string[];
  addedAt: number;
  applyCount: number;
}

const STORAGE_KEY = "clearpath_river_catalog_v2";

function fingerprint(source: string): string {
  let h = 0;
  const s = source.trim();
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `fp${Math.abs(h).toString(36)}`;
}

function readStore(): RiverCatalogEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyStore();
    const parsed = JSON.parse(raw) as RiverCatalogEntry[];
    return Array.isArray(parsed) ? parsed.filter((e) => e.pineSource) : [];
  } catch {
    return [];
  }
}

/** Drop v1 RIR entries — they cannot run on the interpreter path. */
function migrateLegacyStore(): RiverCatalogEntry[] {
  const legacyKey = "clearpath_river_catalog_v1";
  try {
    localStorage.removeItem(legacyKey);
  } catch { /* ignore */ }
  return [];
}

function writeStore(entries: RiverCatalogEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listCatalogEntries(): RiverCatalogEntry[] {
  return readStore().sort((a, b) => b.addedAt - a.addedAt);
}

export function getCatalogEntry(id: string): RiverCatalogEntry | null {
  return readStore().find((e) => e.id === id) ?? null;
}

export function saveToCatalog(
  entry: Omit<RiverCatalogEntry, "id" | "addedAt" | "applyCount" | "fingerprint"> & { pineSource: string },
): RiverCatalogEntry {
  const fp = fingerprint(entry.pineSource);
  const full: RiverCatalogEntry = {
    ...entry,
    fingerprint: fp,
    id: `river-${fp}-${Date.now().toString(36)}`,
    addedAt: Date.now(),
    applyCount: 0,
  };
  const store = readStore();
  const dupe = store.findIndex((e) => e.fingerprint === fp && e.name === entry.name);
  if (dupe >= 0) {
    store[dupe] = { ...full, id: store[dupe].id, applyCount: store[dupe].applyCount, addedAt: store[dupe].addedAt };
  } else {
    store.unshift(full);
  }
  writeStore(store);
  return dupe >= 0 ? store[dupe] : full;
}

export function removeFromCatalog(id: string): boolean {
  const store = readStore();
  const next = store.filter((e) => e.id !== id);
  if (next.length === store.length) return false;
  writeStore(next);
  return true;
}

/** Apply a local catalog entry to all charts via the interpreter bridge. */
export function applyCatalogEntry(id: string, inputOverrides: Record<string, Value> = {}): boolean {
  const entry = getCatalogEntry(id);
  if (!entry?.pineSource?.trim()) return false;

  const compiled = compilePine(entry.pineSource);
  if (compiled.status !== "ok") return false;

  const inputs: Record<string, Value> = { ...entry.defaultInputs, ...inputOverrides };
  setActiveRiverIndicator({
    name: entry.name,
    source: entry.pineSource,
    inputs,
  });

  const store = readStore();
  const idx = store.findIndex((e) => e.id === id);
  if (idx >= 0) {
    store[idx].applyCount += 1;
    writeStore(store);
  }
  return true;
}

/** Apply any Pine record (public/private API payloads). */
export function applyPineRecord(record: {
  name: string;
  pineSource: string;
  defaultInputs?: Record<string, Value>;
}): boolean {
  const compiled = compilePine(record.pineSource);
  if (compiled.status !== "ok") return false;
  const inputs: Record<string, Value> = record.defaultInputs ?? {};
  compiled.inputs.forEach((inp) => {
    if (!(inp.id in inputs)) inputs[inp.id] = inp.value;
  });
  setActiveRiverIndicator({
    name: record.name,
    source: record.pineSource,
    inputs,
  });
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
      e.fingerprint.toLowerCase().includes(q),
  );
}

export function entryFromActive(active: ActiveRiverIndicator, meta: {
  author?: string;
  description?: string;
  tags?: string[];
  source?: CatalogSource;
  version?: number | null;
}): Omit<RiverCatalogEntry, "id" | "addedAt" | "applyCount" | "fingerprint"> {
  return {
    name: active.name,
    author: meta.author ?? "You",
    description: meta.description ?? "",
    source: meta.source ?? "local",
    pineSource: active.source,
    pineVersion: meta.version ?? null,
    defaultInputs: active.inputs,
    tags: meta.tags ?? [],
  };
}
