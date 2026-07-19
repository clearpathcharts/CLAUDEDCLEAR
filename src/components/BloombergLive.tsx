import React, { useState } from 'react';
import { Play, Tv, Eye, Maximize2, RefreshCw } from 'lucide-react';

export const BloombergLive: React.FC = React.memo(() => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewers, setViewers] = useState('48.2k');

  return (
    <div className="flex flex-col h-full justify-between font-sans text-neutral-200">
      {/* 1. Bloomberg Top header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Red Pulse live dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
          <span className="text-[10px] font-black uppercase text-[#ff1493] tracking-widest font-mono">
            Bloomberg Live
          </span>
        </div>
        <span className="font-mono text-[9px] text-zinc-500">
          <Eye size={10} className="inline mr-1" /> {viewers} watching
        </span>
      </div>

      {/* 2. Large Video Preview Layout (Netflix/YouTube style) */}
      <div 
        onClick={() => setIsPlaying(true)}
        className="relative flex-1 my-3 rounded-xl overflow-hidden group/tv cursor-pointer w-full aspect-video border border-white/10 bg-neutral-950 shadow-inner"
      >
        <img 
          src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600" 
          alt="Bloomberg Live News desk camera focus" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover/tv:scale-105 transition-transform duration-700 pointer-events-none"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#ff1493] text-white flex items-center justify-center shadow-[0_0_25px_rgba(255,20,147,0.55)] group-hover:shadow-[0_0_35px_rgba(255,20,147,0.75)] group-hover:scale-110 transition-all duration-300 transform">
            <Play size={20} className="fill-white ml-1" />
          </div>
        </div>

        {/* Live overlay banner */}
        <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
          LIVE STREAM
        </div>

        {/* Anchor name and broadcast title */}
        <div className="absolute bottom-3 left-3 right-3 text-left">
          <p className="font-bold text-white text-xs sm:text-sm tracking-wide leading-tight drop-shadow-md font-serif italic text-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Fed Interest Rate Discussion & Quantitative Vector Update
          </p>
        </div>
      </div>

      {/* 3. Stream Controller: Watch Live Trigger */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          className="flex-1 py-3 bg-gradient-to-r from-[#ff1493] to-purple-600 hover:shadow-[0_0_15px_rgba(255,20,147,0.45)] text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Play size={10} className="fill-white" />
          ▶ WATCH LIVE STREAMING
        </button>
        
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          className="p-3 bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95"
          title="Fullscreen Live Transmission"
        >
          <Maximize2 size={12} />
        </button>
      </div>

      {/* Bloomberg TV Stream Overlay Modal */}
      {isPlaying && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-in select-none">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-[#ff1493]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,20,147,0.3)] flex flex-col justify-between max-h-[90vh]">
            
            {/* Header of Modal */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/45 text-left">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1493] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff1493]" />
                </span>
                <span className="font-serif text-sm font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#ff1493] to-[#00ffff] tracking-widest flex items-center gap-2">
                  <Tv size={14} className="text-[#ff1493]" />
                  CLEARPATH BLOOMBERG TV STREAM
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                className="p-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-950/40 rounded-xl text-[10px] font-mono hover:text-white transition-all cursor-pointer"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Video Live Frame */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <iframe
                title="Bloomberg Livestream Player"
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dp8PhLsUcFE?autoplay=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Modal Footer information bar */}
            <div className="bg-black p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 font-mono text-[9px] text-zinc-500">
              <div className="flex items-center gap-1.5 uppercase font-bold text-zinc-400">
                <span>FEED STATUS: STABLE CONNECTION</span>
                <span>•</span>
                <span>PORT: 3000 BROADCAST</span>
              </div>
              <span className="uppercase text-zinc-600 font-extrabold tracking-wider">
                © CPMS TV LIVE TRANSMISSION DECK
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
});

BloombergLive.displayName = 'BloombergLive';
export default BloombergLive;
