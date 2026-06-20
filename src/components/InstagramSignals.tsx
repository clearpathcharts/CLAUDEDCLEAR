import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Star } from 'lucide-react';

export const InstagramSignals: React.FC = React.memo(() => {
  const [likes, setLikes] = useState(14800);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasBookmarked, setHasBookmarked] = useState(false);

  const handleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
    } else {
      setLikes(prev => prev + 1);
    }
    setHasLiked(!hasLiked);
  };

  const hashtags = ['#gold', '#stocks', '#bitcoin'];

  return (
    <div className="flex flex-col h-full justify-between font-sans text-neutral-200">
      {/* 1. Profile / Header row */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          {/* Neon Instagram-like colored circle вокруг аватарки */}
          <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=50" 
              alt="Creator Profile" 
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full border border-neutral-950 object-cover" 
            />
          </div>
          <div className="space-y-0.5 text-left">
            <span className="text-[10px] font-black tracking-wide text-white block font-serif">
              clearpath.capital
            </span>
            <span className="text-[8px] text-zinc-500 tracking-wider uppercase block font-mono">
              Milan, Italy • Trending
            </span>
          </div>
        </div>

        <Star size={12} className="text-[#ff1493] animate-pulse" />
      </div>

      {/* 2. Main Large Instagram Image (80% weight) */}
      <div className="relative flex-1 my-3 rounded-xl overflow-hidden group/insta min-h-[160px] border border-white/5 bg-neutral-950">
        <img 
          src="https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=600" 
          alt="Immersive neon stock market charts" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover/insta:scale-105 transition-transform duration-700 pointer-events-none"
        />
        {/* Soft elegant vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        {/* Floating Category Label */}
        <span className="absolute top-3 right-3 bg-black/75 border border-white/10 text-[#ff1493] font-mono text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
          EXPLORE DECK
        </span>

        {/* Hashtags and content Overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-left space-y-1.5">
          <span className="text-[8.5px] font-black tracking-widest uppercase font-mono text-[#ff1493]">
            TRENDING TODAY
          </span>
          <div className="flex gap-1.5">
            {hashtags.map(tg => (
              <span 
                key={tg} 
                className="px-2.5 py-0.5 rounded-full bg-[#ff1493]/15 border border-[#ff1493]/35 text-[#ff1493] text-[9px] font-black uppercase font-mono tracking-wider drop-shadow-sm"
              >
                {tg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Social Metrics Row (20% text) */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={handleLike} 
              aria-label="Like"
              className="text-zinc-400 hover:text-[#ff1493] transition-colors cursor-pointer active:scale-90"
            >
              <Heart size={14} className={hasLiked ? "fill-[#ff1493] text-[#ff1493]" : ""} />
            </button>
            <button type="button" aria-label="Comment" className="text-zinc-400 hover:text-white transition-colors">
              <MessageCircle size={14} />
            </button>
            <button type="button" aria-label="Send" className="text-zinc-400 hover:text-white transition-colors">
              <Send size={14} />
            </button>
          </div>

          <button 
            type="button" 
            aria-label="Bookmark"
            onClick={() => setHasBookmarked(!hasBookmarked)}
            className="text-zinc-400 hover:text-[#00ffff] transition-colors cursor-pointer active:scale-95"
          >
            <Bookmark size={14} className={hasBookmarked ? "fill-[#00ffff] text-[#00ffff]" : ""} />
          </button>
        </div>

        <div className="text-left text-[10px]">
          <span className="font-extrabold text-white mr-1.5 font-serif text-[11px]">
            {(likes / 1000).toFixed(1)}k likes
          </span>
          <span className="text-zinc-400 font-sans leading-relaxed">
            Market liquidity curves shifting towards active risk assets...
          </span>
        </div>
      </div>
    </div>
  );
});

InstagramSignals.displayName = 'InstagramSignals';
export default InstagramSignals;
