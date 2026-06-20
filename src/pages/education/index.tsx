// /src/pages/education/index.tsx
import React, { useState } from 'react';
import { BookOpen, GraduationCap, Award, PlayCircle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function EducationPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <div className="education-page min-h-screen p-6 md:p-10 text-white font-sans bg-[#03010b]">
      <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* Academic University Hero Layout */}
        <div className="p-8 bg-gradient-to-r from-neutral-950/85 via-[#030612]/95 to-transparent border border-[#00ffe1]/20 rounded-3xl relative overflow-hidden shadow-2xl select-none">
          <div className="absolute inset-0 bg-[#00ffe1]/[0.01] pointer-events-none" />
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <GraduationCap className="w-24 h-24 text-[#00ffe1]" />
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00ffe1] font-black block mb-2">
            INSTITUTIONAL CURRICULUM // LEARNING MATRIX
          </span>

          <h1 className="text-white font-black text-2xl tracking-tight uppercase flex items-center gap-2">
            Financial Education Universe
          </h1>

          <p className="text-zinc-405 text-xs mt-3 leading-relaxed max-w-2xl">
            Welcome to the academic training division of Clear Path. Systemic trading mastery requires full mastery 
            of equity valuation, foreign exchange credit channels, and decentralized cryptographic consensus mechanics.
          </p>

          <div className="flex gap-4 mt-6 pt-4 border-t border-white/5 font-mono text-[9.5px]">
            <div className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              STATUS: <b className="text-white">SCHOLASTIC LEVEL 1</b>
            </div>
            <div>•</div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              TRACKS AVAILABLE: <b className="text-[#00ffe1]">3 MASTER MAJORS</b>
            </div>
          </div>
        </div>

        {/* Education Tracks Grid */}
        <div className="education-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* TRACK 1: STOCKS */}
          <div 
            onClick={() => setActiveModule('stocks')}
            className={`glass module-card p-6 cursor-pointer hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between h-72 group ${activeModule === 'stocks' ? 'border-[#00D9FF] bg-cyan-950/10' : ''}`}
          >
            <div>
              <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-4 select-none">
                <span className="font-mono text-[10px] text-[#00D9FF] font-black uppercase">DIVISION 01</span>
                <span className="text-[8px] bg-[#00D9FF]/10 text-[#00D9FF] px-2 py-0.5 rounded font-mono font-bold">EQUITY CAP</span>
              </div>
              <h2 className="text-white font-black text-lg uppercase tracking-tight group-hover:text-[#00D9FF] transition-all">
                Stocks
              </h2>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                Learn ownership systems, earnings, and valuation. Understand corporate governance, debt leverage balance sheets, and dividend yields.
              </p>
            </div>
            <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 pt-3 border-t border-white/5">
              <span>5 STUDY LABS</span>
              <span className="text-[#00D9FF] font-black group-hover:translate-x-1 transition-all">ENTER CELL →</span>
            </div>
          </div>

          {/* TRACK 2: FOREX */}
          <div 
            onClick={() => setActiveModule('forex')}
            className={`glass module-card p-6 cursor-pointer hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between h-72 group ${activeModule === 'forex' ? 'border-[#8B00FF] bg-purple-950/10' : ''}`}
          >
            <div>
              <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-4 select-none">
                <span className="font-mono text-[10px] text-[#8B00FF] font-black uppercase">DIVISION 02</span>
                <span className="text-[8px] bg-[#8B00FF]/10 text-[#8B00FF] px-2 py-0.5 rounded font-mono font-bold">FIAT SWAP</span>
              </div>
              <h2 className="text-white font-black text-lg uppercase tracking-tight group-hover:text-[#8B00FF] transition-all">
                Forex
              </h2>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-semibold">
                Understand currencies, inflation, and central banks. Study interest rate differentials, reserve asset management, and macro liquidity swaps.
              </p>
            </div>
            <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 pt-3 border-t border-white/5">
              <span>4 STUDY LABS</span>
              <span className="text-[#8B00FF] font-black group-hover:translate-x-1 transition-all">ENTER CELL →</span>
            </div>
          </div>

          {/* TRACK 3: CRYPTO */}
          <div 
            onClick={() => setActiveModule('crypto')}
            className={`glass module-card p-6 cursor-pointer hover:border-pink-500/30 transition-all duration-300 flex flex-col justify-between h-72 group ${activeModule === 'crypto' ? 'border-[#FF007F] bg-pink-950/10' : ''}`}
          >
            <div>
              <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-4 select-none">
                <span className="font-mono text-[10px] text-[#FF007F] font-black uppercase">DIVISION 03</span>
                <span className="text-[8px] bg-[#FF007F]/10 text-[#FF007F] px-2 py-0.5 rounded font-mono font-bold">LEDGER RES</span>
              </div>
              <h2 className="text-white font-black text-lg uppercase tracking-tight group-hover:text-[#FF007F] transition-all">
                Crypto
              </h2>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                Learn blockchain systems, mining, and tokenomics. Discover public key cryptography, zero-knowledge proofs, and smart ledger protocols.
              </p>
            </div>
            <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 pt-3 border-t border-white/5">
              <span>6 STUDY LABS</span>
              <span className="text-[#FF007F] font-black group-hover:translate-x-1 transition-all">ENTER CELL →</span>
            </div>
          </div>

        </div>

        {/* Dynamic Study Details Accordion */}
        {activeModule && (
          <div className="p-8 bg-black/60 border border-white/5 rounded-3xl animate-fadeIn text-left">
            {activeModule === 'stocks' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h4 className="text-[#00D9FF] font-black text-sm uppercase tracking-wider select-none">// SYLLABUS: CORE EQUITIES MATRIX</h4>
                <p className="text-zinc-300 font-sans leading-relaxed text-xs">
                  Sovereign businesses are traded through global clearing channels. Mastery begins with dissecting basic corporate structures, balance accounts, and discounted future cash flows:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-white font-bold block mb-1">UNIT I - Ownership & Shares</span>
                    <span className="text-zinc-450 block leading-relaxed text-[11px]">How share capitalization operates, dilutes, and registers fractional equity rights.</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-white font-bold block mb-1">UNIT II - Corporate Earnings Calculus</span>
                    <span className="text-zinc-450 block leading-relaxed text-[11px]">Evaluating EBITDA, PE multiples, debt covenants, and cash flow structures.</span>
                  </div>
                </div>
              </div>
            )}

            {activeModule === 'forex' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h4 className="text-[#8B00FF] font-black text-sm uppercase tracking-wider select-none">// SYLLABUS: MACRO CREDIT FLOWS</h4>
                <p className="text-zinc-300 font-sans leading-relaxed text-xs">
                  Currency relationships are driven by bilateral national credit accounts, reserve banks demand, and structural inflation policies:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-white/[0.02] border border-white/05 rounded-xl">
                    <span className="text-white font-bold block mb-1">UNIT I - Interest Rate Physics</span>
                    <span className="text-zinc-450 block leading-relaxed text-[11px]">How the Federal Funds and overnight borrow limits direct interbank liquidity vectors.</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-white font-bold block mb-1">UNIT II - Inflationary Arbitrage</span>
                    <span className="text-zinc-450 block leading-relaxed text-[11px]">Sovereign supply indexes and purchasing power parity (PPP) calibration loops.</span>
                  </div>
                </div>
              </div>
            )}

            {activeModule === 'crypto' && (
              <div className="flex flex-col gap-4 font-mono text-xs">
                <h4 className="text-[#FF007F] font-black text-sm uppercase tracking-wider select-none">// SYLLABUS: DECENTRALIZED DATA ENGINEERING</h4>
                <p className="text-zinc-300 font-sans leading-relaxed text-xs">
                  Decentralization shifts trust from institutional counterparties directly into trust-minimized cryptographic algorithms and network protocols:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-white font-bold block mb-1">UNIT I - Proof of Work vs Stake Consensus</span>
                    <span className="text-zinc-450 block leading-relaxed text-[11px]">Sovereign mining thermodynamics versus capital staking security loops.</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/05 rounded-xl">
                    <span className="text-white font-bold block mb-1">UNIT II - Tokenomics and Supply Caps</span>
                    <span className="text-zinc-450 block leading-relaxed text-[11px]">Dissecting halving, fee delegation burn, and smart-contract locking parameters.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
