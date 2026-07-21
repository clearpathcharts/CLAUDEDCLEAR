import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePageAutoUpdate } from '../hooks/usePageAutoUpdate';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  MapPin, 
  Zap, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  AlertTriangle, 
  Target, 
  Shuffle, 
  Map, 
  Calendar,
  Globe,
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Headphones,
  Disc,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Session {
  id: string;
  name: string;
  city: string;
  utcStart: number; // Hour in UTC (0-23)
  utcEnd: number;   // Hour in UTC (0-23)
  ptStart: number;  // Hour in Pacific Time (0-23)
  ptEnd: number;    // Hour in Pacific Time (0-23)
  volatility: 'low' | 'medium' | 'high';
  commonPairs: string[];
  characteristics: string;
}

interface KillZone {
  name: string;
  nyTime: string;
  utcTime: string;
  characteristics: string;
  sentiment: string;
  commonPairs: string[];
}

interface PodcastTrack {
  id: string;
  title: string;
  trader: string;
  duration: string;
  src: string;
  topic: string;
  date: string;
}

export default function KillZones() {
  const [currentUtcTime, setCurrentUtcTime] = useState(new Date());
  const [overrideHour, setOverrideHour] = useState<number | null>(null); // Interactive simulated hour
  const [activeTab, setActiveTab] = useState<'matrix' | 'overlaps' | 'opens'>('matrix');
  const [isExpanded, setIsExpanded] = useState(false);

  // Multi-track podcast system
  const tracks: PodcastTrack[] = [
    {
      id: 'track-1',
      title: 'Institutional Liquidity Sweeps',
      trader: 'Alistair Cole, FX Specialist',
      duration: '6:12',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      topic: 'Order-book depletion & vacuum traps during NY overlap.',
      date: 'TODAY'
    },
    {
      id: 'track-2',
      title: 'Decentralized Spillways & Pools',
      trader: 'Maria Thorne, CFTC Desk',
      duration: '7:05',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      topic: 'Routing through secondary pools to dodge toxic flow.',
      date: 'YESTERDAY'
    },
    {
      id: 'track-3',
      title: 'Macro Cross-Border Flow Secrets',
      trader: 'Kenji Sato, SG Liquidator',
      duration: '5:44',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      topic: 'Exploiting geographical spread latency on USD/JPY.',
      date: 'MAY 31'
    }
  ];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  usePageAutoUpdate(() => setCurrentUtcTime(new Date()), { intervalMs: 1000 });

  // Update audio Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = tracks[currentTrackIndex].src;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log('Audio playback user-gesture delay:', err));
      }
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio auto-play blocked, playing safely:', err);
        setIsPlaying(true);
      });
    }
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getActiveHourUTC = () => {
    if (overrideHour !== null) return overrideHour;
    return currentUtcTime.getUTCHours();
  };

  const getActiveMinutesUTC = () => {
    if (overrideHour !== null) return 0;
    return currentUtcTime.getUTCMinutes();
  };

  const sessions: Session[] = [
    {
      id: 'sydney',
      name: 'Sydney Session',
      city: 'Sydney, Australia',
      utcStart: 22, // 10 PM UTC is 22:00
      utcEnd: 7,    // 7 AM UTC is 07:00
      ptStart: 15,  // 3 PM PT is 15:00
      ptEnd: 24,    // 12 AM PT is 24:00 (or 0)
      volatility: 'low',
      commonPairs: ['AUD/USD', 'NZD/USD'],
      characteristics: 'Slower, structured movement ideal for regional Australian and New Zealand dollar exposures. Lower institutional friction.'
    },
    {
      id: 'tokyo',
      name: 'Tokyo Session',
      city: 'Tokyo, Japan',
      utcStart: 0,   // 12 AM UTC is 00:00
      utcEnd: 9,   // 9 AM UTC is 09:00
      ptStart: 17,  // 5 PM PT is 17:00
      ptEnd: 2,    // 2 AM PT is 02:00
      volatility: 'medium',
      commonPairs: ['USD/JPY', 'AUD/JPY'],
      characteristics: 'Primary Yen-heavy liquidating window. Features robust directional technical sweeps and sovereign central bank buffers.'
    },
    {
      id: 'singapore',
      name: 'Singapore Session',
      city: 'Singapore',
      utcStart: 1,   // 1 AM UTC
      utcEnd: 10,  // 10 AM UTC
      ptStart: 18,  // 6 PM PT
      ptEnd: 3,    // 3 AM PT
      volatility: 'medium',
      commonPairs: ['USD/SGD', 'USD/JPY'],
      characteristics: 'Crucial Asian capital distribution waypoint. Aggregates liquidity transfers and sovereign hedge pool positioning.'
    },
    {
      id: 'london',
      name: 'London Session',
      city: 'London, United Kingdom',
      utcStart: 8,   // 8 AM UTC is 08:00
      utcEnd: 17,  // 5 PM UTC is 17:00
      ptStart: 1,   // 1 AM PT is 01:00
      ptEnd: 10,   // 10 AM PT is 10:00
      volatility: 'high',
      commonPairs: ['EUR/USD', 'GBP/USD'],
      characteristics: 'Extremely aggressive capital allocation environment. Large institutional blocks engage in major trend originations.'
    },
    {
      id: 'newyork',
      name: 'New York Session',
      city: 'New York, USA',
      utcStart: 13,  // 1 PM UTC is 13:00
      utcEnd: 22,  // 10 PM UTC is 22:00
      ptStart: 6,   // 6 AM PT is 06:00
      ptEnd: 15,   // 3 PM PT is 15:00
      volatility: 'high',
      commonPairs: ['XAU/USD', 'NASDAQ'],
      characteristics: ' NYSE / NASDAQ indices correlation opens. Highly volatile windows featuring major US macro report triggers.'
    }
  ];

  const killZones: KillZone[] = [
    {
      name: 'Asian Kill Zone',
      nyTime: '7:00 PM – 10:00 PM',
      utcTime: '11:00 PM – 2:00 AM',
      characteristics: 'Consolidation brackets, key range formulations, Yen-based target liquidity pools.',
      sentiment: 'Pacific centers settle early ranges. Good for establishing breakout lines.',
      commonPairs: ['USD/JPY', 'AUD/JPY']
    },
    {
      name: 'London Kill Zone',
      nyTime: '2:00 AM – 5:00 AM',
      utcTime: '6:00 AM – 9:00 AM',
      characteristics: 'Aggressive institutional hunt sweep, often sets the daily low or high of major pairs.',
      sentiment: 'Major European sovereign volume injects here. High slippage breakout potential.',
      commonPairs: ['EUR/USD', 'GBP/USD']
    },
    {
      name: 'New York Kill Zone',
      nyTime: '7:00 AM – 10:00 AM',
      utcTime: '11:00 AM – 2:00 PM',
      characteristics: 'Strong overlap volatility, CME futures correlations, Federal release indices integration.',
      sentiment: 'High volume institutional flow. Trend updates, high liquidity reversions common.',
      commonPairs: ['XAU/USD (Gold)', 'NASDAQ']
    }
  ];

  // Helper to determine if an hour falls in the session
  const isSessionActive = (session: Session) => {
    const hour = getActiveHourUTC();
    if (session.utcStart <= session.utcEnd) {
      return hour >= session.utcStart && hour < session.utcEnd;
    } else {
      // Overnight session (e.g., 22 PM to 7 AM UTC)
      return hour >= session.utcStart || hour < session.utcEnd;
    }
  };

  const isKillZoneActive = (kz: KillZone) => {
    const hour = getActiveHourUTC();
    if (kz.name.includes('Asian')) {
      return hour >= 23 || hour < 2;
    } else if (kz.name.includes('London')) {
      return hour >= 6 && hour < 9;
    } else {
      return hour >= 11 && hour < 14;
    }
  };

  const getVolatilityBadgeClass = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-rose-950/40 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
      case 'medium':
        return 'bg-amber-950/40 text-amber-400 border border-amber-500/30';
      case 'low':
      default:
        return 'bg-cyan-950/40 text-[#00FFE1] border border-[#00FFE1]/20';
    }
  };

  // Active status text helper to display in collapsed view 
  const activeSessionsList = sessions
    .filter(isSessionActive)
    .map(s => s.name.replace(' Session', ''))
    .join(' & ');

  if (!isExpanded) {
    return (
      <div className="bg-[#050508]/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg text-left" id="global-market-kill-zones">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[#00ffe1] animate-pulse text-base">⚡</span> 
              <h2 className="text-sm font-semibold uppercase text-[#ff5a1f] tracking-wider">
                GLOBAL TRADING SESSIONS
              </h2>
            </div>
            {activeSessionsList && (
              <span className="text-[10px] sm:text-xs font-mono bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/35 px-2.5 py-0.5 rounded-full font-bold">
                ACTIVE: {activeSessionsList.toUpperCase()}
              </span>
            )}
            <span className="text-zinc-450 font-mono text-[10px] lg:block hidden">
              Live volatility indicators, currency center alignments, and CFTC liquidity windows.
            </span>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="font-mono text-xs text-zinc-300 bg-black/50 border border-zinc-800 px-3 py-1 rounded-lg">
              <span className="text-[#00ffe1] font-bold mr-1">UTC:</span>
              {currentUtcTime.toUTCString().replace('GMT', '').split(' ')[4]}
            </div>
            <button 
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#00ffe1] border border-[#00ffe1]/40 px-3 py-1.5 rounded-xl hover:bg-[#00ffe1]/10 bg-[#00ffe1]/5 transition-all text-center uppercase cursor-pointer"
            >
              <span>Expand Matrix</span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050508]/95 border-2 border-pink-500/20 rounded-3xl p-5 sm:p-6 md:p-8 space-y-6 md:space-y-8 shadow-[0_0_40px_rgba(236,72,153,0.06)] text-left" id="global-market-kill-zones">
      
      {/* Native Audio Source */}
      <audio 
        ref={audioRef}
        src={tracks[currentTrackIndex].src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => skipTrack('next')}
      />

      {/* 1. COMPLIANCE & SPECTRUM HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-[#ff5a1f]/30 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-black text-[#ff007f] tracking-[0.4em] uppercase block">
              INSTITUTIONAL SPECTRUM SYSTEM — SECURE COMPLIANCE
            </span>
            <button 
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-mono font-bold text-[#ff007f] border border-[#ff007f]/40 px-2 py-0.5 rounded-md hover:bg-[#ff007f]/10 bg-[#ff007f]/5 transition-all uppercase cursor-pointer"
            >
              <span>Minimize</span>
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-black uppercase text-[#ff5a1f] tracking-wider flex flex-wrap items-center gap-3 mt-1 drop-shadow-[0_0_20px_rgba(255,90,31,0.2)]">
            <span className="text-[#00ffe1] animate-pulse shrink-0">⚡</span> 
            GLOBAL TRADING SESSIONS
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-mono mt-1 font-semibold leading-relaxed">
            Live volatility matrix, currency center alignments, and CFTC liquidity windows. Now in <span className="text-[#00ffe1] font-black underline decoration-dashed decoration-[#ff007f]/50">Ultra-Legible Contrast Mode</span>.
          </p>
        </div>

        {/* TIME CONTROLLER DISPLAY CARD / NEON METERS */}
        <div className="flex flex-wrap items-center gap-4 bg-black/95 border border-[#00ffe1]/50 p-3 sm:p-4 rounded-xl w-full xl:w-auto shadow-[0_0_25px_rgba(0,255,225,0.15)]">
          <div className="space-y-1 font-mono text-xs sm:text-sm text-zinc-300">
            <div className="text-[#ff007f] font-black text-[10px] sm:text-xs tracking-wider uppercase">UTC LIVE TRADING MATRIX</div>
            <div className="text-[#00ffe1] font-black text-sm sm:text-base">
              {currentUtcTime.toUTCString().replace('GMT', 'UTC')}
            </div>
          </div>
          <div className="hidden sm:block w-[1px] h-10 bg-zinc-800" />
          <div className="space-y-1 font-mono text-xs sm:text-sm text-[#00ffe1]">
            <div className="text-[#ff5a1f] font-black text-[10px] sm:text-xs tracking-wider uppercase">PACIFIC PROTOCOL (PT)</div>
            <div className="text-[#ff007f] font-black text-sm sm:text-base animate-pulse">
              {currentUtcTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC TIMEFRAME SIMULATION BAR */}
      <div className="bg-gradient-to-r from-purple-950/20 via-pink-950/15 to-[#050508]/90 border-2 border-[#ff007f]/20 p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <Radio className="text-[#00ffe1] w-5 h-5 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-mono font-black text-[#00ffe1] uppercase tracking-widest">
              {overrideHour !== null ? '⚠️ TESTING SIMULATED SESSION HOUR' : '⏳ ACTIVE RADAR TIMELINE'}
            </span>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            {overrideHour !== null ? (
              <button 
                onClick={() => setOverrideHour(null)}
                className="text-[#ff007f] font-black hover:underline uppercase tracking-wide bg-[#ff007f]/10 px-3 py-1 rounded-lg border border-[#ff007f]/30"
              >
                Reset to Live Radar Clock
              </button>
            ) : (
              <span className="bg-zinc-900 border border-white/5 text-zinc-300 px-2.5 py-1 rounded-lg">Drag below to preview future session overlap points</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-mono font-black text-[#ff007f] w-16 text-right shrink-0">00:00 UTC</span>
          <input 
            type="range" 
            min="0" 
            max="23" 
            value={overrideHour !== null ? overrideHour : currentUtcTime.getUTCHours()}
            onChange={(e) => setOverrideHour(parseInt(e.target.value))}
            className="flex-1 accent-[#00ffe1] h-2.5 bg-[#0a0a0f] border border-zinc-805 rounded-lg cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-mono font-black text-[#00ffe1] w-16 text-left shrink-0">23:00 UTC</span>
        </div>

        <div className="flex flex-wrap justify-between font-mono text-[10px] sm:text-xs text-zinc-400 font-bold px-2 uppercase gap-x-2">
          <span>Sydney Open</span>
          <span>Asian Core</span>
          <span>Frankfurt Open</span>
          <span>London Open</span>
          <span>NY Core Open</span>
          <span>NY Core Close</span>
        </div>
      </div>

      {/* 3. DYNAMIC FIVE REGIONAL SESSIONS CARDS GRID */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#00ffe1]/25 pb-2">
          <Globe className="text-[#00ffe1] w-5 h-5 shrink-0" />
          <h3 className="text-xs sm:text-sm font-mono font-black text-zinc-350 uppercase tracking-[0.2em]">
            ACTIVE SESSION VOLATILITY SPECTRUM
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 xl:gap-5">
          {sessions.map((session) => {
            const active = isSessionActive(session);
            return (
              <div 
                key={session.id}
                className={`relative p-4 sm:p-5 lg:p-3 xl:p-5 rounded-2xl xl:rounded-3xl text-left flex flex-col justify-between min-h-[14rem] select-none transition-all duration-300 ${
                  active 
                    ? 'bg-black border-2 border-[#00ffe1] shadow-[0_0_25px_rgba(0,255,225,0.15)] scale-[1.02] z-10' 
                    : 'bg-[#09090e] border border-white/5 opacity-75 hover:opacity-100 hover:border-[#ff007f]/30'
                }`}
              >
                {/* Active Session Laser Strip */}
                {active && (
                  <div className="absolute top-0 left-6 right-6 h-[3px] bg-gradient-to-r from-transparent via-[#ff007f] to-transparent" />
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm lg:text-[10px] xl:text-xs font-mono font-extrabold text-[#00ffe1] uppercase tracking-wider shrink-0">
                      {session.city}
                    </span>
                    {active && (
                      <span className="text-[10px] sm:text-xs lg:text-[8px] xl:text-[9px] font-mono bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/35 px-1.5 py-0.5 xl:px-3 xl:py-1 rounded-full font-black animate-pulse uppercase tracking-wider whitespace-nowrap shrink-0">
                        ● ACTIVE SPECTRUM
                      </span>
                    )}
                  </div>
                  
                  <h4 className={`text-base sm:text-xl lg:text-xs xl:text-sm font-cinzel font-black uppercase tracking-normal xl:tracking-wide leading-tight ${
                    session.id === 'sydney' ? 'text-[#00ffe1]' : 
                    session.id === 'london' || session.id === 'newyork' ? 'text-[#ff007f]' : 'text-[#ff5a1f]'
                  }`}>
                    {session.name}
                  </h4>
                  
                  <div className="space-y-1.5 font-mono text-xs sm:text-sm lg:text-[10px] xl:text-xs pt-1">
                    <div className="flex justify-between gap-1">
                      <span className="text-[#00ffe1] opacity-75 font-black uppercase text-[10px] lg:text-[9px] xl:text-[10px]">UTC ZONE:</span>
                      <strong className="text-white font-black whitespace-nowrap">{session.utcStart}:00 – {session.utcEnd}:00</strong>
                    </div>
                    <div className="flex justify-between border-t border-zinc-900/50 pt-1 gap-1">
                      <span className="text-[#ff007f] opacity-75 font-black uppercase text-[10px] lg:text-[9px] xl:text-[10px] font-mono">PT ZONE:</span>
                      <strong className="text-[#ff5a1f] font-black whitespace-nowrap">{session.ptStart === 24 ? '12 AM' : `${session.ptStart}:00`} – {session.ptEnd === 24 ? '12 AM' : `${session.ptEnd}:00`}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-[#ff5a1f]/30 flex flex-nowrap gap-1 items-center justify-between mt-3">
                  <span className={`text-[10px] sm:text-xs lg:text-[8px] xl:text-[10px] px-1.5 py-1 xl:px-3 xl:py-1.5 rounded font-black font-mono uppercase whitespace-nowrap ${getVolatilityBadgeClass(session.volatility)}`}>
                    {session.volatility}
                  </span>
                  <span className="text-[10px] sm:text-xs lg:text-[8px] xl:text-[10px] font-mono text-[#00ffe1] font-black bg-[#00ffe1]/10 px-1.5 py-0.5 xl:px-2.5 xl:py-1 border border-[#00ffe1]/30 xl:border-2 rounded whitespace-nowrap">
                    {session.commonPairs[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. KILL ZONES & OVERLAPS/RADIO CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        
        {/* LEFT COLUMN: THE THREE RADAR KILL ZONES (7 COLUMNS) */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-rose-500/30 pb-2 text-left">
            <Target className="text-[#ff007f] w-5 h-5 shrink-0" />
            <h3 className="text-xs sm:text-sm font-mono font-black text-zinc-300 uppercase tracking-widest">
              ⚡ LIVE LIQUIDITY "KILL ZONES" INDEX
            </h3>
          </div>

          <div className="space-y-5">
            {killZones.map((kz, index) => {
              const active = isKillZoneActive(kz);
              const colorTheme = kz.name.includes('Asian') ? 'text-[#00ffe1]' : kz.name.includes('London') ? 'text-[#ff007f]' : 'text-[#ff5a1f]';
              return (
                <div 
                  key={index}
                  className={`p-6 sm:p-7 rounded-3xl relative overflow-hidden transition-all text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                    active 
                      ? 'border-2 border-[#ff007f] bg-gradient-to-r from-red-950/20 to-purple-950/25 shadow-[0_0_25px_rgba(255,0,127,0.25)] bg-black' 
                      : 'border border-white/5 bg-[#09090e]'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#ff007f] via-[#00ffe1] to-transparent rounded-r" />
                  )}

                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className={`text-lg sm:text-xl font-cinzel font-black uppercase tracking-widest ${colorTheme}`}>
                        {kz.name}
                      </h4>
                      {active ? (
                        <span className="text-xs font-mono bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/40 px-3 py-1 rounded font-black animate-pulse uppercase tracking-widest">
                          🚨 ACTIVE TRANSIT SCAN
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-zinc-550 border border-white/5 px-2.5 py-1 rounded uppercase tracking-wider font-extrabold">
                          STANDBY MONITORING
                        </span>
                      )}
                    </div>
                    
                    <p className="text-base sm:text-lg text-zinc-200 leading-relaxed font-semibold">
                      <span className="text-[#00ffe1] font-bold">{kz.sentiment}</span> <span className="text-pink-200/80 font-normal">{kz.characteristics}</span>
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                      {kz.commonPairs.map((pair, pIdx) => (
                        <span key={pIdx} className="bg-black border border-[#00ffe1]/30 text-[#00ffe1] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,225,0.1)]">
                          {pair}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 w-full md:w-auto font-mono">
                    <div className="text-[#ff5a1f] text-xs font-black uppercase tracking-widest">NEW YORK TIME:</div>
                    <div className="text-white font-black text-base sm:text-lg">{kz.nyTime}</div>
                    <div className="text-[#00ffe1] font-black text-sm sm:text-base mt-1">{kz.utcTime} UTC</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: HARDWIRED PODCAST RADIO ROAD & OVERLAPS (5 COLUMNS) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* HARDWIRED POTENT PODCAST SPEAKER SYSTEM */}
          <div className="bg-[#090912] border-2 border-[#00ffe1] rounded-[2rem] p-6 sm:p-7 space-y-5 text-left relative overflow-hidden shadow-[0_0_35px_rgba(0,255,225,0.18)]">
            
            {/* Glowing Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff007f]/20 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-center justify-between border-b-2 border-[#ff5a1f]/35 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ff007f] via-[#00ffe1] to-[#ff5a1f] flex items-center justify-center shrink-0 animate-bounce shadow-[0_0_15px_rgba(0,255,225,0.3)]">
                  <Headphones className="text-black w-6 h-6 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-cinzel font-black text-[#ff007f] uppercase tracking-wider">
                    SPECTRUM RADIO
                  </h3>
                  <p className="text-xs font-mono font-black text-zinc-350 uppercase tracking-widest leading-none mt-1">
                    Hardwired live podcasts
                  </p>
                </div>
              </div>

              {/* Little interactive visual speaker waves */}
              <div className="flex items-end gap-1.5 h-7">
                <span className={`w-1.5 bg-[#ff007f] rounded-full transition-all duration-300 ${isPlaying ? 'h-6 animate-[pulse_1.1s_infinite]' : 'h-2'}`} />
                <span className={`w-1.5 bg-[#00ffe1] rounded-full transition-all duration-300 ${isPlaying ? 'h-7 animate-[pulse_0.8s_infinite]' : 'h-3'}`} />
                <span className={`w-1.5 bg-[#ff5a1f] rounded-full transition-all duration-300 ${isPlaying ? 'h-5 animate-[pulse_1.3s_infinite]' : 'h-1.5'}`} />
                <span className={`w-1.5 bg-[#00ffe1] rounded-full transition-all duration-300 ${isPlaying ? 'h-6 animate-[pulse_0.9s_infinite]' : 'h-2'}`} />
              </div>
            </div>

            {/* Core Podcast Track Display Panel */}
            <div className="bg-black/95 rounded-2xl p-5 border border-[#00ffe1]/20 flex flex-col justify-between min-h-[10rem] relative">
              <div className="space-y-2">
                <span className="text-xs font-mono font-black bg-[#ff007f]/20 text-[#ff007f] px-3 py-1 border border-[#ff007f]/45 rounded-full uppercase tracking-wider inline-block">
                  {tracks[currentTrackIndex].date} BROADCAST
                </span>
                
                <h4 className="text-lg sm:text-xl font-cinzel font-black text-[#00ffe1] uppercase tracking-wide truncate mt-1">
                  {tracks[currentTrackIndex].title}
                </h4>
                
                <p className="text-sm sm:text-base font-mono text-[#ff5a1f] font-black">
                  🎙️ {tracks[currentTrackIndex].trader}
                </p>
                
                <p className="text-xs sm:text-sm text-zinc-300 font-bold leading-relaxed line-clamp-2 md:line-clamp-1">
                  Topic: {tracks[currentTrackIndex].topic}
                </p>
              </div>

              {/* Seek Timeline Progress Bar */}
              <div className="pt-4 space-y-1.5">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressBarChange}
                  className="w-full accent-[#ff007f] h-2 bg-zinc-800 rounded-full cursor-pointer"
                />
                <div className="flex justify-between font-mono text-xs text-zinc-550 font-black uppercase">
                  <span>{formatAudioTime(currentTime)}</span>
                  <span>{formatAudioTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Audio Controller Knobs */}
            <div className="flex items-center justify-between gap-4">
              
              {/* Skip & Play Buttons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => skipTrack('prev')}
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 hover:border-[#ff007f]/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Previous Podcast"
                >
                  <span className="font-mono text-xs font-black">◀◀</span>
                </button>

                <button 
                  onClick={togglePlay}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg transform hover:scale-105 ${
                    isPlaying 
                      ? 'bg-[#ff007f] hover:bg-[#d10068] text-white shadow-[0_0_15px_rgba(255,0,127,0.4)]' 
                      : 'bg-[#00ffe1] hover:bg-[#00d8bf] text-black shadow-[0_0_15px_rgba(0,255,225,0.4)]'
                  }`}
                  title={isPlaying ? 'Pause Broadcast' : 'Play Live Podcast'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button 
                  onClick={() => skipTrack('next')}
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 hover:border-[#ff007f]/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Next Podcast"
                >
                  <span className="font-mono text-xs font-black">▶▶</span>
                </button>
              </div>

              {/* Volume & Mute Controls */}
              <div className="flex items-center gap-2 bg-black/60 border border-white/5 py-1 px-3 rounded-full">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-zinc-400 hover:text-[#00ffe1] transition-all cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#00ffe1]" />
                  )}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-16 accent-[#00ffe1] h-1 cursor-pointer"
                  title="Live Volume"
                />
              </div>

            </div>

            {/* List Of All Available Podcasts to Select */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="text-[10px] font-mono font-black text-[#ff007f] tracking-widest uppercase mb-1">
                AVAILABLE TRADER CHRONICLES:
              </div>

              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {tracks.map((t, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <button 
                      key={t.id}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left border font-mono transition-all duration-200 flex justify-between items-center ${
                        isCurrent 
                          ? 'border-[#00ffe1] bg-[#00ffe1]/5 text-[#00ffe1]' 
                          : 'border-white/5 bg-black/40 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-extrabold uppercase truncate">{t.title}</div>
                        <div className="text-[10px] text-zinc-550 truncate">{t.trader}</div>
                      </div>
                      <span className="text-[10px] shrink-0 font-bold font-mono border-l border-white/10 pl-2.5">
                        {t.duration}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SESSION OVERLAPS MATRIX */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-purple-500/35 pb-2 text-left">
              <Shuffle className="text-purple-400 w-5 h-5 shrink-0" />
              <h3 className="text-xs sm:text-sm font-mono font-black text-zinc-350 uppercase tracking-widest">
                SESSION OVERLAPS
              </h3>
            </div>

            <div className="space-y-4 text-left">
              {/* Overlap 1 */}
              <div className="p-5 sm:p-6 rounded-3xl bg-black/60 border-l-4 border-[#ff007f] space-y-2 border border-white/5 shadow-md">
                <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-cinzel">
                  London + New York Peak Overlap
                </h4>
                <div className="font-mono text-xs text-zinc-300">
                  <span>UTC: 13:00 – 17:00</span>
                  <span className="block text-[#00ffe1] font-semibold">PT (Pacific): 06:00 AM – 10:00 AM</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-semibold">
                  This represents the highest institutional liquidity cluster globally. Major economic releases and key trend breakout patterns initiate directly inside this pocket.
                </p>
              </div>

              {/* Overlap 2 */}
              <div className="p-5 sm:p-6 rounded-3xl bg-black/60 border-l-4 border-[#00ffe1] space-y-2 border border-white/5 shadow-md">
                <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-cinzel">
                  Tokyo + London Transition window
                </h4>
                <div className="font-mono text-xs text-zinc-300">
                  <span className="block text-purple-400 font-extrabold">UTC: 07:00 AM – 09:00 AM</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-semibold">
                  Commonly creates morning fake outs, stop hunt sweeps of Asian high/low ranges, and severe reversal setups ahead of primary European market hours.
                </p>
              </div>
            </div>
          </div>

          {/* SKELETON GLOBAL FLOW ACCENT BADGE */}
          <div className="bg-black/95 border-2 border-[#ff007f]/20 p-5 rounded-2xl space-y-2 select-none">
            <div className="text-[10px] font-mono text-[#ff007f] font-black uppercase tracking-widest">
              🔁 CONTINUOUS INTEGRATED CAPITAL ROTATION
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-black text-[#00ffe1] italic overflow-hidden whitespace-nowrap text-ellipsis uppercase">
              <span>SYDNEY</span>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              <span>TOKYO/SG</span>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              <span>FRANKFURT</span>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              <span>LONDON</span>
              <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-[#ff007f]">NEW YORK</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
