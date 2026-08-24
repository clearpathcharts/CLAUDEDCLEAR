import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/FirebaseContext';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';
import {
  clearComplianceLoginFlag,
  hasComplianceLoginFlag,
} from '../../lib/complianceLoginFlag';
import TermsAndConditions from '../TermsAndConditions';
import { RegulatoryComplianceCard } from './RegulatoryComplianceCard';

function shouldPreviewFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('compliance') === '1';
  } catch {
    return false;
  }
}

function stripComplianceQuery(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('compliance')) return;
    url.searchParams.delete('compliance');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}

/**
 * After Private Login the page reloads. A session flag set just before reload
 * opens this dialog once per successful sign-in (not on every refresh).
 * Preview: /?compliance=1
 */
export function RegulatoryComplianceLoginPopup() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (loading) return;
    const preview = shouldPreviewFromUrl();
    const fromLogin = Boolean(user) && hasComplianceLoginFlag();
    if (preview || fromLogin) setOpen(true);
  }, [user, loading]);

  const close = () => {
    setTermsOpen(false);
    setOpen(false);
    clearComplianceLoginFlag();
    stripComplianceQuery();
  };

  useAccessibleDialog(dialogRef, {
    open,
    onClose: close,
    initialFocusRef: closeBtnRef,
  });

  if (!open || typeof document === 'undefined') return null;

  const node = (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
      role="presentation"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compliance-login-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/10 bg-[#141418] p-6 md:p-8 shadow-[0_0_48px_rgba(0,229,255,0.12)]"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={close}
          aria-label="Close regulatory compliance notice"
          className="absolute top-4 right-4 rounded-lg border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
        >
          Close
        </button>
        <p className="m-0 mb-4 pr-16 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
          Shown each time you sign in with Private Login
        </p>
        <RegulatoryComplianceCard
            titleId="compliance-login-title"
            onUpdate={() => setTermsOpen(true)}
            footer={
              <button
                type="button"
                onClick={close}
                className="px-6 py-3.5 rounded-xl border border-white/15 bg-transparent text-zinc-200 font-mono text-xs font-black uppercase tracking-widest hover:border-white/40 hover:text-white transition-all"
              >
                Continue to desk
              </button>
            }
          />
      </div>

      {termsOpen ? (
        <div
          className="fixed inset-0 z-[5010] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          role="presentation"
          onClick={(e) => {
            e.stopPropagation();
            setTermsOpen(false);
          }}
        >
          <div
            className="bg-[#030303] border border-zinc-800 rounded-[2rem] w-full max-w-4xl p-6 md:p-10 relative shadow-[0_0_50px_rgba(0,255,255,0.15)] my-8"
            role="dialog"
            aria-modal="true"
            aria-label="Update compliance status"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white font-mono text-xs font-black tracking-widest uppercase border border-white/10 px-3 py-1 rounded-lg hover:border-white/20 transition-all"
            >
              ✕ CLOSE
            </button>
            <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
              <TermsAndConditions isBackend={true} onBack={() => setTermsOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return createPortal(node, document.body);
}
