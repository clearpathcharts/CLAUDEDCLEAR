import React, { useState } from 'react';
import { VideoBadge } from './VideoBadge';
import { ExplainOverlay } from './ExplainOverlay';
import { getExplainContent } from './explainContent';

const GOLD = '#FFCC00';

/**
 * Always-on play badge above every live chart (not gated by Explain Mode).
 * Opens the “What is the Gold Bar” film so visitors are not lost on the candles.
 */
export function GoldBarChartVideoTrigger({ compact = true }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const content = getExplainContent('gold-bar');

  return (
    <div
      className="flex items-center gap-2 min-w-0 pt-1 pb-2"
      data-gold-bar-chart-video
      onPointerDown={(e) => e.stopPropagation()}
    >
      <VideoBadge
        compact={compact}
        color={content?.color ?? GOLD}
        onClick={() => setOpen(true)}
        label="the Gold Bar trading tool"
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-w-0 truncate bg-transparent border-0 p-0 cursor-pointer text-left text-[9px] font-black uppercase tracking-[0.16em] text-[#FFCC00] hover:text-[#FFE566]"
        title="What is the Gold Bar trading tool"
      >
        What is the Gold Bar
      </button>
      {open && <ExplainOverlay contentId="gold-bar" onClose={() => setOpen(false)} />}
    </div>
  );
}
