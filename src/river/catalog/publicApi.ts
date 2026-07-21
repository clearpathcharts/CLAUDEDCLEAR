// Client helpers for the public River catalog API.

export interface PublicCatalogEntry {
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
}

const BASE = "/api/river/catalog/public";

export async function fetchPublicCatalog(): Promise<PublicCatalogEntry[]> {
  const res = await fetch(BASE, { credentials: "same-origin" });
  if (!res.ok) throw new Error("Could not load public catalog.");
  const data = await res.json();
  return Array.isArray(data.entries) ? data.entries : [];
}

export async function fetchPublicEntry(id: string): Promise<PublicCatalogEntry | null> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { credentials: "same-origin" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not load catalog entry.");
  const data = await res.json();
  return data.entry ?? null;
}

export async function publishToPublicCatalog(payload: {
  name: string;
  author: string;
  description?: string;
  pineSource: string;
  pineVersion?: number | null;
  tags?: string[];
}): Promise<PublicCatalogEntry> {
  const res = await fetch(BASE, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Publish failed.");
  }
  const data = await res.json();
  return data.entry;
}

export async function bumpPublicApply(id: string): Promise<void> {
  await fetch(`${BASE}/${encodeURIComponent(id)}/apply`, {
    method: "POST",
    credentials: "same-origin",
  });
}
