import React, { useMemo, useState } from 'react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import { resetPasswordWithToken, PrivateAuthClientError } from '../api/privateAuth';

export default function ResetPasswordPage() {
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('token') || '';
  }, []);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is missing its token. Request a new one from Private Login.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await resetPasswordWithToken({ token, newPassword, confirmPassword });
      setOk(true);
      window.setTimeout(() => {
        window.location.href = '/?login=1';
      }, 900);
    } catch (err: any) {
      setError(
        err instanceof PrivateAuthClientError
          ? err.message
          : String(err?.message || 'Could not reset password.')
      );
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-white relative">
      <SEO
        title="Reset Private Login password"
        description="Choose a new password for your ClearPath Trader Private Login."
      />
      <SurfBackground />
      <main className="relative z-10 max-w-md mx-auto px-4 py-16">
        <a href="/" className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF]">
          ← ClearPath Home
        </a>
        <div className="mt-6 rounded-[28px] border border-[#00E5FF]/25 bg-[#050508] p-6 shadow-[0_0_60px_rgba(0,229,255,0.12)]">
          <h1 className="font-orbitron text-xl font-bold uppercase tracking-wider">
            Choose a new password
          </h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Enter it twice, then Save. You will go back to Private Login.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                New password
              </span>
              <input
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black border border-white/10 focus:border-[#00E5FF]/50 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Re-enter new password
              </span>
              <input
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="text-[11px] text-zinc-500 hover:text-[#00E5FF]"
            >
              {show ? 'Hide passwords' : 'Show passwords'}
            </button>
            <button
              type="submit"
              disabled={busy || ok}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              {busy ? 'Saving…' : ok ? 'Opening Private Login…' : 'Save new password'}
            </button>
            {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}
            {ok && (
              <p className="text-xs text-emerald-400 font-mono">
                Password updated. Sign in with the new one.
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
