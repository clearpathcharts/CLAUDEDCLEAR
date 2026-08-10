import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, Eye, EyeOff, X, Shield, KeyRound } from 'lucide-react';
import {
  loginPrivateAccount,
  registerPrivateAccount,
  resubmitIdentity,
  declineIdentity,
  resendIdentityConfirm,
  requestPasswordReset,
  completePasswordResetWithToken,
  PrivateAuthClientError,
} from '../api/privateAuth';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

type Step =
  | 'identify'
  | 'login'
  | 'register'
  | 'forgot'
  | 'forgot_sent'
  | 'reset_password'
  | 'real_info'
  | 'pending_email'
  | 'goodbye';

interface PrivateLoginDeskProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  /** Prefill from activation links (/activate?email=...). */
  initialEmail?: string;
  /** One-time token from password-reset email link. */
  initialResetToken?: string;
}

/**
 * Private per-member login desk.
 * Default: one screen — email + password. Register adds display name.
 * Hard-blocked fake emails still reject at register; soft quarantine no longer traps login.
 */
export default function PrivateLoginDesk({
  open,
  onClose,
  initialMode = 'login',
  initialEmail = '',
  initialResetToken = '',
}: PrivateLoginDeskProps) {
  const [step, setStep] = useState<Step>(
    initialResetToken ? 'reset_password' : initialMode === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState(initialEmail);
  const [accountEmail, setAccountEmail] = useState(initialEmail);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [knownName, setKnownName] = useState('');
  const [infoBanner, setInfoBanner] = useState('');
  const [resetToken, setResetToken] = useState(initialResetToken);
  const dialogRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    if (initialResetToken) {
      setResetToken(initialResetToken);
      setStep('reset_password');
      setInfoBanner('Choose a new password for your Private Login.');
    } else {
      setStep(initialMode === 'register' ? 'register' : 'login');
    }
    if (initialEmail) {
      setEmail(initialEmail);
      setAccountEmail(initialEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode, initialEmail, initialResetToken]);

  React.useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const identity = params.get('identity');
      const reset = params.get('reset');
      const token = String(params.get('token') || '').trim();
      if (identity === 'confirmed') {
        setInfoBanner('Identity confirmed. Sign in with your email and password.');
        setStep('login');
      } else if (identity === 'declined') {
        setStep('goodbye');
      } else if (identity === 'invalid') {
        setError('That confirmation link is invalid or expired.');
      } else if (reset === '1' && token) {
        setResetToken(token);
        setStep('reset_password');
        setInfoBanner('Choose a new password for your Private Login.');
      } else if (reset === 'expired') {
        setStep('forgot');
        setError('That reset link expired. Enter your email and we’ll send a fresh one.');
      } else if (reset === 'invalid') {
        setStep('forgot');
        setError('That reset link is invalid. Enter your email and we’ll send a fresh one.');
      }
    } catch {
      /* ignore */
    }
  }, [open]);

  const reset = () => {
    setStep(initialMode === 'register' ? 'register' : 'login');
    setEmail('');
    setAccountEmail('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setBusy(false);
    setKnownName('');
    setInfoBanner('');
    setResetToken('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useAccessibleDialog(dialogRef, {
    open,
    onClose: handleClose,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await loginPrivateAccount({ email, password });
      if (result.kind === 'declined') {
        setStep('goodbye');
        setBusy(false);
        return;
      }
      if (result.kind === 'pending_confirm') {
        setEmail(result.user.email);
        setAccountEmail(result.user.email);
        setDisplayName(result.user.displayName || '');
        setKnownName(result.user.displayName || 'Member');
        setStep('real_info');
        setInfoBanner('Please enter real information to unlock your desk.');
        setBusy(false);
        return;
      }
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
      const result = await registerPrivateAccount({ email, password, displayName });
      if (result.quarantined) {
        setEmail(result.user.email);
        setAccountEmail(result.user.email);
        setDisplayName(result.user.displayName || displayName);
        setInfoBanner(
          result.emailSent
            ? 'We sent a confirmation email. Please enter real information below, or confirm via the link.'
            : 'Please enter real information. (Confirmation email could not be sent yet — SMTP may be offline.)'
        );
        setStep('real_info');
        setBusy(false);
        return;
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Could not create private account.');
      setBusy(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await resubmitIdentity({
        currentEmail: accountEmail || email,
        password,
        newEmail: email,
        newDisplayName: displayName,
      });
      if (!result.quarantined) {
        window.location.reload();
        return;
      }
      if (result.emailSent) {
        setAccountEmail(result.user.email);
        setInfoBanner('Check your email and click the confirmation link to unlock your desk.');
        setStep('pending_email');
      } else {
        setAccountEmail(result.user.email);
        setInfoBanner('Still looks incomplete — please use a real name and a real email address.');
        setStep('real_info');
        if (result.reasons?.length) {
          setError('Please enter real information to continue.');
        }
      }
      setEmail(result.user.email);
      setDisplayName(result.user.displayName || displayName);
    } catch (err: any) {
      if (err instanceof PrivateAuthClientError && err.code === 'IDENTITY_DECLINED') {
        setStep('goodbye');
      } else {
        setError(err.message || 'Could not update information.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setError('');
    setBusy(true);
    try {
      await declineIdentity({ email: accountEmail || email, password: password || undefined });
      setStep('goodbye');
    } catch (err: any) {
      if (err instanceof PrivateAuthClientError && (err.code === 'IDENTITY_DECLINED' || err.message?.includes('Have a good one'))) {
        setStep('goodbye');
      } else {
        // Even if account missing, show goodbye for soft close
        setStep('goodbye');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setBusy(true);
    try {
      const result = await resendIdentityConfirm({ email: accountEmail || email, password });
      setInfoBanner(
        result.emailSent
          ? 'Confirmation email resent. Check your inbox.'
          : 'Could not send email (SMTP offline). Keep this window open and try again later.'
      );
    } catch (err: any) {
      if (err instanceof PrivateAuthClientError && err.code === 'IDENTITY_DECLINED') {
        setStep('goodbye');
      } else {
        setError(err.message || 'Resend failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await requestPasswordReset(email);
      setInfoBanner(
        result.emailSent
          ? result.message
          : `${result.message} If nothing arrives in a few minutes, SMTP may be offline — try again later or ask Rick.`
      );
      setStep('forgot_sent');
    } catch (err: any) {
      setError(err.message || 'Could not start password reset.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!resetToken) {
      setError('Reset link is missing. Request a new one from Forgot password.');
      setStep('forgot');
      return;
    }
    setBusy(true);
    try {
      await completePasswordResetWithToken({ token: resetToken, newPassword: password });
      window.location.href = '/';
    } catch (err: any) {
      const code = err instanceof PrivateAuthClientError ? err.code : undefined;
      if (code === 'RESET_EXPIRED' || code === 'RESET_INVALID') {
        setStep('forgot');
        setError(err.message || 'That reset link is invalid or expired. Request a new one.');
      } else {
        setError(err.message || 'Could not reset password.');
      }
      setBusy(false);
    }
  };

  if (!open) return null;

  const title =
    step === 'login'
      ? 'Private Login'
      : step === 'forgot' || step === 'forgot_sent'
        ? 'Forgot password'
        : step === 'reset_password'
          ? 'Choose a new password'
          : step === 'register'
            ? 'Create your private account'
            : step === 'real_info'
              ? 'Please enter real information'
              : step === 'pending_email'
                ? 'Confirm your identity'
                : step === 'goodbye'
                  ? 'Have a good one.'
                  : 'Private Login';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          onClick={step === 'goodbye' ? handleClose : handleClose}
          aria-hidden="true"
        />

        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="private-login-title"
          tabIndex={-1}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-[#00E5FF]/25 bg-[#050508] shadow-[0_0_60px_rgba(0,229,255,0.12)] overflow-hidden outline-none"
        >
          <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#00E5FF]/10 via-transparent to-[#FF1493]/10 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30" aria-hidden="true">
                <Shield size={18} className="text-[#00E5FF]" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#00E5FF]">
                  Private Member Desk
                </p>
                <h2
                  id="private-login-title"
                  className="text-lg font-black text-white tracking-tight mt-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {title}
                </h2>
                {step !== 'goodbye' && (
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    {step === 'login'
                      ? 'Email and password. That’s it.'
                      : step === 'forgot'
                        ? 'We’ll email a one-time reset link. No password in the email.'
                        : step === 'forgot_sent'
                          ? 'Check your inbox (and spam).'
                          : step === 'reset_password'
                            ? 'Pick something you’ll remember — at least 8 characters.'
                            : step === 'register'
                              ? 'Create your login — then you’re in.'
                              : 'Your workspace stays yours.'}
                  </p>
                )}
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
            {infoBanner && step !== 'goodbye' && (
              <p className="text-[11px] text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/25 rounded-xl px-3 py-2 leading-relaxed">
                {infoBanner}
              </p>
            )}

            {step === 'goodbye' && (
              <div className="space-y-4 text-center py-6">
                <p
                  className="text-2xl font-black text-white tracking-tight"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Have a good one.
                </p>
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                  ClearPath is built on honesty and real membership. You’re welcome back anytime with real details.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl border border-white/15 text-zinc-300 text-xs font-black uppercase tracking-widest hover:border-[#00E5FF]/40 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {step === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Email
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

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Password
                  </span>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF1493]/80" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl pl-10 pr-12 py-3 text-sm text-white outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock size={14} />
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot');
                    setPassword('');
                    setConfirmPassword('');
                    setError('');
                    setInfoBanner('');
                  }}
                  className="w-full text-[11px] text-zinc-400 hover:text-[#FF1493] transition-colors"
                >
                  Forgot password?
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setPassword('');
                    setConfirmPassword('');
                    setError('');
                    setInfoBanner('');
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Need an account? Create one
                </button>
              </form>
            )}

            {step === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Mail size={14} />
                  {busy ? 'Sending…' : 'Email me a reset link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError('');
                    setInfoBanner('');
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            )}

            {step === 'forgot_sent' && (
              <div className="space-y-4">
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  If an account exists for <span className="text-white">{email}</span>, the reset email
                  is on its way. Open the link within 1 hour, choose a new password, then sign in.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setPassword('');
                    setError('');
                    setInfoBanner('After you reset, sign in with your new password.');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest"
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const fakeEvent = { preventDefault() {} } as React.FormEvent;
                    void handleForgot(fakeEvent);
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors disabled:opacity-50"
                >
                  Resend reset email
                </button>
              </div>
            )}

            {step === 'reset_password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    New password
                  </span>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF1493]/80" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl pl-10 pr-12 py-3 text-sm text-white outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    </button>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Confirm password
                  </span>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00E5FF]/70" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/10 focus:border-[#00E5FF]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none tracking-widest"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <KeyRound size={14} />
                  {busy ? 'Saving…' : 'Save new password'}
                </button>
              </form>
            )}

            {step === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Email
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

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Your name
                  </span>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B026FF]" />
                    <input
                      type="text"
                      required
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
                    Password (min 8)
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
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
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
                  {busy ? 'Creating…' : 'Create account & enter'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setPassword('');
                    setConfirmPassword('');
                    setError('');
                    setInfoBanner('');
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </form>
            )}

            {step === 'real_info' && (
              <form onSubmit={handleResubmit} className="space-y-4">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  ClearPath is built on honesty. Please use your real name and a real email — temporary or fake addresses will not unlock membership.
                </p>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Real display name
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
                      placeholder="Your real name"
                      className="w-full bg-black border border-white/10 focus:border-[#B026FF]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Real email
                  </span>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00E5FF]/70" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full bg-black border border-white/10 focus:border-[#00E5FF]/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Password (same as you just created)
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Submit real info'}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDecline}
                  className="w-full py-3 rounded-xl border border-white/10 text-zinc-400 text-xs font-black uppercase tracking-widest hover:border-[#FF5277]/40 hover:text-[#FF5277] transition-colors disabled:opacity-50"
                >
                  No thanks
                </button>
              </form>
            )}

            {step === 'pending_email' && (
              <div className="space-y-4">
                <p className="text-[12px] text-zinc-300 leading-relaxed">
                  We sent a confirmation link to <span className="text-[#00E5FF] font-mono">{email}</span>.
                  Click it to unlock your private desk. The link expires in 48 hours.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResend}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Resend confirmation email'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep('real_info')}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Update my information
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDecline}
                  className="w-full text-[11px] text-zinc-600 hover:text-[#FF5277] transition-colors"
                >
                  No thanks
                </button>
              </div>
            )}

            {error && step !== 'goodbye' && (
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
