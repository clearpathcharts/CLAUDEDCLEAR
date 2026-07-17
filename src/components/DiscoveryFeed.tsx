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

export default function DiscoveryFeed({ onTabChange, profile }: DiscoveryFeedProps) {
  return (
    <div className="w-full text-white font-sans min-h-[90vh] relative" id="super_comb_homepage_root">
      <div className="max-w-[1100px] mx-auto space-y-5">

        {/* Hero */}
        <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-[20px] p-7 backdrop-blur-md">
          <div className="inline-block bg-[#4D00FF]/15 text-[#B9A6FF] text-[11px] font-bold px-3 py-1.5 rounded-full mb-3.5">
            Welcome back
          </div>
          <div className="text-[26px] font-extrabold text-white mb-2">{profile?.name || 'Trader'}</div>
          <div className="text-[13px] text-[#AAA] max-w-[420px]">
            Your markets, your methodology, your pace.
          </div>
        </div>

        {/* Charts wide card */}
        <button
          onClick={() => onTabChange('StrictlyCharts')}
          className="w-full bg-black/70 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-[20px] p-5 flex items-center justify-between transition-all cursor-pointer text-left"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-3.5">
              <BarChart3 size={20} className="text-[#00E5FF]" />
            </div>
            <div className="text-[17px] font-bold text-white mb-1">Interactive charts</div>
            <div className="text-xs text-[#AAA]">Live BTC, AAPL, and forex, ready to go.</div>
          </div>
          <ArrowRight size={18} className="text-[#00E5FF] shrink-0" />
        </button>

        {/* Bento grid: Board, Encyclopedia of Finance, Encyclopedia of Indicators, ClearPath Education */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onTabChange('MeetTheBoard')}
            className="bg-black/70 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-[20px] p-5 text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-3.5">
              <Shield size={20} className="text-[#FFD700]" />
            </div>
            <div className="text-sm font-bold text-white">Board</div>
          </button>

          <button
            onClick={() => onTabChange('Encyclopedia')}
            className="bg-black/70 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-[20px] p-5 text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-3.5">
              <GraduationCap size={20} className="text-[#00E5FF]" />
            </div>
            <div className="text-sm font-bold text-white leading-tight">Encyclopedia of finance</div>
          </button>

          <button
            onClick={() => onTabChange('EncyclopediaOfIndicators')}
            className="bg-black/70 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-[20px] p-5 text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-3.5">
              <BarChart3 size={20} className="text-[#00E5FF]" />
            </div>
            <div className="text-sm font-bold text-white leading-tight">Encyclopedia of indicators</div>
          </button>

          <button
            onClick={() => onTabChange('ClearPathEducation')}
            className="bg-black/70 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-[20px] p-5 text-left transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#B026FF]/10 flex items-center justify-center mb-3.5">
              <Book size={20} className="text-[#B026FF]" />
            </div>
            <div className="text-sm font-bold text-white">ClearPath education</div>
          </button>
        </div>

        {/* C.P.T. buddy tile */}
        <button
          onClick={openCptBuddy}
          className="w-full bg-black/70 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-[20px] p-5 flex items-center gap-3.5 transition-all cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF1493]/10 flex items-center justify-center shrink-0">
            <MessageSquare size={20} className="text-[#FF1493]" />
          </div>
          <div className="text-sm font-bold text-white">Ask C.P.T., your personal trading buddy</div>
        </button>

      </div>
    </div>
  );
}
