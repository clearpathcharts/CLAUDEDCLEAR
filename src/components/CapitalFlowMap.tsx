import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, TrendingUp, TrendingDown, Clock, Maximize2 } from 'lucide-react';
import { FlowState, buildFlowState, updateFlow, normalizeFlow } from '../lib/trading/capitalFlowEngine';
import { LowLatencyStream } from '../lib/trading/lowLatencyStream';
import { usePageAutoUpdate } from '../hooks/usePageAutoUpdate';

const stream = new LowLatencyStream();

export default function CapitalFlowMap() {
  const [flow, setFlow] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    const flowState = buildFlowState();
    
    stream.subscribe((ticks) => {
      ticks.forEach(t => updateFlow(flowState, t));
      setFlow(normalizeFlow(flowState));
      setLastUpdate(Date.now());
    });
  }, []);

  // Demo ingest loop (local synthetic ticks — paused while tab hidden)
  usePageAutoUpdate(() => {
    const symbols = ["AAPL", "MSFT", "EUR/USD", "BTC", "DAX", "USD/JPY"];
    const s = symbols[Math.floor(Math.random() * symbols.length)];
    stream.ingest({
      symbol: s,
      price: 100 + Math.random() * 20,
      volume: Math.random() * 1000
    });
  }, { intervalMs: 200 });

  return (
    <div className="p-8 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Capital Flow Map</h2>
            <p className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-[0.3em]">Regional Intensity v2.1</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
           <div className="w-2 h-2 rounded-full bg-cyan-400 " />
           <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Live Aggregation</span>
        </div>
      </div>

      {/* EXPLANATORY HEADER DECK */}
      <div className="mb-8 p-6 bg-zinc-950/80 border border-cyan-500/20 rounded-[1.5rem] text-left select-none shadow-[0_0_20px_rgba(0,255,255,0.03)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#00FFFF] mb-2 font-cinzel">
          💡 UNDERSTANDING GEOGRAPHIC CAPITAL FLOWS (REGIONAL NODES)
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
          This system tracks and maps the live transaction velocity of cross-border capital inflows and outflows across four master geo-economic hubs: the Americas (<strong className="text-emerald-400">US Node</strong>), Europe (<strong className="text-purple-400">EU Node</strong>), Japan/Asia-Pacific (<strong className="text-[#00FFFF]">JP Node</strong>), and Decentralized Digital Assets (<strong className="text-orange-500">GLOBAL Node</strong>). 
        </p>
        <p className="text-[11px] text-zinc-400 leading-relaxed mt-2.5 font-normal">
          Capital is highly dynamic and constantly rotates out of weaker regional assets into higher-yielding sovereign safe havens. By watching the flow intensity of these four core regions, traders can see which geopolitical zones smart money is aggressively exiting (bearish indicators) and which ones are witnessing active institutional growth—allowing accurate macro positioning ahead of macro trend developments.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(flow).sort((a,b) => Math.abs(b[1]) - Math.abs(a[1])).map(([region, value]) => (
          <motion.div 
            key={region}
            layout
            className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group"
          >
            {/* Intensity Background */}
            <div 
              className={`absolute inset-0 opacity-10 transition-all duration-500 ${value > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
              style={{ opacity: Math.abs(value) * 0.2 }}
            />

            <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">{region} Node</div>
                  <div className={value > 0 ? 'text-green-500' : 'text-red-500'}>
                    {value > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
               </div>

               <div>
                  <div className="text-4xl font-black italic text-white mb-2 tracking-tighter">
                    {(value * 100).toFixed(1)}%
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${value > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.abs(value) * 100}%` }}
                    />
                  </div>
               </div>

               <div className="mt-6 flex items-center justify-between text-[8px] font-mono uppercase text-gray-600">
                  <span>Sentiment: {value > 0.3 ? 'Strong Inflow' : value < -0.3 ? 'Massive Exit' : 'Balanced'}</span>
                  <span>Lag: <Clock className="w-2 h-2 inline-block ml-1" /> 2ms</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
