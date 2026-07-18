import React from 'react';
import {
  BarChart3,
  Shield,
  GraduationCap,
  Book,
  MessageSquare,
  ArrowRight,
  Sparkles,
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

const cardBase =
  'relative overflow-hidden rounded-[20px] bg-black/75 backdrop-blur-md transition-all duration-300 cursor-pointer text-left group';

export default function DiscoveryFeed({ onTabChange, profile }: DiscoveryFeedProps) {
  return (
    <div className="w-full text-white font-sans min-h-[90vh] relative" id="super_comb_homepage_root">
      {/* Atmosphere — same energy language as Y.W.C., calmer for Home */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[10%] w-[520px] h-[360px] rounded-full bg-[#00E5FF]/15 blur-[120px] animate-pulse" />
        <div className="absolute top-[35%] right-[-5%] w-[420px] h-[320px] rounded-full bg-[#FF1493]/12 blur-[110px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[380px] h-[260px] rounded-full bg-[#B026FF]/10 blur-[100px]" />
      </div>

      <div className="max-w-[1100px] mx-auto space-y-5 relative z-10">

        {/* Hero */}
        <div
          className={`${cardBase} border-2 border-[#00E5FF]/45 p-7 shadow-[0_0_28px_rgba(0,229,255,0.22),inset_0_0_40px_rgba(0,229,255,0.04)]`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-80" />
          <div className="inline-flex items-center gap-1.5 bg-[#00E5FF]/15 text-[#7DF9FF] text-[11px] font-bold px-3 py-1.5 rounded-full mb-3.5 border border-[#00E5FF]/35 shadow-[0_0_12px_rgba(0,229,255,0.35)]">
            <Sparkles size={12} className="text-[#00E5FF]" />
            Welcome back
          </div>
          <div className="text-[26px] font-extrabold text-white mb-2 drop-shadow-[0_0_18px_rgba(0,229,255,0.25)]">
            {profile?.name || 'Trader'}
          </div>
          <div className="text-[13px] text-[#C8D7E8] max-w-[420px]">
            Your markets, your methodology, your pace.
          </div>
        </div>

        {/* Charts wide card */}
        <button
          type="button"
          onClick={() => onTabChange('StrictlyCharts')}
          className={`${cardBase} w-full border-2 border-[#00E5FF]/50 p-5 flex items-center justify-between shadow-[0_0_24px_rgba(0,229,255,0.2)] hover:border-[#00E5FF] hover:shadow-[0_0_36px_rgba(0,229,255,0.4)] hover:-translate-y-0.5`}
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 flex items-center justify-center mb-3.5 shadow-[0_0_14px_rgba(0,229,255,0.35)]">
              <BarChart3 size={20} className="text-[#00E5FF]" />
            </div>
            <div className="text-[17px] font-bold text-white mb-1">Interactive charts</div>
            <div className="text-xs text-[#A8C0D8]">Live BTC, AAPL, and forex, ready to go.</div>
          </div>
          <ArrowRight size={18} className="text-[#00E5FF] shrink-0 drop-shadow-[0_0_8px_#00E5FF] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onTabChange('MeetTheBoard')}
            className={`${cardBase} border-2 border-[#FFD700]/45 p-5 shadow-[0_0_22px_rgba(255,215,0,0.18)] hover:border-[#FFD700] hover:shadow-[0_0_34px_rgba(255,215,0,0.4)] hover:-translate-y-0.5`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center mb-3.5 shadow-[0_0_14px_rgba(255,215,0,0.35)]">
              <Shield size={20} className="text-[#FFD700]" />
            </div>
            <div className="text-sm font-bold text-white">Board</div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('Encyclopedia')}
            className={`${cardBase} border-2 border-[#00E5FF]/45 p-5 shadow-[0_0_22px_rgba(0,229,255,0.18)] hover:border-[#00E5FF] hover:shadow-[0_0_34px_rgba(0,229,255,0.4)] hover:-translate-y-0.5`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 flex items-center justify-center mb-3.5 shadow-[0_0_14px_rgba(0,229,255,0.35)]">
              <GraduationCap size={20} className="text-[#00E5FF]" />
            </div>
            <div className="text-sm font-bold text-white leading-tight">Encyclopedia of finance</div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('EncyclopediaOfIndicators')}
            className={`${cardBase} border-2 border-[#39FF14]/40 p-5 shadow-[0_0_22px_rgba(57,255,20,0.16)] hover:border-[#39FF14] hover:shadow-[0_0_34px_rgba(57,255,20,0.35)] hover:-translate-y-0.5`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#39FF14]/12 border border-[#39FF14]/40 flex items-center justify-center mb-3.5 shadow-[0_0_14px_rgba(57,255,20,0.3)]">
              <BarChart3 size={20} className="text-[#39FF14]" />
            </div>
            <div className="text-sm font-bold text-white leading-tight">Encyclopedia of indicators</div>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('ClearPathEducation')}
            className={`${cardBase} border-2 border-[#B026FF]/50 p-5 shadow-[0_0_22px_rgba(176,38,255,0.2)] hover:border-[#B026FF] hover:shadow-[0_0_34px_rgba(176,38,255,0.4)] hover:-translate-y-0.5`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#B026FF]/15 border border-[#B026FF]/45 flex items-center justify-center mb-3.5 shadow-[0_0_14px_rgba(176,38,255,0.35)]">
              <Book size={20} className="text-[#B026FF]" />
            </div>
            <div className="text-sm font-bold text-white">ClearPath education</div>
          </button>
        </div>

        {/* C.P.T. buddy tile */}
        <button
          type="button"
          onClick={openCptBuddy}
          className={`${cardBase} w-full border-2 border-[#FF1493]/55 p-5 flex items-center gap-3.5 shadow-[0_0_26px_rgba(255,20,147,0.28)] hover:border-[#FF1493] hover:shadow-[0_0_40px_rgba(255,20,147,0.45)] hover:-translate-y-0.5`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF1493]/15 border border-[#FF1493]/45 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,20,147,0.4)]">
            <MessageSquare size={20} className="text-[#FF1493]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Ask C.P.T., your personal trading buddy</div>
            <div className="text-[11px] text-[#FFB6D9] mt-0.5">Site help · neuro charts · The River · trading</div>
          </div>
        </button>

      </div>
    </div>
  );
}
