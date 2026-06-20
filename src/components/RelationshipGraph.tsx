// /src/components/RelationshipGraph.tsx
import React from 'react';

interface RelationshipGraphProps {
  title: string;
  relationships: string[];
}

export default function RelationshipGraph({
  title,
  relationships,
}: RelationshipGraphProps) {
  return (
    <div className="relationship-graph glass p-6 flex flex-col gap-4 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black">
          TRANSMISSION PIPELINE INDEX
        </span>
      </div>

      <h2 className="text-white font-black text-sm uppercase tracking-tight">
        {title}
      </h2>

      <div className="relationship-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
        {relationships.map((item, i) => (
          <div
            key={i}
            className="relationship-node p-3 bg-neutral-900/60 border border-white/10 rounded-xl text-center text-xs font-mono font-bold text-zinc-330 hover:border-[#00D9FF] hover:text-[#00D9FF] transition-all cursor-pointer select-none"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
