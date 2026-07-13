import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, X, Users, ExternalLink } from 'lucide-react';

export const FacebookIntel: React.FC = React.memo(() => {
  const [likes, setLikes] = useState(18240);
  const [commentsCount, setCommentsCount] = useState(2410);
  const [hasLiked, setHasLiked] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const handleLike = () => {
    if (hasLiked) {
      setLikes((prev) => prev - 1);
    } else {
      setLikes((prev) => prev + 1);
    }
    setHasLiked(!hasLiked);
  };

  const handleComment = () => {
    setCommentsCount((prev) => prev + 1);
  };

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
  ];

  return (
    <div className="flex flex-col h-full justify-between font-sans text-neutral-200">
      <button
        type="button"
        onClick={() => setGroupOpen(true)}
        className="flex items-center justify-between pb-3 border-b border-white/5 w-full text-left cursor-pointer group/header hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#00FFFF]/20 bg-neutral-900 flex items-center justify-center font-bold text-sm text-cyan-400">
            S
          </div>
          <div className="space-y-0.5">
            <h5 className="text-[11px] font-black tracking-wider uppercase text-white font-serif group-hover/header:text-[#00ffff] transition-colors">
              Sovereign Market Traders
            </h5>
            <div className="flex items-center gap-1.5 text-[9px] text-[#00ffff] font-mono">
              <Globe size={10} className="text-[#00ffff]" />
              <span>Public Group • 142k Members • Tap for hub</span>
            </div>
          </div>
        </div>
        <MoreHorizontal size={14} className="text-zinc-500 group-hover/header:text-white" />
      </button>

      <button
        type="button"
        onClick={() => setGroupOpen(true)}
        className="relative flex-1 my-3 rounded-xl overflow-hidden group/img min-h-[160px] border border-white/5 bg-neutral-950 w-full text-left cursor-pointer"
      >
        <img
          src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600"
          alt="Trading room with gold prices chart"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5 pointer-events-none" />
        <div className="absolute bottom-4 left-4 right-4 space-y-1 pointer-events-none">
          <span className="inline-block bg-blue-600 text-white font-mono text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
            MARKET SENTIMENT
          </span>
          <p className="text-sm sm:text-base font-bold font-serif text-white tracking-wide leading-snug drop-shadow-md">
            &quot;Gold traders are preparing for CPI tomorrow. Overnight collateral calls peak as positions lock.&quot;
          </p>
        </div>
      </button>

      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="User avatar"
                  referrerPolicy="no-referrer"
                  className="w-4.5 h-4.5 rounded-full border border-neutral-950 object-cover"
                />
              ))}
            </div>
            <span className="text-[#00ffff] font-extrabold font-sans">
              {(likes / 1000).toFixed(1)}k Reactions
            </span>
          </div>
          <button type="button" onClick={handleComment} className="hover:underline cursor-pointer">
            {commentsCount.toLocaleString()} comments
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={handleLike}
            className={`py-1.5 rounded-xl border flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase font-black transition-all cursor-pointer active:scale-95 ${
              hasLiked
                ? 'border-[#00ffff] bg-[#00ffff]/10 text-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.15)]'
                : 'border-white/5 bg-[#030307]/40 text-zinc-400 hover:text-white hover:border-zinc-800'
            }`}
          >
            <ThumbsUp size={11} className={hasLiked ? 'fill-[#00ffff] animate-bounce' : ''} />
            <span>{hasLiked ? 'Liked' : 'Like'}</span>
          </button>
          <button
            type="button"
            onClick={handleComment}
            className="py-1.5 rounded-xl border border-white/5 bg-[#030307]/40 hover:border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase font-black transition-all cursor-pointer active:scale-95"
          >
            <MessageCircle size={11} />
            <span>Comment</span>
          </button>
          <button
            type="button"
            onClick={() => setGroupOpen(true)}
            className="py-1.5 rounded-xl border border-white/5 bg-[#030307]/40 hover:border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase font-black transition-all cursor-pointer active:scale-95"
          >
            <Share2 size={11} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {groupOpen && (
        <div className="fixed inset-0 z-[180] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#00ffff]/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-lg">
                  S
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Sovereign Market Traders
                  </h3>
                  <p className="text-[10px] text-[#00ffff] font-mono flex items-center gap-1 mt-0.5">
                    <Users size={10} /> 142,000 members • Public
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGroupOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Macro traders, liquidity desks, and visual chartists sharing setups without casino hype.
              Join the ClearPath community lobby below for live chat, or connect your account for private guilds.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setGroupOpen(false);
                  document.getElementById('clearpath-live-lobby')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#00ffff]/15 border border-[#00ffff]/35 text-[#00ffff] text-[10px] font-black uppercase tracking-widest hover:bg-[#00ffff] hover:text-black transition-all cursor-pointer"
              >
                Open Live Lobby
              </button>
              <a
                href="https://www.facebook.com/groups/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                title="Open Facebook groups"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

FacebookIntel.displayName = 'FacebookIntel';
export default FacebookIntel;
