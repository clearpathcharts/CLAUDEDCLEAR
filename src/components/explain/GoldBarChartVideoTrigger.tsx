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
      className="flex h-8 shrink-0 items-center rounded-md border border-[#FFCC00]/30 bg-[#FFCC00]/5 px-2"
      data-gold-bar-chart-video
      onPointerDown={(e) => e.stopPropagation()}
    >
      <VideoBadge
        compact={compact}
        color={content?.color ?? GOLD}
        onClick={() => setOpen(true)}
        label="the Gold Bar trading tool"
        text="What is the Gold Bar"
      />
      {open && <ExplainOverlay contentId="gold-bar" onClose={() => setOpen(false)} />}
    </div>
  );
}
