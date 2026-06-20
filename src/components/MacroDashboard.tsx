import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Globe, TrendingUp, TrendingDown, Activity, Info, BarChart3, Database } from 'lucide-react';
import { fetchYieldCurve, fetchGDP, YieldData, MacroObservation } from '../services/macroService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function MacroDashboard() {
  const [yieldData, setYieldData] = useState<YieldData[]>([]);
  const [gdpData, setGdpData] = useState<MacroObservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [yData, gData] = await Promise.all([
        fetchYieldCurve(),
        fetchGDP()
      ]);
      setYieldData(yData);
      setGdpData(gData);
      setLoading(false);
    };
    load();
  }, []);

  const isInverted = yieldData.length > 2 && yieldData[0].value > yieldData[2].value;

  return (
    <div className="p-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Globe className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white italic mb-2">Macroeconomic Dashboard</h2>
            <p className="text-lg font-black text-indigo-400 font-mono uppercase tracking-widest max-w-3xl leading-relaxed">HOW TO USE THIS: Monitor broad economic data that affects the financial markets, such as the Treasury Yield Curve, US GDP growth, and core Fed rates.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isInverted ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
            <Activity className="w-3 h-3" />
            Curve Status: {isInverted ? 'Inverted' : 'Normal'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Benchmark Treasury Yields</h3>
            <div className="flex items-center gap-4">
               {yieldData.map(d => (
                 <div key={d.maturity} className="flex flex-col items-end">
                   <span className="text-[8px] font-black uppercase text-gray-600">{d.maturity}</span>
                   <span className="text-xs font-mono font-bold text-indigo-400">{d.value}%</span>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={yieldData}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis 
                  dataKey="maturity" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#818cf8', fontSize: '10px' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorYield)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
           <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
             <div className="flex items-center gap-3 mb-4">
               <Info className="w-4 h-4 text-indigo-400" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Yield Spread (10Y-2Y)</h4>
             </div>
             <div className="text-3xl font-black italic tracking-tighter text-white">
               {(yieldData.length > 2 ? (yieldData[2].value - yieldData[0].value).toFixed(2) : '0.00')}%
             </div>
             <p className="text-[10px] text-gray-500 font-mono mt-2 uppercase">Critical recession signal indicator</p>
           </div>

           <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <BarChart3 className="w-16 h-16" />
             </div>
             <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Macro Sentiment</h4>
             <div className="text-xl font-bold text-white mb-4 italic uppercase">Contractionary Skew</div>
             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <div className="w-2/3 h-full bg-indigo-500" />
             </div>
             <div className="flex justify-between mt-2 text-[8px] font-mono uppercase text-gray-500">
               <span>Deflation</span>
               <span>Inflation</span>
             </div>
           </div>
        </div>
      </div>

      <div className="flex-1 rounded-3xl bg-black/40 border border-white/5 p-6 relative flex flex-col">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">US Real GDP Trends</h3>
            </div>
            <div className="text-[10px] font-mono text-gray-500">Latest: ${gdpData[0]?.value.toLocaleString()}B</div>
         </div>
         
         <div className="flex-1 min-h-[200px]">
           <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
             <BarChart data={gdpData.slice().reverse()}>
               <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
               <XAxis 
                 dataKey="date" 
                 stroke="#4b5563" 
                 fontSize={10} 
                 tickLine={false} 
                 axisLine={false} 
                 tickFormatter={(val) => val.split('-')[0]}
               />
               <YAxis 
                 stroke="#4b5563" 
                 fontSize={10} 
                 tickLine={false} 
                 axisLine={false} 
                 domain={['dataMin - 1000', 'auto']}
               />
               <Tooltip 
                 contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                 itemStyle={{ color: '#10b981', fontSize: '10px' }}
                 cursor={{ fill: '#ffffff05' }}
               />
               <Bar 
                 dataKey="value" 
                 fill="#10b981" 
                 radius={[4, 4, 0, 0]} 
                 opacity={0.8}
               />
             </BarChart>
           </ResponsiveContainer>
         </div>

         <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
            {[
              { label: 'Fed Funds Rate', value: '5.25 - 5.50%', status: 'Stable' },
              { label: 'Core Inflation (YoY)', value: '3.8%', status: 'Decreasing' },
              { label: 'Unemployment', value: '3.9%', status: 'Rising' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                 <span className="text-xs font-bold text-gray-400">{item.label}</span>
                 <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">{item.value}</div>
                    <div className="text-[8px] font-black uppercase text-indigo-400">{item.status}</div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
