import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Terminal, 
  Database, 
  Globe, 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Cpu, 
  Zap,
  Activity,
  Layers,
  Power
} from 'lucide-react';

interface BoardMember {
  id: number;
  name: string;
  position: string;
  image: string;
}

export default function BoardMemberPortal({ member, onClose }: { member: BoardMember; onClose: () => void }) {
  const [activeModule, setActiveModule] = useState('Overview');

  // Variations based on member Role
  const isRick = member.name.includes('Rick');
  const isBrent = member.name.includes('Brent');

  const modules = [
    { id: 'Overview', icon: Terminal, label: 'COMMAND' },
    { id: 'Analytics', icon: Activity, label: 'TELEMETRY' },
    { id: 'Nodes', icon: Cpu, label: 'INFRA' },
    { id: 'Social', icon: Users, label: 'ALLIANCES' },
  ];

  return (
    <div className="fixed inset-0 z-[250] bg-[#020202] text-white flex flex-col font-sans">
      {/* Market Top Bar */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
              {member.image ? (
                <img src={member.image} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={member.name} />
              ) : (
                <div className="w-full h-full bg-[#111] flex items-center justify-center">
                  <span className="text-white/30 text-xs font-bold">{member.name.substring(0,2).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-widest text-sm italic">{member.name}</h2>
              <p className="text-indigo-400 font-mono text-[8px] uppercase tracking-[0.3em] font-bold">Board Portal Level 5</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          
          <nav className="hidden md:flex space-x-6">
            {modules.map(mod => (
              <button 
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeModule === mod.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-white'
                }`}
              >
                <mod.icon size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{mod.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500  shadow-[0_0_8px_#10b981]" />
            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">Encrypted Uplink</span>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all border border-rose-500/20"
          >
            <Power size={20} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="scrollbar-panel flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Market Vol" value="$25.4B" trend="+4.2%" color="indigo" />
            <StatCard label="Network Load" value="12% CAP" trend="NOMINAL" color="emerald" />
            <StatCard label="Active Nodes" value="482" trend="+3 New" color="amber" />
            <StatCard label="Security Clear" value="ALPHA" trend="VERIFIED" color="blue" />
          </div>

          {/* Main Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Panel: Primary Variation */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <Terminal size={120} className="text-indigo-500 rotate-12" />
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-2">
                  {isRick ? "Executive Master Control" : 
                   isBrent ? "Global Infrastructure Node" :
                   "Governance Audit Stream"}
                </h3>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-mono mb-8 max-w-xl">
                  {isRick ? "Full spectrum oversight of Clear Path Markets Science operations and capital distribution. System override enabled." :
                   isBrent ? "Real-time latency monitoring of market nodes. System sync status: 99.9%." :
                   "Mandatory compliance tracking and investor transparency logging. Regulation node 04."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ActionBox label="Initialize Sync" icon={Layers} />
                  <ActionBox label="Audit Protocol" icon={ShieldAlert} />
                </div>
              </div>

              {/* Data Visualization Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-black border border-white/5 rounded-3xl h-[300px] flex items-center justify-center">
                   <div className="text-center space-y-4">
                      <div className="flex justify-center"><Activity className="text-indigo-500 " size={40} /></div>
                      <span className="text-gray-600 uppercase font-mono text-[10px] tracking-[0.5em]">Market Flow Analytics</span>
                   </div>
                </div>
                <div className="bg-black border border-white/5 rounded-3xl h-[300px] flex items-center justify-center">
                   <div className="text-center space-y-4">
                      <div className="flex justify-center"><Globe className="text-emerald-500 " size={40} /></div>
                      <span className="text-gray-600 uppercase font-mono text-[10px] tracking-[0.5em]">Global Expansion Node Matrix</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Side Modules */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6">
                 <div className="flex items-center space-x-2 mb-6">
                    <TrendingUp className="text-indigo-400" size={16} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Market Dominance Index</h4>
                 </div>
                 <div className="space-y-4">
                    <ProgressNode label="Market Cap" value={82} color="indigo" />
                    <ProgressNode label="User Trust" value={95} color="emerald" />
                    <ProgressNode label="Node Stability" value={78} color="amber" />
                 </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center justify-between">
                    <span>Recent Activity</span>
                    <Zap size={12} className="text-amber-500" />
                 </h4>
                 <div className="space-y-4">
                    <ActivityLog text="Identity Verified: Rick Floyd" time="2M AGO" />
                    <ActivityLog text="System Patch 4.2.0 Deployed" time="1H AGO" />
                    <ActivityLog text="Governance Sync Complete" time="5H AGO" />
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, color }: any) {
  const colorMap: any = {
    indigo: 'text-indigo-500 border-indigo-500/20',
    emerald: 'text-emerald-500 border-emerald-500/20',
    amber: 'text-amber-500 border-amber-500/20',
    blue: 'text-blue-500 border-blue-500/20'
  };
  return (
    <div className={`bg-white/2 border ${colorMap[color]} rounded-2xl p-6 backdrop-blur-md`}>
      <div className="text-gray-500 text-[9px] uppercase font-mono tracking-widest mb-1">{label}</div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-black italic">{value}</div>
        <div className={`text-[8px] font-mono ${trend.includes('+') ? 'text-emerald-500' : 'text-gray-500'}`}>{trend}</div>
      </div>
    </div>
  );
}

function ActionBox({ label, icon: Icon }: any) {
  return (
    <button className="flex items-center space-x-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group">
      <div className="p-3 bg-white/5 rounded-xl group-hover:bg-indigo-500/20 transition-all">
        <Icon size={20} className="text-gray-400 group-hover:text-indigo-400" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{label}</span>
    </button>
  );
}

function ProgressNode({ label, value, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest text-gray-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${colors[color]}`} 
        />
      </div>
    </div>
  );
}

function ActivityLog({ text, time }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] text-gray-300 uppercase tracking-widest">{text}</span>
      <span className="text-[8px] font-mono text-gray-600">{time}</span>
    </div>
  );
}
