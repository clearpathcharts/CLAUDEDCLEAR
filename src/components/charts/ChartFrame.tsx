
"use client";

import { ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  themeProfiles,
  type ThemeProfileId,
} from "../../lib/theme/profiles";

const TIMEFRAMES = ["1m", "5m", "10m", "15m", "30m", "1h", "4h", "1d", "1w", "1M", "YTD"];

export function ChartFrame({
  title,
  profileId,
  timeframe,
  isExpanded = false,
  onExpandToggle,
  onTimeframeChange,
  children,
}: {
  title: string;
  profileId: string;
  timeframe?: string;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onTimeframeChange?: (tf: string) => void;
  children: ReactNode;
}) {
  const normalizedProfileId = (profileId || "").toLowerCase();
  const safeProfileId = normalizedProfileId in themeProfiles ? (normalizedProfileId as ThemeProfileId) : "calm_focus";
  const profile = themeProfiles[safeProfileId];

  return (
    <div
      className={`bento-card w-full h-full transition-all duration-500 flex flex-col ${isExpanded ? 'fixed inset-4 z-[150] shadow-[0_0_50px_rgba(0,0,0,0.8)]' : 'relative'}`}
    >
      <div
        className="rounded-[22px] overflow-hidden w-full h-full flex flex-col relative z-10"
        style={{
          background: `linear-gradient(180deg, ${profile.bgTop}, ${profile.bgBottom})`,
        }}
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: profile.text }}>
              {title}
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-xs opacity-80" style={{ color: profile.text }}>
                {profile.label}
              </span>
              {onExpandToggle && (
                <button 
                  onClick={onExpandToggle} 
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  style={{ color: profile.text }}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange?.(tf)}
                className="px-3 py-1 text-xs rounded-md border transition uppercase font-sans cursor-pointer hover:opacity-90"
                style={{
                  color: timeframe === tf ? "#ffffff" : "rgba(255,255,255,0.7)",
                  borderColor: timeframe === tf ? "#FF007F" : "rgba(255,255,255,0.10)",
                  background:
                    timeframe === tf 
                      ? "linear-gradient(135deg, #FF007F 0%, #FF4500 60%, #3a0000 100%)" 
                      : "rgba(10, 10, 18, 0.5)",
                  boxShadow: timeframe === tf 
                    ? "0 0 12px rgba(255, 0, 127, 0.6), inset 0 0 6px rgba(255, 69, 0, 0.7)" 
                    : "none",
                  fontWeight: timeframe === tf ? "900" : "500",
                  letterSpacing: "0.05em",
                }}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex-1 h-full min-h-[300px]" style={{ background: profile.panel }}>
          {children}
        </div>
      </div>
      
      {/* Backdrop for expanded state */}
      {isExpanded && (
        <div className="fixed inset-[-100px] bg-black/80 -z-10 backdrop-blur-sm" />
      )}
    </div>
  );
}
