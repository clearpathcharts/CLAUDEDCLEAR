// /src/components/StockCard.tsx
import React from 'react';

type Props = {
  ticker: string;
  company: string;
  sector: string;
  marketCap: string;
  glowType?: 'purple' | 'pink' | 'orange';
};

export default function StockCard({
  ticker,
  company,
  sector,
  marketCap,
  glowType = 'purple'
}: Props) {
  const glowStyles = {
    purple: 'hover:shadow-[0_0_15px_#8B00FF,_0_0_30px_#5B00FF] border-[#8B00FF]/25',
    pink: 'hover:shadow-[0_0_15px_#FF007F,_0_0_30px_#FF1493] border-[#FF007F]/25',
    orange: 'hover:shadow-[0_0_15px_#FF6A00,_0_0_30px_#FFC400] border-[#FF6A00]/25'
  };

  const badgeColors = {
    purple: 'text-[#8B00FF] bg-[#8B00FF]/15 border-[#8B00FF]/30',
    pink: 'text-[#FF007F] bg-[#FF007F]/15 border-[#FF007F]/30',
    orange: 'text-[#FF6A00] bg-[#FF6A00]/15 border-[#FF6A00]/30'
  };

  return (
    <div className={`p-6 bg-black/60 backdrop-blur-xl border rounded-2xl cursor-pointer hover:bg-neutral-900/40 transition-all duration-300 flex flex-col justify-between h-44 ${glowStyles[glowType]}`}>
      <div className="flex justify-between items-start">
        <div className={`p-1 px-2.5 rounded-lg text-[10px] font-mono font-black uppercase leading-none tracking-wider border ${badgeColors[glowType]}`}>
          {ticker}
        </div>
        <span className="text-zinc-550 text-[9px] font-mono tracking-widest uppercase">STOCKS SECURED</span>
      </div>

      <div className="mt-4 text-left">
        <h2 className="text-white font-black text-sm uppercase tracking-tight truncate leading-none mb-1">
          {company}
        </h2>
        <p className="text-zinc-400 text-[10.5px] truncate font-medium">
          {sector}
        </p>
      </div>

      <div className="w-full h-px bg-white/5 my-2.5" />

      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-zinc-500 uppercase font-bold tracking-wider">CAP VALUE:</span>
        <span className="text-white font-black">{marketCap}</span>
      </div>
    </div>
  );
}
