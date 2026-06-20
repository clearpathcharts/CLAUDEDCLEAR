import React from "react";
import { 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Twitch, 
  Globe, 
  MessageSquare,
  Pin,
  ExternalLink
} from "lucide-react";

interface Props {
  platform: string;
  url: string;
}

export default function SocialPanel({
  platform,
  url
}: Props) {
  if (!url) return null;

  // Map platforms to custom styling & icons
  const getPlatformMeta = (p: string) => {
    const term = p.toLowerCase();
    if (term.includes('youtube')) return { icon: Youtube, color: 'hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]', textColor: 'text-red-400' };
    if (term.includes('instagram')) return { icon: Instagram, color: 'hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]', textColor: 'text-pink-400' };
    if (term.includes('facebook')) return { icon: Facebook, color: 'hover:border-blue-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]', textColor: 'text-blue-500' };
    if (term.includes('twitter') || term.includes('x')) return { icon: Twitter, color: 'hover:border-sky-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]', textColor: 'text-sky-400' };
    if (term.includes('linkedin')) return { icon: Linkedin, color: 'hover:border-blue-700 hover:shadow-[0_0_15px_rgba(29,78,216,0.4)]', textColor: 'text-blue-400' };
    if (term.includes('twitch')) return { icon: Twitch, color: 'hover:border-purple-600 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)]', textColor: 'text-purple-400' };
    if (term.includes('discord')) return { icon: MessageSquare, color: 'hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]', textColor: 'text-indigo-400' };
    if (term.includes('telegram')) return { icon: MessageSquare, color: 'hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]', textColor: 'text-cyan-400' };
    if (term.includes('pinterest')) return { icon: Pin, color: 'hover:border-rose-600 hover:shadow-[0_0_15px_rgba(225,29,72,0.4)]', textColor: 'text-rose-500' };
    return { icon: Globe, color: 'hover:border-[#00e5ff] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]', textColor: 'text-[#00e5ff]' };
  };

  const meta = getPlatformMeta(platform);
  const Icon = meta.icon;

  const resolvedUrl = url.startsWith('http') ? url : `https://${url}`;

  return (
    <a
      href={resolvedUrl}
      target="_blank"
      rel="noreferrer"
      className={`
        relative
        overflow-hidden
        block
        bg-[#09090d]/80
        border
        border-white/10
        rounded-[24px]
        p-6
        text-white
        hover:-translate-y-1
        transition-all
        duration-300
        z-10
        backdrop-blur-md
        group
        ${meta.color}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-white/5 border border-white/5 ${meta.textColor}`}>
            <Icon size={20} />
          </div>
          <div className="text-[17px] font-orbitron font-bold capitalize tracking-wide select-none">
            {platform}
          </div>
        </div>
        <ExternalLink size={14} className="text-white/40 group-hover:text-white transition-colors" />
      </div>

      <div className="mt-4 text-xs font-mono text-gray-400 break-all select-all selection:bg-[#ff2ea6]/30">
        {url}
      </div>
    </a>
  );
}
