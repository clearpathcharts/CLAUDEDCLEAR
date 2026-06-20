import React, { useState } from 'react';
import { BookOpen, Flame, Heart, Sparkles, Star, ChevronRight, Bookmark, ArrowRight, Share2, Volume2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MagazineArticle {
  title: string;
  magazine: string;
  image: string;
  summary: string;
  readTime: string;
  category: string;
}

export default function MagazineHub() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [aiSummaryTopic, setAiSummaryTopic] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string>('');

  const tabs = [
    { id: 'all', label: 'ALL EDITIONS' },
    { id: 'men', label: 'MEN / LIFESTYLE' },
    { id: 'women', label: 'WOMEN / FASHION' },
    { id: 'children', label: 'CHILDREN & FAMILY' },
    { id: 'sports', label: 'SPORTS & RACING' },
    { id: 'luxury', label: 'LUXURY GOODS' },
    { id: 'automotive', label: 'AUTOMOTIVE' },
    { id: 'tech', label: 'AI & TECH' },
    { id: 'finance', label: 'PRIVATE FINANCE' },
    { id: 'culture', label: 'CULTURE & MUSIC' },
    { id: 'travel', label: 'TRAVEL DECK' },
    { id: 'gaming', label: 'RETRO GAMING' }
  ];

  const editorialCovers: MagazineArticle[] = [
    {
      title: "The Silent Rise of Neo-Swiss Horological Engineering",
      magazine: "GQ Magazine",
      image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
      summary: "How ultra-luxury bespoke watch platforms are bypassing standard retail outlets to supply private investors with secure asset reserves.",
      readTime: "7 min read",
      category: "luxury"
    },
    {
      title: "Quantum Threads: Post-Silicon Material Construction in Atelier Design",
      magazine: "Vogue",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
      summary: "Biomimetic fibers and solar-integrated mesh fabrics lead the charge inside Paris showrooms, defining high-performance luxury.",
      readTime: "11 min read",
      category: "women"
    },
    {
      title: "Adventures in Particle Physics for Young Inventors",
      magazine: "Scholastic Press",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
      summary: "How modern educational boards are designing high-fidelity mechanical kits to render quantum orbits accessible for children.",
      readTime: "5 min read",
      category: "children"
    },
    {
      title: "Aerodynamic Advancements Set for Circuit de la Sarthe Debuts",
      magazine: "MotorTrend",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
      summary: "Exclusive telemetry blueprints reveal how dual-vortex downforce wings optimize thermal exhaust indices on standard race engines.",
      readTime: "9 min read",
      category: "automotive"
    },
    {
      title: "Generative Neuromorphic Hardware Departs Lab Laboratories For Cloud Nodes",
      magazine: "WIRED",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      summary: "Sub-nanosecond synapse simulation boards enter bulk manufacture phases, promising unprecedented power efficiency coefficients.",
      readTime: "8 min read",
      category: "tech"
    },
    {
      title: "The Geopolitical Architecture of BRICS Sovereign Clearing Houses",
      magazine: "International Wealth Advisor",
      image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e",
      summary: "An analytical breakdown of bilateral trading desks and alternative currencies replacing international correspondent banking pathways.",
      readTime: "12 min read",
      category: "finance"
    },
    {
      title: "Neo-Brutalist Architecture Overhauls High-Density Living Sectors",
      magazine: "Architectural Digest",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      summary: "How natural concrete meshes and solar-thermal cooling cavities reduce systematic utility loads by over 45% naturally inside Geneva blocks.",
      readTime: "6 min read",
      category: "culture"
    },
    {
      title: "Deep Arctic Lodging Stations Offer Absolute Sensory Isolation",
      magazine: "Travel & Leisure",
      image: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb",
      summary: "Sub-zero geodesic structures in Longyearbyen explore high-density thermal insulation and bio-integrated oxygen pipelines.",
      readTime: "10 min read",
      category: "travel"
    },
    {
      title: "Arcade Rebirth: The Physical Hardware Restorers of Kyoto",
      magazine: "Edge Magazine",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f",
      summary: "A behind-the-scenes journey inside custom electronic workshops restoring CRT monitors and original board logic processors.",
      readTime: "7 min read",
      category: "gaming"
    }
  ];

  const getFilteredCovers = () => {
    if (activeTab === 'all') return editorialCovers;
    return editorialCovers.filter(item => item.category === activeTab);
  };

  const toggleSaveArticle = (title: string) => {
    if (savedArticles.includes(title)) {
      setSavedArticles(prev => prev.filter(t => t !== title));
    } else {
      setSavedArticles(prev => [...prev, title]);
    }
  };

  const handleSimulateAiSummary = (topic: string) => {
    setAiSummaryTopic(topic);
    setIsGeneratingSummary(true);
    setGeneratedSummary('');
    
    setTimeout(() => {
      setGeneratedSummary(
        `⚡ [CPMS AI SYNAPSE SUMMARY] ON "${topic.toUpperCase()}"\n\n` +
        `Aggregating vectors across Vogue, GQ, WIRED, and Bloomberg editorial reserves. We identify a structural synthesis: Luxury markets are increasingly adopting material tech parameters, while high-end horological houses integrate decentralized ledger verification tokens to counteract counterfeiting grids.\n\n` +
        `● Macro Impact: Consumer rotation prioritizes durable hard assets.\n` +
        `● Material Shift: Quantum carbon fibers reduce casing weight by 35%.\n` +
        `● Conclusion: High correlation coefficient between mechanical craftsmanship and private financial index hedging.`
      );
      setIsGeneratingSummary(false);
    }, 1600);
  };

  return (
    <div id="magazine-hub-portal-div" className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 shadow-[0_12px_45px_rgba(0,0,0,0.85)] relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute right-10 bottom-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full" />
      <div className="absolute left-10 top-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full" />

      {/* Hero Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] bg-[#39ff14]/10 w-fit px-3 py-1 rounded-full font-black">
            <BookOpen className="w-3 h-3 text-[#39ff14]" />
            <span>EDITORIAL MAGAZINE ARCHIVE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black font-serif italic text-white tracking-tight">
            MAGAZINE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#39ff14] to-cyan-400">HUB & DEEP EDITS</span>
          </h2>
          <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
            High-fidelity editorial discovery platform. Browse premium international publications covering men's style, luxury garments, sub-micron computing, automotive telemetry, and retro hardware restoration.
          </p>
        </div>

        {/* Counter of saved elements */}
        {savedArticles.length > 0 && (
          <div className="bg-[#39ff14]/10 border border-[#39ff14]/30 px-4.5 py-2.5 rounded-2xl flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-[#39ff14] fill-[#39ff14]" />
            <span className="text-[10px] font-mono text-white font-bold">{savedArticles.length} SAVED STORIES</span>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/5 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#39ff14] text-black shadow-[0_0_12px_rgba(57,255,20,0.55)] font-extrabold' 
                : 'text-zinc-400 hover:text-[#39ff14] hover:bg-zinc-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive AI multi-view summarizer */}
      <div className="bg-gradient-to-r from-zinc-950 to-zinc-950/60 border border-white/5 p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1 flex-1 text-left">
          <span className="text-[9px] font-mono text-[#39ff14] bg-[#39ff14]/5 px-2 py-0.5 rounded uppercase font-black">AI RECONCILIATION ENGINE</span>
          <h4 className="text-sm font-sans font-extrabold text-white">Synthesize Multiple Editorial Viewpoints</h4>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Synthesize intersecting trends from WIRED, GQ, and the Financial Times into a comprehensive macro-trend dashboard instantly.
          </p>
        </div>
        <button
          onClick={() => handleSimulateAiSummary(activeTab === 'all' ? 'Luxury Horology & AI Synapses' : activeTab)}
          disabled={isGeneratingSummary}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-[#39ff14] border border-[#39ff14]/30 rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-[0_0_10px_rgba(57,255,20,0.1)]"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>{isGeneratingSummary ? 'COMPUTING VECTORS...' : 'SYNTHESIZE MAGAZINE AXIS'}</span>
        </button>
      </div>

      {/* AI Summary result drawer */}
      <AnimatePresence>
        {generatedSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/80 border border-[#39ff14]/20 p-5 rounded-2xl font-mono text-[11px] leading-relaxed text-left relative overflow-hidden"
          >
            <button 
              onClick={() => setGeneratedSummary('')}
              className="absolute top-3 right-3 text-[9px] text-zinc-500 hover:text-white"
            >
              [DISMISS LOGGER]
            </button>
            <pre className="whitespace-pre-wrap text-zinc-300 font-mono text-[11px] pr-8">{generatedSummary}</pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Magazine rack grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {getFilteredCovers().map((cover, idx) => {
          const isSaved = savedArticles.includes(cover.title);
          return (
            <div 
              key={idx} 
              className="bg-black/40 border border-white/5 hover:border-purple-500/20 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 p-4 text-left"
            >
              <div className="space-y-3.5">
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-zinc-900">
                  <img 
                    src={cover.image} 
                    alt={cover.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-103 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                  
                  {/* Magazine title overlay */}
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/80 border border-white/10 text-[9px] font-bold text-white font-mono rounded">
                    {cover.magazine}
                  </span>

                  {/* Bookmark CTA */}
                  <button 
                    onClick={() => toggleSaveArticle(cover.title)}
                    className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/90 border border-white/10 hover:border-[#39ff14]/30 rounded-lg text-white font-sans transition cursor-pointer"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-[#39ff14] fill-[#39ff14]' : 'text-zinc-400'}`} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                    <span>{cover.category}</span>
                    <span>•</span>
                    <span>{cover.readTime}</span>
                  </div>
                  <h4 className="text-sm font-sans font-extrabold text-white leading-snug group-hover:text-[#39ff14] transition-colors">
                    {cover.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    {cover.summary}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">DIGITAL RE-ROUTE</span>
                <span className="text-[#39ff14] cursor-pointer flex items-center gap-1 group-hover:translate-x-1 transition-transform" onClick={() => toggleSaveArticle(cover.title)}>
                  {isSaved ? 'Story Saved' : 'Save Cover'} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
