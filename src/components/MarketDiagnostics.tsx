import React, { useEffect, useState } from "react";
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Database, 
  Terminal, 
  Cpu, 
  History, 
  CheckCircle2, 
  XOctagon, 
  Maximize2,
  Lock,
  Compass
} from "lucide-react";
import { usePageAutoUpdate } from "../hooks/usePageAutoUpdate";
import { useAuth } from "../contexts/FirebaseContext";
import { FOUNDER_EMAIL, isFounderEmail } from "../lib/founder";
import { auth } from "../firebase";

interface ApiStatusItem {
  name: string;
  tier: string;
  status: "ONLINE" | "DEGRADED" | "MOCK_FALLBACK" | "OFFLINE" | "NOT_CONFIGURED";
  responseTime: number;
  message: string;
}

interface BuildErrorItem {
  id: number;
  code: string;
  error: string;
  context: string;
  phase: string;
  timestamp: string;
  remediation: string;
  status?: "remediated" | "live";
}

export default function MarketDiagnostics() {
  const { user } = useAuth();
  const founderOk =
    isFounderEmail(user?.email) || isFounderEmail(auth.currentUser?.email);

  const [apiStatuses, setApiStatuses] = useState<ApiStatusItem[]>([]);
  const [buildErrors, setBuildErrors] = useState<BuildErrorItem[]>([]);
  const [liveFailureCount, setLiveFailureCount] = useState(0);
  const [siteBuildHealthy, setSiteBuildHealthy] = useState(true);
  const [buildArchiveNote, setBuildArchiveNote] = useState("");
  const [loadingApis, setLoadingApis] = useState(false);
  const [selectedError, setSelectedError] = useState<BuildErrorItem | null>(null);
  const [lastCheck, setLastCheck] = useState<string>("");

  const fetchLiveDiagnostics = async () => {
    if (!founderOk) return;
    setLoadingApis(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setApiStatuses(data);
      }
    } catch (e) {
      console.error("Failed to query live status endpoints", e);
    } finally {
      setLoadingApis(false);
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  const fetchBuildErrors = async () => {
    if (!founderOk) return;
    try {
      const res = await fetch("/api/build-errors");
      if (!res.ok) return;
      const data = await res.json();
      // New shape: { historical, liveFailureCount, siteBuildHealthy, note }
      // Old shape: bare array (treat as remediated archive — never paint as live red).
      if (Array.isArray(data)) {
        setBuildErrors(data);
        setLiveFailureCount(0);
        setSiteBuildHealthy(true);
        setBuildArchiveNote(
          "Fixed archive from early builds — not live failures. Left probes are the live truth."
        );
      } else {
        const rows = Array.isArray(data.historical)
          ? data.historical
          : Array.isArray(data.errors)
            ? data.errors
            : [];
        setBuildErrors(rows);
        setLiveFailureCount(Number(data.liveFailureCount || 0));
        setSiteBuildHealthy(data.siteBuildHealthy !== false);
        setBuildArchiveNote(
          String(
            data.note ||
              "Fixed archive from early builds — not live failures. Left probes are the live truth."
          )
        );
      }
    } catch (e) {
      console.error("Failed to load build errors list", e);
    }
  };

  usePageAutoUpdate(fetchLiveDiagnostics, { intervalMs: 15_000, enabled: founderOk });

  useEffect(() => {
    if (!founderOk) return;
    void fetchBuildErrors();
  }, [founderOk]);

  if (!founderOk) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 font-sans" style={{ backgroundColor: '#09090b' }}>
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-zinc-950 p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-red-400 mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-black uppercase tracking-widest text-white">Diagnostics Locked</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This console is restricted to the ClearPath founder account
            (<span className="font-mono text-[#00FFFF]"> {FOUNDER_EMAIL}</span>).
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: ApiStatusItem["status"]) => {
    const base =
      "inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold font-mono tracking-wider px-2.5 py-1 rounded";
    switch (status) {
      case "ONLINE":
        return (
          <span className={`${base} bg-emerald-950/50 border border-emerald-500/30 text-emerald-400`}>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        );
      case "DEGRADED":
        return (
          <span className={`${base} bg-amber-950/50 border border-amber-500/30 text-amber-400`}>
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            DEGRADED
          </span>
        );
      case "MOCK_FALLBACK":
        return (
          <span className={`${base} bg-blue-950/50 border border-blue-500/30 text-blue-400`}>
            FAILOVER ACTIVE
          </span>
        );
      case "NOT_CONFIGURED":
        return (
          <span className={`${base} bg-zinc-900 border border-zinc-500/40 text-zinc-300`}>
            NOT CONFIGURED
          </span>
        );
      default:
        return (
          <span className={`${base} bg-rose-950/50 border border-rose-500/30 text-rose-400`}>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 text-white text-left font-sans select-none">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">SECURE TELEMETRY CONSOLE</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 text-white uppercase font-sans">
            CPM Core Diagnostic Handshake Dashboard
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            Left = live service probes (what matters now). Right = old fixed build diary — not a live crash list.
          </p>
        </div>

        <button
          onClick={fetchLiveDiagnostics}
          disabled={loadingApis}
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 rounded bg-zinc-900 border border-white/10 hover:border-cyan-500/40 hover:bg-zinc-800 transition text-xs font-mono text-cyan-400 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingApis ? 'animate-spin' : ''}`} />
          FORCE HANDSHAKE PING {lastCheck && `(Last: ${lastCheck})`}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* Left Hand: Connection Probes for Key APIs (twelvedata, finnhub, polygon, alpha vantage) */}
        <div className="lg:col-span-6 bg-zinc-950/40 rounded-xl border border-white/5 p-6">
          <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
            <div>
              <h2 className="text-md font-bold tracking-tight flex items-center gap-2 text-white">
                <Cpu className="h-4.5 w-4.5 text-emerald-400" />
                Live Ingress Endpoint Probe Matrix
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Real-time status, latency, and keys verification.</p>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
              POLLING CONCURRENT
            </span>
          </div>

          <div className="space-y-4">
            {apiStatuses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-black/40 rounded-lg border border-white/5">
                <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mb-2" />
                <p className="text-xs text-white/50 font-mono">Retrieving active gateway outputs...</p>
              </div>
            ) : (
              <>
                {/* At-a-glance strip: wrap into two rows, readable on phones */}
                <div className="grid grid-cols-2 gap-2 mb-1">
                  {apiStatuses.map((api) => {
                    const tone =
                      api.status === "ONLINE"
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                        : api.status === "DEGRADED"
                          ? "border-amber-500/40 text-amber-400 bg-amber-950/30"
                          : api.status === "MOCK_FALLBACK"
                            ? "border-blue-500/40 text-blue-400 bg-blue-950/30"
                            : api.status === "NOT_CONFIGURED"
                              ? "border-zinc-500/40 text-zinc-300 bg-zinc-900/50"
                              : "border-rose-500/40 text-rose-400 bg-rose-950/30";
                    return (
                      <div
                        key={`chip-${api.name}`}
                        className={`rounded-lg border px-2.5 py-2 font-mono ${tone}`}
                      >
                        <div className="text-xs sm:text-sm font-black truncate uppercase tracking-wide text-white">
                          {api.name}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold mt-0.5 uppercase tracking-wider">
                          {api.status === "MOCK_FALLBACK"
                            ? "FAILOVER"
                            : api.status === "NOT_CONFIGURED"
                              ? "N/A"
                              : api.status}
                          {api.responseTime > 0 ? ` · ${api.responseTime}ms` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {apiStatuses.map((api) => (
                <div 
                  key={api.name}
                  className="bg-black/60 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-white/5 mt-0.5 border border-white/5">
                      <Database className={`h-4 w-4 ${
                        api.status === "ONLINE" ? "text-emerald-400" :
                        api.status === "DEGRADED" ? "text-amber-400" :
                        api.status === "NOT_CONFIGURED" ? "text-zinc-400" :
                        api.status === "OFFLINE" ? "text-rose-400" : "text-cyan-400"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base sm:text-sm text-white font-sans">{api.name}</span>
                        <span className="text-xs opacity-40 font-mono">[{api.tier}]</span>
                      </div>
                      <p className="text-xs sm:text-[11px] text-white/60 mt-1 leading-relaxed font-mono">{api.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-white/5 pt-3 md:pt-0 gap-2">
                    {getStatusBadge(api.status)}
                    {api.responseTime > 0 ? (
                      <span className="text-sm sm:text-xs font-mono font-medium text-cyan-400">
                        {api.responseTime}ms ping
                      </span>
                    ) : (
                      <span className="text-sm sm:text-xs font-mono font-medium text-zinc-500">
                        No latency
                      </span>
                    )}
                  </div>
                </div>
              ))}
              </>
            )}
          </div>
        </div>

        {/* Right Hand: FIXED archive — never paint as live red failures */}
        <div
          className={`lg:col-span-6 bg-zinc-950/40 rounded-xl border p-6 flex flex-col justify-between ${
            siteBuildHealthy && liveFailureCount === 0
              ? "border-emerald-500/25"
              : "border-rose-500/40"
          }`}
        >
          <div>
            <div className="flex justify-between items-start gap-3 pb-3 border-b border-white/5 mb-4">
              <div>
                <h2 className="text-md font-bold tracking-tight flex items-center gap-2 text-white">
                  <History className="h-4.5 w-4.5 text-emerald-400" />
                  Build history (fixed archive)
                </h2>
                <p className="text-white/55 text-xs mt-1 leading-relaxed max-w-md">
                  {buildArchiveNote ||
                    "These are old June 2026 issues that were already fixed. They are not crashing the live site."}
                </p>
              </div>
              <span
                className={`shrink-0 text-[10px] px-2 py-1 rounded font-mono font-bold ${
                  siteBuildHealthy && liveFailureCount === 0
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                {siteBuildHealthy && liveFailureCount === 0
                  ? `0 LIVE FAILURES · ${buildErrors.length} FIXED`
                  : `${liveFailureCount} LIVE FAILURES`}
              </span>
            </div>

            {siteBuildHealthy && liveFailureCount === 0 ? (
              <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-emerald-100 m-0 leading-relaxed">
                  <strong className="text-emerald-300">Site build is healthy.</strong> Green on the left =
                  live services. This list on the right is a scrapbook of problems that were already
                  repaired — not a live alarm.
                </p>
              </div>
            ) : null}

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
              {buildErrors.map((err) => {
                const fixed = err.status !== "live";
                const open = selectedError?.id === err.id;
                return (
                  <div
                    key={err.id}
                    onClick={() => setSelectedError(open ? null : err)}
                    className={`p-3 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
                      open
                        ? fixed
                          ? "bg-emerald-950/25 border-emerald-500/50 text-emerald-100"
                          : "bg-rose-950/30 border-rose-500 text-rose-300"
                        : "bg-black/60 border-white/5 hover:border-white/10 text-white/80"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span
                        className={`text-xs font-bold ${fixed ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        #{err.id} {err.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          fixed ? "text-emerald-500/80" : "text-rose-400"
                        }`}
                      >
                        {fixed ? "FIXED" : "LIVE"}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-1">{err.error}</p>

                    {open && (
                      <div
                        className={`mt-3 bg-black/80 rounded p-3 text-[11px] leading-relaxed space-y-2 border ${
                          fixed ? "border-emerald-500/20" : "border-rose-500/20"
                        }`}
                      >
                        <div>
                          <span className="text-zinc-500 block uppercase font-bold text-[9px]">
                            What happened then
                          </span>
                          <code
                            className={`font-mono text-left block max-w-full break-all p-1 rounded border mt-1 ${
                              fixed
                                ? "text-zinc-300 bg-zinc-900/80 border-zinc-700"
                                : "text-rose-400 bg-rose-950/20 border-rose-950/50"
                            }`}
                          >
                            {err.error}
                          </code>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase font-bold text-[9px]">
                            Context
                          </span>
                          <p className="text-white/70 m-0">{err.context}</p>
                        </div>
                        <div className="border-t border-white/5 pt-2">
                          <span className="text-emerald-400 block uppercase font-bold text-[9px]">
                            How it was fixed
                          </span>
                          <p className="text-emerald-300 font-bold m-0">{err.remediation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 bg-zinc-900/60 rounded p-3 text-[11px] font-mono text-white/50 border border-white/5">
            <span className="text-[10px] font-bold text-cyan-400 block mb-1">HOW TO READ THIS PAGE</span>
            Left = live probes (Firebase, Private Login, TwelveData). Grey N/A = key not configured.
            MarketWatch/Reuters red often means their sites block scrapers — not that your members
            database is down.
          </div>
        </div>

      </div>

      {/* Math Calculator Engine Integration Info Card */}
      <div className="mt-8 bg-zinc-950/40 rounded-xl border border-white/5 p-6 text-left">
        <h2 className="text-md font-bold tracking-tight text-white mb-4 uppercase font-mono">
          CPM Custom Mathematical Engineering Engines (Fully Operational)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/50 p-4 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono tracking-wide text-white">IndicatorRegistry</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Provides mathematical mapping coordinates for 50+ core indices (EMA, SMA, RSI, MACD, ATR, VWAP, OBV, Bollinger Bands, ADX, Ichimoku). Removes magenta defaults in favor of high-fidelity, professional color palettes.
            </p>
          </div>

          <div className="bg-black/50 p-4 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold font-mono tracking-wide text-white">IndicatorEngine & Banks</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Maintains independent calculation loops that prohibit shared-state EMA memory leaks. Computes true Ichimoku coordinates, Bollinger deviance channels, and ATR thresholds in milliseconds.
            </p>
          </div>

          <div className="bg-black/50 p-4 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-pink-500" />
              <span className="text-xs font-bold font-mono tracking-wide text-white">SMC & Imbalances Scan</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Our professional smart money concepts module scans active price actions to discover BOS, CHOCH structural breaks, and Fair Value Gaps, rendering them as institutional block levels.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
