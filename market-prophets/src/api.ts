import type { BriefSummary, MarketBrief } from "./types";

export async function fetchLatestBrief(): Promise<MarketBrief | null> {
  const res = await fetch("/api/briefs/latest");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load latest brief");
  return res.json();
}

export async function fetchBrief(date: string): Promise<MarketBrief | null> {
  const res = await fetch(`/api/briefs/${encodeURIComponent(date)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load brief");
  return res.json();
}

export async function fetchArchive(): Promise<BriefSummary[]> {
  const res = await fetch("/api/briefs");
  if (!res.ok) throw new Error("Failed to load archive");
  const data = await res.json();
  return data.briefs ?? [];
}

export async function triggerGenerate(secret?: string): Promise<{ ok: boolean; headline?: string; error?: string }> {
  const res = await fetch("/api/brief/generate", {
    method: "POST",
    headers: secret ? { "X-Brief-Secret": secret } : {},
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error ?? "Generation failed" };
  return { ok: true, headline: data.headline };
}
