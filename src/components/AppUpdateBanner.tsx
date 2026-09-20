import React from 'react';
import { Download, RefreshCw, Store, X } from 'lucide-react';
import { snoozeUpdate, useAppUpdateCheck } from '../hooks/useAppUpdateCheck';
import type { UpdateOffer } from '../lib/appVersion';

function primaryLabel(offer: UpdateOffer): string {
  if (offer.primaryAction === 'reload') return 'Refresh now';
  if (offer.primaryAction === 'apk') return 'Download APK';
  return 'Open store';
}

function runPrimary(offer: UpdateOffer): void {
  if (offer.primaryAction === 'reload') {
    window.location.reload();
    return;
  }
  if (!offer.primaryUrl) return;
  // Always open in a new browsing context — never silent install.
  window.open(offer.primaryUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Consent-first update prompt for web + Capacitor Android.
 * Never auto-downloads or auto-installs binaries.
 */
export default function AppUpdateBanner() {
  const { offer, snoozeHours } = useAppUpdateCheck();
  const [dismissed, setDismissed] = React.useState(false);

  if (!offer || dismissed) return null;

  // A hard lock with no working primary button would freeze the whole app on a
  // config mistake (minSupported bumped before APP_UPDATE_PLAY_STORE_URL /
  // allowlisted APK URL is set). Degrade to the dismissible banner instead.
  const primaryActionable = offer.primaryAction === 'reload' || Boolean(offer.primaryUrl);
  const hard = offer.severity === 'hard' && primaryActionable;

  return (
    <div
      className={`fixed inset-x-0 z-[10000] flex justify-center px-3 ${
        hard ? 'bottom-0 top-0 items-center bg-black/75 backdrop-blur-sm' : 'bottom-4 pointer-events-none'
      }`}
      role={hard ? 'alertdialog' : 'status'}
      aria-live="polite"
      aria-labelledby="cp-update-title"
      aria-describedby="cp-update-desc"
    >
      <div
        className={`pointer-events-auto w-full max-w-md rounded-2xl border border-[#00E5FF]/35 bg-[#0a0a0a]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl ${
          hard ? '' : ''
        }`}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p
              id="cp-update-title"
              className="text-[11px] font-black uppercase tracking-widest text-[#00E5FF]"
            >
              {hard ? 'Update required' : 'Update available'}
            </p>
            <p className="mt-1 font-mono text-[10px] text-zinc-400">
              {offer.platform === 'web' ? 'Web' : 'Android'} · {offer.currentLabel} →{' '}
              {offer.latestLabel}
            </p>
          </div>
          {!hard && (
            <button
              type="button"
              aria-label="Dismiss update notice"
              className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:text-white"
              onClick={() => {
                snoozeUpdate(snoozeHours);
                setDismissed(true);
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <p id="cp-update-desc" className="mb-3 text-xs leading-relaxed text-zinc-300">
          {offer.notes}
        </p>

        {offer.primaryAction === 'apk' && offer.apkSha256 && (
          <p className="mb-3 break-all font-mono text-[9px] text-zinc-500">
            SHA-256: {offer.apkSha256}
          </p>
        )}

        {!offer.primaryUrl && offer.primaryAction !== 'reload' && (
          <p className="mb-3 text-[11px] text-amber-300/90">
            No store or APK URL is configured on the server yet. Ask ops to set{' '}
            <code className="text-[#00E5FF]">APP_UPDATE_PLAY_STORE_URL</code>.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={offer.primaryAction !== 'reload' && !offer.primaryUrl}
            onClick={() => runPrimary(offer)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/15 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#00E5FF] transition hover:bg-[#00E5FF]/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {offer.primaryAction === 'reload' ? (
              <RefreshCw size={13} aria-hidden="true" />
            ) : offer.primaryAction === 'apk' ? (
              <Download size={13} aria-hidden="true" />
            ) : (
              <Store size={13} aria-hidden="true" />
            )}
            {primaryLabel(offer)}
          </button>

          {!hard && (
            <button
              type="button"
              onClick={() => {
                snoozeUpdate(snoozeHours);
                setDismissed(true);
              }}
              className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              Later
            </button>
          )}

          {offer.secondaryApkUrl && (
            <button
              type="button"
              onClick={() =>
                window.open(offer.secondaryApkUrl!, '_blank', 'noopener,noreferrer')
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-[#00E5FF]/35 hover:text-[#00E5FF]"
            >
              <Download size={13} aria-hidden="true" />
              APK mirror
            </button>
          )}
        </div>

        <p className="mt-3 text-[9px] leading-relaxed text-zinc-600">
          Updates never install silently. Store installs use the official listing; APK
          sideloads open in your browser for you to review.
        </p>
      </div>
    </div>
  );
}
