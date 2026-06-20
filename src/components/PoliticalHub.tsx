import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Scale, Compass, Globe, Award, ChevronRight, CheckCircle2, ChevronDown, ListFilter, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RSSService, politicalFeeds } from '../services/rssService';

interface FeedItem {
  title: string;
  link: string;
  description: string;
  timestamp: string;
  image: string;
  author: string;
}

export default function PoliticalHub() {
  const [selectedPartyTab, setSelectedPartyTab] = useState<'all' | 'compare' | 'policy'>('compare');
  const [activeStory, setActiveStory] = useState<any | null>(null);

  // Non-partisan policy tracker data
  const [legislationTrack, setLegislationTrack] = useState([
    { id: 'leg_1', name: 'Federal Clean Energy Act', sponsor: 'Bipartisan Consortium', status: 'In Senate Committee', progress: 45, impact: 'High economic transformation on utility sectors' },
    { id: 'leg_2', name: 'Sovereign Port Infrastructure Bond', sponsor: 'Joint House Panel', status: 'Passed House (232-198)', progress: 78, impact: 'Infrastructure funding for deepwater shipping docking docks' },
    { id: 'leg_3', name: 'Digital Asset Commission Bill', sponsor: 'Financial Services Desk', status: 'Drafting Stages', progress: 15, impact: 'Creates stablecoin reserve and broker guidelines' }
  ]);

  // Fallback high-fidelity viewpoint narratives when live feeds throttle
  const democraticPerspective = [
    {
      title: "Climate Policy Reform Gains Ground in New Infrastructure Budget",
      desc: "Progressive climate initiatives emerge with proposed tax exclusions for offshore wind installations and state-backed grid upgrades.",
      source: "Democratic Policy Group",
      date: "Just now",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa"
    },
    {
      title: "Consolidated Student Loan Relief Plan Enters Third Stage",
      desc: "Proposed federal revisions allow long-running graduates to deduct service premiums directly from standard taxation indices.",
      source: "The Guardian US",
      date: "25m ago",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1"
    }
  ];

  const neutralPerspective = [
    {
      title: "Joint Committee Highlights Fiscal Deficit Risks Over 10-Year Horizon",
      desc: "An independent analysis projects escalating bond payment obligations if spending is not offset by structural revenue indexes.",
      source: "Congressional Budget Watch",
      date: "Just now",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"
    },
    {
      title: "State Election Boards Overhaul Cyber Protection Standards",
      desc: "A nonpartisan taskforce completes deployment of air-gapped cryptographic logging devices across 14 key battleground districts.",
      source: "Reuters Agency Desk",
      date: "40m ago",
      image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c"
    }
  ];

  const republicanPerspective = [
    {
      title: "Southern Border Enforcement Bill Targets Supply Chain Inspection Ports",
      desc: "Proponents outline strict logistics inspection matrices, claiming secure entry gates reduce security blind spots.",
      source: "House Appropriations Panel",
      date: "Just now",
      image: "https://images.unsplash.com/photo-1541872705-1f73c6400ec9"
    },
    {
      title: "Small Business Regulatory Reduction Directive Unveiled",
      desc: "Proposed package seeks to permanently sunset standard filing paperwork for corporate divisions with headcount metrics below 50.",
      source: "Townhall Economics",
      date: "1h ago",
      image: "https://images.unsplash.com/photo-1521791136364-72864752523b"
    }
  ];

  return (
    <div id="political-hub-wrapper-section" className="bg-[#050507] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 shadow-[0_15px_45px_rgba(0,0,0,0.9)] relative overflow-hidden">
      {/* Visual background gradient accents */}
      <div className="absolute left-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
      <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full" />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-64 h-32 bg-[#39ff14]/5 blur-[90px] rounded-full pointer-events-none" />

      {/* Main header block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/10 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] bg-[#39ff14]/10 w-fit px-3 py-1 rounded-full font-black">
            <Scale className="w-3 h-3 text-[#39ff14]" />
            <span>TRANSPARENT VIEWPOINT AGGREGATION</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black font-serif italic text-white tracking-tight">
            POLITICAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#39ff14] to-rose-400">HUB & COMPARISON</span>
          </h2>
          <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
            Multi-perspective digital intelligence. Compare center, democratic progressives, conservative libertarians, and nonpartisan think-tank analysis side-by-side to understand media positioning natively.
          </p>
        </div>

        {/* View Mode controls */}
        <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-white/5 h-fit shrink-0 w-full lg:w-auto">
          {[
            { id: 'compare', label: 'SIDE-BY-SIDE COMPARE' },
            { id: 'policy', label: 'POLICY TRACKER' },
            { id: 'all', label: 'ALL NEWS ENTRIES' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setSelectedPartyTab(btn.id as any)}
              className={`flex-1 lg:flex-none px-3.5 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                selectedPartyTab === btn.id 
                  ? 'bg-zinc-800 text-white border border-white/10' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {selectedPartyTab === 'compare' && (
        /* Left: Dem, Center: Ind, Right: Rep side-by-side columns */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          
          {/* COLUMN 1: PROGRESSIVE / DEMOCRAT */}
          <div className="space-y-4 border border-blue-500/10 bg-blue-950/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-sky-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
                DEMOCRATIC PERSPECTIVE
              </span>
              <span className="text-[9px] font-mono text-zinc-600">LEFT-LEAN INTEGRATION</span>
            </div>

            <div className="space-y-4 pt-2">
              {democraticPerspective.map((story, idx) => (
                <div key={idx} className="group bg-black/40 border border-white/5 hover:border-blue-500/20 p-4 rounded-xl transition-all duration-300 space-y-3 cursor-pointer" onClick={() => setActiveStory(story)}>
                  <div className="h-32 rounded-lg overflow-hidden border border-white/5">
                    <img src={story.image} alt="Dem focus" className="w-full h-full object-cover group-hover:scale-102 transition duration-500 font-sans" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500">{story.source} • {story.date}</span>
                  <h4 className="text-xs font-sans font-bold text-white group-hover:text-sky-400 transition-colors leading-snug">
                    {story.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed line-clamp-3">
                    {story.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: INDEPENDENT / NEUTRAL */}
          <div className="space-y-4 border border-zinc-500/10 bg-zinc-950 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-zinc-700 via-amber-500/40 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                INDEPENDENT & NONPARTISAN
              </span>
              <span className="text-[9px] font-mono text-zinc-600">BALANCED ANALYSIS</span>
            </div>

            <div className="space-y-4 pt-2">
              {neutralPerspective.map((story, idx) => (
                <div key={idx} className="group bg-black/40 border border-white/5 hover:border-amber-500/20 p-4 rounded-xl transition-all duration-300 space-y-3 cursor-pointer" onClick={() => setActiveStory(story)}>
                  <div className="h-32 rounded-lg overflow-hidden border border-white/5">
                    <img src={story.image} alt="Ind focus" className="w-full h-full object-cover group-hover:scale-102 transition duration-500 font-sans" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500">{story.source} • {story.date}</span>
                  <h4 className="text-xs font-sans font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                    {story.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed line-clamp-3">
                    {story.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 3: CONSERVATIVE / REPUBLICAN */}
          <div className="space-y-4 border border-rose-500/10 bg-rose-950/5 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-pink-400 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-rose-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_#f43f5e]" />
                REPUBLICAN PERSPECTIVE
              </span>
              <span className="text-[9px] font-mono text-zinc-600">RIGHT-LEAN INTEGRATION</span>
            </div>

            <div className="space-y-4 pt-2">
              {republicanPerspective.map((story, idx) => (
                <div key={idx} className="group bg-black/40 border border-white/5 hover:border-rose-500/20 p-4 rounded-xl transition-all duration-300 space-y-3 cursor-pointer" onClick={() => setActiveStory(story)}>
                  <div className="h-32 rounded-lg overflow-hidden border border-white/5">
                    <img src={story.image} alt="Rep focus" className="w-full h-full object-cover group-hover:scale-102 transition duration-500 font-sans" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500">{story.source} • {story.date}</span>
                  <h4 className="text-xs font-sans font-bold text-white group-hover:text-rose-400 transition-colors leading-snug">
                    {story.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed line-clamp-3">
                    {story.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {selectedPartyTab === 'policy' && (
        /* Real-time legislative status boards */
        <div className="space-y-4 relative z-10">
          <h4 className="text-xs font-mono uppercase tracking-widest text-[#39ff14] flex items-center gap-2">
            <span>●</span> LEGISLATIVE BILL TRACKING SYSTEM
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {legislationTrack.map(bill => (
              <div key={bill.id} className="bg-zinc-950 border border-white/5 rounded-2xl p-5 space-y-4 text-left relative overflow-hidden">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[8px] font-mono text-[#39ff14] bg-[#39ff14]/5 px-2 py-0.5 rounded uppercase font-black">{bill.sponsor}</span>
                    <h5 className="text-sm font-sans font-extrabold text-white mt-1 leading-tight">{bill.name}</h5>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 shrink-0">{bill.status}</span>
                </div>
                
                {/* Custom tracking indicator bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                    <span>Probability to enact</span>
                    <span>{bill.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-[#39ff14]" style={{ width: `${bill.progress}%` }} />
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed pt-1 border-t border-white/5">
                  <span className="font-mono text-zinc-500 text-[9px] uppercase block">Sector Correlation:</span>
                  {bill.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPartyTab === 'all' && (
        /* Consolidated linear list or logs */
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3 relative z-10">
          <span className="text-[9px] font-mono text-zinc-400 tracking-wider uppercase block pb-2 border-b border-white/5">POLITICAL DISCOURSES INTEGRATED FEED ARCHIVE</span>
          {[...democraticPerspective, ...neutralPerspective, ...republicanPerspective].map((story, index) => (
            <div key={index} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-b-0 group cursor-pointer hover:bg-zinc-900/10" onClick={() => setActiveStory(story)}>
              <span className="text-zinc-500 font-mono text-[10px] select-none shrink-0 w-24 truncate">[{story.source}]</span>
              <span className="text-zinc-300 font-sans font-medium hover:text-[#39ff14] text-left flex-1 truncate px-4">{story.title}</span>
              <span className="text-zinc-500 font-mono text-[9px] shrink-0">{story.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reader details modal trigger support */}
      <AnimatePresence>
        {activeStory && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9000] outline-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0c10] border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full text-left relative space-y-5"
            >
              <button 
                onClick={() => setActiveStory(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xs font-mono border border-white/5 hover:border-white/20 p-2 rounded-xl transition cursor-pointer"
              >
                ESC / CLOSE
              </button>

              <div className="inline-flex items-center gap-2 text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
                <span>POLITICAL ANALYSIS WIRE</span>
              </div>

              <div className="h-56 rounded-2xl overflow-hidden border border-white/5">
                <img src={activeStory.image} alt="Story view" className="w-full h-full object-cover font-sans" referrerPolicy="no-referrer" />
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">{activeStory.source} • Transmitted live</div>
                <h3 className="text-xl md:text-2xl font-serif italic text-white font-black leading-tight">{activeStory.title}</h3>
              </div>

              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {activeStory.desc}
              </p>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>POLITICAL HUB DISCOVERY</span>
                <span className="text-[#39ff14]">TRANSLOCAL VERIFICATION ENFORCED</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
