import React from 'react';
import { ExternalLink, Radio, Shield, Sparkles } from 'lucide-react';

interface PortalProps {
  variant?: 'card' | 'banner' | 'sidebar' | 'interactive';
  customTitle?: string;
  customSubtitle?: string;
}

export default function ClearPathTraderPortal({ 
  variant = 'card', 
  customTitle, 
  customSubtitle 
}: PortalProps) {
  
  const getPortalContent = () => {
    switch (variant) {
      case 'banner':
        return {
          title: customTitle || 'CONTINUE BEYOND THEORY',
          subtitle: customSubtitle || 'Enter the Live ClearPathTrader Environment',
          description: 'Experience real-time liquidity pools, live order matching visualizers, and state-of-the-art terminal modules built for elite market analysis.',
          ctaText: 'Access ClearPathTrader Portal',
          accentColor: 'border-cyan-500/30 text-[#00D9FF] hover:border-[#00D9FF]',
          glowClass: 'rgba(0, 217, 255, 0.08)'
        };
      case 'sidebar':
        return {
          title: customTitle || 'ECOSYSTEM APEX NODE',
          subtitle: customSubtitle || 'Live Terminal Portal',
          description: 'Bridge the theory matrix with world order flows.',
          ctaText: 'Open Terminal',
          accentColor: 'border-pink-500/30 text-[#FF00C8] hover:border-[#FF00C8]',
          glowClass: 'rgba(255, 0, 200, 0.08)'
        };
      case 'interactive':
        return {
          title: customTitle || 'YOU HAVE EXPLORED THE HISTORY',
          subtitle: customSubtitle || 'Now Experience The Living Market',
          description: 'The civilization timeline ends in the live market currents. Trade the post-QE regime in high-fidelity sandbox pipelines directly connected to elite global institutions.',
          ctaText: 'Launch Live Simulation',
          accentColor: 'border-amber-500/30 text-amber-400 hover:border-amber-400',
          glowClass: 'rgba(245, 158, 11, 0.08)'
        };
      default:
        return {
          title: customTitle || 'EXPLORE REAL-TIME MARKET SYSTEMS',
          subtitle: customSubtitle || 'Continue Your Financial Education',
          description: 'Witness macroeconomic forces collapse and balloon real-time asset quotes. Elevate your portfolio comprehension using the full suite of ClearPath tools.',
          ctaText: 'Connect to ClearPathTrader',
          accentColor: 'border-purple-500/30 text-purple-400 hover:border-purple-300',
          glowClass: 'rgba(168, 85, 247, 0.08)'
        };
    }
  };

  const content = getPortalContent();

  return (
    <div 
      className={`relative overflow-hidden transition-all duration-500 select-text card-custom-shadow group ${
        variant === 'sidebar' 
          ? 'rounded-2xl border border-[#FF00C8]/20 bg-black/85 p-4 flex flex-col gap-3'
          : variant === 'banner'
            ? 'rounded-3xl border border-white/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#030611]/90 via-[#010c26]/60 to-black/90'
            : 'rounded-3xl border border-white/5 bg-[#030611]/80 backdrop-blur-xl p-6 md:p-8 flex flex-col justify-between gap-4'
      }`}
      style={{
        boxShadow: variant === 'sidebar' 
          ? `0 10px 30px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 15px rgba(255, 0, 200, 0.05)`
          : `0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px ${content.glowClass}`
      }}
    >
      {/* Background Animated Neon Orbits & Glow */}
      <div className={`absolute rounded-full blur-[80px] pointer-events-none opacity-20 transition-all duration-1000 group-hover:opacity-35 ${
        variant === 'sidebar' ? 'top-[-20%] right-[-10%] w-32 h-32' : 'top-[-30%] right-[-20%] w-60 h-60'
      }`}
        style={{
          backgroundColor: variant === 'sidebar' ? '#FF00C8' : variant === 'banner' ? '#00D9FF' : variant === 'interactive' ? '#F59E0B' : '#8B5CF6'
        }}
      />

      <div className={variant === 'banner' ? 'flex-1 flex flex-col gap-2' : 'flex flex-col gap-3'}>
        {/* Antenna Node indicator */}
        <div className="flex items-center gap-2 select-none">
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              variant === 'sidebar' ? 'bg-[#FF00C8]' : variant === 'banner' ? 'bg-[#00D9FF]' : variant === 'interactive' ? 'bg-amber-400' : 'bg-purple-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              variant === 'sidebar' ? 'bg-[#FF00C8]' : variant === 'banner' ? 'bg-[#00D9FF]' : variant === 'interactive' ? 'bg-amber-400' : 'bg-purple-400'
            }`}></span>
          </div>
          <span className="font-mono text-[7.5px] font-black tracking-[0.25em] text-zinc-500 uppercase flex items-center gap-1.5">
            NODE: {variant === 'sidebar' ? 'APEX' : 'CONNECTED'} •
            <span className="text-zinc-400 animate-pulse">{variant === 'sidebar' ? 'ACCESS' : 'GATEWAY'}</span>
          </span>
        </div>

        {/* Cinematic Headers */}
        <div>
          <span className={`font-mono text-zinc-400 font-extrabold uppercase tracking-widest block mb-0.5 ${
            variant === 'sidebar' ? 'text-[7.5px]' : 'text-[9px]'
          }`}>
            {content.title}
          </span>
          <h4 className={`text-white font-extrabold tracking-tight leading-snug group-hover:text-white transition-colors duration-300 ${
            variant === 'sidebar' ? 'text-xs' : 'text-base md:text-lg'
          }`}>
            {content.subtitle}
          </h4>
          <p className={`text-zinc-400 leading-relaxed max-w-[580px] ${
            variant === 'sidebar' ? 'text-[9.5px] mt-1' : 'text-xs mt-2.5'
          }`}>
            {content.description}
          </p>
        </div>

        {/* Legal Regulatory Footnote */}
        <div className={`border-t border-white/5 flex flex-col gap-2 mt-2 pt-2 text-left select-none ${
          variant === 'sidebar' ? '' : 'sm:flex-row sm:items-center'
        }`}>
          <div className="flex items-center gap-1 text-rose-500 font-mono text-[8px] font-black tracking-wider uppercase border border-rose-500/15 bg-rose-500/5 px-1.5 py-0.5 rounded shrink-0 w-fit">
            <Shield className="w-2.5 h-2.5" />
            18+ Educational Platform
          </div>
          <p className={`font-mono text-zinc-500 leading-normal ${
            variant === 'sidebar' ? 'text-[7.5px]' : 'text-[9px]'
          }`}>
            Trading and financial markets involve risk. Educational use only.
          </p>
        </div>
      </div>

      {/* Primary Interactive CTA button linking directly to login destination */}
      <div className={`${variant === 'banner' ? 'md:mt-0 shrink-0 self-start md:self-center' : 'mt-2'} relative z-10`}>
        <a 
          href="/login" 
          className={`flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.01] border font-mono font-black tracking-widest transition-all duration-300 hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] ${
            variant === 'sidebar' 
              ? 'px-3 py-2 text-[9px] w-full' 
              : 'px-5 py-3.5 text-xs'
          } ${content.accentColor}`}
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}
        >
          <span>{content.ctaText}</span>
          <ExternalLink className={`${variant === 'sidebar' ? 'w-3 h-3' : 'w-4 h-4'} animate-bounce`} style={{ animationDuration: '3.5s' }} />
        </a>
      </div>
    </div>
  );
}
