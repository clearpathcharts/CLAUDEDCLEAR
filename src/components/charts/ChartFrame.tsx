
"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2 } from "lucide-react";
import { ChartLocalTimeAndPulse } from "./ChartLocalTimeAndPulse";
import { TimeframeMenu } from "./TimeframeMenu";
import {
  themeProfiles,
  type ThemeProfileId,
} from "../../lib/theme/profiles";

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

  // Prevent page scroll stealing drag gestures while the expanded chart is open.
  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  const card = (
    <div
      className="rounded-[22px] overflow-hidden w-full h-full flex flex-col relative"
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
                aria-label={isExpanded ? "Minimize chart" : "Expand chart"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <ChartLocalTimeAndPulse slotId={`frame-${title}`} symbol={title} />
        </div>

        <div className="mt-3">
          <TimeframeMenu
            value={timeframe || "1h"}
            onChange={(tf) => onTimeframeChange?.(tf)}
          />
        </div>
      </div>

      <div className="p-4 flex-1 min-h-0 flex flex-col" style={{ background: profile.panel }}>
        {children}
      </div>
    </div>
  );

  if (isExpanded && typeof document !== "undefined") {
    return (
      <>
        {/* Keep grid layout stable while the chart is portaled to <body>. */}
        <div className="invisible pointer-events-none w-full min-h-[480px]" aria-hidden="true">
          <div className="bento-card w-full h-full flex flex-col opacity-0">{card}</div>
        </div>
        {createPortal(
          <>
            <div
              className="fixed inset-0 z-[149] bg-black/80 backdrop-blur-sm"
              onClick={onExpandToggle}
              aria-hidden="true"
            />
            <div
              className="bento-card fixed inset-4 z-[150] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {card}
            </div>
          </>,
          document.body
        )}
      </>
    );
  }

  return (
    <div className="bento-card w-full h-full transition-all duration-500 flex flex-col relative">
      {card}
    </div>
  );
}
