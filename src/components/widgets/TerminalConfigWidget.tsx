import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { 
  Terminal, 
  Activity, 
  Compass, 
  Zap, 
  Clock, 
  Layers, 
  Sparkles, 
  Globe, 
  Check, 
  Database,
  Search,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';

export default function TerminalConfigWidget() {
  const [traderType, setTraderType] = useState<string>(() => {
    return localStorage.getItem('cpt_trader_classification') || 'scalper';
  });
  
  const [selectedSessionOverride, setSelectedSessionOverride] = useState<string | null>(null);
  const [activePairs, setActivePairs] = useState<string[]>([]);
  const [activeSessionName, setActiveSessionName] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);

  const handleRefreshTelemetry = () => {
    setIsRefreshingTelemetry(true);
    
    // Simulate real re-fetch of current session's market telemetry
    setTimeout(() => {
      setIsRefreshingTelemetry(false);
      setRefreshSuccess(true);
      
      // Dispatch event to show a toast, reload sparklines, and trigger sound/visual alerts
      const event = new CustomEvent('market-telemetry-refetched', {
        detail: {
          timestamp: new Date().toLocaleTimeString(),
          classification: traderType,
          pairs: activePairs
        }
      });
      window.dispatchEvent(event);
      
      setTimeout(() => setRefreshSuccess(false), 2400);
    }, 1200);
  };

  // Add global event listener so that a click on the header of the "Terminal Matrix Control" sidebar panel can also trigger this
  useEffect(() => {
    const handleGlobalTrigger = () => {
      handleRefreshTelemetry();
    };
    window.addEventListener('trigger-terminal-telemetry-refresh', handleGlobalTrigger);
    return () => {
      window.removeEventListener('trigger-terminal-telemetry-refresh', handleGlobalTrigger);
    };
  }, [activePairs, traderType]);

  // Load active session dynamically based on current UTC time or override
  usePageAutoUpdate(() => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    const seconds = now.getUTCSeconds().toString().padStart(2, '0');
    setUtcTime(`${utcHour.toString().padStart(2, '0')}:${minutes}:${seconds} UTC`);

    let sessionKey = 'asian';
    if (utcHour >= 22 || utcHour < 8) {
      sessionKey = 'asian';
    } else if (utcHour >= 8 && utcHour < 13) {
      sessionKey = 'european';
    } else if (utcHour >= 13 && utcHour < 22) {
      sessionKey = 'us';
    }

    const activeSession = selectedSessionOverride || sessionKey;

    if (activeSession === 'asian') {
      setActiveSessionName("Asian / Pacific Session (Tokyo, Sydney, Singapore)");
      setActivePairs(["AUD/USD", "USD/JPY", "NZD/USD", "AUD/JPY", "USD/SGD"]);
    } else if (activeSession === 'european') {
      setActiveSessionName("London / European Session (London, Frankfurt)");
      setActivePairs(["EUR/USD", "GBP/USD", "EUR/GBP", "USD/CHF", "EUR/JPY"]);
    } else if (activeSession === 'us') {
      setActiveSessionName("US / New York Session");
      setActivePairs(["USD/CAD", "EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD (Gold)"]);
    }
  }, { intervalMs: 2_000 });

  const handleTraderTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTraderType(val);
    localStorage.setItem('cpt_trader_classification', val);
    
    // Broadcast change to global application state
    const event = new CustomEvent('trader-classification-changed', { detail: { type: val } });
    window.dispatchEvent(event);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const getClassificationSpecs = () => {
    switch (traderType) {
      case 'scalper':
        return {
          title: "Hyper-Fast Scalper Mode",
          description: "Optimized for millisecond tape readers. Streaming index values update at sub-2-second rates.",
          latency: "< 50ms Network Queue",
          buffer: "100 ticks",
          color: "#00D9FF",
        };
      case 'intraday':
        return {
          title: "Hour-Block Intraday Mode",
          description: "Engineered for mid-term hourly breakout strategies. Analytics cache updates every 1 minute.",
          latency: "Adaptive Queue (150ms)",
          buffer: "500 candles",
          color: "#FF00C8",
        };
      case 'daytrader':
        return {
          title: "EOD Day Trader Mode",
          description: "Zero overnight risk protocol. Ensures all positions automatically flatten before primary session settlement.",
          latency: "Risk Filter On (200ms)",
          buffer: "Daily Session Pivot",
          color: "#f59e0b",
        };
      default:
        return {
          title: "Standard Analyst Flow",
          description: "Default statistical telemetry data visualization and macro fundamentals pipeline.",
          latency: "Standard Queue",
          buffer: "None",
          color: "#aaa",
        };
    }
  };

  const specs = getClassificationSpecs();

  return (
    <div id="clear-path-trader-setup" className="w-full h-full bg-[#050314] text-white flex flex-col font-mono p-4 rounded-xl border border-white/10 select-none overflow-y-auto custom-scrollbar relative">
      
      {/* Absolute pulsing background watermark */}
      <div className="absolute right-4 top-4 font-black text-3xl opacity-5 pointer-events-none select-none">
        CPMS
      </div>

      {/* Header and State Status Icon */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-[#00D9FF]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
            Terminal Configuration Panel
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 bg-black/50 px-2.5 py-1 rounded-full border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{utcTime || "UTC CLOCK"}</span>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Dropdown Section */}
        <div className="space-y-1.5">
          <label htmlFor="traderType" className="block text-[10px] uppercase tracking-widest text-[#FF00C8] font-bold">
            Select Trader Classification:
          </label>
          <div className="relative">
            <select 
              id="traderType" 
              value={traderType}
              onChange={handleTraderTypeChange}
              className="w-full bg-[#0a081a] text-xs text-white p-3 border border-white/15 rounded-xl outline-none focus:border-[#00D9FF]/50 hover:bg-white/[0.02] cursor-pointer transition-colors appearance-none"
            >
              <option value="scalper">⚡ SCALPER (Hyper-fast execution, seconds to minutes)</option>
              <option value="intraday">📈 INTRADAY TRADER (Holding positions for hours)</option>
              <option value="daytrader">⚖️ DAY TRADER (Flat by end of day)</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Dynamic Spec Highlight Card */}
        <div 
          className="p-3.5 rounded-xl bg-black/60 border transition-all duration-300 relative overflow-hidden"
          style={{ borderColor: `${specs.color}25` }}
        >
          {/* Subtle colored accent glow background */}
          <div 
            className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none"
            style={{ backgroundColor: specs.color }}
          />

          <div className="flex items-center space-x-2 mb-1.5">
            <Zap size={14} style={{ color: specs.color }} className="animate-bounce" />
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: specs.color }}>
              {specs.title}
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 leading-normal uppercase">
            {specs.description}
          </p>
          
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 text-[9px]">
            <div className="space-y-0.5">
              <span className="text-zinc-500 block">QUEUE THREAD:</span>
              <span className="font-bold text-zinc-200">{specs.latency}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-zinc-500 block">BUFFER ARRAY:</span>
              <span className="font-bold text-zinc-200">{specs.buffer}</span>
            </div>
          </div>
        </div>

        {/* RE-FETCH TELEMETRY SECTION */}
        <div className="bg-black/60 border border-white/5 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden transition-all duration-300">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
            <span>Session Market Telemetry:</span>
            <span className="text-emerald-400 font-mono text-[8.5px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Broker Sync
            </span>
          </div>

          <button
            onClick={handleRefreshTelemetry}
            disabled={isRefreshingTelemetry}
            className={`w-full py-2 bg-zinc-950 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              isRefreshingTelemetry 
                ? 'bg-[#00D9FF]/10 border-[#00D9FF]/30 text-[#00D9FF] cursor-wait text-xs font-bold' 
                : 'border-white/5 hover:border-[#FF00C8]/50 hover:bg-white/[0.02] text-zinc-300'
            }`}
          >
            <RefreshCw size={11} className={isRefreshingTelemetry ? "animate-spin text-[#00D9FF]" : "text-zinc-500"} />
            <span>{isRefreshingTelemetry ? 'RE-FETCHING TELEMETRY...' : 'REFRESH TELEMETRY DATA'}</span>
          </button>
        </div>

        {/* Real-time D3 Sparkline of EUR/USD Tick Stream */}
        {traderType === 'scalper' && (
          <EurUsdSparkline />
        )}

        {/* Global Active Session Tracker with Override Controls */}
        <div className="space-y-2 border-t border-white/5 pt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-[#00D9FF]">
              <Globe size={11} />
              <span>Session Matrix</span>
            </div>
            {selectedSessionOverride && (
              <button 
                onClick={() => setSelectedSessionOverride(null)}
                className="text-[8px] border border-red-500/30 bg-red-950/20 px-1.5 py-0.5 rounded text-red-400 hover:bg-red-500 hover:text-white transition-all uppercase"
              >
                Clear Preset Override
              </button>
            )}
          </div>

          <div id="session-info" className="p-3 bg-[#0c0a21]/90 rounded-xl border border-white/5 text-center">
            <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-[0.2em] mb-1">
              Active Global Engine
            </span>
            <div className="text-xs font-black text-amber-500 tracking-wide uppercase leading-tight">
              {activeSessionName}
            </div>
          </div>

          {/* Session Overrides for quick demo / global inspection */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            {[
              { id: 'asian', label: 'Tokyo / Asian' },
              { id: 'european', label: 'London / EU' },
              { id: 'us', label: 'New York / US' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedSessionOverride(btn.id)}
                className={`py-1.5 px-1 text-[8px] font-black uppercase tracking-widest border rounded transition-all truncate ${
                  selectedSessionOverride === btn.id || (selectedSessionOverride === null && (
                    (btn.id === 'asian' && activeSessionName.includes('Asian')) ||
                    (btn.id === 'european' && activeSessionName.includes('London')) ||
                    (btn.id === 'us' && activeSessionName.includes('US'))
                  ))
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-black/40 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preloaded Pairs For Session */}
        <div className="bg-[#050412]/80 border border-white/5 p-3 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400">
            <span>Pairs Pre-Loaded For Session:</span>
            <span className="text-emerald-400 font-mono text-[8px]">{activePairs.length} Ready</span>
          </div>
          
          <ul id="loaded-pairs" className="space-y-1">
            <AnimatePresence mode="popLayout">
              {activePairs.map((pair) => (
                <motion.li 
                  key={pair}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between py-1 px-2.5 rounded bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.02] text-xs font-bold transition-all text-emerald-400"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {pair}
                  </span>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-300 font-mono py-0.5 px-1.5 rounded uppercase border border-emerald-500/20">
                    Live Telemetry
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

      </div>

      {/* Persistence confirmation overlay */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-3 left-3 right-3 bg-emerald-950/95 border border-emerald-500/50 text-emerald-400 py-1.5 rounded-lg text-[9px] text-center font-bold uppercase tracking-widest z-10 flex items-center justify-center gap-1"
          >
            <Check size={10} />
            Trader Profile Synced Securely
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {refreshSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-3 left-3 right-3 bg-cyan-950/95 border border-cyan-500/50 text-[#00D9FF] py-1.5 rounded-lg text-[9px] text-center font-bold uppercase tracking-widest z-10 flex items-center justify-center gap-1"
          >
            <RefreshCw size={10} className="animate-spin text-[#00D9FF]" />
            Telemetry Re-Fetched Successfully
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Lightweight realistic D3 sparkline for EUR/USD real-time scalping telemetry
function EurUsdSparkline() {
  const [ticks, setTicks] = useState<number[]>(() => {
    const initial = [];
    let current = 1.08520;
    for (let i = 0; i < 40; i++) {
      current += (Math.random() - 0.5) * 0.00008;
      initial.push(current);
    }
    return initial;
  });

  const [spread, setSpread] = useState<string>('0.2');

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks((prev) => {
        const last = prev[prev.length - 1];
        const change = (Math.random() - 0.5) * 0.00006;
        let next = last + change;
        
        // Logical EUR/USD boundaries
        if (next < 1.08200) next = 1.08220;
        if (next > 1.08800) next = 1.08780;

        // Spread updates dynamically
        const nextSpread = (0.2 + Math.random() * 0.3).toFixed(1);
        setSpread(nextSpread);

        return [...prev.slice(1), next];
      });
    }, 400); // 400ms tick updates config

    return () => clearInterval(interval);
  }, []);

  const currentPrice = ticks[ticks.length - 1];
  const initialPrice = ticks[0];
  const prevPrice = ticks[ticks.length - 2] || currentPrice;
  const priceDiff = currentPrice - prevPrice;
  const isUp = currentPrice >= prevPrice;

  // D3 dimensions and scales
  const width = 280;
  const height = 48;
  const margin = { top: 3, right: 3, bottom: 3, left: 3 };

  const xScale = d3.scaleLinear()
    .domain([0, ticks.length - 1])
    .range([margin.left, width - margin.right]);

  const minVal = d3.min(ticks) || 1.08300;
  const maxVal = d3.max(ticks) || 1.08700;
  const padding = (maxVal - minVal) * 0.1 || 0.0001;

  const yScale = d3.scaleLinear()
    .domain([minVal - padding, maxVal + padding])
    .range([height - margin.bottom, margin.top]);

  const lineGenerator = d3.line<number>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d))
    .curve(d3.curveMonotoneX);

  const areaGenerator = d3.area<number>()
    .x((_, i) => xScale(i))
    .y0(height - margin.bottom)
    .y1((d) => yScale(d))
    .curve(d3.curveMonotoneX);

  const pathData = lineGenerator(ticks) || '';
  const areaData = areaGenerator(ticks) || '';

  const midVal = (minVal + maxVal) / 2;

  const lastX = xScale(ticks.length - 1);
  const lastY = yScale(currentPrice);

  const trendColor = currentPrice >= initialPrice ? '#00D9FF' : '#FF00C8';

  return (
    <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2 relative overflow-hidden">
      <div 
        className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full blur-2xl opacity-5 pointer-events-none transition-all duration-500" 
        style={{ backgroundColor: trendColor }}
      />

      <div className="flex justify-between items-start">
        <div className="space-y-0.5 text-left">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
            <span className="font-sans text-[8.5px] text-zinc-400 font-extrabold uppercase tracking-widest">
              EUR/USD Scalper Feed
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-black text-white tracking-tight">
              {currentPrice.toFixed(5)}
            </span>
            <span className={`font-mono text-[9px] font-bold ${isUp ? 'text-[#00D9FF]' : 'text-[#FF00C8]'}`}>
              {isUp ? '▲' : '▼'} {priceDiff >= 0 ? '+' : ''}{(priceDiff * 10000).toFixed(1)}p
            </span>
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <span className="font-mono text-[8px] text-zinc-500 uppercase block font-bold tracking-widest">
            SPREAD
          </span>
          <span className="font-mono text-[10px] text-[#00D9FF] font-black tracking-tight block">
            {spread} Pips
          </span>
        </div>
      </div>

      {/* D3 Svg Sparkline container */}
      <div className="relative w-full h-[48px] bg-[#03010b] rounded-lg p-1 border border-white/[0.03] overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sparkline-grad-eur-usd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Median center dotted grid anchor */}
          <line 
            x1="0" 
            x2={width} 
            y1={yScale(midVal)} 
            y2={yScale(midVal)} 
            stroke="white" 
            strokeWidth="0.5" 
            strokeDasharray="1,6" 
            opacity="0.1" 
          />

          {/* Area under the line */}
          <path d={areaData} fill="url(#sparkline-grad-eur-usd)" />

          {/* Line stroke */}
          <path d={pathData} stroke={trendColor} strokeWidth="1.25" fill="none" className="transition-all duration-300" />

          {/* Last current point pin */}
          <circle cx={lastX} cy={lastY} r="2" fill={trendColor} />
          <circle cx={lastX} cy={lastY} r="5" fill="none" stroke={trendColor} strokeWidth="0.5" opacity="0.6" className="animate-ping" />
        </svg>
      </div>

      {/* Live Transaction / Action Logs */}
      <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-zinc-500 border-t border-white/5 pt-1">
        <div className="flex items-center gap-1.5 text-left">
          <span className="text-zinc-600 font-bold uppercase">BID:</span>
          <span className="text-zinc-300 font-semibold">{(currentPrice - 0.00001).toFixed(5)}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end text-right">
          <span className="text-zinc-600 font-bold uppercase">ASK:</span>
          <span className="text-[#00D9FF] font-semibold">{(currentPrice + parseFloat(spread) * 0.0001).toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
}
