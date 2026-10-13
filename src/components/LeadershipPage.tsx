import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import PublicSiteLinks from './PublicSiteLinks';
import { PUBLIC_LEADERS } from '../content/leadershipPublic';

export default function LeadershipPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-x-hidden relative">
      <SEO
        title="Leadership — ClearPath Trader"
        description="Leadership team for Clear Path Markets Science Corp. and ClearPath Trader: Richard Anthony Floyd, Brent (CCO), and Brian Weber (CFO Advisor)."
        canonical="https://clearpathtrader.com/leadership"
      />
      <SurfBackground />

      <nav className="relative z-10 w-full px-4 py-5 md:px-10 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <a
          href="/"
          className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-[#00E5FF] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          ClearPath Home
        </a>
        <span className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-black uppercase tracking-widest text-zinc-400">
          <Users size={13} className="text-[#FF1493]" />
          Leadership
        </span>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-16 space-y-12">
        <header className="space-y-4 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
            Leadership
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Clear Path Markets Science Corp. — the team behind ClearPath Trader. Personal social profiles are not listed here;
            follow the company on{' '}
            <a href="https://www.instagram.com/clearpathtrader" className="text-[#00E5FF] hover:underline" rel="noopener noreferrer" target="_blank">
              Instagram
            </a>
            .
          </p>
        </header>

        <div className="grid gap-10">
          {PUBLIC_LEADERS.map((leader) => (
            <article
              key={leader.id}
              id={leader.id}
              className="flex flex-col md:flex-row gap-6 md:gap-10 rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8"
            >
              <div className="shrink-0 mx-auto md:mx-0">
                <img
                  src={leader.imageUrl}
                  alt={`${leader.displayName}, ${leader.jobTitle}`}
                  width={240}
                  height={300}
                  className="w-48 md:w-56 rounded-2xl object-cover border-2 border-white/15 shadow-lg"
                />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                  {leader.displayName}
                </h2>
                <p className="text-[#00E5FF] font-mono text-xs uppercase tracking-[0.25em]">{leader.jobTitle}</p>
                {leader.roleLine ? (
                  <p className="text-[#FFD700] text-xs font-mono uppercase tracking-widest">{leader.roleLine}</p>
                ) : null}
                <p className="text-zinc-300 leading-relaxed pt-2">{leader.bio}</p>
                {leader.id === 'richard-floyd' ? (
                  <p className="pt-2">
                    <a href="/press" className="text-sm text-[#FF1493] hover:underline font-semibold uppercase tracking-wider">
                      Full press kit & founder story →
                    </a>
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <PublicSiteLinks />
      </main>
    </div>
  );
}
