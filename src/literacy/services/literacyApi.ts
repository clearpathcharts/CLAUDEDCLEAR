export interface WatchCheckResult {
  url: string;
  hash: string;
  title: string;
  excerpt: string;
  byteLength: number;
  fetchedAt: number;
}

export async function checkWatchedPage(url: string): Promise<WatchCheckResult> {
  const res = await fetch("/api/literacy/watch-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Watch check failed (${res.status})`);
  }
  return res.json();
}

export interface TruthSearchHit {
  id: string;
  title: string;
  snippet: string;
  source: "vault" | "wiki" | "market";
  score: number;
}

export async function truthSearch(payload: {
  query: string;
  vault: Array<{ id: string; title: string; body: string; tags?: string[] }>;
  wiki: Array<{ id: string; title: string; summary: string; body: string; tags?: string[] }>;
  symbol?: string;
}): Promise<{ hits: TruthSearchHit[]; marketNote?: string }> {
  const res = await fetch("/api/literacy/truth-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Truth search failed (${res.status})`);
  }
  return res.json();
}

export async function scoreMentorTrust(payload: {
  question: string;
  answer: string;
  vaultNotes: string[];
  marketContext?: string;
}): Promise<{ score: number; reasons: string[] }> {
  const res = await fetch("/api/literacy/mentor-trust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Trust score failed (${res.status})`);
  }
  return res.json();
}

export async function fetchRssFeed(url: string): Promise<
  Array<{ id: string; text: string; link?: string; description?: string; timestamp: number }>
> {
  const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("RSS fetch failed");
  return res.json();
}
