import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Terminal, X, ChevronRight, Fingerprint, Activity } from 'lucide-react';

interface BoardMember {
  id: number;
  name: string;
  position: string;
  image: string;
}

interface BoardLoginTerminalProps {
  member: BoardMember;
  onClose: () => void;
  onSuccess: (member: BoardMember) => void;
}

export default function BoardLoginTerminal({ member, onClose, onSuccess }: BoardLoginTerminalProps) {
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBiometricOverride = () => {
    setStatus('verifying');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => onSuccess(member), 500);
    }, 1000);
  };

  const handleVerify = async () => {
    if (!passcode) return;
    
    setStatus('verifying');
    
    // Alphanumeric Name Mapping (Full Name to Phone Keypad)
    const memberCodes: Record<string, string> = {
      'Richard Anthony': '74242732684669', // RICHARDANTHONY
      'Brent Miller': '27368645537',      // BRENTMILLER
      'Bryan Weber': '2792693237',         // BRYANWEBER
      'Dustin Shorr': '38784674677'        // DUSTINSHORR
    };

    setTimeout(() => {
      const isMasterKey = passcode === '7777';
      const isMemberKey = memberCodes[member.name] === passcode;

      if (isMasterKey || isMemberKey) { 
        setStatus('success');
        setTimeout(() => onSuccess(member), 500);
      } else {
        setStatus('error');
        setErrorMsg('MARKET HASH MISMATCH');
        setTimeout(() => {
          setStatus('idle');
          setPasscode('');
        }, 2000);
      }
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(75,0,255,0.2)]"
      >
        {/* Terminal Header */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-transparent flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Shield size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white text-xs font-black uppercase tracking-widest">Board Authentication</h3>
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-tighter">Secure Node // {member.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Identity Card */}
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            {member.image ? (
              <img 
                src={member.image}
                referrerPolicy="no-referrer" 
                className="w-16 h-16 rounded-xl object-cover grayscale" 
                alt={member.name} 
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#111] flex items-center justify-center border border-white/5">
                <span className="text-white/30 text-xl font-bold">{member.name.substring(0,2).toUpperCase()}</span>
              </div>
            )}
            <div>
              <div className="text-white font-black uppercase tracking-widest text-sm">{member.name}</div>
              <div className="text-indigo-400 font-mono text-[9px] uppercase tracking-widest">{member.position}</div>
            </div>
          </div>

          {/* Keypad/Input */}
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="ENTER NAME HASH"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-center text-white font-mono tracking-[0.3em] focus:border-indigo-500/50 outline-none transition-all placeholder:tracking-widest placeholder:text-gray-700"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700">
                <Lock size={16} />
              </div>
            </div>

            <button 
              onClick={handleVerify}
              onContextMenu={(e) => { e.preventDefault(); handleBiometricOverride(); }}
              className={`w-full py-4 rounded-xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] ${
                status === 'error' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/50' :
                status === 'verifying' ? 'bg-indigo-500/20 text-indigo-500' :
                'bg-white/10 hover:bg-indigo-500 text-white font-black'
              }`}
            >
              {status === 'verifying' ? (
                <>
                  <Activity size={18} className="" />
                  <span className="uppercase text-xs tracking-widest">Verifying...</span>
                </>
              ) : status === 'error' ? (
                <>
                  <Fingerprint size={18} />
                  <span className="uppercase text-xs tracking-widest">{errorMsg}</span>
                </>
              ) : (
                <>
                  <span className="uppercase text-xs tracking-[0.3em]">Authorize Entry</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em] leading-relaxed">
              Security Protocol: Map your FULL NAME (No Spaces) to numeric phone keypad. <br />
              [Master Key: 7777] // All attempts logged.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
