import React, { useMemo, useState } from 'react';
import { changeOwnPassword, logoutPrivateAccount, PrivateAuthClientError } from '../../api/privateAuth';

/**
 * Logged-in password change. After a successful save the session is destroyed
 * and the browser returns to Private Login.
 */
export default function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const mismatch = useMemo(
    () => Boolean(confirmPassword) && newPassword !== confirmPassword,
    [newPassword, confirmPassword]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await changeOwnPassword({ currentPassword, newPassword, confirmPassword });
      setOk(true);
      try {
        await logoutPrivateAccount();
      } catch {
        /* session already cleared by the change-password route */
      }
      window.location.href = '/?login=1';
    } catch (err: any) {
      const msg =
        err instanceof PrivateAuthClientError
          ? err.message
          : String(err?.message || 'Could not change password.');
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 p-5 border border-white/10 rounded-[18px] bg-[#07070d]/50">
      <div className="space-y-1 mb-4">
        <h3 className="text-base font-orbitron font-bold text-white uppercase tracking-wider">
          Change your password
        </h3>
        <p className="text-xs text-[#999] leading-relaxed">
          Enter your current password, choose a new one, then re-enter it to confirm. Save signs
          you out and opens Private Login so you can sign in with the new password.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
            Current password
          </span>
          <input
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="bg-[#0f0f0f] border border-white/10 rounded-[18px] p-4 text-white text-[14px] outline-none focus:border-[#00e5ff] focus:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
            New password
          </span>
          <input
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="bg-[#0f0f0f] border border-white/10 rounded-[18px] p-4 text-white text-[14px] outline-none focus:border-[#00e5ff] focus:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
            Re-enter new password
          </span>
          <input
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="bg-[#0f0f0f] border border-white/10 rounded-[18px] p-4 text-white text-[14px] outline-none focus:border-[#00e5ff] focus:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all"
          />
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#00e5ff]"
          >
            {show ? 'Hide passwords' : 'Show passwords'}
          </button>
          <button
            type="submit"
            disabled={busy || mismatch || ok}
            className="ml-auto bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/25 px-5 py-3 rounded-[12px] text-xs font-black text-[#00e5ff] uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50"
          >
            {busy ? 'Saving…' : ok ? 'Signing you out…' : 'Save new password'}
          </button>
        </div>
        {mismatch && (
          <p className="md:col-span-2 text-xs font-mono text-rose-400">Passwords do not match yet.</p>
        )}
        {error && <p className="md:col-span-2 text-xs font-mono text-rose-400">{error}</p>}
      </form>
    </div>
  );
}
