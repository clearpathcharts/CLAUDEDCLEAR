/**
 * The River — public + private catalog persistence (file-backed).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type RiverCatalogScope = "public" | "private";

export interface RiverCatalogRecord {
  id: string;
  name: string;
  author: string;
  description: string;
  pineSource: string;
  pineVersion: number | null;
  tags: string[];
  addedAt: number;
  applyCount: number;
  fingerprint: string;
  /** Owner uid for private vault entries */
  ownerUid?: string;
}

const DATA_DIR = path.join(process.cwd(), "data", "river");
const PUBLIC_FILE = path.join(DATA_DIR, "public_catalog.json");
const PRIVATE_DIR = path.join(DATA_DIR, "private_vault");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PRIVATE_DIR)) fs.mkdirSync(PRIVATE_DIR, { recursive: true });
}

function fingerprint(source: string): string {
  return crypto.createHash("sha256").update(source.trim()).digest("hex").slice(0, 16);
}

function readPublic(): RiverCatalogRecord[] {
  ensureDataDir();
  if (!fs.existsSync(PUBLIC_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(PUBLIC_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePublic(entries: RiverCatalogRecord[]) {
  ensureDataDir();
  fs.writeFileSync(PUBLIC_FILE, JSON.stringify(entries, null, 2));
}

function privateFile(uid: string): string {
  return path.join(PRIVATE_DIR, `${uid.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function readPrivate(uid: string): RiverCatalogRecord[] {
  ensureDataDir();
  const file = privateFile(uid);
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePrivate(uid: string, entries: RiverCatalogRecord[]) {
  ensureDataDir();
  fs.writeFileSync(privateFile(uid), JSON.stringify(entries, null, 2));
}

function sanitizeEntry(input: Partial<RiverCatalogRecord> & { pineSource: string }): Omit<RiverCatalogRecord, "id" | "addedAt" | "applyCount" | "fingerprint"> {
  return {
    name: (input.name || "Untitled Indicator").slice(0, 120),
    author: (input.author || "Anonymous").slice(0, 80),
    description: (input.description || "").slice(0, 500),
    pineSource: input.pineSource,
    pineVersion: typeof input.pineVersion === "number" ? input.pineVersion : null,
    tags: Array.isArray(input.tags) ? input.tags.slice(0, 12).map((t) => String(t).slice(0, 32)) : [],
    ownerUid: input.ownerUid,
  };
}

export function listPublicCatalog(): RiverCatalogRecord[] {
  return readPublic().sort((a, b) => b.addedAt - a.addedAt);
}

export function getPublicEntry(id: string): RiverCatalogRecord | null {
  return readPublic().find((e) => e.id === id) ?? null;
}

export function savePublicEntry(input: Partial<RiverCatalogRecord> & { pineSource: string }): RiverCatalogRecord {
  const base = sanitizeEntry(input);
  const fp = fingerprint(base.pineSource);
  const store = readPublic();
  const existing = store.findIndex((e) => e.fingerprint === fp && e.name === base.name);
  const record: RiverCatalogRecord = {
    ...base,
    id: existing >= 0 ? store[existing].id : `pub-${fp}-${Date.now().toString(36)}`,
    fingerprint: fp,
    addedAt: existing >= 0 ? store[existing].addedAt : Date.now(),
    applyCount: existing >= 0 ? store[existing].applyCount : 0,
  };
  if (existing >= 0) store[existing] = record;
  else store.unshift(record);
  writePublic(store);
  return record;
}

export function removePublicEntry(id: string): boolean {
  const store = readPublic();
  const next = store.filter((e) => e.id !== id);
  if (next.length === store.length) return false;
  writePublic(next);
  return true;
}

export function bumpPublicApply(id: string): void {
  const store = readPublic();
  const idx = store.findIndex((e) => e.id === id);
  if (idx >= 0) {
    store[idx].applyCount += 1;
    writePublic(store);
  }
}

export function listPrivateCatalog(uid: string): RiverCatalogRecord[] {
  return readPrivate(uid).sort((a, b) => b.addedAt - a.addedAt);
}

export function savePrivateEntry(uid: string, input: Partial<RiverCatalogRecord> & { pineSource: string }): RiverCatalogRecord {
  const base = sanitizeEntry({ ...input, ownerUid: uid });
  const fp = fingerprint(base.pineSource);
  const store = readPrivate(uid);
  const existing = store.findIndex((e) => e.fingerprint === fp && e.name === base.name);
  const record: RiverCatalogRecord = {
    ...base,
    id: existing >= 0 ? store[existing].id : `mine-${fp}-${Date.now().toString(36)}`,
    fingerprint: fp,
    addedAt: existing >= 0 ? store[existing].addedAt : Date.now(),
    applyCount: existing >= 0 ? store[existing].applyCount : 0,
    ownerUid: uid,
  };
  if (existing >= 0) store[existing] = record;
  else store.unshift(record);
  writePrivate(uid, store);
  return record;
}

export function removePrivateEntry(uid: string, id: string): boolean {
  const store = readPrivate(uid);
  const next = store.filter((e) => e.id !== id);
  if (next.length === store.length) return false;
  writePrivate(uid, next);
  return true;
}

export function bumpPrivateApply(uid: string, id: string): void {
  const store = readPrivate(uid);
  const idx = store.findIndex((e) => e.id === id);
  if (idx >= 0) {
    store[idx].applyCount += 1;
    writePrivate(uid, store);
  }
}

export function seedPublicCatalog(entries: Array<Partial<RiverCatalogRecord> & { pineSource: string }>): number {
  let added = 0;
  for (const entry of entries) {
    const before = readPublic().length;
    savePublicEntry(entry);
    if (readPublic().length >= before) added++;
  }
  return added;
}

export { fingerprint as riverSourceFingerprint };
