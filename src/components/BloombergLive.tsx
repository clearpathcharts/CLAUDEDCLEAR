import React, { useState } from 'react';
import { Play, Tv, Eye, Maximize2, Archive } from 'lucide-react';
import { LIVE_STREAM_SOURCES, youtubeEmbedUrl } from '../cpms/mediaPantryCatalog';

export const BloombergLive: React.FC = React.memo(() => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState(
    LIVE_STREAM_SOURCES.find((s) => s.id === 'cnbc')?.id || LIVE_STREAM_SOURCES[0].id
  );
  const [viewers] = useState('48.2k');

  const activeStream =
    LIVE_STREAM_SOURCES.find((s) => s.id === activeStreamId) || LIVE_STREAM_SOURCES[0];
  const embedUrl = youtubeEmbedUrl(activeStream);

  const openPlayer = (streamId?: string) => {
    if (streamId) setActiveStreamId(streamId);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full justify-between font-sans text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
          <span className="text-[10px] font-black uppercase text-[#ff1493] tracking-widest font-mono">
            {activeStream.label}
          </span>
        </div>
        <span className="font-mono text-[9px] text-zinc-500">
          <Eye size={10} className="inline mr-1" /> {viewers} watching
        </span>
      </div>

      <button
        type="button"
        onClick={() => openPlayer()}
        className="relative flex-1 my-3 rounded-xl overflow-hidden group/tv cursor-pointer w-full aspect-video border border-white/10 bg-neutral-950 shadow-inner text-left"
      >
        <img
          src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600"
          alt="Live market news desk"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover/tv:scale-105 transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-[#ff1493] text-white flex items-center justify-center shadow-[0_0_25px_rgba(255,20,147,0.55)] group-hover:shadow-[0_0_35px_rgba(255,20,147,0.75)] group-hover:scale-110 transition-all duration-300 transform">
            <Play size={20} className="fill-white ml-1" />
          </div>
        </div>
        <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded pointer-events-none">
          LIVE STREAM
        </div>
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <h5 className="font-bold text-white text-xs sm:text-sm tracking-wide leading-tight drop-shadow-md font-serif italic">
            {activeStream.description}
          </h5>
        </div>
      </button>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {LIVE_STREAM_SOURCES.slice(0, 4).map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => openPlayer(source.id)}
            className={`px-2 py-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider border transition-all cursor-pointer ${
              activeStreamId === source.id
                ? 'border-[#ff1493]/50 bg-[#ff1493]/15 text-[#ff1493]'
                : 'border-white/10 text-zinc-500 hover:text-white hover:border-zinc-700'
            }`}
          >
            {source.network}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => openPlayer()}
          className="flex-1 py-3 bg-gradient-to-r from-[#ff1493] to-purple-600 hover:shadow-[0_0_15px_rgba(255,20,147,0.45)] text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Play size={10} className="fill-white" />
          Watch Live Streaming
        </button>
        <button
          type="button"
          onClick={() => openPlayer('yahoo')}
          className="px-3 py-3 bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 text-[8px] font-mono font-black uppercase"
          title="Broadcast archive — recent sessions"
        >
          <Archive size={12} />
          Archive
        </button>
        <button
          type="button"
          onClick={() => openPlayer()}
          className="p-3 bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95"
          title="Fullscreen live transmission"
        >
          <Maximize2 size={12} />
        </button>
      </div>

      {isPlaying && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-in select-none">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-[#ff1493]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,20,147,0.3)] flex flex-col justify-between max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/45 text-left gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1493] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff1493]" />
                </span>
                <span className="font-serif text-sm font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#ff1493] to-[#00ffff] tracking-widest flex items-center gap-2 truncate">
                  <Tv size={14} className="text-[#ff1493] shrink-0" />
                  {activeStream.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPlaying(false)}
                className="p-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-950/40 rounded-xl text-[10px] font-mono hover:text-white transition-all cursor-pointer shrink-0"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {embedUrl ? (
                <iframe
                  title={`${activeStream.label} livestream`}
                  width="100%"
                  height="100%"
                  src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <p className="text-zinc-500 text-sm font-mono p-8 text-center">
                  Stream unavailable. Try another network tab above.
                </p>
              )}
            </div>

            <div className="bg-black p-4 border-t border-white/10 flex flex-wrap gap-2">
              {LIVE_STREAM_SOURCES.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setActiveStreamId(source.id)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase border cursor-pointer ${
                    activeStreamId === source.id
                      ? 'border-[#ff1493] text-[#ff1493] bg-[#ff1493]/10'
                      : 'border-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

BloombergLive.displayName = 'BloombergLive';
export default BloombergLive;
