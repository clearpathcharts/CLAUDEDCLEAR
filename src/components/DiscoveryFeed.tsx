import React from 'react';
import ClearPathLiveTicker from './ClearPathLiveTicker';
import {
  BarChart3,
  Shield,
  BookOpen,
  MessageSquare,
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

export default function DiscoveryFeed({
  onTabChange,
  profile,
  showHomepageContacts = false,
  onSelectContact,
}: DiscoveryFeedProps) {
  const contacts = [
    { id: 1, name: 'Andrei Mashrin', status: 'online' },
    { id: 2, name: 'Aryn Jacobssen', status: 'offline' },
    { id: 3, name: 'Carole Landu', status: 'offline' },
    { id: 4, name: 'Chineze Afa', status: 'online' },
    { id: 5, name: 'Mok Kwang', status: 'online' },
    { id: 6, name: 'Naomi Yepes', status: 'online' },
  ];

  const initials = (name: string) => name.split(' ').map(p => p[0]).join('');

  const quickTiles = [
    { id: 'StrictlyCharts', label: 'Charts', icon: BarChart3, color: '#00E5FF' },
    { id: 'MeetTheBoard', label: 'Board', icon: Shield, color: '#FFD700' },
    { id: 'TrainingBoard', label: 'Training', icon: BookOpen, color: '#B026FF' },
  ];

  const tickers = ['AAPL', 'BTCUSD', 'MSFT'];

  return (
    <div className="w-full text-white font-sans min-h-[90vh]" id="super_comb_homepage_root">
      <div className="max-w-[600px] mx-auto py-8 px-4 space-y-10">

        {/* Profile header, like a social profile top */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            className="w-20 h-20 rounded-full object-cover border-2 border-[#4D00FF]"
            src={profile?.avatarUrl || profile?.avatar || 'https://i.postimg.cc/Vshdgqvt/83dd53f6-dc2e-475f-854a-b1cfe4b7e8d7.png'}
            alt=""
          />
          <div>
            <p className="text-[#888] text-xs tracking-[0.2em] font-mono">WELCOME BACK</p>
            <h1 className="text-white text-2xl font-black uppercase tracking-wide mt-1">
              {profile?.name || 'Trader'}
            </h1>
          </div>
        </div>

        {/* Contacts as a "stories" row, if enabled */}
        {showHomepageContacts && (
          <div className="flex gap-5 overflow-x-auto pb-2">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact && onSelectContact(contact)}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              >
                <div className="relative w-14 h-14 rounded-full bg-[#4D00FF]/10 border-2 border-[#4D00FF]/50 flex items-center justify-center text-[#B9A6FF] text-sm font-black font-mono">
                  {initials(contact.name)}
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${
                      contact.status === 'online' ? 'bg-[#00E5FF]' : 'bg-[#555]'
                    }`}
                  />
                </div>
                <span className="text-[#AAA] text-[11px] font-medium">
                  {contact.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Quick navigation, spaced as its own card */}
        <div className="bg-black/30 border border-white/10 rounded-3xl p-6">
          <p className="text-[#888] text-xs tracking-[0.2em] font-mono mb-4">QUICK ACCESS</p>
          <div className="grid grid-cols-4 gap-3">
            {quickTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.id}
                  onClick={() => onTabChange(tile.id)}
                  className="flex flex-col items-center gap-2 py-2 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Icon size={20} style={{ color: tile.color }} />
                  </div>
                  <span className="text-white text-[10px] font-bold uppercase tracking-wide">{tile.label}</span>
                </button>
              );
            })}
            <button
              onClick={openCptBuddy}
              className="flex flex-col items-center gap-2 py-2 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <MessageSquare size={20} style={{ color: '#FF1493' }} />
              </div>
              <span className="text-white text-[10px] font-bold uppercase tracking-wide">C.P.T.</span>
            </button>
          </div>
        </div>

        {/* Each market as its own feed-style card, stacked with real spacing */}
        <div className="space-y-6">
          <p className="text-[#888] text-xs tracking-[0.2em] font-mono px-1">LIVE MARKETS</p>
          {tickers.map((symbol) => (
            <div key={symbol} className="bg-black/30 border border-white/10 rounded-3xl p-6">
              <ClearPathLiveTicker symbol={symbol} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
