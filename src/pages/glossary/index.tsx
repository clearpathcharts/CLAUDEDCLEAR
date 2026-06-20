// /src/pages/glossary/index.tsx
import React, { useState } from "react";
import glossary from "../../../data/glossary/glossary.json";
import { Search, Hash, BookOpen } from "lucide-react";

interface GlossaryTerm {
  term: string;
  definition: string;
  category?: string;
}

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  const filteredGlossary = glossary.filter((item: GlossaryTerm) => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLetter = activeLetter ? item.term.toUpperCase().startsWith(activeLetter) : true;
    return matchesSearch && matchesLetter;
  });

  return (
    <div className="glossary-page min-h-screen p-6 md:p-10 text-white font-sans bg-[#03010b]">
      <div className="max-w-5xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* Glossary Header Hero */}
        <div className="p-8 bg-gradient-to-r from-neutral-950/85 via-[#030612]/95 to-transparent border border-pink-500/10 rounded-3xl relative overflow-hidden shadow-2xl select-none">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF007F] font-black block mb-2">
            ACADEMIC GLOSSARY DIVISION // DEFINITION ENGINE
          </span>

          <h1 className="text-white font-black text-2.5xl tracking-tight uppercase flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FF007F]" />
            ClearPath Financial Glossary
          </h1>

          <p className="text-zinc-405 text-xs mt-3 leading-relaxed max-w-2xl">
            Sovereign capital operates on deep semantic lexicons. Master standard terminologies, corporate definitions, 
            liquidity structures, and currency interest-differential jargon.
          </p>
        </div>

        {/* Global Glossary Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <input 
              type="text" 
              placeholder="Filter glossary dictionary..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950/80 border border-white/10 hover:border-white/20 focus:border-[#FF007F]/40 text-white font-mono text-xs placeholder-zinc-550 pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
          </div>

          <div className="flex gap-2 flex-wrap justify-center font-mono text-[10px]">
            <button 
              onClick={() => setActiveLetter(null)}
              className={`px-2.5 py-1.5 rounded-lg border cursor-pointer font-black ${!activeLetter ? 'bg-[#FF007F]/15 border-[#FF007F]/35 text-white' : 'bg-white/[0.01] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              ALL
            </button>
            {alphabet.map((letter) => {
              const hasItems = glossary.some((item: GlossaryTerm) => item.term.toUpperCase().startsWith(letter));
              return (
                <button
                  key={letter}
                  onClick={() => setActiveLetter(letter)}
                  disabled={!hasItems}
                  className={`px-2 py-1.5 rounded-lg border font-black transition-all ${!hasItems ? 'opacity-25 cursor-not-allowed border-transparent text-zinc-650' : activeLetter === letter ? 'bg-[#FF007F]/15 border-[#FF007F]/35 text-white cursor-pointer' : 'bg-white/[0.01] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer'}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Glossary Cards Grid */}
        <div className="glossary-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredGlossary.map((term: GlossaryTerm, i: number) => (
            <div
              key={i}
              className="glass glossary-card p-6 flex flex-col justify-between hover:border-[#FF007F]/20 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-3 font-mono text-[9px] select-none text-zinc-550">
                  <span className="uppercase tracking-wider">
                    {term.category || "General Markets"}
                  </span>
                  <span className="text-[#FF007F] font-black">
                    #{i + 1}
                  </span>
                </div>

                <h2 className="text-white font-black text-sm uppercase tracking-tight select-text mb-2.5">
                  {term.term}
                </h2>

                <p className="text-zinc-350 text-[11.5px] leading-relaxed font-sans select-text">
                  {term.definition}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/5 flex gap-1 font-mono text-[9px] text-[#FF007F] select-none">
                <span>DEFINED BY ACADEMIC MATRIX</span>
              </div>
            </div>
          ))}

          {filteredGlossary.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-white/5 rounded-3xl">
              ⚠️ NO MATCHED GLOSSARY TERM DEFINITIONS LOADED FOR CURRENT QUERY
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
