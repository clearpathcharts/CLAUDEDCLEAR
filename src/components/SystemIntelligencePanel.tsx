import React, { useEffect, useState } from 'react';
import { DataStreamService, TwelveDataHealthClient, HealthEvent } from '../services/dataStreamService';
import { Activity, ShieldCheck, AlertTriangle, Radio, RefreshCw, Layers, Terminal, ChevronDown, ChevronUp, Database } from 'lucide-react';

export default function SystemIntelligencePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<TwelveDataHealthClient>(() => DataStreamService.getLatestHealth());
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // Subscribe to live telemetry and log stream changes in the gateway
    const unsubscribe = DataStreamService.subscribeToHealth((latest) => {
      setHealth(latest);
    });
    return () => unsubscribe();
  }, []);

  const handleForceCheck = async () => {
    setToggling(true);
    try {
      await DataStreamService.queryBackendHealth();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setToggling(false), 800);
    }
  };

  const getEventBadgeClass = (type: HealthEvent['type']) => {
    switch (type) {
      case 'SUCCESS':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'WARNING':
        return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'ERROR':
        return 'text-rose-400 border-rose-500/30 bg-rose-950/40';
      case 'FALLBACK':
        return 'text-pink-400 border-pink-500/30 bg-pink-950/20';
      default:
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20';
    }
  };

  const displayEvents = (health.events || []).slice(0, 5);

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString();
    } catch {
      return isoString;
    }
  };

  const isMock = health.status === 'MOCK_FALLBACK' || health.fallbackMode;

  return (
    <div id="anchored-system-intelligence-panel" className="w-full px-6 lg:px-12 mb-6">
      <div className="border border-white/10 bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        
        {/* Core Inline Status Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 gap-4 border-b border-white/5 bg-zinc-950/60 select-none">
          
          {/* Diagnostic Label */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-[#7F00FF]'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${health.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-[#7F00FF]'}`}></span>
            </span>
            <div className="text-left">
              <span className="text-[9px] font-mono font-black text-zinc-500 tracking-[0.2em] uppercase block">
                INGRESS MONITOR
              </span>
              <h4 className="text-xs font-black font-mono text-white tracking-widest uppercase flex items-center gap-2">
                <span>TWELVE DATA TERMINAL SYSTEMS</span>
                <span className="text-[9px] font-normal text-[#7F00FF] px-1.5 py-0.2 border border-[#7F00FF]/40 rounded self-center font-sans tracking-normal">v5.0-PRO</span>
              </h4>
            </div>
          </div>

          {/* Quick Metrics — always two rows of two (never one endless strip) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full md:w-auto text-left text-sm font-mono">
            
            {/* status */}
            <div className="min-w-0">
              <span className="text-zinc-400 text-[11px] sm:text-xs uppercase font-bold block tracking-wide">CONNECTION STATE</span>
              <span className={`font-black uppercase tracking-wider text-sm sm:text-base ${health.status === 'HEALTHY' ? 'text-emerald-400' : 'text-[#7F00FF]'}`}>
                {health.status === 'HEALTHY' ? 'LIVE SYNCED' : 'FAILOVER CACHE'}
              </span>
            </div>

            {/* TwelveData market API key — NOT private-login credentials */}
            <div className="min-w-0">
              <span className="text-zinc-400 text-[11px] sm:text-xs uppercase font-bold block tracking-wide">MARKET API KEY</span>
              <span className={`font-black flex items-center gap-1 text-sm sm:text-base ${health.apiKeyPresent ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {health.apiKeyPresent ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                    <span>LOADED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline mr-0.5 shrink-0" />
                    <span className="text-amber-500">NOT SET</span>
                  </>
                )}
              </span>
            </div>

            {/* latency */}
            <div className="min-w-0">
              <span className="text-zinc-400 text-[11px] sm:text-xs uppercase font-bold block tracking-wide">PIPELINE LATENCY</span>
              <span className="text-cyan-400 font-extrabold text-sm sm:text-base">{health.latencyMs || 24}ms</span>
            </div>

            {/* quota */}
            <div className="min-w-0">
              <span className="text-zinc-400 text-[11px] sm:text-xs uppercase font-bold block tracking-wide">API ALLOWANCE</span>
              <span className="text-white font-bold text-sm sm:text-base">{health.rateLimitRemaining || '8'} / {health.rateLimitLimit || '8'} REQS</span>
            </div>

          </div>

          {/* Action Controllers */}
          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={handleForceCheck}
              disabled={toggling}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-black border border-white/10 uppercase cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${toggling ? 'animate-spin text-cyan-400' : ''}`} />
              <span>TEST LINK</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7F00FF]/15 hover:bg-[#7F00FF]/30 text-[#A855F7] hover:text-white rounded text-[10px] font-black border border-[#7F00FF]/30 uppercase cursor-pointer transition-all"
            >
              <span>{isOpen ? 'HIDE LOGS' : 'VIEW TRACE'}</span>
              {isOpen ? <ChevronUp className="w-3" /> : <ChevronDown className="w-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Logs Panel */}
        {isOpen && (
          <div className="p-5 bg-black/90 border-t border-white/5 text-left font-mono text-[11px] animate-in slide-in-from-top-4 duration-200">
            
            {/* Guide message if API Key is missing */}
            {!health.apiKeyPresent && (
              <div className="mb-4 p-3 border border-amber-500/20 bg-amber-500/10 rounded-xl leading-relaxed text-amber-300">
                <span className="font-extrabold uppercase block text-[10px] text-amber-400 tracking-wider mb-0.5">⚠️ LIVE DATA CONFIGURATION REQUIRED:</span>
                Your site is currently using the <strong className="text-white">Active Failover Cache Pipeline</strong> because no active <strong className="font-bold text-white">TWELVEDATA_API_KEY</strong> environment secret was detected in your app setup. Specify your real API variable in the top-right Settings menu inside AI Studio to stream live institutional exchange rates instantly.
              </div>
            )}

            {/* Error alerts if active */}
            {health.lastError && (
              <div className="mb-4 p-3 border border-rose-500/30 bg-rose-550/10 rounded-xl text-rose-400 leading-relaxed break-words">
                <span className="font-extrabold uppercase block text-[10px] text-rose-500 tracking-wider mb-0.5">Active Ingress Outage Logs:</span>
                {health.lastError}
              </div>
            )}

            {/* Trace Event Streams */}
            <div>
              <div className="font-extrabold uppercase text-zinc-500 text-[10px] tracking-wider mb-2.5 flex items-center justify-between">
                <span>Ingress Event Sequence Log (Realtime)</span>
                <span className="text-[9px] font-normal text-zinc-600">LAST 10 TRACE SIGNALS</span>
              </div>

              {displayEvents.length === 0 ? (
                <div className="py-4 text-center text-zinc-600 uppercase italic">
                  Ingress sequences clear. Waiting for connection events...
                </div>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {displayEvents.map((evt, idx) => (
                    <div key={idx} className="p-2.5 rounded border border-white/5 bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-1 rounded text-[8px] font-bold border shrink-0 ${getEventBadgeClass(evt.type)}`}>
                          {evt.type}
                        </span>
                        <span className="text-zinc-300 leading-relaxed pr-2 break-all">{evt.message}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 shrink-0 self-end sm:self-center">{formatTimestamp(evt.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
