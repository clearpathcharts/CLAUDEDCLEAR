import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, Eye, EyeOff, X, Shield, KeyRound } from 'lucide-react';
import {
  loginPrivateAccount,
  registerPrivateAccount,
  resubmitIdentity,
  declineIdentity,
  resendIdentityConfirm,
  requestForgotPassword,
  completeForgotPassword,
  changePrivatePassword,
  fetchPrivateSession,
  PrivateAuthClientError,
} from '../api/privateAuth';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

type Step =
  | 'identify'
  | 'login'
  | 'register'
  | 'forgot'
  | 'forgot_sent'
  | 'reset'
  | 'change'
  | 'real_info'
  | 'pending_email'
  | 'goodbye';

interface PrivateLoginDeskProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'reset' | 'change';
  /** Prefill from activation links (/activate?email=...). */
  initialEmail?: string;
  /** Prefill from /login?reset=TOKEN */
  initialResetToken?: string;
}

/**
 * Private per-member login desk.
 * Default: one screen — email + password. Register adds display name.
 * Forgot password + reset link + signed-in change password are first-class.
 * Hard-blocked fake emails still reject at register; soft quarantine no longer traps login.
 */
export default function PrivateLoginDesk({
  open,
  onClose,
  initialMode = 'login',
  initialEmail = '',
  initialResetToken = '',
}: PrivateLoginDeskProps) {
  const resolveInitialStep = (): Step => {
    if (initialResetToken) return 'reset';
    if (initialMode === 'register') return 'register';
    if (initialMode === 'forgot') return 'forgot';
    if (initialMode === 'reset') return 'reset';
    if (initialMode === 'change') return 'change';
    return 'login';
  };

  const [step, setStep] = useState<Step>(resolveInitialStep);
  const [email, setEmail] = useState(initialEmail);
  const [accountEmail, setAccountEmail] = useState(initialEmail);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [knownName, setKnownName] = useState('');
  const [infoBanner, setInfoBanner] = useState('');
  const [forgotHint, setForgotHint] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setStep(resolveInitialStep());
    if (initialEmail) {
      setEmail(initialEmail);
      setAccountEmail(initialEmail);
    }
    if (initialResetToken) {
      setResetToken(initialResetToken);
      setStep('reset');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode, initialEmail, initialResetToken]);

  React.useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const identity = params.get('identity');
      const reset = String(params.get('reset') || '').trim();
      if (reset) {
        setResetToken(reset);
        setStep('reset');
        setInfoBanner('Choose a new password for your Private Login.');
      } else if (params.get('change_password') === '1') {
        setStep('change');
      } else if (identity === 'confirmed') {
        setInfoBanner('Identity confirmed. Sign in with your email and password.');
        setStep('login');
      } else if (identity === 'declined') {
        setStep('goodbye');
      } else if (identity === 'invalid') {
        setError('That confirmation link is invalid or expired.');
      }
    } catch {
      /* ignore */
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || step !== 'change') return;
    let cancelled = false;
    (async () => {
      const session = await fetchPrivateSession();
      if (cancelled) return;
      if (!session?.email) {
        setError('Sign in first, then change your password.');
        setStep('login');
        return;
      }
      setEmail(session.email);
      setAccountEmail(session.email);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step]);

  const reset = () => {
    setStep(initialMode === 'register' ? 'register' : 'login');
    setEmail('');
    setAccountEmail('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setResetToken('');
    setShowPassword(false);
    setError('');
    setBusy(false);
    setKnownName('');
    setInfoBanner('');
    setForgotHint('');
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

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await requestForgotPassword(email);
      setForgotHint(result.hint || '');
      setInfoBanner(result.message);
      setStep('forgot_sent');
    } catch (err: any) {
      setError(err.message || 'Could not start password reset.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!resetToken) {
      setError('Reset link is missing. Use Forgot password to get a new link.');
      return;
    }
    setBusy(true);
    try {
      const result = await completeForgotPassword({ token: resetToken, newPassword: password });
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
      setInfoBanner(result.message || 'Password updated. Sign in with your new password.');
      if (result.email) {
        setEmail(result.email);
        setAccountEmail(result.email);
      }
      setStep('login');
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('reset');
        window.history.replaceState({}, '', url.pathname + url.search);
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await changePrivatePassword({
        currentPassword,
        newPassword: password,
      });
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setInfoBanner(result.message || 'Password updated.');
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Could not change password.');
    } finally {
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

  if (!open) return null;

  const title =
    step === 'login'
      ? 'Private Login'
      : step === 'register'
        ? 'Create your private account'
        : step === 'forgot' || step === 'forgot_sent'
          ? 'Forgot password'
          : step === 'reset'
            ? 'Choose a new password'
            : step === 'change'
              ? 'Change password'
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
          onClick={handleClose}
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#00E5FF]" />
              <h2 id="private-login-title" className="text-sm font-black uppercase tracking-widest text-white">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-zinc-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {step !== 'goodbye' && (
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {step === 'login'
                  ? 'Email and password. That’s it.'
                  : step === 'register'
                    ? 'Pick an email and a password you will remember.'
                    : step === 'forgot'
                      ? 'Enter the email on your Private Login. We will send a reset link.'
                      : step === 'forgot_sent'
                        ? 'Check your email for the reset link.'
                        : step === 'reset'
                          ? 'Pick a new password (min 8 characters).'
                          : step === 'change'
                            ? 'Enter your current password, then choose a new one.'
                            : step === 'real_info'
                              ? 'Use your real name and a real email.'
                              : step === 'pending_email'
                                ? 'Confirm via the link we emailed you.'
                                : null}
              </p>
            )}

            {infoBanner && step !== 'goodbye' && (
              <p className="text-[11px] text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/25 rounded-xl px-3 py-2">
                {infoBanner}
              </p>
            )}

            {step === 'goodbye' && (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm text-zinc-300">Have a good one.</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl border border-white/10 text-zinc-300 text-xs font-black uppercase tracking-widest"
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
                    setError('');
                    setInfoBanner('');
                    setForgotHint('');
                  }}
                  className="w-full text-[11px] text-[#FF1493] hover:text-[#ff6bb5] transition-colors font-medium"
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
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Send reset link'}
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
                {forgotHint && (
                  <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                    {forgotHint}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest"
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setStep('forgot');
                    setInfoBanner('');
                    setForgotHint('');
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Try a different email
                </button>
              </div>
            )}

            {step === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    New password (min 8)
                  </span>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF1493]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoFocus
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
                    Confirm new password
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save new password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot');
                    setPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className="w-full text-[11px] text-zinc-500 hover:text-[#00E5FF] transition-colors"
                >
                  Need a new reset link?
                </button>
              </form>
            )}

            {step === 'change' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Current password
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-white/10 focus:border-[#FF1493]/50 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    New password (min 8)
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
                    Confirm new password
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Update password'}
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
