import React, { useState } from 'react';
import { useExplainModeOptional } from './ExplainModeContext';
import { VideoBadge } from './VideoBadge';
import { ExplainOverlay } from './ExplainOverlay';
import { explainColorForNavTab, getExplainContent } from './explainContent';

interface ExplainTriggerProps {
  contentId: string;
  color?: string;
  compact?: boolean;
}

/**
 * Drop this next to any tab label:
 *   <ExplainTrigger contentId="StrictlyCharts" />
 * Renders nothing when Explain Mode is off or the id has no copy yet.
 */
export function ExplainTrigger({ contentId, color, compact = true }: ExplainTriggerProps) {
  const { explainMode } = useExplainModeOptional();
  const [open, setOpen] = useState(false);
  const content = getExplainContent(contentId);

  if (!explainMode || !content) return null;

  return (
    <>
      <VideoBadge
        compact={compact}
        color={color ?? content.color ?? explainColorForNavTab(contentId)}
        onClick={() => setOpen(true)}
        label={content.title}
      />
      {open && <ExplainOverlay contentId={contentId} onClose={() => setOpen(false)} />}
    </>
  );
}
