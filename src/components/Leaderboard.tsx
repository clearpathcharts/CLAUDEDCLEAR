import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, User, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateLeaderboard } from '../services/backendService';
import { LeaderboardEntry } from '../types';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await calculateLeaderboard();
      setEntries(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Elite Rankings</h2>
            <p className="text-[10px] text-yellow-500/60 font-mono uppercase">Social Sentiment Layer v1.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <Activity className="w-3 h-3 text-green-500" />
          <span className="text-[9px] font-mono text-gray-400 uppercase">Snapshot: LIVE</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-yellow-500/20 border-t-yellow-500 animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Aggregating Sentiment...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {entries.map((entry, i) => (
            <motion.div 
              key={entry.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border transition-all ${i < 3 ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-white/5'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-600 text-white' : 'text-gray-500 font-mono'}`}>
                  {i < 3 ? <Medal className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                       Operator_{entry.uid.substring(0, 5)}
                       {i === 0 && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Verified Level 0{4-i > 0 ? 4-i : 1}</div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-white">
                  {entry.score} <span className="text-[9px] font-black uppercase text-gray-500">Points</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-widest text-green-500">
                  <TrendingUp className="w-3 h-3" />
                  +{(Math.random() * 20).toFixed(1)}%
                </div>
              </div>
            </motion.div>
          ))}
          {entries.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-10">
              <User className="w-12 h-12 mb-4" />
              <p className="text-xs font-mono uppercase tracking-widest leading-relaxed">
                No active operators found.<br/>Be the first to establish status.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Weekly Volume</div>
            <div className="text-lg font-black italic tracking-tighter text-white">1.2M UNIT</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
             <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Market Sentiment</div>
             <div className="text-lg font-black italic tracking-tighter text-white">BULLISH 72%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
