import React from 'react';

interface YwcLavaPanelProps {
  children: React.ReactNode;
  className?: string;
  rounded?: '2xl' | '3xl';
  padding?: string;
  id?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/** Lava-Hot Industrial panel — same glow border treatment as the Y.W.C. hero. */
export function YwcLavaPanel({
  children,
  className = '',
  rounded = '2xl',
  padding = 'p-5 md:p-6',
  id,
  as: Tag = 'div',
}: YwcLavaPanelProps) {
  const roundClass = rounded === '3xl' ? 'rounded-3xl' : 'rounded-2xl';

  return (
    <Tag
      id={id}
      className={`ywc-lava-panel ${roundClass} ${padding} backdrop-blur-xl relative overflow-hidden ${className}`}
    >
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-bl from-[#FF0080]/45 via-[#FF4500]/30 to-transparent blur-2xl md:h-40 md:w-40" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-gradient-to-tr from-[#FF4500]/40 via-[#FF1493]/22 to-transparent blur-3xl" />
      <div className="relative z-10">{children}</div>
    </Tag>
  );
}

export function YwcSectionTitle({
  children,
  className = '',
  as: Tag = 'h3',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4' | 'span';
}) {
  const El = Tag as React.ElementType;
  return (
    <El className={`ywc-section-title font-black uppercase tracking-wider ${className}`}>
      {children}
    </El>
  );
}
