// /src/pages/companies/[company].tsx
import React from "react";
import companies from "../../../data/companies/companies.json";

interface CompanyData {
  ticker: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  exchange: string;
  marketCap: string;
  whatMoves: string[];
  competitors: string[];
}

interface CompanyPageProps {
  company?: CompanyData;
}

export default function CompanyPage({ company }: CompanyPageProps) {
  // Graceful fallback loader: if no company was passed directly as a prop (e.g., when routed dynamically),
  // try to fetch a default or inspect URL context
  const resolvedCompany = company || companies[0];

  if (!resolvedCompany) {
    return (
      <div className="company-profile-page min-h-screen bg-[#03010b] flex items-center justify-center p-6 text-zinc-500 font-mono">
        NO COMPILING COMPANY DATA RECORD DETECTED.
      </div>
    );
  }

  return (
    <div className="company-profile-page min-h-screen p-6 bg-[#03010b] text-white">
      {/* Visual top border */}
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fadeIn">
        
        {/* 1. HERO GLASS SECTION */}
        <section className="hero glass p-8 relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="font-mono text-8xl font-black text-cyan-400 select-none">
              {resolvedCompany.ticker}
            </span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black">
            CLEARPATH PROFILE ENGINE // INSTITUTIONAL LISTING
          </span>

          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            {resolvedCompany.name}
          </h1>

          <p className="text-zinc-330 text-xs leading-relaxed max-w-2xl">
            {resolvedCompany.description}
          </p>

          <div className="stats-grid grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-5 border-t border-white/5">
            <div className="stat-card p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="font-mono text-[9px] text-zinc-550 block uppercase tracking-wider">Sector</span>
              <h3 className="text-white font-black text-sm mt-1 uppercase">{resolvedCompany.sector}</h3>
            </div>

            <div className="stat-card p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="font-mono text-[9px] text-zinc-550 block uppercase tracking-wider">Industry</span>
              <h3 className="text-white font-black text-sm mt-1 uppercase truncate">{resolvedCompany.industry}</h3>
            </div>

            <div className="stat-card p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="font-mono text-[9px] text-zinc-550 block uppercase tracking-wider">Exchange</span>
              <h3 className="text-cyan-400 font-mono font-black text-sm mt-1">{resolvedCompany.exchange}</h3>
            </div>
          </div>
        </section>

        {/* 2. WHAT MOVES SECTION */}
        <section className="what-moves glass p-8">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF007F] font-black block mb-2">
            TRANSMISSION SENSITIVITY INDICATORS
          </span>
          <h2 className="text-white font-black text-lg uppercase tracking-tight mb-4">
            What Moves This Company?
          </h2>

          <ul className="list-disc pl-5 font-mono text-xs text-zinc-350 flex flex-col gap-2.5">
            {resolvedCompany.whatMoves.map((item, i) => (
              <li key={i} className="hover:text-white transition-all">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 3. COMPETITORS SECTION */}
        <section className="competitors glass p-8">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF6A00] font-black block mb-2">
            MARKET MAP SEGMENTATION
          </span>
          <h2 className="text-white font-black text-lg uppercase tracking-tight mb-4">
            Major Competitors
          </h2>

          <div className="competitor-grid grid grid-cols-1 sm:grid-cols-3 gap-4">
            {resolvedCompany.competitors.map((item, i) => (
              <div 
                key={i} 
                className="competitor-card p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-center font-bold text-xs text-zinc-300 hover:text-white flex items-center justify-center min-h-[50px] transition-all"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
