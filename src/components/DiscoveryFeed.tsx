import React, { useState } from 'react';
import KillZones from './KillZones';
import ClearPathLiveTicker from './ClearPathLiveTicker';
import {
  BarChart3,
  Shield,
  BookOpen,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
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

// Opens the floating C.P.T. buddy widget (see CptBuddyWidget.tsx) without needing
// to lift its open/close state up into App.tsx.
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

  return (
    <div
      className="w-full text-white font-sans min-h-[90vh] flex justify-center relative p-3 md:p-6"
      id="super_comb_homepage_root"
    >
      <div
        className="w-full max-w-[720px] bg-[#050505] border border-white/10 rounded-[24px] p-6 md:p-8 relative overflow-hidden"
        id="glassmorphic_big_sur_inner_shell"
      >
        {/* Ambient glow accents, purely decorative */}
        <div className="absolute -top-20 -left-16 w-64 h-64 rounded-full bg-[#b026ff]/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-16 w-64 h-64 rounded-full bg-[#00f3ff]/8 blur-[90px] pointer-events-none" />

        {/* Greeting */}
        <div className="relative flex items-center justify-between mb-6">
          <div>
            <p className="text-[#555] text-[11px] tracking-widest font-mono mb-1">WELCOME BACK</p>
            <p className="text-white text-xl font-bold">{profile?.name || 'Trader'}</p>
          </div>
          <img
            className="w-9 h-9 rounded-lg object-cover border border-[#b026ff]/40"
            src={profile?.avatarUrl || profile?.avatar || 'https://i.postimg.cc/Vshdgqvt/83dd53f6-dc2e-475f-854a-b1cfe4b7e8d7.png'}
            alt=""
          />
        </div>

        {/* Quick navigation - 4 tiles */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          <button
            onClick={() => onTabChange('StrictlyCharts')}
            className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl p-4 text-center transition-all cursor-pointer"
          >
            <BarChart3 size={20} className="text-[#00f3ff] mx-auto mb-2" />
            <p className="text-white text-xs font-medium">Charts</p>
          </button>
          <button
            onClick={() => onTabChange('MeetTheBoard')}
            className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl p-4 text-center transition-all cursor-pointer"
          >
            <Shield size={20} className="text-[#ff8800] mx-auto mb-2" />
            <p className="text-white text-xs font-medium">Board</p>
          </button>
          <button
            onClick={() => onTabChange('TrainingBoard')}
            className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl p-4 text-center transition-all cursor-pointer"
          >
            <BookOpen size={20} className="text-[#b026ff] mx-auto mb-2" />
            <p className="text-white text-xs font-medium">Training</p>
          </button>
          <button
            onClick={openCptBuddy}
            className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl p-4 text-center transition-all cursor-pointer"
          >
            <MessageSquare size={20} className="text-[#FF1493] mx-auto mb-2" />
            <p className="text-white text-xs font-medium">C.P.T. buddy</p>
          </button>
        </div>

        {/* Live markets */}
        <div className="relative mb-6">
          <p className="text-[#555] text-[11px] tracking-widest font-mono mb-2">LIVE MARKETS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ClearPathLiveTicker symbol="AAPL" />
            <ClearPathLiveTicker symbol="BTCUSD" />
            <ClearPathLiveTicker symbol="MSFT" />
          </div>
        </div>

        {/* Kill Zones - real trading session widget */}
        <div className="relative mb-6">
          <KillZones />
        </div>

        {/* Contacts */}
        {showHomepageContacts && (
          <div className="relative">
            <p className="text-[#555] text-[11px] tracking-widest font-mono mb-2">CONTACTS</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelectContact && onSelectContact(contact)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div className="relative w-10 h-10 rounded-lg bg-[#b026ff]/10 border border-[#b026ff]/30 flex items-center justify-center text-[#b026ff] text-xs font-bold font-mono">
                    {initials(contact.name)}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#050505] ${
                        contact.status === 'online' ? 'bg-[#00ff88]' : 'bg-[#555]'
                      }`}
                    />
                  </div>
                  <span className="text-[#888] text-[10px] truncate max-w-[60px]">
                    {contact.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
