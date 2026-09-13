import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Check,
  ClipboardList,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

type AutoCheck = {
  id: string;
  ok: boolean;
  severity: "critical" | "warn" | "info";
  detail: string;
  latencyMs?: number;
};

type CatalogItem = {
  id: string;
  title: string;
  why: string;
  kind: "auto" | "human";
  cadence: string;
  survival?: boolean;
  section: string;
  input?: "text";
};

type HumanState = { done: boolean; note?: string; at?: string };

type InvestorResearch = {
  date: string;
  investor: {
    id: string;
    name: string;
    kind: string;
    website: string;
    linkedin?: string;
    outreachHint?: string;
    stage: string;
    thesis: string;
    whyClearPath: string;
    suggestedAngle: string;
  };
  wikiExtract?: string;
  wikiUrl?: string;
  siteTitle?: string;
  siteDescription?: string;
  groqFit?: string;
  sources: string[];
  draftNote: string;
  warnings: string[];
};

export type DailyOpsReport = {
  date: string;
  ranAt: string;
  overall: "green" | "yellow" | "red";
  auto: AutoCheck[];
  items: CatalogItem[];
  human: Record<string, HumanState>;
  investor: InvestorResearch | null;
  investorCatalog?: Array<{ id: string; name: string; kind: string; stage: string }>;
  pipeline: Array<{ investorId: string; status: string; notes?: string }>;
  shipped: Array<{ id: string; title: string; evidence: string }>;
  openWork: Array<{ id: string; title: string; why: string }>;
  nextDueHint: string;
  siteStatus?: "green" | "yellow" | "red";
  failingAuto?: string[];
};

const SECTION_LABEL: Record<string, string> = {
  site: "Site",
  marketing: "Marketing",
  outreach: "Outreach",
  business: "Business",
  personal: "Personal",
  eod: "End of day",
};

function badge(ok: boolean, severity: string) {
  if (ok && severity !== "warn") return "text-emerald-300 bg-emerald-500/15 border-emerald-500/40";
  if (severity === "warn") return "text-amber-300 bg-amber-500/15 border-amber-500/40";
  return "text-red-300 bg-red-500/15 border-red-500/40";
}

export default function DailyOpsDesk({
  getHeaders,
  kickEveryone,
}: {
  getHeaders: () => Promise<Record<string, string>>;
  kickEveryone?: {
    busy: boolean;
    message: string | null;
    onKick: () => void;
  };
}) {
  const [report, setReport] = useState<DailyOpsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [survivalOnly, setSurvivalOnly] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [investorNotes, setInvestorNotes] = useState("");
  const [showShipped, setShowShipped] = useState(false);
  const [pinId, setPinId] = useState("baird_augustine");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-ops", { headers, credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setReport(null);
        setError(body.message || "No report yet — tap Run today’s sweep.");
        return;
      }
      if (!res.ok) throw new Error(body.message || body.error || `Unavailable (${res.status})`);
      setReport(body as DailyOpsReport);
    } catch (e: any) {
      setError(e?.message || "Failed to load Daily Ops");
    } finally {
      setLoading(false);
    }
  };

  const runNow = async () => {
    setBusy(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-ops/run", {
        method: "POST",
        headers,
        credentials: "include",
        body: "{}",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Sweep failed (${res.status})`);
      setReport(body as DailyOpsReport);
    } catch (e: any) {
      setError(e?.message || "Sweep failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = async (item: CatalogItem, done: boolean) => {
    if (!report) return;
    const note = drafts[item.id] ?? report.human[item.id]?.note ?? "";
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-ops/complete", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ itemId: item.id, done, note }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Save failed");
      setReport(body as DailyOpsReport);
    } catch (e: any) {
      setError(e?.message || "Could not save checkbox");
    }
  };

  const markInvestor = async (status: "contacted" | "skipped" | "followup") => {
    if (!report?.investor) return;
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-ops/investor", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          investorId: report.investor.investor.id,
          status,
          notes: investorNotes,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Pipeline save failed");
      setReport(body as DailyOpsReport);
    } catch (e: any) {
      setError(e?.message || "Could not update investor pipeline");
    }
  };

  const pinInvestor = async () => {
    const query = pinId.trim();
    if (!query) return;
    setBusy(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/daily-ops/investor/research", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ investorId: query }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Research failed");
      setReport(body as DailyOpsReport);
    } catch (e: any) {
      setError(e?.message || "Could not research that name");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const humanItems = useMemo(() => {
    const list = (report?.items || []).filter((i) => i.kind === "human");
    return survivalOnly ? list.filter((i) => i.survival) : list;
  }, [report, survivalOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of humanItems) {
      const arr = map.get(item.section) || [];
      arr.push(item);
      map.set(item.section, arr);
    }
    return map;
  }, [humanItems]);

  const doneCount = humanItems.filter((i) => report?.human[i.id]?.done).length;
  const autoFail = report?.auto.filter((c) => !c.ok && c.severity === "critical").length || 0;
  const autoWarn = report?.auto.filter((c) => c.severity === "warn" || (!c.ok && c.severity !== "critical")).length || 0;

  return (
    <div className="space-y-8">
      <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#00FFFF]/30 shadow-[0_0_18px_rgba(0,255,255,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[#00FFFF] text-xl font-bold uppercase mb-1 flex items-center gap-2">
              <ClipboardList size={20} />
              Daily Ops — {report?.date || "today (Pacific)"}
            </h2>
            <p className="text-white/55 text-sm max-w-2xl">
              Site health is automatic (live HTTP, secrets, Groq, Stripe, GitHub). Your boxes are a
              separate todo list — they never turn the banner red. Investor research is copy-draft
              only. Nothing auto-emails. Website service: clear-path-markets-science in europe-west1
              (Belgium). Do not Edit & deploy clearpath-voice-os unless you mean Ava.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {kickEveryone ? (
              <button
                type="button"
                data-ceo-kick-sessions
                disabled={kickEveryone.busy}
                onClick={kickEveryone.onKick}
                className="px-3 py-2 rounded-md border border-amber-500/50 bg-amber-500/15 text-amber-100 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/25 disabled:opacity-50"
              >
                {kickEveryone.busy ? "Signing everyone out…" : "Force everyone out"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setSurvivalOnly((v) => !v)}
              className={`px-3 py-2 rounded-md border text-xs font-bold uppercase tracking-wider ${
                survivalOnly
                  ? "border-[#FF00FF]/50 text-[#FF00FF] bg-[#FF00FF]/10"
                  : "border-white/20 text-white/80 hover:bg-white/5"
              }`}
            >
              {survivalOnly ? "Low-energy day" : "Back to survival set"}
            </button>
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
              className="px-3 py-2 rounded-md border border-[#00FFFF]/50 text-[#00FFFF] text-xs font-bold uppercase tracking-wider hover:bg-[#00FFFF]/10 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
              Run today’s sweep
            </button>
          </div>
        </div>

        {kickEveryone?.message ? (
          <p className="text-amber-100 text-sm mb-3 font-mono whitespace-pre-wrap">{kickEveryone.message}</p>
        ) : null}
        {error && <p className="text-amber-300 text-sm mb-3 font-mono">{error}</p>}

        {loading && !report ? (
          <p className="text-white/50 font-mono text-xs">Loading…</p>
        ) : report ? (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span
              className={`px-3 py-1 rounded font-black uppercase tracking-widest text-xs border ${
                (report.siteStatus || report.overall) === "green"
                  ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/40"
                  : (report.siteStatus || report.overall) === "yellow"
                    ? "text-amber-300 bg-amber-500/15 border-amber-500/40"
                    : "text-red-300 bg-red-500/15 border-red-500/40"
              }`}
            >
              site {report.siteStatus || report.overall}
            </span>
            <span className="text-white/70 font-mono text-xs flex items-center gap-1">
              <Activity size={12} />
              {(report.failingAuto && report.failingAuto.length
                ? report.failingAuto.join(" · ")
                : autoFail + autoWarn === 0
                  ? "all auto checks ok"
                  : `auto critical=${autoFail} warn=${autoWarn}`) as string}
            </span>
            <span className="text-white/70 font-mono text-xs flex items-center gap-1">
              <Check size={12} /> todo {doneCount}/{humanItems.length}
              {survivalOnly ? " survival" : " full"}
            </span>
            <span className="text-white/45 font-mono text-xs">{report.nextDueHint}</span>
          </div>
        ) : null}
      </div>

      {report && (
        <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#FF4500]" />
              Automated site checks
            </h3>
            {kickEveryone ? (
              <button
                type="button"
                data-ceo-kick-sessions
                disabled={kickEveryone.busy}
                onClick={kickEveryone.onKick}
                className="px-3 py-2 rounded-md border border-amber-500/50 bg-amber-500/15 text-amber-100 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/25 disabled:opacity-50"
              >
                {kickEveryone.busy ? "Signing everyone out…" : "Force everyone out"}
              </button>
            ) : null}
          </div>
          <p className="text-zinc-500 text-xs mb-4 max-w-3xl">
            Live HTTP / secrets / Groq / Stripe / GitHub from the process serving right now.
            A GitHub “deploy” can mint a named revision while traffic stays pinned — keep{" "}
            <span className="text-zinc-300">LATEST</span>, then tap Run today’s sweep. Ava
            (clearpath-voice-os) is not this repo; missing Twilio is not a trader outage.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white/80 text-sm">
              <thead className="bg-black/40 text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Check</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {report.auto.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-3 py-2 font-medium font-mono text-xs">{c.id.replace(/^auto_/, "")}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${badge(c.ok, c.severity)}`}>
                        {c.ok ? (c.severity === "warn" ? "warn" : "ok") : c.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                      {c.detail}
                      {typeof c.latencyMs === "number" ? ` (${c.latencyMs}ms)` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report && (
        <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#FF00FF]/25">
          <h3 className="text-[#FF00FF] font-black uppercase tracking-widest text-sm mb-1 flex items-center gap-2">
            <Building2 size={16} />
            Today’s investor — {report.investor?.investor.name || "none yet"}
          </h3>
          <p className="text-white/50 text-xs font-mono mb-3">
            {report.investor
              ? `${report.investor.investor.kind} · ${report.investor.investor.stage} · sources: ${report.investor.sources.join(", ")}`
              : "Pin a name from the catalog, or run today’s sweep."}
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <select
              value={pinId}
              onChange={(e) => setPinId(e.target.value)}
              className="flex-1 min-w-[220px] bg-black/50 border border-white/15 rounded-md px-3 py-2 text-xs text-white"
            >
              {(report.investorCatalog || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.kind})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void pinInvestor()}
              disabled={busy || !pinId}
              className="px-3 py-2 rounded-md border border-[#FF00FF]/40 text-[#FF00FF] text-xs font-bold uppercase disabled:opacity-50"
            >
              Research this name
            </button>
          </div>
          {report.investor ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-sm text-white/80">
              <p>
                <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">Website</span>
                <a className="text-[#00FFFF] underline" href={report.investor.investor.website} target="_blank" rel="noreferrer">
                  {report.investor.investor.website}
                </a>
              </p>
              {report.investor.investor.linkedin && (
                <p>
                  <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">LinkedIn</span>
                  <a className="text-[#00FFFF] underline" href={report.investor.investor.linkedin} target="_blank" rel="noreferrer">
                    {report.investor.investor.linkedin}
                  </a>
                </p>
              )}
              {report.investor.investor.outreachHint && (
                <p>
                  <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">How to reach (do not auto-send)</span>
                  {report.investor.investor.outreachHint}
                </p>
              )}
              <p>
                <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">Our seed thesis</span>
                {report.investor.investor.thesis}
              </p>
              <p>
                <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">Why ClearPath</span>
                {report.investor.investor.whyClearPath}
              </p>
              <p>
                <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">Suggested angle</span>
                {report.investor.investor.suggestedAngle}
              </p>
              {report.investor.wikiExtract && (
                <p>
                  <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">Wikipedia</span>
                  {report.investor.wikiExtract}
                  {report.investor.wikiUrl && (
                    <>
                      {" "}
                      <a className="text-[#00FFFF] underline" href={report.investor.wikiUrl} target="_blank" rel="noreferrer">
                        source
                      </a>
                    </>
                  )}
                </p>
              )}
              {(report.investor.siteTitle || report.investor.siteDescription) && (
                <p>
                  <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">Homepage</span>
                  {report.investor.siteTitle}
                  {report.investor.siteDescription ? ` — ${report.investor.siteDescription}` : ""}
                </p>
              )}
              {report.investor.groqFit && (
                <p>
                  <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block">
                    Groq summary of those sources only
                  </span>
                  {report.investor.groqFit}
                </p>
              )}
              {report.investor.warnings.length > 0 && (
                <p className="text-amber-300 font-mono text-xs">{report.investor.warnings.join(" · ")}</p>
              )}
            </div>
            <div>
              <span className="text-zinc-500 uppercase text-[10px] font-black tracking-widest block mb-2">
                Draft letter — copy, then send yourself
              </span>
              <textarea
                readOnly
                value={report.investor.draftNote}
                className="w-full min-h-[28rem] h-[32rem] bg-black/50 border border-white/15 rounded-md p-3 text-xs font-mono text-zinc-200 whitespace-pre-wrap"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(report.investor!.draftNote);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      setError("Clipboard blocked — copy from the box.");
                    }
                  }}
                  className="px-3 py-2 rounded-md border border-[#00FFFF]/40 text-[#00FFFF] text-xs font-bold uppercase"
                >
                  {copied ? "Copied" : "Copy letter"}
                </button>
                <input
                  value={investorNotes}
                  onChange={(e) => setInvestorNotes(e.target.value)}
                  placeholder="Your send notes (optional)"
                  className="flex-1 min-w-[140px] bg-black/40 border border-white/15 rounded-md px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => void markInvestor("contacted")}
                  className="px-3 py-2 rounded-md border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase"
                >
                  Mark sent
                </button>
                <button
                  type="button"
                  onClick={() => void markInvestor("skipped")}
                  className="px-3 py-2 rounded-md border border-white/20 text-white/70 text-xs font-bold uppercase"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
          ) : (
            <p className="text-white/45 text-xs">
              No researched note yet — pick a name and tap Research this name. Nothing auto-emails.
            </p>
          )}
        </div>
      )}

      {report && (
        <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10">
          <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1 flex items-center gap-2">
            <HeartPulse size={16} className="text-[#39FF14]" />
            Human list for today
          </h3>
          <p className="text-white/45 text-xs mb-5">
            Survival set (default): site walk, money glance, one outreach, one investor note.
            The rest is parked behind “Low-energy day”. Unchecked todos never mean the site is down.
          </p>
          {[...grouped.entries()].map(([section, items]) => (
            <div key={section} className="mb-6">
              <h4 className="text-[#00FFFF] text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                {SECTION_LABEL[section] || section}
              </h4>
              <ul className="space-y-2">
                {items.map((item) => {
                  const state = report.human[item.id];
                  return (
                    <li
                      key={item.id}
                      className="border border-white/10 rounded-md px-3 py-3 bg-black/20"
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(state?.done)}
                          onChange={(e) => void toggleItem(item, e.target.checked)}
                          className="mt-1"
                        />
                        <span className="flex-1">
                          <span className="text-white text-sm font-semibold block">{item.title}</span>
                          <span className="text-zinc-500 text-xs block">{item.why}</span>
                          {item.input === "text" && (
                            <input
                              value={drafts[item.id] ?? state?.note ?? ""}
                              onChange={(e) =>
                                setDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                              }
                              onBlur={() => void toggleItem(item, Boolean(state?.done) || Boolean((drafts[item.id] || state?.note || "").trim()))}
                              placeholder="Type here, then tab out to save"
                              className="mt-2 w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-xs text-white"
                            />
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1a2e] p-6 rounded-lg border border-amber-500/20">
            <h3 className="text-amber-200 font-black uppercase tracking-widest text-sm mb-2">
              Still open on the site
            </h3>
            <p className="text-zinc-500 text-xs mb-3">
              Backlog / ops checklist — not the same as the auto-check table above. These stay
              listed until you finish the action (Firebase deploy, Flow uploads, build Ava, etc.).
              Merging a PR alone will not clear this panel.
            </p>
            <ul className="space-y-3">
              {report.openWork.map((w) => (
                <li key={w.id}>
                  <span className="text-white text-sm font-semibold block">{w.title}</span>
                  <span className="text-zinc-500 text-xs">{w.why}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setShowShipped((v) => !v)}
              className="text-zinc-300 font-black uppercase tracking-widest text-sm mb-3"
            >
              Already shipped as of 18 Aug 2026 {showShipped ? "▾" : "▸"}
            </button>
            {showShipped && (
              <ul className="space-y-2">
                {report.shipped.map((s) => (
                  <li key={s.id} className="text-zinc-400 text-xs">
                    <span className="text-emerald-300 font-semibold">{s.title}</span>
                    <span className="block font-mono text-[10px] text-zinc-600">{s.evidence}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
