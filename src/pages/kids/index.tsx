// /src/pages/kids/index.tsx
import React from "react";
import { Sparkles, Coins, TrendingUp, DollarSign, BookOpen } from "lucide-react";

export default function KidsMode() {
  const cards = [
    {
      title: "What Is Money?",
      desc: "Inside your pocket are small pieces of paper or metal. Money is a tool we use to swap for things we want. Instead of trade-exchanging cookies for a toy, we use coins to buy things easily!",
      icon: DollarSign,
      color: "text-amber-400",
      bg: "border-amber-500/10 hover:border-amber-500/30",
    },
    {
      title: "What Is A Stock?",
      desc: "Imagine you start an amazing juice stand. To buy a bigger blender, you ask a friend to help, giving them a tiny certificate paper. A stock is a small digital token representing ownership of a company!",
      icon: TrendingUp,
      color: "text-[#00D9FF]",
      bg: "border-cyan-500/10 hover:border-cyan-500/30",
    },
    {
      title: "What Is Inflation?",
      desc: "Inflation is when toys or candy become more expensive over time. If a balloon costs $1 this year but $1.50 next year, the value of that dollar became smaller. Understanding this help us save money!",
      icon: Coins,
      color: "text-[#FF007F]",
      bg: "border-pink-500/10 hover:border-pink-500/30",
    }
  ];

  return (
    <div className="kids-mode min-h-screen p-6 md:p-10 text-white font-sans bg-[#03010b]">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* Header Hero */}
        <div className="p-8 bg-gradient-to-r from-neutral-950/85 via-[#030612]/95 to-transparent border border-amber-500/15 rounded-3xl relative overflow-hidden shadow-2xl select-none">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-400 font-black block mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            ClearPath Junior Ecosystem // Kids Learning Matrix
          </span>

          <h1 className="text-white font-black text-2.5xl tracking-tight uppercase flex items-center gap-2">
            Learn Money & Markets
          </h1>

          <p className="text-zinc-405 text-xs mt-3 leading-relaxed max-w-xl">
            A simplified, friendly handbook decoding the financial system. Learn the absolute basics of ownership, transactions, and macroeconomics.
          </p>
        </div>

        {/* Kids Grid */}
        <div className="kids-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const IconComp = card.icon;
            return (
              <div
                key={card.title}
                className={`glass kids-card p-6 rounded-3xl border flex flex-col justify-between min-h-[300px] transition-all duration-300 ${card.bg} bg-gradient-to-br from-white/[0.03] to-transparent hover:-translate-y-2 select-text`}
              >
                <div>
                  <div className="flex justify-between items-start border-b border-white/5 pb-2.5 mb-4 select-none">
                    <span className="font-mono text-[9px] text-zinc-550">CHAPTER 0{i + 1}</span>
                    <IconComp className={`w-5 h-5 ${card.color}`} />
                  </div>

                  <h2 className="text-white font-black text-base uppercase tracking-tight mb-3">
                    {card.title}
                  </h2>

                  <p className="text-zinc-350 text-[11.5px] leading-relaxed font-sans">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-zinc-550 select-none">
                  <span>FOUNDATIONS MANUAL</span>
                  <span className={`${card.color} font-black`}>COMPLETED</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
