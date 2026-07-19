import React from 'react';
import {
  BarChart3,
  Shield,
  GraduationCap,
  Book,
  MessageSquare,
  ArrowRight,
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

      </div>
    </div>
  );
}
