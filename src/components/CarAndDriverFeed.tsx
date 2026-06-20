import React, { useState } from 'react';
import { BookOpen, ArrowRight, Heart } from 'lucide-react';

export const CarAndDriverFeed: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likes, setLikes] = useState(2540);
  const [hasLiked, setHasLiked] = useState(false);

  const article = {
    title: 'The 2027 Corvette ZR1',
    desc: 'Bypassing current megawatt electrical systems, the 2027 Corvette ZR1 leverages precision twin-turbocharged active drivetrains for supreme physics performance.',
    category: 'AUTO REVIEW',
    source: 'Car & Driver Magazine',
    time: '5m read',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
    fullContent: 'The 2027 Chevrolet Corvette ZR1 has shattered expectations by retaining a monstrous flat-plane crank twin-turbocharged V8 engine that output coordinates above 1,064 horsepower. This state-of-the-art propulsion mechanism introduces active carbon-matrix cooling buffers to handle sudden vertical thermal cycles under high speed draw rates. Utilizing advanced computational aerodynamics, the ZR1 crafts a record-breaking 1,200 lbs of downforce, asserting complete control over high speed sweep layouts. Inside the high-g cockpit, modern digital displays pair with raw analog controls, stripping visual clutter for pure high-octane performance.'
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) {
      setLikes(prev => prev - 1);
    } else {
      setLikes(prev => prev + 1);
    }
    setHasLiked(!hasLiked);
  };

  return (
    <div className="flex flex-col h-full justify-between font-sans text-neutral-200">
      {/* 1. Magazine header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-[#00ffff]" />
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">
            Car & Driver Review
          </span>
        </div>
        <span className="font-mono text-[9px] text-[#00ffff] font-extrabold uppercase">
          EST. MATURITY 2027
        </span>
      </div>

      {/* 2. Large Supercar Image (80% visual block) */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="relative flex-1 my-3 rounded-xl overflow-hidden group/car cursor-pointer w-full aspect-video border border-white/5 bg-neutral-950"
      >
        <img 
          src={article.image} 
          alt="2027 Corvette ZR1 on the open road" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover/car:scale-105 transition-transform duration-700 pointer-events-none"
        />
        {/* Editorial overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

        {/* Magazine Issue tag */}
        <span className="absolute top-3 right-3 bg-white text-black font-mono text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
          JULY 2026 ISSUE
        </span>

        {/* High-end Overlay Text */}
        <div className="absolute bottom-4 left-4 right-4 text-left space-y-1">
          <h4 className="text-lg sm:text-xl font-black italic font-serif text-white tracking-wide leading-tight drop-shadow-lg">
            {article.title}
          </h4>
          <span className="text-[9px] text-zinc-300 font-sans tracking-wide pr-1 line-clamp-1 opacity-90">
            A twin-turbocharged 1,064-HP titan with custom carbon active wings.
          </span>
        </div>
      </div>

      {/* 3. Magazine Review Footer (Interactive Read Review option) */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleLike}
          className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-[#ff1493] transition-colors"
        >
          <Heart size={12} className={hasLiked ? "fill-[#ff1493] text-[#ff1493]" : ""} />
          <span>{likes.toLocaleString()} likes</span>
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-[10px] font-mono uppercase font-black text-[#00ffff] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
        >
          READ REVIEW <ArrowRight size={12} className="transition-transform group-hover/car:translate-x-1" />
        </button>
      </div>

      {/* Immersive automotive card reader */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[201] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fade-in text-left">
          <div className="relative w-full max-w-xl bg-zinc-950 border border-[#ff1493]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,20,147,0.3)] flex flex-col justify-between max-h-[90vh]">
            
            {/* Header of Modal */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#00ffff]" />
                <span className="font-mono text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                  CAR & DRIVER SPECIAL INTEL REPORT
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-950/40 rounded-xl text-[10px] font-mono hover:text-white transition-all cursor-pointer"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Immersive Body with cover photo */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 text-left">
              {/* Cover Photo */}
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/5 relative bg-zinc-900">
                <img 
                  src={article.image} 
                  alt="Supercar Corvette ZR1 custom review" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-[#ff1493] text-white text-[8px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded uppercase">
                    SPECIAL REVIEW
                  </span>
                  <span className="bg-[#00ffff]/10 border border-[#00ffff]/20 text-[#00ffff] text-[8px] font-mono tracking-widest px-2.5 py-0.5 rounded uppercase font-bold">
                    EST. TORQUE SHIFT
                  </span>
                </div>
              </div>

              {/* Title & info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-zinc-500 font-mono text-[9px]">
                  <span>PUBLICATION: {article.source}</span>
                  <span>•</span>
                  <span>{article.time}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white leading-tight">
                  {article.title}
                </h3>
              </div>

              {/* Description quote */}
              <p className="text-zinc-400 text-xs leading-relaxed border-l-2 border-[#00ffff] pl-4 italic">
                {article.desc}
              </p>

              <div className="text-zinc-300 text-xs leading-relaxed space-y-4 font-sans">
                <p>{article.fullContent}</p>
                <p>Equipped with a rear twin-turbo setup producing unprecedented intake compression, the 2027 ZR1 leverages its modular mechanics core to process hyper speeds. It marks a pinnacle of combustion supercar engineering before hybrid regulations lock the platform entirely.</p>
              </div>

              {/* Interact */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                    hasLiked 
                      ? 'border-[#ff1493] bg-[#ff1493]/15 text-[#ff1493]' 
                      : 'border-white/5 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart size={12} className={hasLiked ? 'fill-[#ff1493] text-[#ff1493]' : ''} />
                  <span>{hasLiked ? 'REVIEWS LIKED' : 'LIKE THIS REVIEW'} ({likes.toLocaleString()})</span>
                </button>

                <span className="text-[10px] text-zinc-500 font-mono italic">
                  ClearPath Parity Checked
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-zinc-950 px-6 py-4 border-t border-white/10 flex items-center justify-between text-zinc-500 font-mono text-[9px]">
              <span>MAGAZINE PARITY DECK</span>
              <span>SECURE HANDSHAKE COMPLIANT</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
});

CarAndDriverFeed.displayName = 'CarAndDriverFeed';
export default CarAndDriverFeed;
