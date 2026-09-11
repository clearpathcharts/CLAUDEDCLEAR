import React from 'react';

type Props = {
  deskLabel: string;
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

/** Isolates desk crashes — chart/panel errors must not white-screen the whole terminal. */
export default class DeskErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[DeskErrorBoundary:${this.props.deskLabel}]`, error, info.componentStack);
  }

  private reload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          className="mx-3 my-6 rounded-xl border border-rose-500/40 bg-rose-950/30 p-6 text-center"
          role="alert"
        >
          <p className="text-sm font-black uppercase tracking-widest text-rose-300 mb-2">
            {this.props.deskLabel} hit a rendering error
          </p>
          <p className="text-xs text-zinc-400 mb-4 max-w-md mx-auto leading-relaxed">
            The chart desk stopped safely so the rest of the site stays up. Reload this desk or switch tabs.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="rounded-md border border-rose-400/50 bg-rose-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-200 hover:bg-rose-500/25"
          >
            Reload desk
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
