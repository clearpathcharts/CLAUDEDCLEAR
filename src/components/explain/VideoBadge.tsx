import React from 'react';

interface VideoBadgeProps {
  color: string;
  onClick: () => void;
  label: string;
  compact?: boolean;
}

export function VideoBadge({ color, onClick, label, compact = true }: VideoBadgeProps) {
  const width = compact ? 26 : 40;
  const height = compact ? 17 : 26;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={`Extra explanation: how ${label} works`}
      title={`Need extra understanding? Open a plain-language guide for ${label}`}
      className="shrink-0 leading-none bg-transparent border-0 p-0 cursor-pointer hover:opacity-90"
    >
      <svg viewBox="0 0 30 20" width={width} height={height} aria-hidden>
        <rect
          x="1"
          y="1"
          width="28"
          height="18"
          rx="5"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
        />
        <path d="M12 6 L12 14 L19 10 Z" fill={color} />
      </svg>
    </button>
  );
}
