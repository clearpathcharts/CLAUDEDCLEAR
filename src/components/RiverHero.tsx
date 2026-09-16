import React, { useState } from 'react';
import { Sparkles, Waves, Play } from 'lucide-react';
import { RIVER_PAGE_CONTENT } from '../river/marketing/riverPageContent';

type HeroClip = 'genie' | 'tributaries';

export default function RiverHero() {
  const [clip, setClip] = useState<HeroClip>('genie');
  const { hero, pillars } = RIVER_PAGE_CONTENT;
  const src =
    clip === 'genie' ? hero.videos.genieWorkstation : hero.videos.tributariesCharts;

  return (
    <section
      className="mb-8 rounded-2xl overflow-hidden border border-[#00D9FF]/20 bg-gradient-to-br from-[#00D9FF]/5 via-black/40 to-[#FFD700]/5"
      id="river-hero-auto-updated"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#00D9FF]/80 mb-2">{hero.eyebrow}</p>
          <div className="flex items-center gap-2 mb-3">
            <Waves size={22} className="text-[#00D9FF]" />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">{hero.title}</h2>
          </div>
          <p className="text-sm text-white/55 leading-relaxed max-w-md mb-4">{hero.subtitle}</p>
          <span className="inline-flex self-start text-[10px] px-2.5 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/25 uppercase tracking-widest mb-5">
            {hero.badge}
          </span>

          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setClip('genie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider border transition-all ${
                clip === 'genie'
                  ? 'bg-[#00D9FF]/15 border-[#00D9FF]/40 text-[#00D9FF]'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <Sparkles size={12} /> Build with Genie
            </button>
            <button
              type="button"
              onClick={() => setClip('tributaries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider border transition-all ${
                clip === 'tributaries'
                  ? 'bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <Play size={12} /> Apply to charts
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-xl bg-black/40 border border-white/5 p-3"
                style={{ borderColor: `${p.accent}22` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: p.accent }}>
                  {p.title}
                </p>
                <p className="text-[10px] text-white/45 leading-snug">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[220px] lg:min-h-[320px] bg-black/60">
          <video
            key={src}
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            autoPlay
            muted
            loop
            playsInline
            poster=""
            aria-label={clip === 'genie' ? 'River Genie workstation animation' : 'River splits to chart tributaries'}
          >
            <source src={src} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">
              {clip === 'genie' ? 'River Genie · Pine co-pilot' : 'One script · every chart'}
            </span>
            <span className="text-[9px] text-white/30">v{RIVER_PAGE_CONTENT.version}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
