import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sliders, Search, RotateCcw, Frown, Info, Calculator, Tag, ArrowDown, 
  TriangleAlert, X, Check, Star, StarHalf, ChevronLeft, Layers, PlayCircle, BookOpen, Activity, ArrowRight
} from 'lucide-react';
import { buildIndicators } from './indicatorsData';

const LS_KEY = "indicator_directory_v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDateMonthDYr(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

const INDICATORS = buildIndicators();

const defaultState = {
  search: "",
  categories: [] as string[],
  maxComplexity: 5,
  withVideoOnly: false,
  sort: "nameAsc",
  selectedIndicatorId: "",
  lastSaved: ""
};

export default function EncyclopediaOfIndicators() {
  const [state, setState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ...defaultState,
            ...parsed,
            categories: Array.isArray(parsed.categories) ? parsed.categories : []
          };
        }
      }
    } catch {}
    return defaultState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const saveStateTime = () => {
    updateState({ lastSaved: formatDateMonthDYr(new Date()) });
  };

  const filteredIndicators = useMemo(() => {
    const q = state.search.trim().toLowerCase();
    const cats = new Set(state.categories);
    const maxC = state.maxComplexity;
    const videoOnly = state.withVideoOnly;

    let list = INDICATORS.filter(p => {
      if (q) {
        const hay = `${p.name} ${p.description} ${p.tags.join(" ")} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cats.size && !cats.has(p.category)) return false;
      if (p.complexity > maxC) return false;
      if (videoOnly && !p.hasVideo) return false;
      return true;
    });

    const sort = state.sort;
    if (sort === "complexityAsc") {
      list.sort((a, b) => a.complexity - b.complexity);
    } else if (sort === "complexityDesc") {
      list.sort((a, b) => b.complexity - a.complexity);
    } else if (sort === "nameAsc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => {
        if (a.hasVideo !== b.hasVideo) return a.hasVideo ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }
    return list;
  }, [state.search, state.categories, state.maxComplexity, state.withVideoOnly, state.sort]);

  const selectedIndicator = INDICATORS.find(p => p.id === state.selectedIndicatorId);

  const toggleCategory = (cat: string) => {
    let cats = [...state.categories];
    if (cats.includes(cat)) {
      cats = cats.filter(c => c !== cat);
    } else {
      cats.push(cat);
    }
    updateState({ categories: cats, selectedIndicatorId: '' });
  };

  const removeChip = (key: string) => {
    if (key === "search") updateState({ search: "" });
    if (key === "cats") updateState({ categories: [] });
    if (key === "complexity") updateState({ maxComplexity: 5 });
    if (key === "video") updateState({ withVideoOnly: false });
    updateState({ selectedIndicatorId: "" });
  };
  
  const handleBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#030307] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-[#00B6FF]/30 pb-16 relative w-full">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[20%] w-[900px] h-[500px] bg-gradient-to-r from-[#8A2EFF] via-[#00B6FF] to-[#00FFD1] rounded-full blur-[120px] opacity-[0.15] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] left-[80%] w-[600px] h-[400px] bg-gradient-to-r from-[#00FFD1] to-[#7CFF00] rounded-full blur-[100px] opacity-[0.1] pointer-events-none z-0"></div>
      
      <div className="px-2 sm:px-4 pt-4 sm:pt-6 relative z-10 w-full min-h-[inherit]">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-[#00FFD1] transition-colors mb-4 text-xs font-mono tracking-widest uppercase w-fit bg-[#071226]/50 border border-[#00B6FF]/30 px-4 py-2 rounded-lg backdrop-blur-sm cursor-pointer z-50 relative shadow-[0_0_15px_rgba(0,182,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,209,0.3)]"
        >
          <ChevronLeft size={16} /> Back to Terminal Desktop
        </button>

        <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border border-[#00B6FF]/30 rounded-2xl bg-[#071226]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,182,255,0.15)] sticky top-3 z-30">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-b from-[#00B6FF]/20 to-[#071226] border border-[#00B6FF]/50 shadow-[0_0_15px_rgba(0,182,255,0.4)] shrink-0">
              <Layers className="text-[#00FFD1]" size={20} />
            </div>
            <div className="min-w-0 pr-4">
              <h1 className="m-0 text-base font-semibold tracking-wide truncate mt-1 text-white uppercase font-mono tracking-widest">Indicator Directory</h1>
              <p className="m-0 mt-0.5 text-xs text-[#00FFFF]/60 truncate uppercase tracking-widest font-mono">Browse mathematical models and technical analysis tools.</p>
            </div>
          </div>
        </header>

        <main className={`grid grid-cols-1 lg:grid-cols-[280px_1fr] ${selectedIndicator ? 'xl:grid-cols-[280px_1fr_400px]' : ''} gap-4 mt-4 items-start pb-20`}>
          
          {/* Left panel Filters */}
          <aside className="border border-[#00B6FF]/20 rounded-2xl bg-[#0A1C3A]/40 backdrop-blur-md shadow-[0_0_30px_rgba(0,182,255,0.1)] overflow-hidden lg:sticky lg:top-[92px]">
            <div className="p-4 py-3.5 border-b border-[#00B6FF]/20">
              <h2 className="m-0 text-sm flex items-center gap-2 font-semibold text-[#00B6FF] uppercase tracking-widest font-mono">
                <Sliders size={16}/> Filters
              </h2>
            </div>
            <div className="p-4 flex flex-col gap-4">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#00FFD1]/80 font-mono tracking-widest uppercase">Search</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00B6FF]/60" />
                  <input type="text" className="w-full bg-[#071226]/80 border border-[#00B6FF]/30 rounded-xl py-2.5 pl-10 pr-3 text-[13px] outline-none focus:border-[#00FFD1] focus:shadow-[0_0_15px_rgba(0,255,209,0.3)] transition-all text-white placeholder-[#00B6FF]/40 font-mono" placeholder="Find an indicator..." value={state.search} onChange={e => { updateState({search: e.target.value, selectedIndicatorId: ""}); saveStateTime();}} />
                </div>
              </div>

              <div className="p-3 border border-[#00B6FF]/30 border-dashed rounded-2xl bg-[#071226]/30">
                <div className="text-xs text-[#00FFD1]/80 mb-2 px-1 font-mono tracking-widest uppercase">Category</div>
                <div className="flex flex-col gap-2">
                  {Array.from(new Set(INDICATORS.map(p => p.category))).sort().map(cat => (
                    <label key={cat} className="flex items-center gap-2.5 p-2 rounded-xl border border-[#00B6FF]/10 bg-[#071226]/60 hover:bg-[#00B6FF]/10 hover:border-[#00B6FF]/40 cursor-pointer transition-all select-none">
                      <input type="checkbox" checked={state.categories.includes(cat)} onChange={() => { toggleCategory(cat); saveStateTime(); }} className="w-4 h-4 accent-[#00B6FF] rounded bg-[#071226] border-[#00B6FF]/30"/>
                      <span className="text-xs text-white/90 font-mono uppercase tracking-widest">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#00FFD1]/80 font-mono tracking-widest uppercase">Max Complexity</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="5" step="1" className="flex-1 accent-[#00B6FF] h-1.5 bg-[#00B6FF]/20 rounded-lg appearance-none cursor-pointer" value={state.maxComplexity} onChange={e => { updateState({maxComplexity: Number(e.target.value)}); saveStateTime();}} />
                  <div className="px-3 py-1.5 text-xs text-[#00FFD1] border border-[#00B6FF]/30 bg-[#071226] rounded-full min-w-[40px] text-center font-mono shadow-[0_0_10px_rgba(0,182,255,0.2)]">
                    {state.maxComplexity}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 p-2.5 border border-[#00B6FF]/10 bg-[#071226]/60 rounded-xl cursor-pointer hover:border-[#00B6FF]/30 hover:bg-[#00B6FF]/5 transition-all">
                <input type="checkbox" className="hidden" checked={state.withVideoOnly} onChange={e => { updateState({withVideoOnly: e.target.checked, selectedIndicatorId: ""}); saveStateTime();}} />
                <div className={`w-11 h-6 rounded-full border relative transition-all ${state.withVideoOnly ? "border-[#00FFD1] bg-[#00B6FF]/20 shadow-[0_0_10px_rgba(0,255,209,0.3)]" : "border-[#00B6FF]/30 bg-[#071226]"}`}>
                  <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all shadow-[0_0_5px_rgba(0,255,209,0.5)] ${state.withVideoOnly ? "left-[22px] bg-[#00FFD1]" : "left-[3px] bg-[#00B6FF]/50"}`}></div>
                </div>
                <span className="text-xs text-white/80 select-none font-mono tracking-widest uppercase">Contains Video</span>
              </label>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#00FFD1]/80 font-mono tracking-widest uppercase">Sort Parameters</label>
                <select className="w-full bg-[#071226]/80 text-[#00FFD1] border border-[#00B6FF]/30 rounded-xl py-2.5 px-3 text-[12px] font-mono tracking-widest uppercase outline-none focus:border-[#00FFD1] focus:shadow-[0_0_15px_rgba(0,255,209,0.3)] transition-all appearance-none" value={state.sort} onChange={e => { updateState({sort: e.target.value}); saveStateTime();}}>
                    <option value="nameAsc" className="bg-[#071226]">Name - A to Z</option>
                    <option value="featured" className="bg-[#071226]">Media Features First</option>
                    <option value="complexityAsc" className="bg-[#071226]">Complexity - Low to High</option>
                    <option value="complexityDesc" className="bg-[#071226]">Complexity - High to Low</option>
                </select>
              </div>

              <button 
                onClick={() => { updateState({search: "", categories: [], maxComplexity: 5, withVideoOnly: false, sort: "nameAsc", selectedIndicatorId: ""}); saveStateTime(); }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#FF2D95]/40 text-[#FF2D95] rounded-xl bg-[#071226]/80 hover:bg-[#FF2D95]/10 hover:shadow-[0_0_15px_rgba(255,45,149,0.3)] transition-all text-[11px] font-mono tracking-widest uppercase mt-2"
              >
                <RotateCcw size={14}/> Reset filters
              </button>
            </div>
          </aside>

          {/* Main List */}
          <section className="flex flex-col min-h-[60vh]">
            <div className="flex items-start justify-between gap-4 p-3 border border-[#00B6FF]/30 rounded-2xl bg-[#0A1C3A]/60 shadow-[0_0_20px_rgba(0,182,255,0.1)] mb-3 relative z-20 backdrop-blur-md">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-[#00FFD1]/80 font-mono tracking-widest uppercase">Matches</span>
                <span className="text-lg font-medium tracking-wide text-[#00FFD1]">{filteredIndicators.length}</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {state.search && (
                   <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#00B6FF]/40 bg-[#00B6FF]/10 text-[#00FFD1] text-[10px] font-mono tracking-widest shadow-[0_0_10px_rgba(0,182,255,0.2)]">
                     <span>Search: {state.search}</span>
                     <button onClick={() => removeChip('search')}><X size={12} className="text-[#00B6FF] hover:text-white" /></button>
                   </div>
                )}
                {state.categories.length > 0 && (
                   <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#D946EF]/40 bg-[#D946EF]/10 text-[#D946EF] text-[10px] font-mono tracking-widest shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                     <span>Cat: {state.categories.join(', ')}</span>
                     <button onClick={() => removeChip('cats')}><X size={12} className="text-[#D946EF] hover:text-white" /></button>
                   </div>
                )}
                {state.maxComplexity < 5 && (
                   <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#FFF000]/40 bg-[#FFF000]/10 text-[#FFF000] text-[10px] text-nowrap font-mono tracking-widest shadow-[0_0_10px_rgba(255,240,0,0.2)]">
                     <span>Level: {'<='} {state.maxComplexity}</span>
                     <button onClick={() => removeChip('complexity')}><X size={12} className="text-[#FFF000] hover:text-white" /></button>
                   </div>
                )}
                {state.withVideoOnly && (
                   <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#7CFF00]/40 bg-[#7CFF00]/10 text-[#7CFF00] text-[10px] text-nowrap font-mono tracking-widest shadow-[0_0_10px_rgba(124,255,0,0.2)]">
                     <span>Contains Video</span>
                     <button onClick={() => removeChip('video')}><X size={12} className="text-[#7CFF00] hover:text-white" /></button>
                   </div>
                )}
              </div>
            </div>

            {filteredIndicators.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-[#00B6FF]/30 border-dashed rounded-2xl bg-[#071226]/50 backdrop-blur-md p-8 text-center text-[#00B6FF] mt-2 shadow-[inset_0_0_30px_rgba(0,182,255,0.05)]">
                 <Frown size={32} className="opacity-70 mb-4" />
                 <h3 className="text-sm font-medium text-white/90 mb-2 font-mono tracking-widest uppercase">No indicators match.</h3>
                 <p className="text-xs text-[#00B6FF]/70 font-mono">Adjust your parameters to discover models.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5 gap-4">
                {filteredIndicators.map(p => {
                  const isActive = p.id === state.selectedIndicatorId;
                  return (
                    <article 
                      key={p.id}
                      onClick={() => updateState({ selectedIndicatorId: isActive ? "" : p.id })}
                      className={`
                        relative flex flex-col border rounded-2xl overflow-hidden cursor-pointer shadow-[0_12px_26px_rgba(0,0,0,0.5)] transition-all bg-[linear-gradient(135deg,#071226_0%,#0A1C3A_35%,rgba(0,182,255,0.15)_65%,rgba(0,255,209,0.1)_100%)]
                        ${isActive ? "border-[#00FFD1] shadow-[0_0_20px_rgba(0,255,209,0.3)] bg-gradient-to-r from-[#071226] to-[#0A1C3A]" : "border-[#00B6FF]/30 hover:-translate-y-0.5 hover:border-[#00B6FF]/70 hover:shadow-[0_0_15px_rgba(0,182,255,0.3)]"}
                      `}
                    >
                      <div className="h-[160px] bg-[#071226] relative overflow-hidden shrink-0 group border-b border-[#00B6FF]/30">
                         <img src={p.img} alt={`${p.name} chart illustration`} className="w-full h-full object-cover object-top transform scale-[1.01] transition-transform duration-500 group-hover:scale-105 opacity-90" loading="lazy" />
                         <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] border backdrop-blur-md font-medium tracking-widest uppercase font-mono shadow-[0_0_10px_rgba(0,0,0,0.5)] ${p.hasVideo ? "bg-[#8A2EFF]/20 border-[#8A2EFF]/50 text-[#8A2EFF]" : "bg-[#071226]/80 border-[#00B6FF]/40 text-[#00B6FF]"}`}>
                            {p.hasVideo ? <PlayCircle size={12} /> : <BookOpen size={12} />}
                            {p.hasVideo ? "Video Demo" : "Text Guide"}
                         </div>
                      </div>
                      <div className="p-4 flex flex-col gap-3 flex-1 justify-between bg-[#071226]/80 backdrop-blur-sm">
                         <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                               <h3 className="m-0 text-[15px] font-bold text-white leading-tight truncate tracking-wide">{p.name}</h3>
                               <div className="text-[10px] font-mono tracking-widest uppercase text-[#00FFD1] mt-1 shrink-0">{p.category}</div>
                            </div>
                         </div>
                         
                         <p className="text-xs text-white/50 line-clamp-2 my-1 h-8">{p.description}</p>
                         
                         <div className="flex items-center justify-between border-t border-[#00B6FF]/20 pt-3 mt-1">
                            <div className="flex items-center gap-1 text-[#00B6FF] shrink-0">
                               <span className="text-[9px] uppercase text-[#00B6FF]/70 mr-1 font-mono tracking-widest">Complexity:</span>
                               {[1,2,3,4,5].map(i => {
                                  if (p.complexity >= i) return <div key={i} className="w-1.5 h-3 bg-[#00B6FF] rounded-[1px] shadow-[0_0_5px_rgba(0,182,255,0.6)]"/>;
                                  return <div key={i} className="w-1.5 h-3 bg-[#00B6FF]/20 rounded-[1px]"/>;
                               })}
                            </div>
                         </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* Right Panel - Active Detail View (Video + Imagery) */}
          {selectedIndicator && (
            <aside className="border border-[#00B6FF]/30 rounded-2xl bg-gradient-to-b from-[#071226]/95 to-[#0A1C3A]/95 shadow-[0_15px_40px_rgba(0,182,255,0.2)] overflow-hidden lg:sticky lg:top-[92px] hidden xl:flex flex-col min-h-[600px] max-h-[85vh] backdrop-blur-xl">
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                {selectedIndicator.hasVideo && selectedIndicator.videoUrl ? (
                  <div className="w-full bg-[#071226] relative aspect-video border-b border-[#00B6FF]/30 overflow-hidden group">
                    <video 
                      src={selectedIndicator.videoUrl} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen saturate-150"
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071226] via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-[#071226]/80 px-3 py-1.5 rounded-full border border-[#00B6FF]/40 backdrop-blur-md">
                       <PlayCircle size={14} className="text-[#00FFD1]" />
                       <span className="text-[10px] font-mono tracking-widest text-white uppercase">LIVE DEMO</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[220px] bg-[#071226] relative border-b border-[#00B6FF]/30 shrink-0">
                     <img src={selectedIndicator.img} className="w-full h-full object-cover object-top opacity-95" alt={`${selectedIndicator.name} chart illustration`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#071226] via-transparent to-transparent pointer-events-none"></div>
                  </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="mb-6 shrink-0">
                    <span className="text-[10px] text-[#00FFD1] border border-[#00FFD1]/30 bg-[#00FFD1]/10 px-2.5 py-1 rounded-sm tracking-widest uppercase font-mono shadow-[0_0_10px_rgba(0,255,209,0.2)]">{selectedIndicator.category}</span>
                    <h2 className="text-2xl font-bold mt-4 tracking-tight text-white">{selectedIndicator.name}</h2>
                    <p className="text-sm text-[#00B6FF]/80 leading-relaxed mt-3">{selectedIndicator.description}</p>
                  </div>
                  
                  <div className="bg-[#071226]/60 rounded-xl p-4 border border-[#00B6FF]/20 mb-6 shrink-0 shadow-[inset_0_0_15px_rgba(0,182,255,0.05)]">
                    <h4 className="text-[10px] font-bold text-[#D946EF] uppercase tracking-widest mb-3 font-mono">Model Configuration parameters</h4>
                    <div className="space-y-3">
                      {selectedIndicator.tags.map((tag, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check size={14} className="text-[#7CFF00] mt-0.5 shrink-0 shadow-[0_0_10px_rgba(124,255,0,0.5)] rounded-full" />
                          <p className="text-[12px] text-white/70 leading-snug font-mono uppercase tracking-wide">Signals effectively within the <strong className="text-[#00FFD1] font-bold">{tag}</strong> matrix.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto shrink-0 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const abbr = selectedIndicator.chartAbbr;
                        const payload = {
                          id: selectedIndicator.id,
                          name: selectedIndicator.name,
                          abbr: abbr || selectedIndicator.name,
                          addedAt: Date.now(),
                        };
                        try {
                          const raw = localStorage.getItem("clearpath_pending_indicators");
                          const list = raw ? JSON.parse(raw) : [];
                          const next = Array.isArray(list) ? list.filter((x: any) => x?.name !== payload.name) : [];
                          next.push(payload);
                          localStorage.setItem("clearpath_pending_indicators", JSON.stringify(next.slice(-40)));
                          if (abbr) {
                            const activeRaw = localStorage.getItem("clearpath_active_chart_indicators");
                            const active = activeRaw ? JSON.parse(activeRaw) : ["SMA", "RSI"];
                            const merged = Array.isArray(active) ? [...active] : ["SMA", "RSI"];
                            if (!merged.includes(abbr)) merged.push(abbr);
                            localStorage.setItem("clearpath_active_chart_indicators", JSON.stringify(merged));
                          }
                        } catch {}
                        window.dispatchEvent(new CustomEvent("clearpath-add-indicator", { detail: payload }));
                        window.history.pushState({}, "", "/");
                        window.dispatchEvent(new Event("popstate"));
                        try {
                          localStorage.setItem("clearpath_active_tab", "StrictlyCharts");
                        } catch {}
                        window.dispatchEvent(new CustomEvent("clearpath-set-tab", { detail: "StrictlyCharts" }));
                      }}
                      className="w-full bg-[#00B6FF] hover:bg-[#00FFD1] hover:text-[#071226] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-[13px] uppercase font-mono tracking-widest shadow-[0_0_20px_rgba(0,182,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,209,0.6)]"
                    >
                      Add This Indicator <ArrowRight size={16} />
                    </button>
                    <p className="text-[10px] text-[#00B6FF]/60 font-mono text-center mt-2 tracking-wide">
                      {selectedIndicator.chartAbbr
                        ? `Adds ${selectedIndicator.chartAbbr} to Charts when a live overlay exists.`
                        : "Saved to your indicator list — open Charts to apply related tools."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const q = encodeURIComponent(selectedIndicator.name);
                        window.open(`https://www.tradingview.com/scripts/search/${q}/`, "_blank", "noopener,noreferrer");
                      }}
                      className="w-full bg-transparent border border-[#00B6FF]/40 hover:border-[#00B6FF] text-[#00B6FF] font-mono tracking-widest py-3.5 rounded-xl transition-colors mt-3 text-[11px] uppercase hover:bg-[#00B6FF]/10"
                    >
                      Read Documentation
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}

        </main>
      </div>
    </div>
  );
}
