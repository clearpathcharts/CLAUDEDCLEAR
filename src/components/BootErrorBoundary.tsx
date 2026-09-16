import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Last-resort UI when any child throws during render/lifecycle.
 * Prevents the black "Loading New Architecture..." shell from sticking forever.
 */
export class BootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BootErrorBoundary] SPA crash caught:', error, info.componentStack);
    try {
      const w = window as Window & { __CP_BOOT_FAILED?: string; __CP_BOOT_OK?: boolean };
      w.__CP_BOOT_FAILED = error?.message || 'unknown';
      // Stand down HTML watchdog — recovery UI is already on screen
      w.__CP_BOOT_OK = true;
      document.documentElement.setAttribute('data-cp-boot', 'error-boundary');
    } catch {
      /* ignore */
    }
  }

  private reload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error.message || 'Unexpected application error';

    return (
      <div
        role="alert"
        className="min-h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center gap-6 px-6 text-center"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-rose-400">
          ClearPath failed to start
        </p>
        <h1 className="max-w-lg text-xl font-black uppercase tracking-wide">
          Something broke before the terminal could load
        </h1>
        <p className="max-w-md text-sm text-zinc-400 leading-relaxed">
          This is not a blank black screen by design — the app caught a crash. Reload usually
          fixes a transient failure. If it keeps happening, the deploy may be missing client
          config (for example Firebase).
        </p>
        <pre className="max-w-xl w-full overflow-auto rounded-xl border border-white/10 bg-black/60 p-4 text-left font-mono text-[11px] text-rose-200/90">
          {message}
        </pre>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.reload}
            className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-cyan-200 hover:bg-cyan-500/30"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={this.goHome}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-200 hover:bg-white/10"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}

/** Marks successful first paint so the HTML boot watchdog stands down. */
export function BootReadySignal() {
  React.useEffect(() => {
    try {
      const w = window as Window & { __CP_BOOT_OK?: boolean; __CP_BOOT_AT?: number };
      w.__CP_BOOT_OK = true;
      w.__CP_BOOT_AT = Date.now();
      document.documentElement.setAttribute('data-cp-boot', 'ok');
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
