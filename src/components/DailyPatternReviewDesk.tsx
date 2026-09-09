import React, { useEffect, useMemo, useState } from "react";
import { Bell, Check, RefreshCw, Newspaper, Mail, ExternalLink } from "lucide-react";

type PatternHit = {
  id: string;
  label: string;
  direction: "bullish" | "bearish" | "neutral";
  scale?: "major" | "nested";
  category: string;
  confidence: number;
  detail?: string;
};

type ReviewRow = {
  id: string;
  bucket: "forex" | "stocks" | "indices" | "futures" | "commodities";
  symbol: string | null;
  display: string;
  description: string;
  proxyNote?: string;
  status: "ok" | "unavailable";
  unavailableReason?: string;
  sessionDate: string | null;
  lastClose?: number;
  dailyPattern: PatternHit | null;
  subPatterns: PatternHit[];
  independentPatterns: PatternHit[];
  summary: string;
  snapshotSvg: string;
  reviewed: boolean;
  reviewNote?: string;
};

type NewsItem = {
  title: string;
  source: string;
  link?: string;
  pubDate?: string;
};

type MarketProphetsBrief = {
  editionDate: string;
  headline: string;
  summary: string;
  bullets: string[];
  traderLens?: string;
  watchToday?: string[];
  url: string;
  source: "live" | "unavailable";
};

export type DailyPatternReviewReport = {
  date: string;
  ranAt: string;
  unreadAlert: boolean;
  unreadCount: number;
  scanned: number;
  labeled: number;
  unavailable: number;
  disclaimer: string;
  nextDueHint: string;
  news: { items: NewsItem[]; sourcesTried: string[]; sourcesOk: string[] };
  marketProphets?: MarketProphetsBrief | null;
  digestEmailSentAt?: string;
  digestEmailTo?: string;
  storage?: "disk" | "both";
  rows: ReviewRow[];
};

const BUCKET_LABEL: Record<ReviewRow["bucket"], string> = {
  forex: "Top 25 forex",
  stocks: "Top stocks",
  indices: "Top indices",
  futures: "Top 10 futures (cash proxies)",
  commodities: "Top 10 commodities",
};

const DIRECTION: Record<PatternHit["direction"], string> = {
  bullish: "text-emerald-300",
  bearish: "text-red-300",
  neutral: "text-sky-300",
};

function HitList({ title, items, empty }: { title: string; items: PatternHit[]; empty: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-1">{title}</p>
      {items.length === 0 ? (
        <p className="text-[11px] text-zinc-600 font-mono">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((p, i) => (
            <li key={`${p.id}-${i}`} className="text-[11px] font-mono text-zinc-300">
              <span className={DIRECTION[p.direction]}>{p.label}</span>
              {p.scale === "nested" ? <span className="text-cyan-400"> nested</span> : null}
              <span className="text-zinc-600"> · {Math.round(p.confidence * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DailyPatternReviewDesk({
  getHeaders,
}: {
  getHeaders: () => Promise<Record<string, string>>;
}) {
  const [report, setReport] = useState<DailyPatternReviewReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<ReviewRow["bucket"] | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-pattern-review", { headers, credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setReport(null);
        setError(body.message || "No overnight review yet — tap Run now.");
        return;
      }
      if (!res.ok) throw new Error(body.message || body.error || `Unavailable (${res.status})`);
      setReport(body as DailyPatternReviewReport);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load overnight review");
    } finally {
      setLoading(false);
    }
  };

  const runNow = async () => {
    setBusy(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-pattern-review/run", {
        method: "POST",
        headers,
        credentials: "include",
        body: "{}",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Sweep failed (${res.status})`);
      setReport(body as DailyPatternReviewReport);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sweep failed");
    } finally {
      setBusy(false);
    }
  };

  const markRow = async (row: ReviewRow, reviewed: boolean) => {
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-pattern-review/review", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ rowId: row.id, reviewed, note: notes[row.id] ?? row.reviewNote ?? "" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Save failed");
      setReport(body as DailyPatternReviewReport);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save review");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const list = report?.rows || [];
    return bucket === "all" ? list : list.filter((r) => r.bucket === bucket);
  }, [report, bucket]);

  return (
    <div className="mb-8" data-testid="daily-pattern-review">
      <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-amber-400/35 shadow-[0_0_18px_rgba(251,191,36,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-amber-200 text-xl font-bold uppercase mb-1 flex items-center gap-2">
              <Bell size={20} />
              Overnight structure review — {report?.date || "today (Pacific)"}
            </h2>
            <p className="text-white/55 text-sm max-w-2xl">
              Founder alert inbox + optional digest email. Completed daily bars for the mapped universe,
              nested geometry, independent prints, free RSS headlines, and the Market Prophets brief when
              live. Reports persist to Firestore on Cloud Run. Live overlays stay on MARKETS. Missing
              vendor maps stay <span className="font-mono text-zinc-400">DATA UNAVAILABLE</span>. Not a
              trade signal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || busy}
              className="px-3 py-2 rounded-md border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void runNow()}
              disabled={busy || loading}
              className="px-3 py-2 rounded-md border border-amber-400/50 text-amber-200 text-xs font-bold uppercase tracking-wider hover:bg-amber-400/10 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
              Run now
            </button>
          </div>
        </div>

        {error && <p className="text-amber-300 text-sm mb-3 font-mono">{error}</p>}

        {loading && !report ? (
          <p className="text-white/50 font-mono text-xs">Loading…</p>
        ) : report ? (
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span
              className={`px-3 py-1 rounded font-black uppercase tracking-widest border ${
                report.unreadAlert
                  ? "text-amber-200 bg-amber-500/15 border-amber-400/40"
                  : "text-emerald-300 bg-emerald-500/15 border-emerald-500/40"
              }`}
            >
              {report.unreadAlert ? `${report.unreadCount} unread` : "inbox clear"}
            </span>
            <span className="text-white/70">scanned {report.scanned}</span>
            <span className="text-white/70">labeled {report.labeled}</span>
            <span className="text-white/45">unavailable {report.unavailable}</span>
            <span className="text-white/40">{report.nextDueHint}</span>
            {report.storage === "both" ? (
              <span className="text-emerald-400/80">firestore ok</span>
            ) : (
              <span className="text-zinc-500">local disk only</span>
            )}
            {report.digestEmailSentAt ? (
              <span className="text-sky-300 flex items-center gap-1">
                <Mail size={12} />
                digest sent
              </span>
            ) : (
              <span className="text-zinc-600">digest pending (needs SMTP)</span>
            )}
          </div>
        ) : null}

        <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">{report?.disclaimer}</p>
      </div>

      {report?.marketProphets && (
        <div className="mt-4 bg-[#1a1a2e] p-5 rounded-lg border border-violet-500/25">
          <h3 className="text-violet-200 font-black uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
            <ExternalLink size={16} />
            Market Prophets · daily brief
          </h3>
          {report.marketProphets.source === "live" ? (
            <>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                {report.marketProphets.editionDate}
              </p>
              <p className="text-white font-bold text-sm mb-2">{report.marketProphets.headline}</p>
              {report.marketProphets.summary ? (
                <p className="text-zinc-400 text-xs mb-3 leading-relaxed">{report.marketProphets.summary}</p>
              ) : null}
              {report.marketProphets.bullets.length > 0 ? (
                <ul className="space-y-1 mb-3">
                  {report.marketProphets.bullets.slice(0, 6).map((b, i) => (
                    <li key={i} className="text-xs text-zinc-300 font-mono">
                      · {b}
                    </li>
                  ))}
                </ul>
              ) : null}
              <a
                href={report.marketProphets.url}
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 text-xs font-bold uppercase tracking-wider hover:underline"
              >
                Read on marketprophets.io →
              </a>
            </>
          ) : (
            <p className="text-zinc-600 font-mono text-xs">
              DATA UNAVAILABLE — no live edition from Market Prophets this sweep.
            </p>
          )}
        </div>
      )}

      {report && (
        <div className="mt-4 bg-[#1a1a2e] p-5 rounded-lg border border-white/10">
          <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
            <Newspaper size={16} className="text-amber-200" />
            Basic news · free RSS
          </h3>
          <p className="text-zinc-500 text-xs mb-3">
            Sources ok: {report.news.sourcesOk.length ? report.news.sourcesOk.join(" · ") : "none this run"}{" "}
            <span className="text-zinc-600">(tried {report.news.sourcesTried.join(", ") || "none"})</span>
          </p>
          {report.news.items.length === 0 ? (
            <p className="text-zinc-600 font-mono text-xs">DATA UNAVAILABLE — no headlines from free feeds this sweep.</p>
          ) : (
            <ul className="grid md:grid-cols-2 gap-2">
              {report.news.items.slice(0, 12).map((item, i) => (
                <li key={`${item.source}-${i}`} className="text-xs text-zinc-300 border border-white/5 rounded-md px-3 py-2">
                  <span className="text-amber-200/80 font-mono uppercase tracking-wider">{item.source}</span>
                  <span className="block text-white/90 mt-0.5">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {report && (
        <div className="mt-4 bg-[#1a1a2e] p-5 rounded-lg border border-white/10">
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", "forex", "stocks", "indices", "futures", "commodities"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setBucket(id)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                  bucket === id
                    ? "border-amber-400/60 text-amber-200 bg-amber-400/10"
                    : "border-white/15 text-zinc-400 hover:bg-white/5"
                }`}
              >
                {id === "all" ? "All" : BUCKET_LABEL[id]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {rows.map((row) => {
              const open = openId === row.id;
              return (
                <div
                  key={row.id}
                  className={`rounded-lg border ${
                    row.status === "unavailable"
                      ? "border-white/5 bg-black/20"
                      : row.reviewed
                        ? "border-emerald-500/20 bg-black/30"
                        : "border-amber-400/20 bg-black/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : row.id)}
                    className="w-full text-left px-3 py-3 flex flex-wrap items-center gap-3"
                  >
                    <span className="font-mono text-xs text-white font-bold min-w-[9rem]">{row.display}</span>
                    {row.status === "unavailable" ? (
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        DATA UNAVAILABLE{row.unavailableReason ? ` · ${row.unavailableReason}` : ""}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-300">{row.summary}</span>
                    )}
                    {row.reviewed ? (
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-emerald-300">reviewed</span>
                    ) : row.dailyPattern ? (
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-amber-200">needs review</span>
                    ) : (
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-zinc-600">no daily label</span>
                    )}
                  </button>
                  {open && (
                    <div className="px-3 pb-4 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-t border-white/5">
                      <div
                        className="mt-3 rounded-md overflow-hidden border border-white/10 bg-black"
                        dangerouslySetInnerHTML={{ __html: row.snapshotSvg }}
                      />
                      <div className="mt-3 space-y-3">
                        {row.proxyNote && <p className="text-[11px] text-zinc-500">{row.proxyNote}</p>}
                        <HitList
                          title="Daily pattern"
                          items={row.dailyPattern ? [row.dailyPattern] : []}
                          empty="none labeled on completed daily bars"
                        />
                        <HitList title="Sub-patterns (nested)" items={row.subPatterns} empty="none nested inside the daily structure" />
                        <HitList
                          title="Independent / in-between"
                          items={row.independentPatterns}
                          empty="none in the gaps"
                        />
                        {row.status === "ok" && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <input
                              value={notes[row.id] ?? row.reviewNote ?? ""}
                              onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
                              placeholder="Founder note"
                              className="flex-1 min-w-[10rem] bg-black border border-white/15 rounded-md px-2 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => void markRow(row, !row.reviewed)}
                              className="px-3 py-1.5 rounded-md border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                            >
                              <Check size={12} />
                              {row.reviewed ? "Unreview" : "Mark reviewed"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
