import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import {
  loginPrivateAccount,
  registerPrivateAccount,
  resubmitIdentity,
  declineIdentity,
  resendIdentityConfirm,
  requestPasswordReset,
  PrivateAuthClientError,
} from '../api/privateAuth';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { isFounderEmail } from '../lib/founder';
import './privateLoginSciFi.css';

type Step =
  | 'identify'
  | 'login'
  | 'register'
  | 'forgot'
  | 'real_info'
  | 'pending_email'
  | 'goodbye';

interface PrivateLoginDeskProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  /** Prefill from activation links (/activate?email=...). */
  initialEmail?: string;
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
}: PrivateLoginDeskProps) {
  const [step, setStep] = useState<Step>(initialMode === 'register' ? 'register' : 'login');
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
  const dialogRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setStep(initialMode === 'register' ? 'register' : 'login');
    if (initialEmail) {
      setEmail(initialEmail);
      setAccountEmail(initialEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode, initialEmail]);

  React.useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const identity = params.get('identity');
      if (identity === 'confirmed') {
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
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useAccessibleDialog(dialogRef, {
    open,
    onClose: handleClose,
  });

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setInfoBanner(
        'If that email has a Private Login, we sent a reset link. Check that inbox (and spam). The link expires in 2 hours.'
      );
      setStep('login');
    } catch (err: any) {
      setError(err instanceof PrivateAuthClientError ? err.message : 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  };

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
      if (isFounderEmail(email) || isFounderEmail(result.user?.email)) {
        window.location.assign('/ceo');
      } else {
        window.location.reload();
      }
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

  if (!open) return null;

  const title =
    step === 'login'
      ? 'Private Login'
      : step === 'register'
        ? 'Create your private account'
        : step === 'forgot'
          ? 'Reset your password'
          : step === 'real_info'
            ? 'Please enter real information'
            : step === 'pending_email'
              ? 'Confirm your identity'
              : step === 'goodbye'
                ? 'Have a good one.'
                : 'Private Login';

  return (
    <AnimatePresence>
      <div className="cp-scifi-login fixed inset-0 z-[220] flex items-center justify-center p-4 pt-12" data-testid="private-login-scifi">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="cp-scifi-login-backdrop absolute inset-0"
          onClick={handleClose}
          aria-hidden="true"
        />

        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="private-login-title"
          tabIndex={-1}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="cp-scifi-login-panel relative z-10 outline-none"
        >
          <div className="cp-scifi-login-glitch" aria-hidden="true">
            [ SYSTEM ONLINE ]
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="cp-scifi-login-close"
            aria-label="Close private login"
          >
            ×
          </button>
          <h2 id="private-login-title">Access Terminal</h2>
          <p className="cp-scifi-login-sub">{title}</p>

          <div className="cp-scifi-login-body">
            {infoBanner && step !== 'goodbye' && (
              <p className="cp-scifi-login-banner">{infoBanner}</p>
            )}

            {step === 'goodbye' && (
              <div>
                <p className="cp-scifi-login-sub" style={{ marginBottom: '0.75rem' }}>
                  Have a good one.
                </p>
                <p className="cp-scifi-login-note">
                  ClearPath is built on honesty and real membership. You’re welcome back anytime with real details.
                </p>
                <button type="button" onClick={handleClose} className="cp-scifi-login-ghost">
                  Close
                </button>
              </div>
            )}

            {step === 'login' && (
              <form onSubmit={handleLogin}>
                <label className="cp-scifi-login-field">
                  <span>Email</span>
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </label>

                <label className="cp-scifi-login-field">
                  <span>Password</span>
                  <div className="cp-scifi-login-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="cp-scifi-login-toggle"
                    >
                      {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    </button>
                  </div>
                </label>

                <button type="submit" disabled={busy} className="cp-scifi-login-submit">
                  {busy ? 'Signing in…' : 'Login'}
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
                  className="cp-scifi-login-alt"
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
                  className="cp-scifi-login-alt"
                >
                  Need an account? Create one
                </button>
              </form>
            )}

            {step === 'forgot' && (
              <form onSubmit={handleForgot}>
                <p className="cp-scifi-login-note">
                  Enter the email on the account. We send a one-time reset link by email. The token is never shown in the browser.
                </p>
                <label className="cp-scifi-login-field">
                  <span>Email</span>
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </label>
                <button type="submit" disabled={busy} className="cp-scifi-login-submit">
                  {busy ? 'Sending…' : 'Email me a reset link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError('');
                  }}
                  className="cp-scifi-login-alt"
                >
                  Back to sign in
                </button>
              </form>
            )}

            {step === 'register' && (
              <form onSubmit={handleRegister}>
                <label className="cp-scifi-login-field">
                  <span>Email</span>
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </label>

                <label className="cp-scifi-login-field">
                  <span>Your name</span>
                  <input
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>

                <label className="cp-scifi-login-field">
                  <span>Password (min 8)</span>
                  <div className="cp-scifi-login-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="cp-scifi-login-toggle"
                    >
                      {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                    </button>
                  </div>
                </label>

                <label className="cp-scifi-login-field">
                  <span>Confirm password</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </label>

                <button type="submit" disabled={busy} className="cp-scifi-login-submit">
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
                  className="cp-scifi-login-alt"
                >
                  Already have an account? Sign in
                </button>
              </form>
            )}

            {step === 'real_info' && (
              <form onSubmit={handleResubmit}>
                <p className="cp-scifi-login-note">
                  ClearPath is built on honesty. Please use your real name and a real email — temporary or fake addresses will not unlock membership.
                </p>

                <label className="cp-scifi-login-field">
                  <span>Real display name</span>
                  <input
                    type="text"
                    required
                    autoFocus
                    minLength={2}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your real name"
                  />
                </label>

                <label className="cp-scifi-login-field">
                  <span>Real email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </label>

                <label className="cp-scifi-login-field">
                  <span>Password (same as you just created)</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </label>

                <button type="submit" disabled={busy} className="cp-scifi-login-submit">
                  {busy ? 'Saving…' : 'Submit real info'}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDecline}
                  className="cp-scifi-login-ghost cp-scifi-login-danger"
                >
                  No thanks
                </button>
              </form>
            )}

            {step === 'pending_email' && (
              <div>
                <p className="cp-scifi-login-note">
                  We sent a confirmation link to <span className="font-mono">{email}</span>. Click it to unlock your private desk. The link expires in 48 hours.
                </p>
                <button type="button" disabled={busy} onClick={handleResend} className="cp-scifi-login-submit">
                  {busy ? 'Sending…' : 'Resend confirmation email'}
                </button>
                <button type="button" disabled={busy} onClick={() => setStep('real_info')} className="cp-scifi-login-alt">
                  Update my information
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDecline}
                  className="cp-scifi-login-alt cp-scifi-login-danger"
                >
                  No thanks
                </button>
              </div>
            )}

            {error && step !== 'goodbye' && <p className="cp-scifi-login-error">{error}</p>}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
