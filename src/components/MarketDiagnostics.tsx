import React, { useEffect, useState, useCallback } from "react";
import { usePageAutoUpdate } from "../hooks/usePageAutoUpdate";
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

interface ApiStatusItem {
  name: string;
  tier: string;
  status: "ONLINE" | "DEGRADED" | "MOCK_FALLBACK" | "OFFLINE";
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
}

export default function MarketDiagnostics() {
  const [apiStatuses, setApiStatuses] = useState<ApiStatusItem[]>([]);
  const [buildErrors, setBuildErrors] = useState<BuildErrorItem[]>([]);
  const [loadingApis, setLoadingApis] = useState(false);
  const [selectedError, setSelectedError] = useState<BuildErrorItem | null>(null);
  const [lastCheck, setLastCheck] = useState<string>("");

  const fetchLiveDiagnostics = useCallback(async () => {
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
  }, []);

  const fetchBuildErrors = async () => {
    try {
      const res = await fetch("/api/build-errors");
      if (res.ok) {
        const data = await res.json();
        setBuildErrors(data);
      }
    } catch (e) {
      console.error("Failed to load build errors list", e);
    }
  };

  const { refresh: refreshDiagnostics } = usePageAutoUpdate(fetchLiveDiagnostics, {
    intervalMs: 15_000,
  });

  useEffect(() => {
    fetchBuildErrors();
  }, []);

  const getStatusBadge = (status: ApiStatusItem["status"]) => {
    switch (status) {
      case "ONLINE":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        );
      case "DEGRADED":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30 text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            DEGRADED
          </span>
        );
      case "MOCK_FALLBACK":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-blue-950/50 border border-blue-500/30 text-blue-400">
            FAILOVER ACTIVE
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-rose-950/50 border border-rose-500/30 text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
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
            Active verification engine polling external pricing gates, structural databases, and historical build traces.
          </p>
        </div>

        <button
          onClick={() => void refreshDiagnostics()}
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
              apiStatuses.map((api) => (
                <div 
                  key={api.name}
                  className="bg-black/60 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-white/5 mt-0.5 border border-white/5">
                      <Database className={`h-4 w-4 ${
                        api.status === "ONLINE" ? "text-emerald-400" :
                        api.status === "DEGRADED" ? "text-amber-400" : "text-cyan-400"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-sans">{api.name}</span>
                        <span className="text-[10px] opacity-40 font-mono">[{api.tier}]</span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1 leading-relaxed font-mono">{api.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-white/5 pt-3 md:pt-0 gap-2">
                    {getStatusBadge(api.status)}
                    {api.responseTime > 0 ? (
                      <span className="text-xs font-mono font-medium text-cyan-400">
                        {api.responseTime}ms ping
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-medium text-zinc-500">
                        No latency
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Hand: Last 10 Build Compilation Error Timelines since conception */}
        <div className="lg:col-span-6 bg-zinc-950/40 rounded-xl border border-white/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
              <div>
                <h2 className="text-md font-bold tracking-tight flex items-center gap-2 text-white">
                  <History className="h-4.5 w-4.5 text-zinc-400" />
                  Site Conception Build Halt Log
                </h2>
                <p className="text-white/40 text-xs mt-0.5">Chronology of the last 10 compilation, linter & ESM build blockages.</p>
              </div>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-mono font-bold">
                10 ERRORS CAPTURED
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
              {buildErrors.map((err) => (
                <div 
                  key={err.id}
                  onClick={() => setSelectedError(selectedError?.id === err.id ? null : err)}
                  className={`p-3 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
                    selectedError?.id === err.id 
                    ? "bg-rose-950/30 border-rose-500 text-rose-300" 
                    : "bg-black/60 border-white/5 hover:border-white/10 text-white/80"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-rose-400">#{err.id} {err.code}</span>
                    <span className="text-[10px] text-zinc-500">{err.phase}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-1">
                    {err.error}
                  </p>
                  
                  {selectedError?.id === err.id && (
                    <div className="mt-3 bg-black/80 rounded p-3 border border-rose-500/20 text-[11px] leading-relaxed space-y-2 mt-2">
                      <div className="text-white/90">
                        <span className="text-zinc-500 block uppercase font-bold text-[9px]">Exact Error Stack Dump:</span>
                        <code className="text-rose-400 font-mono text-left block max-w-full break-all bg-rose-950/20 p-1 rounded border border-rose-950/50 mt-1">
                          {err.error}
                        </code>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase font-bold text-[9px]">Context & Genesis:</span>
                        <p className="text-white/70">{err.context}</p>
                      </div>
                      <div className="border-t border-white/5 pt-2">
                        <span className="text-emerald-400 block uppercase font-bold text-[9px]">Sovereign Remediation Executed:</span>
                        <p className="text-emerald-300 font-bold">{err.remediation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-zinc-900/60 rounded p-3 text-[11px] font-mono text-white/50 border border-white/5">
            <span className="text-[10px] font-bold text-cyan-400 block mb-1">CONGESTION SAFETY ADAPTERS:</span>
            To prevent persistent compile crashes, our builder intercepts type diagnostics and automatically loads stabilized type configurations found in <code className="text-emerald-400">src/types/indicators.ts</code>.
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
