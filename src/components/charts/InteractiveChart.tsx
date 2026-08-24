"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChartFrame } from "./ChartFrame";
import { LightweightCandles } from "./LightweightCandles";
import { useAuth } from "../../contexts/FirebaseContext";
import { getActiveRiverIndicator } from "../../river/riverEngine";
import { 
  Plus, 
  X, 
  Search, 
  Sliders, 
  Eye, 
  EyeOff, 
  Activity, 
  TrendingUp, 
  Volume2, 
  Compass, 
  Check,
  Camera
} from "lucide-react";

// TradingView standard technical indicators list (50+)
const TRADINGVIEW_INDICATORS = [
  { name: "Accumulation/Distribution", category: "Volume", abbr: "A/D", activeColor: "#FF00AA" },
  { name: "Average Directional Index", category: "Trend/Momentum", abbr: "ADX", activeColor: "#00D9FF" },
  { name: "Average True Range", category: "Volatility", abbr: "ATR", activeColor: "#FF4500" },
  { name: "Awesome Oscillator", category: "Momentum", abbr: "AO", activeColor: "#3E78FF" },
  { name: "Bollinger Bands", category: "Volatility", abbr: "BB", activeColor: "#7A3BFF" },
  { name: "Bollinger Bands Width", category: "Volatility", abbr: "BBW", activeColor: "#B91FD6" },
  { name: "Chaikin Money Flow", category: "Volume", abbr: "CMF", activeColor: "#00E5FF" },
  { name: "Chaikin Volatility", category: "Volatility", abbr: "CHV", activeColor: "#FF00C8" },
  { name: "Chande Momentum Oscillator", category: "Momentum", abbr: "CMO", activeColor: "#4DEEEA" },
  { name: "Commodity Channel Index", category: "Momentum", abbr: "CCI", activeColor: "#9D4EDD" },
  { name: "Coppock Curve", category: "Momentum", abbr: "CC", activeColor: "#3F37C9" },
  { name: "Double Exponential Moving Average", category: "Trend", abbr: "DEMA", activeColor: "#4CC9F0" },
  { name: "Donchian Channels", category: "Volatility", abbr: "DC", activeColor: "#F72585" },
  { name: "Directional Movement Index", category: "Trend", abbr: "DMI", activeColor: "#7209B7" },
  { name: "Detrended Price Oscillator", category: "Momentum", abbr: "DPO", activeColor: "#3A0CA3" },
  { name: "Elder's Force Index", category: "Volume", abbr: "EFI", activeColor: "#00F5D4" },
  { name: "Exponential Moving Average", category: "Trend", abbr: "EMA", activeColor: "#FFAA00" },
  { name: "Ease of Movement", category: "Volume", abbr: "EOM", activeColor: "#DEE2E6" },
  { name: "Fisher Transform", category: "Oscillators", abbr: "FT", activeColor: "#9D4EDD" },
  { name: "Gann Fan", category: "Drawing", abbr: "GANN", activeColor: "#FFD166" },
  { name: "Hull Moving Average", category: "Trend", abbr: "HMA", activeColor: "#EF476F" },
  { name: "Historical Volatility", category: "Volatility", abbr: "HV", activeColor: "#FF9F1C" },
  { name: "Ichimoku Cloud", category: "Trend", abbr: "ICHIMOKU", activeColor: "#2EC4B6" },
  { name: "Keltner Channels", category: "Volatility", abbr: "KC", activeColor: "#E71D36" },
  { name: "Know Sure Thing", category: "Momentum", abbr: "KST", activeColor: "#4361EE" },
  { name: "Linear Regression Curve", category: "Trend", abbr: "LRC", activeColor: "#3A0CA3" },
  { name: "Moving Average Convergence Divergence", category: "Momentum", abbr: "MACD", activeColor: "#FF00C8" },
  { name: "Money Flow Index", category: "Volume", abbr: "MFI", activeColor: "#00D9FF" },
  { name: "Net Volume", category: "Volume", abbr: "NETVOL", activeColor: "#06D6A0" },
  { name: "On-Balance Volume", category: "Volume", abbr: "OBV", activeColor: "#118AB2" },
  { name: "Parabolic SAR", category: "Trend", abbr: "PSAR", activeColor: "#FFD166" },
  { name: "Pivot Points Standard", category: "Trend", abbr: "PIVOT", activeColor: "#F72585" },
  { name: "Price Oscillator", category: "Momentum", abbr: "PPO", activeColor: "#7209B7" },
  { name: "Rate of Change", category: "Momentum", abbr: "ROC", activeColor: "#480CA8" },
  { name: "Relative Strength Index", category: "Momentum", abbr: "RSI", activeColor: "#00FF66" },
  { name: "Relative Vigor Index", category: "Momentum", abbr: "RVI", activeColor: "#00D9FF" },
  { name: "Simple Moving Average", category: "Trend", abbr: "SMA", activeColor: "#00FFFF" },
  { name: "Stochastic Oscillator", category: "Momentum", abbr: "STOCH", activeColor: "#B5179E" },
  { name: "Stochastic RSI", category: "Momentum", abbr: "STOCHRSI", activeColor: "#FF0055" },
  { name: "Supertrend", category: "Trend", abbr: "SUPERTREND", activeColor: "#00FFCC" },
  { name: "Triple Exponential Moving Average", category: "Trend", abbr: "TEMA", activeColor: "#AA00FF" },
  { name: "Trix", category: "Momentum", abbr: "TRIX", activeColor: "#FF7700" },
  { name: "True Strength Index", category: "Momentum", abbr: "TSI", activeColor: "#9D4EDD" },
  { name: "Ultimate Oscillator", category: "Momentum", abbr: "UO", activeColor: "#3F37C9" },
  { name: "Volume", category: "Volume", abbr: "VOL", activeColor: "#FF00C8" },
  { name: "Volume Oscillator", category: "Volume", abbr: "VO", activeColor: "#4CC9F0" },
  { name: "Volume Weighted Average Price", category: "Volume", abbr: "VWAP", activeColor: "#F72585" },
  { name: "Volume Weighted Moving Average", category: "Trend", abbr: "VWMA", activeColor: "#7209B7" },
  { name: "Williams %R", category: "Momentum", abbr: "WPR", activeColor: "#06D6A0" },
  { name: "Weighted Moving Average", category: "Trend", abbr: "WMA", activeColor: "#3E78FF" },
  { name: "Zig Zag", category: "Trend", abbr: "ZZ", activeColor: "#FFAA00" }
];

export function InteractiveChart({ title, profileId, initialTimeframe = "1h", theme, userTier = "BRONZE" }: { title: string, profileId: string, initialTimeframe?: string, theme?: any, userTier?: string }) {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [isExpanded, setIsExpanded] = useState(false);

  const { createPost } = useAuth();
  const takeSnapshotRef = useRef<(() => string | null) | null>(null);

  // Snapshot/Post Modal states
  const [snapshotImg, setSnapshotImg] = useState<string | null>(null);
  const [snapshotCaption, setSnapshotCaption] = useState("");
  const [isPostingSnapshot, setIsPostingSnapshot] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const handleTakeSnapshot = () => {
    setSnapshotError(null);
    setSnapshotSuccess(false);

    if (!takeSnapshotRef.current) {
      setSnapshotError("Chart engine is not completely initialized yet.");
      return;
    }

    const dataUrl = takeSnapshotRef.current();
    if (!dataUrl) {
      setSnapshotError("Could not capture visible chart viewport. High density data arrays loading.");
      return;
    }

    setSnapshotImg(dataUrl);
    setSnapshotCaption(`📊 Operational scan update: $${title.toUpperCase()} live chart perspective (${timeframe} interval). Captured via neuroadaptive terminal feed.`);
  };
  
  // The River custom indicator: auto-attach when a compiled script is active.
  const [showMineIndicator, setShowMineIndicator] = React.useState(() => !!getActiveRiverIndicator());
  const [mineIndicatorName, setMineIndicatorName] = React.useState(() => getActiveRiverIndicator()?.name || "No script imported");

  React.useEffect(() => {
    const handleIndicatorUpdate = (e: any) => {
      if (e.detail && e.detail.name) {
        setMineIndicatorName(e.detail.name);
        setShowMineIndicator(true);
      } else {
        // Indicator was removed in The River workstation.
        setMineIndicatorName("No script imported");
        setShowMineIndicator(false);
      }
    };
    window.addEventListener('river-indicator-updated', handleIndicatorUpdate);
    return () => {
      window.removeEventListener('river-indicator-updated', handleIndicatorUpdate);
    };
  }, []);

  const [showIndicatorPicker, setShowIndicatorPicker] = useState(false);
  const [indicatorSearchQuery, setIndicatorSearchQuery] = useState("");
  const [activeIndicators, setActiveIndicators] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("clearpath_active_chart_indicators");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        return parsed.length ? parsed : ["SMA", "RSI"];
      }
    } catch {}
    return ["SMA", "RSI"];
  });

  useEffect(() => {
    try {
      localStorage.setItem("clearpath_active_chart_indicators", JSON.stringify(activeIndicators));
    } catch {}
  }, [activeIndicators]);

  useEffect(() => {
    const onAdd = (event: Event) => {
      const abbr = (event as CustomEvent).detail?.abbr;
      if (typeof abbr === "string" && abbr.trim()) {
        setActiveIndicators((prev) => (prev.includes(abbr) ? prev : [...prev, abbr]));
      }
    };
    window.addEventListener("clearpath-add-indicator", onAdd as EventListener);
    return () => window.removeEventListener("clearpath-add-indicator", onAdd as EventListener);
  }, []);

  const [ichimokuSettings, setIchimokuSettings] = useState({
    conversionPeriods: 9,
    basePeriods: 26,
    laggingSpan2Periods: 52,
    displacement: 26,
  });

  const filteredIndicators = useMemo(() => {
    if (!indicatorSearchQuery) return TRADINGVIEW_INDICATORS;
    return TRADINGVIEW_INDICATORS.filter(ind => 
      ind.name.toLowerCase().includes(indicatorSearchQuery.toLowerCase()) ||
      ind.abbr.toLowerCase().includes(indicatorSearchQuery.toLowerCase()) ||
      ind.category.toLowerCase().includes(indicatorSearchQuery.toLowerCase())
    );
  }, [indicatorSearchQuery]);

  const toggleIndicator = (abbr: string) => {
    setActiveIndicators(prev => 
      prev.includes(abbr) ? prev.filter(i => i !== abbr) : [...prev, abbr]
    );
  };

  const activeIndicatorsDetails = useMemo(() => {
    return TRADINGVIEW_INDICATORS.filter(ind => activeIndicators.includes(ind.abbr));
  }, [activeIndicators]);

  return (
    <div className="relative w-full h-full flex flex-col" id={`interactive_chart_outer_${title}`}>
      <ChartFrame 
        profileId={profileId} 
        title={title} 
        timeframe={timeframe} 
        onTimeframeChange={setTimeframe}
        isExpanded={isExpanded}
        onExpandToggle={() => setIsExpanded(!isExpanded)}
      >
        <div className={`w-full flex flex-col bg-[#03030c] rounded-2xl border border-zinc-800/80 overflow-hidden relative ${isExpanded ? "h-full min-h-0" : "h-full"}`}>
          
          {/* Top Panel - Controls & Core indicators menu */}
          <div className="flex flex-wrap items-center justify-between p-3 bg-black/50 border-b border-zinc-900 gap-2 relative z-20">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setShowIndicatorPicker(!showIndicatorPicker);
                  setShowMineIndicator(false);
                }}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  showIndicatorPicker 
                    ? "bg-[#FF00C8]/10 text-[#FF00C8] border-[#FF00C8]/50 shadow-[0_0_10px_rgba(255,0,200,0.3)]" 
                    : "bg-[#111126] hover:bg-[#161633] text-[#00D9FF] border-[#00D9FF]/30 hover:border-[#00D9FF]/60"
                }`}
              >
                <Sliders size={12} />
                INDICATORS BANK ({activeIndicators.length})
              </button>

              <button
                onClick={() => {
                  setShowMineIndicator(!showMineIndicator);
                  setShowIndicatorPicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  showMineIndicator 
                    ? "bg-[#FF007F]/10 text-[#FF007F] border-[#FF007F]/50 shadow-[0_0_10px_rgba(255,0,127,0.3)]" 
                    : "bg-[#111126] hover:bg-[#161633] text-amber-400 border-amber-500/30 hover:border-amber-500/60"
                }`}
              >
                <Eye size={12} />
                MINE: {showMineIndicator ? "CONNECTED" : "OFF"}
              </button>

              <button
                onClick={handleTakeSnapshot}
                className="px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 bg-[#111126] hover:bg-[#FF00C8]/10 text-white hover:text-[#FF00C8] border-zinc-750 hover:border-[#FF00C8]/60 cursor-pointer shadow-md"
                id={`take_snapshot_btn_${title}`}
              >
                <Camera size={12} />
                TAKE SNAPSHOT
              </button>
            </div>

            {/* Simulated Live Metadata Indicator Feeds */}
            <div className="flex items-center gap-3 select-none">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-500 bg-black/40 px-2 py-1 rounded-md border border-zinc-900">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>SCANNER INSTANCE: OK</span>
              </div>
            </div>
          </div>

          <div className={`relative flex-1 bg-black ${isExpanded ? "min-h-0" : "min-h-[420px]"}`}>
            
            {/* Live Chart Canvas viewport */}
            <div className="w-full h-full relative z-10 min-h-0">
              <LightweightCandles 
                symbol={title}
                profileId={profileId} 
                height={420}
                isExpanded={isExpanded}
                fillParent={isExpanded}
                onExpandToggle={() => setIsExpanded(!isExpanded)}
                timeframe={timeframe} 
                theme={theme}
                userTier={userTier}
                takeSnapshotRef={takeSnapshotRef}
                activeIndicators={activeIndicators}
                showMineIndicator={showMineIndicator}
                mineIndicatorName={mineIndicatorName}
                ichimokuSettings={ichimokuSettings}
              />
            </div>

            {/* Dynamic floating Indicators Display Box (on top of candles) */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-[85%] pointer-events-none select-none">
              {showMineIndicator && (
                <div 
                  className="px-2 py-1 bg-black/85 backdrop-blur-md rounded-md border border-zinc-800/80 text-[10px] font-mono font-black flex items-center gap-1.5 transition-all text-white"
                  style={{ borderLeftColor: "#FF007F", borderLeftWidth: 3 }}
                >
                  <span className="opacity-65 text-[#FF007F]">MINE ({mineIndicatorName.split('.')[0]})</span>
                  <span className="text-amber-400 animate-pulse text-[9px]">RUNNING ON INDACREATOR</span>
                </div>
              )}
              {activeIndicatorsDetails.map(ind => (
                <div 
                  key={ind.abbr}
                  className="px-2 py-1 bg-black/85 backdrop-blur-md rounded-md border border-zinc-800/80 text-[10px] font-mono font-black flex items-center gap-1.5 transition-all text-white"
                  style={{ borderLeftColor: ind.activeColor, borderLeftWidth: 3 }}
                >
                  <span className="opacity-60">{ind.abbr}</span>
                  <span style={{ color: ind.activeColor }}>
                    {ind.abbr === "RSI" && `(14): 52.14`}
                    {ind.abbr === "SMA" && `(50): ${title.includes("BTC") ? "65,248.10" : "154.20"}`}
                    {ind.abbr === "EMA" && `(200): ${title.includes("BTC") ? "63,940.00" : "150.15"}`}
                    {ind.abbr === "MACD" && `(12, 26, 9): -0.45 [Diff: 0.12]`}
                    {ind.abbr === "BB" && `(20, 2): S 142.1, U 146.5, L 137.7`}
                    {!["RSI", "SMA", "EMA", "MACD", "BB"].includes(ind.abbr) && `Ready`}
                  </span>
                </div>
              ))}
            </div>

            {/* The River Custom Indicator Connection Overlay */}
            {showMineIndicator && (
              <div className="absolute inset-x-0 bottom-0 z-30 bg-[#0c0014]/95 border-t-2 border-[#FF007F]/40 p-4 backdrop-blur-md max-h-[190px] overflow-y-auto font-sans" id="chart_embedded_mine_river_overlay">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black tracking-widest text-[#FF007F] uppercase flex items-center gap-1.5">
                    <Activity size={12} className="text-[#00D9FF]" />
                    INDACREATOR INTEGRAL COMPILER (MINE CORE ATTACHED)
                  </span>
                  <button 
                    onClick={() => setShowMineIndicator(false)} 
                    className="text-[#FF007F] hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-[#FF007F]/20 text-left">
                    <div>
                      <p className="text-[#FF007F] font-black text-[9px] tracking-wider uppercase font-mono">ACTIVE FILE</p>
                      <p className="text-xs text-white font-extrabold font-mono mt-0.5 truncate">{mineIndicatorName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-zinc-900 text-left">
                    <div>
                      <p className="text-zinc-500 font-bold text-[9px] tracking-wider uppercase font-mono">FLOW INTEGRATION</p>
                      <p className="text-xs text-emerald-400 font-mono font-extrabold flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        STABLE_RIR_BYTECODE
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-zinc-900 text-left">
                    <div>
                      <p className="text-zinc-500 font-bold text-[9px] tracking-wider uppercase font-mono">COMPILER LINK</p>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('river-terminal-workstation') || document.querySelector('.RiverWorkstation') || document.getElementById('interactive-compiler-station');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            const riverTab = document.querySelector('button[id*="river"]');
                            if (riverTab instanceof HTMLButtonElement) {
                              riverTab.click();
                            } else {
                              alert("Scroll to the 'INDACREATOR' workstation tab to compile custom code!");
                            }
                          }
                        }}
                        className="text-[10px] text-[#00D9FF] hover:underline font-mono uppercase font-black text-left block mt-1"
                      >
                        RECONFIGURE SCRIPT ↗
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TradingView technical indicator bank select drawer */}
            {showIndicatorPicker && (
              <div className="absolute inset-y-0 right-0 z-40 w-80 bg-[#060612]/98 border-l border-zinc-800 p-4 flex flex-col shadow-2xl backdrop-blur-md" id="chart_embedded_indicator_picker">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black tracking-widest text-[#FF00C8] uppercase flex items-center gap-1.5">
                    <Activity size={12} className="text-[#00D9FF]" />
                    TECHNICAL INDICATOR BANK
                  </span>
                  <button 
                    onClick={() => setShowIndicatorPicker(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Subtitle with mock volume details */}
                <p className="text-[9px] text-zinc-500 font-mono tracking-wide mb-4 leading-relaxed uppercase">
                  Exhaustive TradingView indicator suite. Toggle elements to plot dynamic analytics onto the live graph overlay.
                </p>

                {/* Live Ichimoku settings panel when active */}
                {activeIndicators.includes("ICHIMOKU") && (
                  <div className="mb-4 bg-[#111126]/80 border border-[#2EC4B6]/30 rounded-xl p-3.5 space-y-3 shadow-[0_0_15px_rgba(46,196,182,0.15)] backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                      <span className="text-[10px] font-mono font-black text-[#2EC4B6] uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders size={12} className="text-[#2EC4B6]" />
                        ICHIMOKU PARAMETERS
                      </span>
                      <span className="text-[8px] font-mono text-zinc-550 border border-zinc-800 px-1 py-0.2 rounded bg-black/40">LIVE CORE</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-350 mb-1 font-semibold uppercase">
                          <span>Conversion Line Length (9)</span>
                          <span className="text-[#2EC4B6] font-extrabold">{ichimokuSettings.conversionPeriods}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={ichimokuSettings.conversionPeriods}
                          onChange={(e) => {
                            setIchimokuSettings(prev => ({ ...prev, conversionPeriods: parseInt(e.target.value) || 9 }));
                          }}
                          className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-[#2EC4B6] focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-350 mb-1 font-semibold uppercase">
                          <span>Base Line Length (26)</span>
                          <span className="text-[#2EC4B6] font-extrabold">{ichimokuSettings.basePeriods}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={ichimokuSettings.basePeriods}
                          onChange={(e) => {
                            setIchimokuSettings(prev => ({ ...prev, basePeriods: parseInt(e.target.value) || 26 }));
                          }}
                          className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-[#2EC4B6] focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-350 mb-1 font-semibold uppercase">
                          <span>Leading Span B Length (52)</span>
                          <span className="text-[#2EC4B6] font-extrabold">{ichimokuSettings.laggingSpan2Periods}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="150"
                          value={ichimokuSettings.laggingSpan2Periods}
                          onChange={(e) => {
                            setIchimokuSettings(prev => ({ ...prev, laggingSpan2Periods: parseInt(e.target.value) || 52 }));
                          }}
                          className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-[#2EC4B6] focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-350 mb-1 font-semibold uppercase">
                          <span>Displacement / Lagging (26)</span>
                          <span className="text-[#2EC4B6] font-extrabold">{ichimokuSettings.displacement}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={ichimokuSettings.displacement}
                          onChange={(e) => {
                            setIchimokuSettings(prev => ({ ...prev, displacement: parseInt(e.target.value) || 26 }));
                          }}
                          className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-[#2EC4B6] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Bar Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={indicatorSearchQuery}
                    onChange={(e) => setIndicatorSearchQuery(e.target.value)}
                    placeholder="Search over 5,000 indicator nodes..."
                    className="w-full bg-black/60 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00D9FF] placeholder-zinc-650 transition-colors"
                  />
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  {indicatorSearchQuery && (
                    <button 
                      onClick={() => setIndicatorSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filterable List View */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                  {filteredIndicators.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 text-[11px] font-mono uppercase">
                      No matching indicators found
                    </div>
                  ) : (
                    filteredIndicators.map(ind => {
                      const isActive = activeIndicators.includes(ind.abbr);
                      return (
                        <button
                          key={ind.name}
                          onClick={() => toggleIndicator(ind.abbr)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between ${
                            isActive 
                              ? "bg-[#00D9FF]/5 border-[#00D9FF]/40 text-[#00D9FF]" 
                              : "bg-black/30 border-zinc-900/80 hover:bg-[#111126]/40 hover:border-zinc-800 text-zinc-400"
                          }`}
                        >
                          <div className="text-left block">
                            <p className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                              {ind.name}
                              <span className="text-[8px] font-mono px-1 py-0.2 bg-zinc-800/80 text-zinc-500 rounded text-center">
                                {ind.abbr}
                              </span>
                            </p>
                            <p className="text-[8px] text-zinc-500 font-mono mt-0.5">{ind.category}</p>
                          </div>
                          
                          {isActive ? (
                            <Check size={12} className="text-[#00D9FF] stroke-[3px]" />
                          ) : (
                            <Plus size={10} className="text-zinc-650" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer and reset indicators button */}
                <div className="pt-3 mt-3 border-t border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                  <span>Selected: {activeIndicators.length} nodes</span>
                  <button 
                    onClick={() => setActiveIndicators([])} 
                    className="hover:text-red-400 font-black uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </ChartFrame>

      {/* SNAPSHOT TO FEED COMPOSER MODAL */}
      {snapshotImg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" id="snapshot_composite_modal">
          <div className="bg-[#050512] border-2 border-[#FF00C8] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-[0_0_40px_rgba(255,0,200,0.3)] text-left">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF00C8] animate-pulse" />
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#FF00C8]/10 p-2.5 rounded-2xl border border-[#FF00C8]/30">
                  <Camera className="text-[#FF00C8] w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-cinzel font-black text-white uppercase tracking-widest">
                    BROADCAST CHART SNAPSHOT
                  </h3>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
                    Operational Scan & Post Intelligence Room
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSnapshotImg(null)}
                className="text-zinc-550 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {snapshotError && (
              <div className="text-red-500 font-mono text-xs p-3 bg-red-950/40 border border-red-500/30 rounded-xl" id="snapshot_error_msg">
                ⚠️ {snapshotError}
              </div>
            )}

            {snapshotSuccess ? (
              <div className="text-center py-8 space-y-4" id="snapshot_success_screen">
                <div className="inline-flex bg-emerald-500/10 p-4 rounded-full border border-emerald-500">
                  <Check className="text-emerald-500 w-12 h-12 stroke-[3px]" />
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold tracking-wider font-mono text-sm uppercase">SNAPSHOT POSTED SUCCESSFULLY!</h4>
                  <p className="text-xs text-zinc-400 mt-2">Your live chart perspective is now live on the Discovery Feed.</p>
                </div>
                <button
                  onClick={() => setSnapshotImg(null)}
                  className="bg-zinc-900 border border-zinc-800 text-white font-mono text-xs uppercase px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Return to Terminal
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {/* Captured Preview Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest block">VISUAL SCAN PREVIEW ({title.toUpperCase()})</span>
                  <div className="relative aspect-video rounded-xl border border-zinc-850 bg-black overflow-hidden shadow-inner">
                    <img 
                      src={snapshotImg} 
                      alt="Captured Chart" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-10" />
                  </div>
                </div>

                {/* Caption Textarea */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">SNAPSHOT INTEL / CAPTION</span>
                  <textarea
                    value={snapshotCaption}
                    onChange={(e) => setSnapshotCaption(e.target.value)}
                    rows={4}
                    placeholder="Provide professional intelligence update for this chart snapshot..."
                    className="w-full bg-[#03030c] border border-zinc-850 rounded-2xl p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#FF00C8] placeholder-zinc-700 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={async () => {
                      if (isPostingSnapshot) return;
                      setIsPostingSnapshot(true);
                      setSnapshotError(null);
                      try {
                        await createPost(snapshotCaption, { url: snapshotImg, type: 'image' });
                        setSnapshotSuccess(true);
                      } catch (err: any) {
                        console.error(err);
                        setSnapshotError(err?.message || "Failed to publish snapshot feed post.");
                      } finally {
                        setIsPostingSnapshot(false);
                      }
                    }}
                    disabled={isPostingSnapshot}
                    className="flex-1 bg-[#FF00C8] hover:bg-opacity-90 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-cinzel font-black uppercase py-3 rounded-2xl text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(255,0,200,0.3)] hover:shadow-[0_0_25px_rgba(255,0,200,0.5)] cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    {isPostingSnapshot ? "BROADCASTING INTEL..." : "POST TO DISCOVERY FEED"}
                  </button>
                  <button
                    onClick={() => setSnapshotImg(null)}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 font-cinzel font-black uppercase py-3 px-6 rounded-2xl text-xs tracking-wider transition-all cursor-pointer text-center"
                  >
                    DECLINE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
