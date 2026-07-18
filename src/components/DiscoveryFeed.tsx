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
} from 'lucide-react';

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
    title: 'The River',
    blurb:
      'Upload or paste Pine Script, compile it here, then apply your indicator so it can show on charts.',
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
      'Ask how to navigate the site, what a neuro chart profile does, how The River works, or get calm trading explanations.',
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
      </div>
    </div>
  );
}
