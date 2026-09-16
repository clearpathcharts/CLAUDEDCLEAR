import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Plus, Trash2, Zap, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';
import { useMembership } from '../hooks/useMembership';
import { formatLimit, isUnlimited } from '../lib/planCatalog';

export default function AlertsCenter() {
  const { alerts, addAlert, deleteAlert } = useAuth();
  const { limits } = useMembership();
  const [showAdd, setShowAdd] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !price) return;
    if (!isUnlimited(limits.alerts) && alerts.length >= limits.alerts) return;
    
    await addAlert({
      symbol: symbol.toUpperCase(),
      price: parseFloat(price),
      condition
    });
    
    setSymbol('');
    setPrice('');
    setShowAdd(false);
  };

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <Bell className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Alert Hub</h2>
            <p className="text-[10px] text-orange-400/60 font-mono uppercase">
              {alerts.length}/{formatLimit(limits.alerts)} on this plan
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (!isUnlimited(limits.alerts) && alerts.length >= limits.alerts) return;
            setShowAdd(true);
          }}
          disabled={!isUnlimited(limits.alerts) && alerts.length >= limits.alerts}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors disabled:opacity-30"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleSubmit} className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Configure Trigger</span>
                <button type="button" onClick={() => setShowAdd(false)}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Asset</label>
                  <input 
                    type="text" 
                    value={symbol}
                    onChange={e => setSymbol(e.target.value)}
                    placeholder="BTCUSD"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-orange-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Trigger Price</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="65000"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {(['above', 'below'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${condition === c ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-white/5 text-gray-500'}`}
                  >
                    Price {c}
                  </button>
                ))}
              </div>
              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Activate Trigger
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <Bell className="w-6 h-6 text-gray-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-400 tracking-tight">System Silent</h3>
              <p className="text-[10px] text-gray-600 font-mono uppercase">No active triggers detected in orbit.</p>
            </div>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl border transition-all ${alert.triggered ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${alert.triggered ? 'bg-orange-500 text-white' : 'bg-white/5 text-orange-400'}`}>
                    {alert.triggered ? <Zap className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white tracking-widest uppercase">{alert.symbol}</div>
                    <div className="text-[9px] text-gray-500 font-mono uppercase">
                      {alert.condition === 'above' ? 'Breaks Above' : 'Falls Below'} ${alert.price.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alert.triggered && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white ">TRIGGERED</span>
                  )}
                  <button 
                    onClick={() => deleteAlert(alert.id!)}
                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
        <CheckCircle2 className="w-4 h-4 text-orange-500" />
        <span className="text-[10px] text-orange-400/80 font-mono leading-tight">
          System ready. Alerts will transmit via system broadcast upon trigger.
        </span>
      </div>
    </div>
  );
}
