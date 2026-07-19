import React from 'react';
import {
  BarChart3,
  Shield,
  GraduationCap,
  Book,
  MessageSquare,
  ArrowRight,
  Wallet,
  LineChart,
  PiggyBank,
  Calculator,
  Newspaper,
  FlaskConical,
  Award,
  ExternalLink,
} from 'lucide-react';
import {
  APPEALING_CERTIFICATES,
  AWESOME_CERTIFICATES_REPO,
} from '../content/appealingCertificates';

interface DiscoveryFeedProps {
  onTabChange: (tabId: string) => void;
  profile: {
    id: string;
    name: string;
    avatar?: string;
    avatarUrl?: string;
    text?: string;
    border?: string;
    bg?: string;
  };
  showHomepageContacts?: boolean;
  onSelectContact?: (contact: any) => void;
  showTerminalMatrixNoise?: boolean;
}

function openCptBuddy() {
  window.dispatchEvent(new CustomEvent('open-cpt-buddy'));
}

/** Shared Home bento chrome — same lava gradient border as Y.W.C. panels */
const bentoClass =
  'ywc-lava-panel rounded-[20px] backdrop-blur-xl relative overflow-hidden transition-all';

export default function DiscoveryFeed({ onTabChange, profile }: DiscoveryFeedProps) {
  return (
    <div className="w-full text-white font-sans min-h-[90vh] relative" id="super_comb_homepage_root">
      <div className="max-w-[1100px] mx-auto space-y-5">

        {/* Hero */}
        <div className={`${bentoClass} p-7`}>
          <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-bl from-[#FF0080]/45 via-[#FF4500]/30 to-transparent blur-2xl" aria-hidden="true" />
          <div className="relative z-10">
            <div className="inline-block bg-[#4D00FF]/15 text-[#B9A6FF] text-[11px] font-bold px-3 py-1.5 rounded-full mb-3.5">
              Welcome back
            </div>
            <div className="text-[26px] font-extrabold text-white mb-2">{profile?.name || 'Trader'}</div>
            <div className="text-[13px] text-[#AAA] max-w-[420px]">
              Your markets, your methodology, your pace.
            </div>
          </div>
        </div>

        {/* Charts wide card */}
        <button
          type="button"
          onClick={() => onTabChange('StrictlyCharts')}
          className={`${bentoClass} w-full p-5 flex items-center justify-between cursor-pointer text-left hover:brightness-110`}
        >
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-3.5">
              <BarChart3 size={20} className="text-[#00E5FF]" aria-hidden="true" />
            </div>
            <div className="text-[17px] font-bold text-white mb-1">Interactive charts</div>
            <div className="text-xs text-[#AAA]">Live BTC, AAPL, and forex, ready to go.</div>
          </div>
          <ArrowRight size={18} className="text-[#00E5FF] shrink-0 relative z-10" aria-hidden="true" />
        </button>

        {/* Bento grid: Board, encyclopedias, Education, Literacy OS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => onTabChange('MeetTheBoard')}
            className={`${bentoClass} p-5 text-left cursor-pointer hover:brightness-110`}
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-3.5">
                <Shield size={20} className="text-[#FFD700]" aria-hidden="true" />
              </div>
              <div className="text-sm font-bold text-white">Board</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('Encyclopedia')}
            className={`${bentoClass} p-5 text-left cursor-pointer hover:brightness-110`}
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-3.5">
                <GraduationCap size={20} className="text-[#00E5FF]" aria-hidden="true" />
              </div>
              <div className="text-sm font-bold text-white leading-tight">Encyclopedia of finance</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('EncyclopediaOfIndicators')}
            className={`${bentoClass} p-5 text-left cursor-pointer hover:brightness-110`}
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-3.5">
                <BarChart3 size={20} className="text-[#00E5FF]" aria-hidden="true" />
              </div>
              <div className="text-sm font-bold text-white leading-tight">Encyclopedia of indicators</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('ClearPathEducation')}
            className={`${bentoClass} p-5 text-left cursor-pointer hover:brightness-110`}
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#B026FF]/10 flex items-center justify-center mb-3.5">
                <Book size={20} className="text-[#B026FF]" aria-hidden="true" />
              </div>
              <div className="text-sm font-bold text-white">ClearPath education</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('LiteracyOS')}
            className={`${bentoClass} p-5 text-left cursor-pointer hover:brightness-110 col-span-2 md:col-span-1`}
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-3.5">
                <Book size={20} className="text-[#FFD700]" aria-hidden="true" />
              </div>
              <div className="text-sm font-bold text-white leading-tight">Literacy OS</div>
            </div>
          </button>
        </div>

        {/* C.P.T. buddy tile */}
        <button
          type="button"
          onClick={openCptBuddy}
          className={`${bentoClass} w-full p-5 flex items-center gap-3.5 cursor-pointer text-left hover:brightness-110`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF1493]/10 flex items-center justify-center shrink-0 relative z-10">
            <MessageSquare size={20} className="text-[#FF1493]" aria-hidden="true" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-bold text-white">Ask C.P.T., your personal trading buddy</div>
            <div className="text-[11px] text-white/50 mt-0.5">Site help · neuro charts · The River · trading</div>
          </div>
        </button>

        {/* Appealing Additions — educational sandboxes (not financial advice) */}
        <section aria-labelledby="appealing-additions-title" className="pt-2 space-y-4">
          <div className={`${bentoClass} p-5 md:p-6`}>
            <div className="relative z-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00E5FF] font-black mb-2">
                Coming into the desk
              </p>
              <h2
                id="appealing-additions-title"
                className="ywc-section-title text-xl md:text-2xl font-black uppercase tracking-tight"
              >
                Appealing Additions
              </h2>
              <p className="mt-2 text-[12px] text-zinc-300 max-w-2xl leading-relaxed">
                Literacy tools and personal sandboxes — calculators, journals, and explainers you run with your own numbers.
                Educational only. Not financial advice.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Budget sandbox',
                blurb: 'Envelope-style categories using numbers you enter — pure math, your rules.',
                icon: Wallet,
                color: '#00E5FF',
                tab: 'LiteracyOS' as const,
              },
              {
                title: 'Cash-flow journal',
                blurb: 'Log income and spending you already know. Visualize patterns, no tips.',
                icon: LineChart,
                color: '#FF7B00',
                tab: 'LiteracyOS' as const,
              },
              {
                title: 'Net-worth notebook',
                blurb: 'Private assets / liabilities ledger you maintain. Track, don’t get told what to buy.',
                icon: PiggyBank,
                color: '#FFD700',
                tab: 'LiteracyOS' as const,
              },
              {
                title: 'Scenario lab',
                blurb: 'What-if sliders for compound growth and inflation — illustrative models only.',
                icon: Calculator,
                color: '#B026FF',
                tab: 'ClearPathEducation' as const,
              },
              {
                title: 'Learning feeds',
                blurb: 'Study RSS and explainers for literacy — information diet, not trade signals.',
                icon: Newspaper,
                color: '#FF1493',
                tab: 'Yours' as const,
              },
              {
                title: 'Concept flask',
                blurb: 'Short labs that unpack market vocabulary without recommending products.',
                icon: FlaskConical,
                color: '#00E5FF',
                tab: 'Encyclopedia' as const,
              },
              {
                title: 'Certificate desk',
                blurb: 'Free external courses with badges — finance literacy paths from the open Awesome Certificates list.',
                icon: Award,
                color: '#FFD700',
                href: '#certificate-desk',
              },
            ].map((item) => {
              const Icon = item.icon;
              const sharedClass = `${bentoClass} p-5 text-left cursor-pointer hover:brightness-110`;
              const body = (
                <div className="relative z-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5"
                    style={{ backgroundColor: `${item.color}1a` }}
                  >
                    <Icon size={20} style={{ color: item.color }} aria-hidden="true" />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{item.title}</div>
                  <div className="text-[11px] text-zinc-300 leading-relaxed">{item.blurb}</div>
                  <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Educational · not advice
                  </div>
                </div>
              );
              if ('href' in item && item.href) {
                return (
                  <a key={item.title} href={item.href} className={sharedClass}>
                    {body}
                  </a>
                );
              }
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onTabChange((item as { tab: string }).tab)}
                  className={sharedClass}
                >
                  {body}
                </button>
              );
            })}
          </div>

          {/* Certificate desk — curated from Awesome Certificates (external free courses) */}
          <div id="certificate-desk" className={`${bentoClass} p-5 md:p-6 scroll-mt-24`}>
            <div className="relative z-10 space-y-5">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FFD700] font-black mb-2 flex items-center gap-1.5">
                    <Award size={12} aria-hidden="true" /> Certificate desk
                  </p>
                  <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                    Free literacy certificates
                  </h3>
                  <p className="mt-2 text-[12px] text-zinc-300 max-w-2xl leading-relaxed">
                    External beginner courses with free badges or certificates of completion.
                    ClearPath does not issue these credentials and does not recommend products or trades —
                    this is a discovery shelf for self-paced learning only.
                  </p>
                </div>
                <a
                  href={AWESOME_CERTIFICATES_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 shrink-0 text-[10px] font-mono font-black uppercase tracking-widest text-[#00E5FF] hover:text-white border border-[#00E5FF]/35 hover:border-[#00E5FF] bg-[#00E5FF]/10 px-3 py-2 rounded-xl transition-colors"
                >
                  Full Awesome Certificates list
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
                {APPEALING_CERTIFICATES.map((cert) => (
                  <li key={`${cert.provider}-${cert.title}`}>
                    <a
                      href={cert.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full rounded-2xl border border-white/10 bg-black/40 hover:border-[#FFD700]/45 hover:bg-black/55 p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#FFD700]/90">
                            {cert.category}
                          </span>
                          <div className="text-sm font-bold text-white mt-1 leading-snug">{cert.title}</div>
                          <div className="text-[11px] text-zinc-400 mt-1">{cert.provider}</div>
                        </div>
                        <ExternalLink size={14} className="text-zinc-500 shrink-0 mt-1" aria-hidden="true" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                        <span className="px-2 py-0.5 rounded-full border border-white/10">{cert.level}</span>
                        <span className="px-2 py-0.5 rounded-full border border-white/10">{cert.hours}h</span>
                        <span className="px-2 py-0.5 rounded-full border border-white/10">
                          {cert.reward === 'badge' ? 'Digital badge' : 'Certificate'}
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>

              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                Catalog curated from{' '}
                <a
                  href={AWESOME_CERTIFICATES_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00E5FF] hover:underline"
                >
                  PanXProject/awesome-certificates
                </a>
                . Course availability and rewards are controlled by each issuer.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
