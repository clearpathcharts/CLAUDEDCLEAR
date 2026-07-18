// Per-user private Pine vault (server-backed, session auth).

export interface PrivateVaultEntry {
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

const BASE = "/api/river/catalog/mine";

export async function fetchPrivateVault(): Promise<PrivateVaultEntry[]> {
  const res = await fetch(BASE, { credentials: "include" });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Could not load your private vault.");
  const data = await res.json();
  return Array.isArray(data.entries) ? data.entries : [];
}

export async function saveToPrivateVault(payload: {
  name: string;
  description?: string;
  pineSource: string;
  pineVersion?: number | null;
  tags?: string[];
}): Promise<PrivateVaultEntry> {
  const res = await fetch(BASE, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("Sign in to your private account to save scripts.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Save failed.");
  }
  const data = await res.json();
  return data.entry;
}

export async function removeFromPrivateVault(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 404) throw new Error("Could not delete vault entry.");
}

export async function bumpPrivateApply(id: string): Promise<void> {
  await fetch(`${BASE}/${encodeURIComponent(id)}/apply`, {
    method: "POST",
    credentials: "include",
  });
}
