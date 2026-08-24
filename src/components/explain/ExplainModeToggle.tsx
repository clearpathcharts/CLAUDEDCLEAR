import React from 'react';
import { useExplainModeOptional } from './ExplainModeContext';
import { VideoBadge } from './VideoBadge';

export function ExplainModeToggle({ compact = false }: { compact?: boolean }) {
  const { explainMode, toggleExplainMode } = useExplainModeOptional();
  const color = explainMode ? '#00E5FF' : '#999';

  return (
    <button
      type="button"
      onClick={toggleExplainMode}
      aria-pressed={explainMode}
      className={`flex items-center gap-1.5 rounded-full border shrink-0 whitespace-nowrap ${
        compact ? 'px-2 py-1.5 text-[9px]' : 'px-3 py-2 text-[10px] md:text-xs'
      } font-black tracking-wider`}
      style={{
        background: explainMode ? 'rgba(0,229,255,0.1)' : 'transparent',
        borderColor: color,
        color,
        fontFamily: "'Cinzel', serif",
      }}
      title="Turn on extra explanations next to each tab — for anyone who wants a slower, clearer walkthrough"
    >
      <svg viewBox="0 0 30 20" width={compact ? 20 : 24} height={compact ? 13 : 16} aria-hidden>
        <rect x="1" y="1" width="28" height="18" rx="5" fill="none" stroke={color} strokeWidth="1.6" />
        <path d="M12 6 L12 14 L19 10 Z" fill={color} />
      </svg>
      {explainMode ? 'Explain on' : 'Need extra understanding'}
    </button>
  );
}
