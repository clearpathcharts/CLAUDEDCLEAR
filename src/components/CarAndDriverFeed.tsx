import React, { useMemo, useState } from 'react';
import { BookOpen, ArrowRight, Heart } from 'lucide-react';
import { useYwcDigest } from '../hooks/useYwcDigest';
import { digestItemToNewsCard, pickDigestItem } from '../lib/ywc/feedMappers';

const FALLBACK_ARTICLE = {
  title: 'Loading latest automotive review…',
  desc: 'Syncing Car & Driver RSS feed.',
  category: 'AUTO REVIEW',
  source: 'Car & Driver Magazine',
  time: 'Live',
  image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  fullContent: 'Fetching the newest review from our automotive RSS partners.',
};

export const CarAndDriverFeed: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likes, setLikes] = useState(2540);
  const [hasLiked, setHasLiked] = useState(false);
  const { items } = useYwcDigest();

  const liveItem = useMemo(
    () => pickDigestItem(items, 'magazine', 'car'),
    [items]
  );

  const article = useMemo(() => {
    if (!liveItem) return FALLBACK_ARTICLE;
    const card = digestItemToNewsCard(liveItem);
    return {
      title: card.title,
      desc: card.desc,
      category: card.subcategory.toUpperCase(),
      source: card.source,
      time: card.time,
      image: card.image,
      fullContent: card.longText,
      link: card.link,
    };
  }, [liveItem]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) {
      setLikes((prev) => prev - 1);
    } else {
      setLikes((prev) => prev + 1);
    }
    setHasLiked(!hasLiked);
  };

  return (
    <div className="flex flex-col h-full justify-between font-sans text-neutral-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-[#00ffff]" />
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">
            Car & Driver Review
          </span>
        </div>
        <span className="font-mono text-[9px] text-[#00ffff] font-extrabold uppercase">
          LIVE RSS
        </span>
      </div>

      <div
        onClick={() => setIsModalOpen(true)}
        className="relative flex-1 my-3 rounded-xl overflow-hidden group/car cursor-pointer w-full aspect-video border border-white/5 bg-neutral-950"
      >
        <img
          src={article.image}
          alt={article.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover/car:scale-105 transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />
        <span className="absolute top-3 right-3 bg-white text-black font-mono text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
          {article.time}
        </span>
        <div className="absolute bottom-4 left-4 right-4 text-left space-y-1">
          <h4 className="text-lg sm:text-xl font-black italic font-serif text-white tracking-wide leading-tight drop-shadow-lg">
            {article.title}
          </h4>
          <span className="text-[9px] text-zinc-300 font-sans tracking-wide pr-1 line-clamp-2 opacity-90">
            {article.desc}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleLike}
          className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-[#ff1493] transition-colors"
        >
          <Heart size={12} className={hasLiked ? 'fill-[#ff1493] text-[#ff1493]' : ''} />
          <span>{likes.toLocaleString()} likes</span>
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-[10px] font-mono uppercase font-black text-[#00ffff] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
        >
          READ REVIEW <ArrowRight size={12} />
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[201] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fade-in text-left">
          <div className="relative w-full max-w-xl bg-zinc-950 border border-[#ff1493]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,20,147,0.3)] flex flex-col justify-between max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#00ffff]" />
                <span className="font-mono text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                  CAR & DRIVER LIVE RSS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-950/40 rounded-xl text-[10px] font-mono hover:text-white transition-all cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 text-left">
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/5 relative bg-zinc-900">
                <img
                  src={article.image}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
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
              <p className="text-zinc-400 text-xs leading-relaxed border-l-2 border-[#00ffff] pl-4 italic">
                {article.desc}
              </p>
              <div className="text-zinc-300 text-xs leading-relaxed font-sans">
                <p>{article.fullContent}</p>
              </div>
              {'link' in article && article.link && (
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-[10px] font-mono text-[#00ffff] hover:text-white uppercase tracking-widest"
                >
                  Read on publisher site →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CarAndDriverFeed.displayName = 'CarAndDriverFeed';
export default CarAndDriverFeed;
