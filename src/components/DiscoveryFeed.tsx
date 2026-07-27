import React from 'react';
import {
  BarChart3,
  Shield,
  GraduationCap,
  Book,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Waves,
  Globe2,
  Newspaper,
  Crown,
  Layers,
  Wallet,
  LineChart,
  PiggyBank,
  Calculator,
  FlaskConical,
  Award,
  ExternalLink,
  Server,
  Library,
} from 'lucide-react';
import {
  APPEALING_CERTIFICATES,
  AWESOME_CERTIFICATES_REPO,
} from '../content/appealingCertificates';
import {
  APPEALING_SELFHOSTED,
  AWESOME_SELFHOSTED_MONEY_SECTION,
  AWESOME_SELFHOSTED_REPO,
} from '../content/appealingSelfhosted';
import {
  APPEALING_ACADEMIC_RESEARCH,
  EBSCO_ACADEMIC_LIBRARIES,
  EBSCO_FREE_DATABASES,
} from '../content/appealingAcademicResearch';

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

type HomeCard = {
  id: string;
  title: string;
  blurb: string;
  tabId?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  glow: string;
  border: string;
  wide?: boolean;
};

const CARDS: HomeCard[] = [
  {
    id: 'charts',
    title: 'Charts',
    blurb:
      'Open the live chart workspace. Watch price action, switch neuro-adaptive chart profiles, and apply indicators without leaving ClearPath.',
    tabId: 'StrictlyCharts',
    icon: BarChart3,
    accent: '#00E5FF',
    glow: 'rgba(0,229,255,0.45)',
    border: 'border-[#00E5FF]',
    wide: true,
  },
  {
    id: 'river',
    title: 'INDACREATOR + River Genie',
    blurb:
      'Upload or paste Pine Script — or ask River Genie to draft it. Compile honestly, then apply your indicator on every chart.',
    tabId: 'TheRiver',
    icon: Waves,
    accent: '#00FFE1',
    glow: 'rgba(0,255,225,0.4)',
    border: 'border-[#00FFE1]',
  },
  {
    id: 'ywc',
    title: 'Y.W.C. — Your World Connected',
    blurb:
      'Community and world hub: news lanes, social channels, politics, and connected feeds in the lava-hot layout.',
    tabId: 'Yours',
    icon: Globe2,
    accent: '#FF4500',
    glow: 'rgba(255,69,0,0.45)',
    border: 'border-[#FF4500]',
  },
  {
    id: 'news',
    title: 'News',
    blurb:
      'Scan market and platform headlines in one feed so you can catch catalysts without hunting tabs.',
    tabId: 'News',
    icon: Newspaper,
    accent: '#FFD700',
    glow: 'rgba(255,215,0,0.35)',
    border: 'border-[#FFD700]',
  },
  {
    id: 'board',
    title: 'Board',
    blurb:
      'Meet the ClearPath board and leadership context before you dig into memberships or the terminal.',
    tabId: 'MeetTheBoard',
    icon: Shield,
    accent: '#FFD700',
    glow: 'rgba(255,215,0,0.4)',
    border: 'border-[#FFD700]',
  },
  {
    id: 'encyclopedia-finance',
    title: 'Encyclopedia of Finance',
    blurb:
      'Deep finance library — concepts, labs, and structured knowledge when you want the “why,” not just a chart.',
    tabId: 'Encyclopedia',
    icon: GraduationCap,
    accent: '#00E5FF',
    glow: 'rgba(0,229,255,0.4)',
    border: 'border-[#00E5FF]',
  },
  {
    id: 'encyclopedia-indicators',
    title: 'Encyclopedia of Indicators',
    blurb:
      'Browse technical and fundamental indicators with plain explanations, then add tools you want on charts.',
    tabId: 'EncyclopediaOfIndicators',
    icon: Layers,
    accent: '#39FF14',
    glow: 'rgba(57,255,20,0.4)',
    border: 'border-[#39FF14]',
  },
  {
    id: 'education',
    title: 'ClearPath Education',
    blurb:
      'Lesson schools, unit quizzes, and a paced path through ClearPath methodology — unlock as you pass.',
    tabId: 'ClearPathEducation',
    icon: Book,
    accent: '#BF00FF',
    glow: 'rgba(191,0,255,0.45)',
    border: 'border-[#BF00FF]',
  },
  {
    id: 'literacy',
    title: 'Literacy OS',
    blurb:
      'Personal literacy workspace — vault, study tools, and sandboxes for budgets and journals you run yourself.',
    tabId: 'LiteracyOS',
    icon: Book,
    accent: '#FFD700',
    glow: 'rgba(255,215,0,0.4)',
    border: 'border-[#FFD700]',
  },
  {
    id: 'memberships',
    title: 'Memberships',
    blurb:
      'Compare plans and access levels so you know what you get before you upgrade.',
    tabId: 'Membership',
    icon: Crown,
    accent: '#FF1493',
    glow: 'rgba(255,20,147,0.4)',
    border: 'border-[#FF1493]',
  },
  {
    id: 'cpt',
    title: 'C.P.T. Personal Buddy',
    blurb:
      'Ask how to navigate the site, what a neuro chart profile does, how INDACREATOR works, or get calm trading explanations.',
    onClick: openCptBuddy,
    icon: MessageSquare,
    accent: '#FF1493',
    glow: 'rgba(255,20,147,0.5)',
    border: 'border-[#FF1493]',
    wide: true,
  },
];

function HomeNavCard({
  card,
  onTabChange,
}: {
  card: HomeCard;
  onTabChange: (tabId: string) => void;
}) {
  const Icon = card.icon;
  const handleClick = () => {
    if (card.onClick) card.onClick();
    else if (card.tabId) onTabChange(card.tabId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        group relative overflow-hidden rounded-3xl text-left transition-all duration-300
        bg-gradient-to-br from-black/90 via-[#0a0612]/95 to-black/90
        border-2 ${card.border}
        hover:-translate-y-1 active:scale-[0.99]
        ${card.wide ? 'md:col-span-2' : ''}
      `}
      style={{
        boxShadow: `0 0 28px ${card.glow}, inset 0 0 48px ${card.glow.replace('0.', '0.0').replace('0.4', '0.06').replace('0.45', '0.07').replace('0.5', '0.08')}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 48px ${card.glow}, 0 0 80px ${card.glow}, inset 0 0 40px rgba(255,255,255,0.03)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 28px ${card.glow}, inset 0 0 48px rgba(255,255,255,0.02)`;
      }}
    >
      {/* Lava corner wash */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl opacity-70"
        style={{ background: `radial-gradient(circle, ${card.accent}66, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full blur-3xl opacity-50"
        style={{ background: `radial-gradient(circle, ${card.accent}44, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }}
      />

      <div className="relative z-10 p-5 md:p-6 flex flex-col h-full min-h-[168px]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center border"
            style={{
              background: `${card.accent}22`,
              borderColor: `${card.accent}88`,
              boxShadow: `0 0 18px ${card.glow}`,
              color: card.accent,
            }}
          >
            <Icon size={22} />
          </div>
          <ArrowRight
            size={18}
            className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 mt-1"
            style={{ color: card.accent }}
          />
        </div>
        <h3 className="text-[15px] md:text-base font-black text-white tracking-wide mb-2 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
          {card.title}
        </h3>
        <p className="text-[12px] md:text-[13px] leading-relaxed text-[#D4E0F0]/90 flex-1">
          {card.blurb}
        </p>
        <span
          className="mt-4 inline-flex text-[10px] font-mono font-bold uppercase tracking-[0.18em]"
          style={{ color: card.accent }}
        >
          Tap to open →
        </span>
      </div>
    </button>
  );
}

export default function DiscoveryFeed({ onTabChange, profile }: DiscoveryFeedProps) {
  return (
    <div className="w-full text-white font-sans min-h-[90vh] relative overflow-hidden" id="super_comb_homepage_root">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-[5%] w-[640px] h-[420px] rounded-full bg-[#FF0080]/20 blur-[130px] animate-pulse" />
        <div className="absolute top-[20%] right-[-8%] w-[520px] h-[400px] rounded-full bg-[#FF4500]/18 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[25%] w-[480px] h-[320px] rounded-full bg-[#00E5FF]/14 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="max-w-[1100px] mx-auto space-y-6 relative z-10 pb-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border-2 border-[#FF1493]/60 bg-gradient-to-br from-black via-[#12061a] to-black p-6 md:p-8 shadow-[0_0_40px_rgba(255,20,147,0.35),0_0_80px_rgba(255,69,0,0.15)]">
          <div className="pointer-events-none absolute top-0 right-0 h-44 w-44 rounded-full bg-gradient-to-bl from-[#FF0080]/50 via-[#FF4500]/30 to-transparent blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-gradient-to-tr from-[#00E5FF]/35 to-transparent blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-[#FF4500]/50 bg-[#FF4500]/15 text-[#FFB48A] text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_16px_rgba(255,69,0,0.4)]">
              <Sparkles size={12} className="text-[#FF4500]" />
              ClearPath Home
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                {profile?.name || 'Trader'}
              </span>
              <span className="block md:inline md:ml-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] via-[#FF4500] to-[#00E5FF]">
                — pick your next move
              </span>
            </h1>
            <p className="text-sm md:text-[15px] text-[#FFD4E8] max-w-2xl leading-relaxed">
              Every card below is a door into a ClearPath tab. Read the line under the title so you know exactly where you’re going before you tap.
            </p>
          </div>
        </section>

        {/* Explained nav grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <HomeNavCard key={card.id} card={card} onTabChange={onTabChange} />
          ))}
        </div>

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
              {
                title: 'Self-hosted toolkit',
                blurb: 'Privacy-first tools from Awesome Selfhosted — budgets, feeds, and read-later you run yourself.',
                icon: Server,
                color: '#00E5FF',
                href: '#selfhosted-toolkit',
              },
              {
                title: 'Academic research desk',
                blurb: 'Free EBSCO scholarly databases & open-access entry points — peer-reviewed literacy, not paywalled advice.',
                icon: Library,
                color: '#B9A6FF',
                href: '#academic-research-desk',
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

          {/* Self-hosted toolkit — curated from Awesome Selfhosted */}
          <div id="selfhosted-toolkit" className={`${bentoClass} p-5 md:p-6 scroll-mt-24`}>
            <div className="relative z-10 space-y-5">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#00E5FF] font-black mb-2 flex items-center gap-1.5">
                    <Server size={12} aria-hidden="true" /> Self-hosted toolkit
                  </p>
                  <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                    Run-your-own literacy stack
                  </h3>
                  <p className="mt-2 text-[12px] text-zinc-300 max-w-2xl leading-relaxed">
                    Open-source apps you can host yourself for budgeting journals, RSS study feeds, and research archives.
                    ClearPath does not operate these services. Tracking tools are not investment advice.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <a
                    href={AWESOME_SELFHOSTED_MONEY_SECTION}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#FF7B00] hover:text-white border border-[#FF7B00]/35 hover:border-[#FF7B00] bg-[#FF7B00]/10 px-3 py-2 rounded-xl transition-colors"
                  >
                    Money section
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                  <a
                    href={AWESOME_SELFHOSTED_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#00E5FF] hover:text-white border border-[#00E5FF]/35 hover:border-[#00E5FF] bg-[#00E5FF]/10 px-3 py-2 rounded-xl transition-colors"
                  >
                    Full Awesome Selfhosted
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
                {APPEALING_SELFHOSTED.map((tool) => (
                  <li
                    key={tool.title}
                    className="h-full rounded-2xl border border-white/10 bg-black/40 hover:border-[#00E5FF]/45 p-4 flex flex-col"
                  >
                    <a
                      href={tool.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 group"
                    >
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#00E5FF]/90">
                        {tool.category}
                      </span>
                      <div className="text-sm font-bold text-white mt-1 leading-snug group-hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
                        {tool.title}
                        <ExternalLink size={12} className="text-zinc-500 shrink-0" aria-hidden="true" />
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed">{tool.blurb}</div>
                    </a>
                    <a
                      href={tool.sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-[9px] font-mono uppercase tracking-wider text-zinc-500 hover:text-[#00E5FF] w-fit"
                    >
                      Source repo →
                    </a>
                  </li>
                ))}
              </ul>

              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                Catalog curated from{' '}
                <a
                  href={AWESOME_SELFHOSTED_REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00E5FF] hover:underline"
                >
                  awesome-selfhosted/awesome-selfhosted
                </a>
                . Skipped trading bots and payment processors — literacy &amp; personal tracking only.
              </p>
            </div>
          </div>

          {/* Academic research desk — free EBSCO / open-access discovery */}
          <div id="academic-research-desk" className={`${bentoClass} p-5 md:p-6 scroll-mt-24`}>
            <div className="relative z-10 space-y-5">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#B9A6FF] font-black mb-2 flex items-center gap-1.5">
                    <Library size={12} aria-hidden="true" /> Academic research desk
                  </p>
                  <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                    Free scholarly &amp; open access
                  </h3>
                  <p className="mt-2 text-[12px] text-zinc-300 max-w-2xl leading-relaxed">
                    From EBSCO’s academic library world: complimentary research databases and open-access paths.
                    ClearPath does not provide paid EBSCOhost subscriptions (e.g. Business Source). Educational research only — not financial advice.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <a
                    href={EBSCO_FREE_DATABASES}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#B9A6FF] hover:text-white border border-[#B9A6FF]/40 hover:border-[#B9A6FF] bg-[#B9A6FF]/10 px-3 py-2 rounded-xl transition-colors"
                  >
                    Free databases
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                  <a
                    href={EBSCO_ACADEMIC_LIBRARIES}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-[#00E5FF] hover:text-white border border-[#00E5FF]/35 hover:border-[#00E5FF] bg-[#00E5FF]/10 px-3 py-2 rounded-xl transition-colors"
                  >
                    Academic libraries
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
                {APPEALING_ACADEMIC_RESEARCH.map((item) => (
                  <li key={item.title}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full rounded-2xl border border-white/10 bg-black/40 hover:border-[#B9A6FF]/50 hover:bg-black/55 p-4 transition-colors"
                    >
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#B9A6FF]">
                        {item.category}
                      </span>
                      <div className="text-sm font-bold text-white mt-1 leading-snug flex items-center gap-1.5">
                        {item.title}
                        <ExternalLink size={12} className="text-zinc-500 shrink-0" aria-hidden="true" />
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed">{item.blurb}</div>
                    </a>
                  </li>
                ))}
              </ul>

              <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                Inspired by{' '}
                <a
                  href={EBSCO_ACADEMIC_LIBRARIES}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B9A6FF] hover:underline"
                >
                  about.ebsco.com/academic-libraries
                </a>
                . Paid discovery / journal packages require a library or campus login — we only list free entry points.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
