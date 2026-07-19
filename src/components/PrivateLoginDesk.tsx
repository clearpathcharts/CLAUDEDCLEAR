import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, Eye, EyeOff, X, Shield, ArrowRight, KeyRound } from 'lucide-react';
import {
  lookupPrivateAccount,
  loginPrivateAccount,
  registerPrivateAccount,
} from '../api/privateAuth';

type Step = 'identify' | 'login' | 'register';

interface PrivateLoginDeskProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

/**
 * Private per-member login desk.
 * Step 1: email → Step 2a: personalized login OR Step 2b: create account.
 */
export default function PrivateLoginDesk({
  open,
  onClose,
  initialMode = 'login',
}: PrivateLoginDeskProps) {
  const [step, setStep] = useState<Step>('identify');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [knownName, setKnownName] = useState('');

  const reset = () => {
    setStep('identify');
    setEmail('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setBusy(false);
    setKnownName('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await lookupPrivateAccount(email);
      const normalized = email.trim().toLowerCase();
      if (result.exists) {
        setKnownName('Member');
        setEmail(normalized);
        setStep('login');
      } else {
        setEmail(normalized);
        setStep('register');
      }
    } catch (err: any) {
      setError(err.message || 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await loginPrivateAccount({ email, password });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await registerPrivateAccount({ email, password, displayName });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Could not create private account.');
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-[#00E5FF]/25 bg-[#050508] shadow-[0_0_60px_rgba(0,229,255,0.12)] overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#00E5FF]/10 via-transparent to-[#FF1493]/10 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30">
                <Shield size={18} className="text-[#00E5FF]" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#00E5FF]">
                  Private Member Desk
                </p>
                <h2
                  className="text-lg font-black text-white tracking-tight mt-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {step === 'login'
                    ? `Welcome back, ${knownName}`
                    : step === 'register'
                      ? 'Create your private account'
                      : 'Enter your private login'}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Each ClearPath member has a private login screen. Your workspace stays yours.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              aria-label="Close private login"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {step === 'identify' && (
              <form onSubmit={handleIdentify} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Account email
                  </span>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00E5FF]/70" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full bg-black border border-white/10 focus:border-[#00E5FF]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {busy ? 'Checking…' : 'Continue'}
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            {step === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-[#00E5FF] font-black text-sm">
                    {(knownName || 'M').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{knownName}</p>
                    <p className="text-[11px] font-mono text-zinc-500">{email}</p>
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Private password
                  </span>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF1493]/80" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl pl-10 pr-12 py-3 text-sm text-white outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock size={14} />
                  {busy ? 'Unlocking…' : 'Enter my private terminal'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('identify');
                    setPassword('');
                    setError('');
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Use a different email
                </button>
              </form>
            )}

            {step === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  No account yet for <span className="text-[#00E5FF] font-mono">{email}</span>.
                  Create your private ClearPath login — only you can open this desk.
                </p>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Display name
                  </span>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B026FF]" />
                    <input
                      type="text"
                      required
                      autoFocus
                      minLength={2}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-black border border-white/10 focus:border-[#B026FF]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Create password (min 8)
                  </span>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF1493]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl pl-10 pr-12 py-3 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Confirm password
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? 'Creating desk…' : 'Create private account & enter'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('identify');
                    setPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Back
                </button>
              </form>
            )}

            {error && (
              <p className="text-[11px] text-[#FF5277] bg-[#FF5277]/10 border border-[#FF5277]/25 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
