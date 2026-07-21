import React, { useState, useEffect, useCallback } from 'react';
import { usePageAutoUpdate } from '../hooks/usePageAutoUpdate';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TradingSessionsCollapse() {
  const [currentUtcTime, setCurrentUtcTime] = useState(new Date());
  
  // State initialization with SSR safety and window width detection
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clearpath_sessions_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      // Default: Collapsed on tablet/mobile (< 1024px), Expanded on desktop (>= 1024px)
      return window.innerWidth < 1024;
    }
    return true;
  });

  usePageAutoUpdate(() => setCurrentUtcTime(new Date()), { intervalMs: 1000 });

  // Sync state to localStorage on changes
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('clearpath_sessions_collapsed', String(next));
      return next;
    });
  };

  const pad = (num: number) => num.toString().padStart(2, '0');

  // Format UTC hours, minutes, seconds
  const utcHours = currentUtcTime.getUTCHours();
  const utcMinutes = currentUtcTime.getUTCMinutes();
  const utcSeconds = currentUtcTime.getUTCSeconds();

  // Helper session open checking logic
  const isSydneyOpen = utcHours >= 22 || utcHours < 7;
  const isTokyoOpen = utcHours >= 0 && utcHours < 9;
  const isSingaporeOpen = utcHours >= 1 && utcHours < 10;
  const isLondonOpen = utcHours >= 8 && utcHours < 17;
  const isNewYorkOpen = utcHours >= 13 && utcHours < 22;

  // Overlaps
  const isLondonNyOverlap = utcHours >= 13 && utcHours < 17;
  const isTokyoLondonTransition = utcHours >= 7 && utcHours < 9;

  return (
    <div 
      className="max-w-[1400px] mx-auto text-white p-4 font-sans leading-relaxed relative overflow-x-hidden w-full" 
      id="global-trading-sessions-dashboard"
    >
      {/* COLLAPSE TRIGGER BUTTON */}
      <button
        onClick={toggleCollapse}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand Trading Sessions" : "Collapse Trading Sessions"}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/60 hover:bg-[#00ffe1]/10 text-[#00ffe1] border border-[#00ffe1]/40 rounded-full p-2 sm:p-2.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#00ffe1] focus:ring-offset-2 focus:ring-offset-black hover:shadow-[0_0_15px_rgba(0,255,225,0.4)] cursor-pointer z-20 flex items-center justify-center"
        id="sessions-toggle-btn"
      >
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 animate-pulse" />
        ) : (
          <ChevronUp className="w-5 h-5" />
        )}
      </button>

      {/* HEADER SECTION - Rendered at all times */}
      <div className="text-center mb-6 sm:mb-8 pr-12 xl:pr-0" id="sessions-header-block">
        <h2 
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wider mb-2 text-[#00ffe1] drop-shadow-[0_0_15px_#00ffe1] uppercase"
          id="sessions-title-text"
        >
          GLOBAL TRADING SESSIONS
        </h2>
        <div className="text-gray-400 text-sm sm:text-base md:text-lg font-medium tracking-wide" id="sessions-subtitle-text">
          Forex • Futures • Crypto • Institutional Liquidity Windows
        </div>
        
        {/* LIVE TIME METRIC */}
        <div className="mt-4 flex justify-center items-center gap-2.5 bg-[#111111]/80 border border-gray-800 rounded-full px-4 py-1.5 w-fit mx-auto shadow-inner">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffe1] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffe1]"></span>
          </span>
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#00ffe1]">
            LIVE SERVER RECORD (UTC): {pad(utcHours)}:{pad(utcMinutes)}:{pad(utcSeconds)}
          </span>
        </div>
      </div>

      {/* EXPANDABLE SECTION */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="expandable-sessions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden w-full flex flex-col"
          >
            {/* SESSION CARD GRID - stacks on mobile, scrollable container on tablet, full grid on desktop */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6 max-h-[70vh] overflow-y-auto md:max-h-[500px] xl:max-h-none xl:overflow-y-visible pr-1.5 sm:pr-2 custom-scrollbar w-full" 
              id="sessions-grid-layout"
            >
              {/* SYDNEY */}
              <div 
                className={`bg-[#101010] border rounded-[18px] p-5 lg:p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[340px]
                  ${isSydneyOpen 
                    ? 'border-[#00ffe1]/80 shadow-[0_0_20px_rgba(0,255,225,0.15)] md:scale-[1.01]' 
                    : 'border-[#1f1f1f] hover:border-[#00ffe1] hover:shadow-[0_0_20px_rgba(0,255,225,0.2)] hover:-translate-y-0.5'}`}
                id="card-sydney"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xl lg:text-2xl font-bold tracking-tight text-white" id="title-sydney">Sydney Session</div>
                    {isSydneyOpen && (
                      <span className="bg-[#00ff99]/15 text-[#00ff99] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border border-[#00ff99]/30 tracking-widest uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[#00ffe1] text-sm lg:text-base mb-4 lg:mb-5 font-semibold" id="city-sydney">Sydney, Australia</div>

                  <div className="bg-[#181818] rounded-xl p-3.5 mb-3 border border-gray-800/45" id="utc-box-sydney">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">UTC Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">10 PM – 7 AM</div>
                  </div>

                  <div className="bg-[#181818] rounded-xl p-3.5 border border-gray-800/45" id="pt-box-sydney">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pacific Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">3 PM – 12 AM</div>
                  </div>
                </div>

                <div className="mt-5 p-2.5 rounded-xl text-center font-black text-[11px] tracking-wider bg-[#00ff96]/15 text-[#00ff99] border border-[#00ff99]/20" id="vol-sydney">
                  LOW VOLATILITY
                </div>
              </div>

              {/* TOKYO */}
              <div 
                className={`bg-[#101010] border rounded-[18px] p-5 lg:p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[340px]
                  ${isTokyoOpen 
                    ? 'border-[#00ffe1]/80 shadow-[0_0_20px_rgba(0,255,225,0.15)] md:scale-[1.01]' 
                    : 'border-[#1f1f1f] hover:border-[#00ffe1] hover:shadow-[0_0_20px_rgba(0,255,225,0.2)] hover:-translate-y-0.5'}`}
                id="card-tokyo"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xl lg:text-2xl font-bold tracking-tight text-white" id="title-tokyo">Tokyo Session</div>
                    {isTokyoOpen && (
                      <span className="bg-[#00ff99]/15 text-[#00ff99] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border border-[#00ff99]/30 tracking-widest uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[#00ffe1] text-sm lg:text-base mb-4 lg:mb-5 font-semibold" id="city-tokyo">Tokyo, Japan</div>

                  <div className="bg-[#181818] rounded-xl p-3.5 mb-3 border border-gray-800/45" id="utc-box-tokyo">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">UTC Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">12 AM – 9 AM</div>
                  </div>

                  <div className="bg-[#181818] rounded-xl p-3.5 border border-gray-800/45" id="pt-box-tokyo">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pacific Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">5 PM – 2 AM</div>
                  </div>
                </div>

                <div className="mt-5 p-2.5 rounded-xl text-center font-black text-[11px] tracking-wider bg-[#ffaa00]/15 text-[#ffaa00] border border-[#ffaa00]/20" id="vol-tokyo">
                  MEDIUM VOLATILITY
                </div>
              </div>

              {/* SINGAPORE */}
              <div 
                className={`bg-[#101010] border rounded-[18px] p-5 lg:p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[340px]
                  ${isSingaporeOpen 
                    ? 'border-[#00ffe1]/80 shadow-[0_0_20px_rgba(0,255,225,0.15)] md:scale-[1.01]' 
                    : 'border-[#1f1f1f] hover:border-[#00ffe1] hover:shadow-[0_0_20px_rgba(0,255,225,0.2)] hover:-translate-y-0.5'}`}
                id="card-singapore"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xl lg:text-2xl font-bold tracking-tight text-white" id="title-singapore">Singapore Session</div>
                    {isSingaporeOpen && (
                      <span className="bg-[#00ff99]/15 text-[#00ff99] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border border-[#00ff99]/30 tracking-widest uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[#00ffe1] text-sm lg:text-base mb-4 lg:mb-5 font-semibold" id="city-singapore">Singapore</div>

                  <div className="bg-[#181818] rounded-xl p-3.5 mb-3 border border-gray-800/45" id="utc-box-singapore">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">UTC Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">1 AM – 10 AM</div>
                  </div>

                  <div className="bg-[#181818] rounded-xl p-3.5 border border-gray-800/45" id="pt-box-singapore">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pacific Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">6 PM – 3 AM</div>
                  </div>
                </div>

                <div className="mt-5 p-2.5 rounded-xl text-center font-black text-[11px] tracking-wider bg-[#ffaa00]/15 text-[#ffaa00] border border-[#ffaa00]/20" id="vol-singapore">
                  MEDIUM VOLATILITY
                </div>
              </div>

              {/* LONDON */}
              <div 
                className={`bg-[#101010] border rounded-[18px] p-5 lg:p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[340px]
                  ${isLondonOpen 
                    ? 'border-[#00ffe1]/80 shadow-[0_0_20px_rgba(0,255,225,0.15)] md:scale-[1.01]' 
                    : 'border-[#1f1f1f] hover:border-[#00ffe1] hover:shadow-[0_0_20px_rgba(0,255,225,0.2)] hover:-translate-y-0.5'}`}
                id="card-london"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xl lg:text-2xl font-bold tracking-tight text-white" id="title-london">London Session</div>
                    {isLondonOpen && (
                      <span className="bg-[#00ff99]/15 text-[#00ff99] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border border-[#00ff99]/30 tracking-widest uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[#00ffe1] text-sm lg:text-base mb-4 lg:mb-5 font-semibold" id="city-london">London, UK</div>

                  <div className="bg-[#181818] rounded-xl p-3.5 mb-3 border border-gray-800/45" id="utc-box-london">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">UTC Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">8 AM – 5 PM</div>
                  </div>

                  <div className="bg-[#181818] rounded-xl p-3.5 border border-gray-800/45" id="pt-box-london">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pacific Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">1 AM – 10 AM</div>
                  </div>
                </div>

                <div className="mt-5 p-2.5 rounded-xl text-center font-black text-[11px] tracking-wider bg-[#ff0050]/15 text-[#ff4d88] border border-[#ff0050]/20" id="vol-london">
                  HIGH VOLATILITY
                </div>
              </div>

              {/* NEW YORK */}
              <div 
                className={`bg-[#101010] border rounded-[18px] p-5 lg:p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[340px]
                  ${isNewYorkOpen 
                    ? 'border-[#00ffe1]/80 shadow-[0_0_20px_rgba(0,255,225,0.15)] md:scale-[1.01]' 
                    : 'border-[#1f1f1f] hover:border-[#00ffe1] hover:shadow-[0_0_20px_rgba(0,255,225,0.2)] hover:-translate-y-0.5'}`}
                id="card-newyork"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xl lg:text-2xl font-bold tracking-tight text-white" id="title-newyork">New York Session</div>
                    {isNewYorkOpen && (
                      <span className="bg-[#00ff99]/15 text-[#00ff99] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border border-[#00ff99]/30 tracking-widest uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[#00ffe1] text-sm lg:text-base mb-4 lg:mb-5 font-semibold" id="city-newyork">New York, USA</div>

                  <div className="bg-[#181818] rounded-xl p-3.5 mb-3 border border-gray-800/45" id="utc-box-newyork">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">UTC Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">1 PM – 10 PM</div>
                  </div>

                  <div className="bg-[#181818] rounded-xl p-3.5 border border-gray-800/45" id="pt-box-newyork">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pacific Time</div>
                    <div className="text-base lg:text-lg font-extrabold text-white">6 AM – 3 PM</div>
                  </div>
                </div>

                <div className="mt-5 p-2.5 rounded-xl text-center font-black text-[11px] tracking-wider bg-[#ff0050]/15 text-[#ff4d88] border border-[#ff0050]/20" id="vol-newyork">
                  HIGH VOLATILITY
                </div>
              </div>
            </div>

            {/* OVERLAPS Sections */}
            <div className="mt-8 lg:mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6" id="overlap-sections">
              {/* OVERLAP 1 */}
              <div 
                className={`bg-[#111111] border-l-4 rounded-r-xl p-5 lg:p-6 transition-all duration-300
                  ${isLondonNyOverlap ? 'border-[#00ffe1] shadow-[0_4px_20px_rgba(0,255,225,0.08)]' : 'border-[#1f1f1f]'}`}
                style={{ borderLeftColor: isLondonNyOverlap ? '#00ffe1' : '#1f1f1f' }}
                id="overlap-card-london-ny"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg lg:text-xl font-bold text-[#00ffe1]" id="overlap-title-london-ny">
                    London + New York Overlap
                  </h3>
                  {isLondonNyOverlap && (
                    <span className="animate-pulse bg-[#00ffe1]/20 text-[#00ffe1] text-[9px] font-black px-2 py-0.5 rounded border border-[#00ffe1]/40 uppercase tracking-wider">
                      PEAK WINDOW
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm space-y-1 text-gray-300 mb-3 sm:mb-4" id="overlap-times-london-ny">
                  <div><strong className="text-white font-semibold">UTC:</strong> 1 PM – 5 PM</div>
                  <div><strong className="text-white font-semibold">PT:</strong> 6 AM – 10 AM</div>
                </div>

                <ul className="list-disc pl-4 space-y-1 text-gray-400 text-xs sm:text-sm" id="overlap-features-london-ny">
                  <li>Highest institutional liquidity across global assets</li>
                  <li>Most aggressive directional moves of the 24-hour cycle</li>
                  <li>Strong forex volatility spikes specifically in EUR, GBP, and USD pairs</li>
                  <li>Major tier-1 macroeconomic news releases</li>
                </ul>
              </div>

              {/* OVERLAP 2 */}
              <div 
                className={`bg-[#111111] border-l-4 rounded-r-xl p-5 lg:p-6 transition-all duration-300
                  ${isTokyoLondonTransition ? 'border-[#00ffe1] shadow-[0_4px_20px_rgba(0,255,225,0.08)]' : 'border-[#1f1f1f]'}`}
                style={{ borderLeftColor: isTokyoLondonTransition ? '#00ffe1' : '#1f1f1f' }}
                id="overlap-card-tokyo-london"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg lg:text-xl font-bold text-[#00ffe1]" id="overlap-title-tokyo-london">
                    Tokyo → London Transition
                  </h3>
                  {isTokyoLondonTransition && (
                    <span className="animate-pulse bg-[#00ffe1]/20 text-[#00ffe1] text-[9px] font-black px-2 py-0.5 rounded border border-[#00ffe1]/40 uppercase tracking-wider">
                      TRANSITION
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm space-y-1 text-gray-300 mb-3 sm:mb-4" id="overlap-times-tokyo-london">
                  <div><strong className="text-white font-semibold">UTC:</strong> 7 AM – 9 AM</div>
                </div>

                <ul className="list-disc pl-4 space-y-1 text-gray-400 text-xs sm:text-sm" id="overlap-features-tokyo-london">
                  <li>Asset trend reversals and overnight settlement traps</li>
                  <li>Clearing of Asian session range highs and lows (liquidity sweeps)</li>
                  <li>Prime structural breakout setups for European session traders</li>
                  <li>Smooth directional hand-off from Eastern flow into Western capital markets</li>
                </ul>
              </div>
            </div>

            {/* FOOTER SECTION */}
            <div 
              className="mt-8 lg:mt-12 text-center text-gray-600 text-[10px] sm:text-xs font-semibold tracking-wider uppercase border-t border-gray-900 pt-6"
              id="sessions-footer"
            >
              GLOBAL MARKET FLOW: Sydney → Tokyo → Singapore → Frankfurt → London → New York
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
