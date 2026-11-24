import React, { useCallback, useEffect, useRef, useState } from 'react';
import { startAlpacaConnect } from '../../api/brokerConnect';
import { ALPACA_AUTHORIZE_DISCLOSURE, OAUTH_APP_NAME } from '../../lib/passThroughBrokerModel';

type Props = {
  open: boolean;
  onAllow: () => void;
  onDeny: () => void;
};

export function AlpacaAuthorizeDisclosure({ open, onAllow, onDeny }: Props) {
  const denyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    denyRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDeny();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDeny]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onClick={onDeny}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alpaca-authorize-title"
        aria-describedby="alpaca-authorize-body"
        className="w-full max-w-md rounded-2xl border border-amber-300/40 bg-[#fff8e1] p-6 text-left shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="alpaca-authorize-title" className="mb-3 text-lg font-bold text-[#b71c1c]">
          {ALPACA_AUTHORIZE_DISCLOSURE.title}
        </h2>
        <div id="alpaca-authorize-body" className="space-y-3 text-sm font-semibold leading-relaxed text-[#b71c1c]">
          <p>{ALPACA_AUTHORIZE_DISCLOSURE.grant}</p>
          <p>
            {ALPACA_AUTHORIZE_DISCLOSURE.warranty}{' '}
            <a
              href={ALPACA_AUTHORIZE_DISCLOSURE.learnMoreHref}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              About {OAUTH_APP_NAME}
            </a>
          </p>
        </div>
        <div className="mt-6 flex justify-around gap-3">
          <button
            ref={denyRef}
            type="button"
            onClick={onDeny}
            className="min-w-[7rem] rounded-lg border border-[#b71c1c]/50 px-4 py-2 text-sm font-black uppercase tracking-wider text-[#b71c1c] hover:bg-[#b71c1c]/10"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="min-w-[7rem] rounded-lg bg-[#b71c1c] px-4 py-2 text-sm font-black uppercase tracking-wider text-white hover:bg-[#8e1515]"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

/** Every Alpaca connect goes through this: the disclosure must be accepted before OAuth starts. */
export function useAlpacaConnectGate(onDenied?: () => void) {
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const requestConnect = useCallback((target: string) => setReturnTo(target), []);
  const deny = useCallback(() => {
    setReturnTo(null);
    onDenied?.();
  }, [onDenied]);
  const allow = useCallback(() => {
    if (returnTo == null) return;
    startAlpacaConnect(returnTo, true);
  }, [returnTo]);

  const disclosure = <AlpacaAuthorizeDisclosure open={returnTo != null} onAllow={allow} onDeny={deny} />;
  return { requestConnect, disclosure };
}
