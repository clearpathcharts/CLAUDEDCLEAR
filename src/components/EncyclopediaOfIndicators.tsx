import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sliders, Search, RotateCcw, Frown, X, ChevronLeft, Layers,
  BookOpen, Activity, ArrowRight, Calculator, AlertTriangle
} from 'lucide-react';
import {
  allBuiltIndicators,
  findIndicatorBySlug,
  indicatorImageSlug,
  type IndicatorRecord,
} from './indicatorsData';

const LS_KEY = "indicator_directory_v2";
const INDICATORS = allBuiltIndicators();

function formatDateMonthDYr(d: Date) {
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

function slugFromPath(): string {
  if (typeof window === "undefined") return "";
  const p = window.location.pathname.toLowerCase().replace(/\/$/, "");
  const m = p.match(/^\/indicators\/([^/]+)$/);
  return m ? decodeURIComponent(m[1]) : "";
}

const defaultState = {
  search: "",
  categories: [] as string[],
  maxComplexity: 5,
  liveOverlayOnly: false,
  sort: "nameAsc",
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
            categories: Array.isArray(parsed.categories) ? parsed.categories : [],
            liveOverlayOnly: Boolean(parsed.liveOverlayOnly),
          };
        }
      }
    } catch {}
    return defaultState;
  });

  const [selectedSlug, setSelectedSlug] = useState<string>(() => slugFromPath());

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    const sync = () => setSelectedSlug(slugFromPath());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const saveStateTime = () => {
    updateState({ lastSaved: formatDateMonthDYr(new Date()) });
  };

  const openIndicator = useCallback((item: IndicatorRecord) => {
    const url = `/indicators/${item.slug}`;
    setSelectedSlug(item.slug);
    try {
      window.history.pushState({ tabId: "EncyclopediaOfIndicators" }, "", url);
    } catch {}
  }, []);

  const closeIndicator = useCallback(() => {
    setSelectedSlug("");
    try {
      window.history.pushState({ tabId: "EncyclopediaOfIndicators" }, "", "/indicators");
    } catch {}
  }, []);

  const filteredIndicators = useMemo(() => {
    const q = state.search.trim().toLowerCase();
    const cats = new Set(state.categories);
    const maxC = state.maxComplexity;
    const liveOnly = state.liveOverlayOnly;

    let list = INDICATORS.filter(p => {
      if (q) {
        const hay = `${p.name} ${p.description} ${p.tags.join(" ")} ${p.category} ${p.chartAbbr || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cats.size && !cats.has(p.category)) return false;
      if (p.complexity > maxC) return false;
      if (liveOnly && !p.hasLiveOverlay) return false;
      return true;
    });

    const sort = state.sort;
    if (sort === "complexityAsc") {
      list.sort((a, b) => a.complexity - b.complexity);
    } else if (sort === "complexityDesc") {
      list.sort((a, b) => b.complexity - a.complexity);
    } else if (sort === "liveFirst") {
      list.sort((a, b) => {
        if (a.hasLiveOverlay !== b.hasLiveOverlay) return a.hasLiveOverlay ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [state.search, state.categories, state.maxComplexity, state.liveOverlayOnly, state.sort]);

  const selectedIndicator = selectedSlug ? findIndicatorBySlug(selectedSlug) : undefined;
  const categories = useMemo(
    () => Array.from(new Set(INDICATORS.map(p => p.category))).sort(),
    []
  );

  const toggleCategory = (cat: string) => {
    let cats = [...state.categories];
    if (cats.includes(cat)) {
      cats = cats.filter(c => c !== cat);
    } else {
      cats.push(cat);
    }
    updateState({ categories: cats });
  };

  const removeChip = (key: string) => {
    if (key === "search") updateState({ search: "" });
    if (key === "cats") updateState({ categories: [] });
    if (key === "complexity") updateState({ maxComplexity: 5 });
    if (key === "live") updateState({ liveOverlayOnly: false });
  };

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  const addToChart = (item: IndicatorRecord) => {
    const abbr = item.chartAbbr;
    const payload = {
      id: item.id,
      name: item.name,
      abbr: abbr || item.name,
      addedAt: Date.now(),
    };
    try {
      const raw = localStorage.getItem("clearpath_pending_indicators");
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? list.filter((x: { name?: string }) => x?.name !== payload.name) : [];
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
    try {
      localStorage.setItem("clearpath_active_tab", "StrictlyCharts");
    } catch {}
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new Event("popstate"));
    window.dispatchEvent(new CustomEvent("clearpath-set-tab", { detail: "StrictlyCharts" }));
  };

  return (
    <div className="min-h-screen bg-[#030307] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-[#00B6FF]/30 pb-16 relative w-full">
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
              <h1 className="m-0 text-base font-semibold tracking-wide truncate mt-1 text-white uppercase font-mono tracking-widest">Encyclopedia of Indicators</h1>
              <p className="m-0 mt-0.5 text-xs text-[#00FFFF]/60 truncate uppercase tracking-widest font-mono">
                {INDICATORS.length} study cards · {INDICATORS.filter(i => i.hasLiveOverlay).length} live chart overlays
              </p>
            </div>
          </div>
        </header>

        {selectedIndicator ? (
          <IndicatorArticle
            item={selectedIndicator}
            onBack={closeIndicator}
            onAdd={() => addToChart(selectedIndicator)}
          />
        ) : (
          <main className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 mt-4 items-start pb-20">
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
                    <input type="text" className="w-full bg-[#071226]/80 border border-[#00B6FF]/30 rounded-xl py-2.5 pl-10 pr-3 text-[13px] outline-none focus:border-[#00FFD1] focus:shadow-[0_0_15px_rgba(0,255,209,0.3)] transition-all text-white placeholder-[#00B6FF]/40 font-mono" placeholder="Find an indicator..." value={state.search} onChange={e => { updateState({search: e.target.value}); saveStateTime();}} />
                  </div>
                </div>

                <div className="p-3 border border-[#00B6FF]/30 border-dashed rounded-2xl bg-[#071226]/30">
                  <div className="text-xs text-[#00FFD1]/80 mb-2 px-1 font-mono tracking-widest uppercase">Category</div>
                  <div className="flex flex-col gap-2">
                    {categories.map(cat => (
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
                  <input type="checkbox" className="hidden" checked={state.liveOverlayOnly} onChange={e => { updateState({liveOverlayOnly: e.target.checked}); saveStateTime();}} />
                  <div className={`w-11 h-6 rounded-full border relative transition-all ${state.liveOverlayOnly ? "border-[#00FFD1] bg-[#00B6FF]/20 shadow-[0_0_10px_rgba(0,255,209,0.3)]" : "border-[#00B6FF]/30 bg-[#071226]"}`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all shadow-[0_0_5px_rgba(0,255,209,0.5)] ${state.liveOverlayOnly ? "left-[22px] bg-[#00FFD1]" : "left-[3px] bg-[#00B6FF]/50"}`}></div>
                  </div>
                  <span className="text-xs text-white/80 select-none font-mono tracking-widest uppercase">Live chart overlay</span>
                </label>

                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#00FFD1]/80 font-mono tracking-widest uppercase">Sort Parameters</label>
                  <select className="w-full bg-[#071226]/80 text-[#00FFD1] border border-[#00B6FF]/30 rounded-xl py-2.5 px-3 text-[12px] font-mono tracking-widest uppercase outline-none focus:border-[#00FFD1] focus:shadow-[0_0_15px_rgba(0,255,209,0.3)] transition-all appearance-none" value={state.sort} onChange={e => { updateState({sort: e.target.value}); saveStateTime();}}>
                      <option value="nameAsc" className="bg-[#071226]">Name - A to Z</option>
                      <option value="liveFirst" className="bg-[#071226]">Live overlays first</option>
                      <option value="complexityAsc" className="bg-[#071226]">Complexity - Low to High</option>
                      <option value="complexityDesc" className="bg-[#071226]">Complexity - High to Low</option>
                  </select>
                </div>

                <button
                  onClick={() => { updateState({search: "", categories: [], maxComplexity: 5, liveOverlayOnly: false, sort: "nameAsc"}); saveStateTime(); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#FF2D95]/40 text-[#FF2D95] rounded-xl bg-[#071226]/80 hover:bg-[#FF2D95]/10 hover:shadow-[0_0_15px_rgba(255,45,149,0.3)] transition-all text-[11px] font-mono tracking-widest uppercase mt-2"
                >
                  <RotateCcw size={14}/> Reset filters
                </button>
              </div>
            </aside>

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
                  {state.liveOverlayOnly && (
                     <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#7CFF00]/40 bg-[#7CFF00]/10 text-[#7CFF00] text-[10px] text-nowrap font-mono tracking-widest shadow-[0_0_10px_rgba(124,255,0,0.2)]">
                       <span>Live overlay</span>
                       <button onClick={() => removeChip('live')}><X size={12} className="text-[#7CFF00] hover:text-white" /></button>
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
                    const permalink = `/indicators/${indicatorImageSlug(p.name)}`;
                    return (
                      <a
                        key={p.id}
                        href={permalink}
                        onClick={(e) => {
                          e.preventDefault();
                          openIndicator(p);
                        }}
                        className="relative flex flex-col border rounded-2xl overflow-hidden cursor-pointer shadow-[0_12px_26px_rgba(0,0,0,0.5)] transition-all no-underline bg-[linear-gradient(135deg,#071226_0%,#0A1C3A_35%,rgba(0,182,255,0.15)_65%,rgba(0,255,209,0.1)_100%)] border-[#00B6FF]/30 hover:-translate-y-0.5 hover:border-[#00B6FF]/70 hover:shadow-[0_0_15px_rgba(0,182,255,0.3)]"
                      >
                        <div className="h-[160px] bg-[#071226] relative overflow-hidden shrink-0 group border-b border-[#00B6FF]/30">
                           <img src={p.img} alt={`${p.name} chart illustration`} className="w-full h-full object-cover object-top transform scale-[1.01] transition-transform duration-500 group-hover:scale-105 opacity-90" loading="lazy" />
                           <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] border backdrop-blur-md font-medium tracking-widest uppercase font-mono shadow-[0_0_10px_rgba(0,0,0,0.5)] ${p.hasLiveOverlay ? "bg-[#00FFD1]/15 border-[#00FFD1]/50 text-[#00FFD1]" : "bg-[#071226]/80 border-[#00B6FF]/40 text-[#00B6FF]"}`}>
                              {p.hasLiveOverlay ? <Activity size={12} /> : <BookOpen size={12} />}
                              {p.hasLiveOverlay ? `Live ${p.chartAbbr}` : "Study card"}
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
                      </a>
                    )
                  })}
                </div>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

function IndicatorArticle({
  item,
  onBack,
  onAdd,
}: {
  item: IndicatorRecord;
  onBack: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="mt-4 border border-[#00B6FF]/30 rounded-2xl bg-[#071226]/80 overflow-hidden shadow-[0_0_30px_rgba(0,182,255,0.12)]">
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[240px] border-b xl:border-b-0 xl:border-r border-[#00B6FF]/20 bg-[#040814]">
          <img src={item.img} alt={`${item.name} chart illustration`} className="w-full h-full object-cover object-top min-h-[240px] max-h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071226] via-transparent to-transparent pointer-events-none" />
        </div>
        <div className="p-6 flex flex-col gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-fit flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00B6FF] hover:text-[#00FFD1]"
          >
            <ChevronLeft size={14} /> All indicators
          </button>
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] text-[#00FFD1] border border-[#00FFD1]/30 bg-[#00FFD1]/10 px-2.5 py-1 rounded-sm tracking-widest uppercase font-mono">{item.category}</span>
              {item.hasLiveOverlay && (
                <span className="text-[10px] text-[#00B6FF] border border-[#00B6FF]/30 bg-[#00B6FF]/10 px-2.5 py-1 rounded-sm tracking-widest uppercase font-mono">Live overlay {item.chartAbbr}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{item.name}</h2>
            <p className="text-sm text-[#00B6FF]/80 leading-relaxed mt-3">{item.description}</p>
          </div>
          <div className="flex items-center gap-1 text-[#00B6FF]">
            <span className="text-[9px] uppercase text-[#00B6FF]/70 mr-1 font-mono tracking-widest">Complexity</span>
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`w-1.5 h-3 rounded-[1px] ${item.complexity >= i ? "bg-[#00B6FF] shadow-[0_0_5px_rgba(0,182,255,0.6)]" : "bg-[#00B6FF]/20"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-t border-[#00B6FF]/20">
        <GuideBlock icon={<Calculator size={14} />} title="Formula" body={item.guide.formula} accent="#00FFD1" />
        <GuideBlock icon={<BookOpen size={14} />} title="How to read" body={item.guide.howToRead} accent="#00B6FF" />
        <GuideBlock icon={<AlertTriangle size={14} />} title="Limitations" body={item.guide.limitations} accent="#FF2D95" />
        <GuideBlock icon={<Sliders size={14} />} title="Typical settings" body={item.guide.typicalSettings} accent="#D946EF" />
      </div>

      <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="flex-1 bg-[#00B6FF] hover:bg-[#00FFD1] hover:text-[#071226] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-[13px] uppercase font-mono tracking-widest shadow-[0_0_20px_rgba(0,182,255,0.4)]"
        >
          {item.chartAbbr ? `Add ${item.chartAbbr} to Charts` : "Save to indicator list"} <ArrowRight size={16} />
        </button>
        <p className="sm:hidden text-[10px] text-[#00B6FF]/60 font-mono text-center tracking-wide">
          Educational labeling only — not a broker signal.
        </p>
      </div>
      <p className="hidden sm:block px-6 pb-6 -mt-3 text-[10px] text-[#00B6FF]/60 font-mono tracking-wide">
        {item.chartAbbr
          ? `Adds the live ${item.chartAbbr} overlay on Charts when that math exists in the indicator bank. Study card, not financial advice.`
          : "Saved to your study list. Open Charts to apply related live overlays when they exist."}
      </p>
    </article>
  );
}

function GuideBlock({
  icon,
  title,
  body,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="bg-[#071226]/60 rounded-xl p-4 border border-[#00B6FF]/20 shadow-[inset_0_0_15px_rgba(0,182,255,0.05)]">
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 font-mono flex items-center gap-2" style={{ color: accent }}>
        {icon} {title}
      </h3>
      <p className="text-[12px] text-white/75 leading-relaxed font-mono">{body}</p>
    </div>
  );
}
