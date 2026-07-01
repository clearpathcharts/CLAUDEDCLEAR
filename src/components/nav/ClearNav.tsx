import React from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Cpu,
  Crown,
  GraduationCap,
  Home,
  LogOut,
  Newspaper,
  Terminal,
  Users,
} from 'lucide-react';

interface ClearNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isAdmin: boolean;
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

export const ClearNav: React.FC<ClearNavProps> = ({
  activeTab,
  onNavigate,
  isAdmin,
  onLogout,
}) => {
  const primaryNavItems: NavItem[] = [
    {
      id: 'Discovery',
      icon: Home,
      label: 'HOME',
    },
    {
      id: 'Yours',
      icon: Users,
      label: 'Y.W.C.',
    },
    {
      id: 'TheRiver',
      icon: Cpu,
      label: 'THE RIVER',
    },
    {
      id: 'ThemeTerminal',
      icon: BarChart3,
      label: 'CHARTS',
    },
    {
      id: 'Journal',
      icon: BookOpen,
      label: 'JOURNAL',
    },
    {
      id: 'News',
      icon: Newspaper,
      label: 'NEWS',
    },
    {
      id: 'Membership',
      icon: Crown,
      label: 'MEMBERSHIPS',
    },
    {
      id: 'Founders',
      icon: Crown,
      label: 'FOUNDERS',
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      id: 'Biography',
      icon: Terminal,
      label: 'PROFILE',
    },

    ...(isAdmin
      ? [
          {
            id: 'Diagnostics',
            icon: Activity,
            label: 'DIAGNOSTICS',
          },
        ]
      : []),

    {
      id: 'Encyclopedia',
      icon: GraduationCap,
      label: 'ENCYCLOPEDIA OF FINANCE',
    },

    {
      id: 'EncyclopediaOfIndicators',
      icon: BarChart3,
      label: 'ENCYCLOPEDIA OF INDICATORS',
    },
  ];

  const renderNavButton = (item: { id: string, icon: any, label: string }, index: number, isSecondaryGroup: boolean) => {
    const isActive = activeTab === item.id;
    const isGoldGlow = item.id === 'Founders' || item.id === 'Membership';
    const isCyanGlow = item.id === 'CpmsApk' || item.id === 'Sentinel' || item.id === 'Encyclopedia' || item.id === 'EncyclopediaOfIndicators';
    const isHotPink = item.id === 'Biography' || item.id === 'Diagnostics';
    // We alternate colors or apply molten lava theme to secondary items and alternating primary items
    const isLava = isSecondaryGroup || index % 2 === 1;

    const buttonStyle = isGoldGlow
      ? isActive
        ? 'bg-[#FFD700]/30 text-[#FFD700] border border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.8)] font-black'
        : 'text-[#FFD700] hover:text-[#FFE4B5] hover:bg-[#FFD700]/10 border border-[#FFD700]/35 shadow-[0_0_10px_rgba(255,215,0,0.35)] font-black'
      : isHotPink
        ? isActive
          ? 'bg-[#FF007F]/25 text-[#FF007F] border border-[#FF007F] shadow-[0_0_20px_rgba(255,0,127,0.8)]'
          : 'text-[#FF007F] hover:text-[#FF66B2] hover:bg-[#FF007F]/10 drop-shadow-[0_0_8px_rgba(255,0,127,0.8)] border border-[#FF007F]/35 shadow-[0_0_10px_rgba(255,0,127,0.35)] font-bold'
        : isCyanGlow
          ? isActive
            ? 'bg-[#00FFFF]/25 text-[#00FFFF] border border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.8)]'
            : 'text-[#00FFFF] hover:text-[#80FFFF] hover:bg-[#00FFFF]/10 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] border border-[#00FFFF]/20'
          : isLava
            ? isActive 
              ? 'bg-[#FF4500]/25 text-[#FF4500] border border-[#FF4500] shadow-[0_0_20px_rgba(255,69,0,0.8)]' 
              : 'text-[#FF4500] hover:text-[#FFA500] hover:bg-[#FF4500]/10 drop-shadow-[0_0_8px_rgba(255,69,0,0.6)] border border-[#FF4500]/20'
            : isActive 
              ? 'bg-[#4D00FF]/25 text-[#4D00FF] border border-[#4D00FF] shadow-[0_0_20px_rgba(77,0,255,0.8)]' 
              : 'text-[#4D00FF] hover:text-[#8b5cf6] hover:bg-[#4D00FF]/10 drop-shadow-[0_0_8px_rgba(77,0,255,0.6)] border border-[#4D00FF]/20';

    const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      onNavigate(item.id);
    };

    return (
      <button
        key={item.id}
        onClick={handlePress}
        onTouchEnd={handlePress}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap font-cinzel cursor-pointer active:scale-95 ${buttonStyle}`}
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <item.icon className="w-3.5 h-3.5 shrink-0" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div id="nav-bar" className="flex flex-col gap-3.5 px-4 py-3 border-b border-white/5 bg-black/94 backdrop-blur-3xl sticky top-0 z-[100] w-full">
      {/* Row 1: Primary Navigation */}
      <div className="flex items-center gap-3.5 md:gap-6 overflow-x-auto no-scrollbar w-full">
        <div className="flex items-center gap-3 md:gap-5 flex-grow">
          {primaryNavItems.map((item, index) => renderNavButton(item, index, false))}
        </div>
      </div>

      {/* Row 2: Secondary sub-menu (FLOWS & CPMS TV & EXIT) under primary */}
      <div className="flex items-center gap-3 px-2 py-1 md:gap-5 bg-zinc-950/60 rounded-xl border border-white/5 w-full md:w-fit overflow-x-auto no-scrollbar outline-none">
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar flex-grow">
          {secondaryNavItems.map((item, index) => renderNavButton(item, index, true))}
          
          {onLogout && (
            <button
              onClick={(e) => { e.preventDefault(); onLogout(); }}
              onTouchEnd={(e) => { e.preventDefault(); onLogout(); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap text-red-500 hover:text-white hover:bg-red-500 border border-red-500/20 font-cinzel cursor-pointer active:scale-95"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
