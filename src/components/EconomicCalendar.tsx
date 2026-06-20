import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Globe, AlertTriangle, ChevronRight } from 'lucide-react';
import { fetchEconomicCalendar } from '../services/economicService';
import { EconomicEvent } from '../types';

export default function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEconomicCalendar().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]';
      case 'Medium': return 'bg-orange-500 text-white';
      case 'Low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="p-6 bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Calendar className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white italic">Calendar</h2>
            <p className="text-[10px] text-emerald-400/60 font-mono uppercase tracking-[0.2em]">Alpha Schedule v2.0</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {events.map((event, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 flex flex-col items-center">
                <span className="text-[10px] font-mono text-gray-500">{event.date.split(' ')[1]}</span>
                <div className={`mt-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${getImpactColor(event.impact)}`}>
                  {event.impact}
                </div>
              </div>

              <div className="h-10 w-[1px] bg-white/10" />

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded uppercase">{event.country}</span>
                  <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{event.event}</span>
                </div>
                <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono uppercase">
                   <span className="flex items-center gap-1.5">Act: <span className="text-white">{event.actual || '--'}</span></span>
                   <span className="flex items-center gap-1.5">For: <span className="text-gray-400">{event.forecast || '--'}</span></span>
                   <span className="flex items-center gap-1.5">Prev: <span className="text-gray-400">{event.previous || '--'}</span></span>
                </div>
              </div>
            </div>

            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
