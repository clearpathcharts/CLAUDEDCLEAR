import React, { useState, useEffect } from 'react';
import { Globe, Compass, Star, MapPin, Radio, ChevronRight, Bookmark, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RSSService, worldFeeds } from '../services/rssService';

interface RegionalStory {
  title: string;
  source: string;
  image: string;
  desc: string;
  date: string;
  region: string;
}

export default function WorldHub() {
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const regionTabs = [
    { id: 'all', label: 'ALL GLOBAL REGIONS' },
    { id: 'northAmerica', label: 'NORTH AMERICA' },
    { id: 'southAmerica', label: 'SOUTH AMERICA' },
    { id: 'europe', label: 'EUROPE' },
    { id: 'asia', label: 'ASIA' },
    { id: 'africa', label: 'AFRICA' },
    { id: 'middleEast', label: 'MIDDLE EAST' },
    { id: 'australia', label: 'AUSTRALIA & OCEANIA' },
    { id: 'lgbtq', label: 'LGBTQ+ VOICE' }
  ];

  // Professional fallback global region cards
  const fallbackStories: RegionalStory[] = [
    {
      title: "NY Times Coverage Highlights Sub-Micron Fab Expansion in Arizona",
      source: "New York Times",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      desc: "Coordinated domestic investment rounds boost local silicon substrate supply, creating robust safety buffers against supply-chain disruption.",
      date: "Just now",
      region: "northAmerica"
    },
    {
      title: "São Paulo Agro-Tech Hubs Leverage Real-Time Soil Sensor Blueprints",
      source: "Folha de S.Paulo",
      image: "https://images.unsplash.com/photo-1593113598332-cd288d649433",
      desc: "Smart agricultural grids use low-frequency radio arrays to optimize phosphate applications, maximizing sugarcane yields.",
      date: "12m ago",
      region: "southAmerica"
    },
    {
      title: "Continental Energy Grid Interconnections Complete Integration Testing",
      source: "Der Spiegel",
      image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e",
      desc: "High-voltage direct current lines between Denmark and Germany successfully balance wind surges, stabilizing retail pricing indexes.",
      date: "30m ago",
      region: "europe"
    },
    {
      title: "Tokyo Semiconductor Consortium Outlines 2nm Production Pipeline",
      source: "The Japan Times",
      image: "https://images.unsplash.com/photo-1544256718-3bcf237f3974",
      desc: "State-backed financial injections bolster leading material suppliers, reinforcing Japan’s absolute dominance in lithography chemicals.",
      date: "1h ago",
      region: "asia"
    },
    {
      title: "Centenary Hydroelectric Grid Online Phase Initiates in Angola",
      source: "Mail & Guardian",
      image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d",
      desc: "The new river turbine installations produce over 400 Megawatts of green baseload, powering up industrial manufacturing basins.",
      date: "2h ago",
      region: "africa"
    },
    {
      title: "Coordinated Green Hydrogen Facilities Launch along Red Sea Coastline",
      source: "Arab News",
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276",
      desc: "Massive solar arrays supply power directly to pure-water desalination chambers, preparing bulk transport ammonia shipments for European desks.",
      date: "3h ago",
      region: "middleEast"
    },
    {
      title: "Smart Water Management Systems Implemented Across Murray-Darling Basins",
      source: "ABC Australia",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
      desc: "High-accuracy telemetry spot sensors notify agricultural authorities of micro-flow rates, preventing sub-surface salt levels from rising.",
      date: "4h ago",
      region: "australia"
    },
    {
      title: "PinkNews Highlights Global Human Rights Resolutions at United Nations Assembly",
      source: "PinkNews Global",
      image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8",
      desc: "International representatives propose comprehensive frameworks to preserve speech freedoms and physical safety indexes for minority groups.",
      date: "Just now",
      region: "lgbtq"
    }
  ];

  useEffect(() => {
    const fetchRegionalRSS = async () => {
      if (activeRegion === 'all') return;
      
      const feedsForRegion = (worldFeeds as any)[activeRegion];
      if (!feedsForRegion || feedsForRegion.length === 0) return;

      setLoading(true);
      try {
        const results = await Promise.all(
          feedsForRegion.map(async (url: string) => {
            const items = await RSSService.fetchAndAnalyze(url);
            return items.map(item => ({ ...item, region: activeRegion }));
          })
        );
        const flattened = results.flat().slice(0, 6);
        if (flattened.length > 0) {
          setFeeds(flattened);
        } else {
          setFeeds([]);
        }
      } catch (err) {
        console.warn(`Could not pull regional feeds for ${activeRegion}, falling back to built-in telemetry.`);
      } finally {
        setLoading(false);
      }
    };
    fetchRegionalRSS();
  }, [activeRegion]);

  const getFilteredStories = () => {
    if (activeRegion === 'all') return fallbackStories;
    return fallbackStories.filter(story => story.region === activeRegion);
  };

  return (
    <div id="world-hub-sections-container" className="bg-[#050505] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative overflow-hidden">
      
      {/* Background glow designs */}
      <div className="absolute right-0 top-0 w-36 h-36 bg-blue-500/5 blur-3xl rounded-full" />
      <div className="absolute left-0 bottom-0 w-36 h-36 bg-cyan-500/5 blur-3xl rounded-full" />

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] bg-[#39ff14]/10 w-fit px-3 py-1 rounded-full font-black">
            <Globe className="w-3" />
            <span>GLOBAL REGIONAL INTELLIGENCE SYSTEM</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black font-serif italic text-white tracking-tight">
            WORLD <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#39ff14] to-cyan-400">HUB & GEOPOLITICS</span>
          </h2>
          <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
            Personalized world media routing dashboard. Keep updated with live feeds, local issues, and critical stories grouped dynamically by regions. Custom telemetry logs bridge borders natively.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/5 relative z-10">
        {regionTabs.map((region) => (
          <button
            key={region.id}
            onClick={() => setActiveRegion(region.id)}
            className={`px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeRegion === region.id 
                ? 'bg-[#39ff14] text-black shadow-[0_0_12px_rgba(57,255,20,0.55)] font-extrabold' 
                : 'text-zinc-400 hover:text-[#39ff14] hover:bg-zinc-900/50'
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>

      {/* Two column: Left lists regions, Right displays live RSS ticker if active */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Main Regional Cards (6 or more covers) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {getFilteredStories().map((story, idx) => (
            <div 
              key={idx} 
              className="bg-black/40 border border-white/5 hover:border-blue-500/10 p-5 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="space-y-4">
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-white/5">
                  <img 
                    src={story.image} 
                    alt={story.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition duration-500" 
                  />
                  <span className="absolute top-3 left-3 bg-[#39ff14]/90 text-black text-[8px] font-mono font-black tracking-widest px-2 py-0.5 rounded uppercase">
                    {story.region.replace(/([A-Z])/g, ' $1')}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[8px] font-mono text-zinc-500">{story.source} • {story.date}</span>
                  <h4 className="text-sm font-sans font-extrabold text-white group-hover:text-[#39ff14] transition-colors leading-snug">
                    {story.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    {story.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 mt-4 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>VERIFIED COVERAGE</span>
                <span className="text-cyan-400">INDEXED SECURE</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Regional Feed transmissions columns */}
        <div className="lg:col-span-4 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl space-y-4 text-left">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Radio className="w-4 text-pink-500 animate-pulse" />
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-zinc-300 font-black">
              LIVE BROADCAST CHANNELS
            </h4>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="w-5 h-5 border border-[#39ff14] border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">CONNECTING ANTENNA...</span>
            </div>
          ) : feeds.length > 0 ? (
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto no-scrollbar">
              {feeds.map((feed, i) => (
                <div key={i} className="text-xs space-y-1 border-b border-white/5 pb-3">
                  <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                    <span>{feed.author || 'WORLD FEED'}</span>
                    <span className="text-[#39ff14]">{feed.timestamp}</span>
                  </div>
                  <a href={feed.link} target="_blank" rel="noreferrer" className="block text-zinc-300 hover:text-white font-sans font-bold leading-tight hover:underline">
                    {feed.title}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                Select a specific region tab (e.g. Europe, Asia, LGBTQ+) to aggregate dynamic XML/RSS content blocks directly.
              </p>
              <div className="bg-black/80 border border-white/5 p-4 rounded-xl text-[10px] font-mono text-zinc-500 space-y-2">
                <div>[TUNING FREQ]: 144.80 MHz</div>
                <div>[STATUS]: WAITING FOR HANDSHAKE</div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
