import React, { useCallback, useEffect, useState } from 'react';
import {
  disconnectAlpaca,
  fetchBrokerStatus,
  startAlpacaConnect,
  type BrokerPublicStatus,
} from '../../api/brokerConnect';

/**
 * Optional pass-through broker connect — user OAuth's their own Alpaca account.
 * ClearPath is not a broker-dealer; the licensed partner holds funds and effects trades.
 */
export default function BrokerConnectPanel() {
  const [alpaca, setAlpaca] = useState<BrokerPublicStatus | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBrokerStatus();
      setNote(data.note || '');
      setAlpaca(data.brokers?.alpaca ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load broker status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const params = new URLSearchParams(window.location.search);
    if (params.get('broker') === 'alpaca_connected') {
      void refresh();
    }
  }, [refresh]);

  const onConnect = () => {
    setBusy(true);
    startAlpacaConnect('/?tab=Biography#Biography');
  };

  const onDisconnect = async () => {
    setBusy(true);
    setError('');
    try {
      await disconnectAlpaca();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Disconnect failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 md:p-8 backdrop-blur-xl">
      <div className="text-[20px] md:text-[24px] mb-2 font-orbitron font-bold bg-gradient-to-r from-[#00e5ff] to-[#818cf8] text-transparent bg-clip-text w-fit">
        Broker connect (pass-through)
      </div>
      <p className="text-[12px] md:text-[13px] text-zinc-400 leading-relaxed mb-4 max-w-2xl">
        {note ||
          'Link your own licensed broker account via OAuth — same model as TradingView + Alpaca. ClearPath is the chart interface; your broker holds funds and executes orders when you authorize them.'}
      </p>

      {loading ? (
        <p className="text-xs font-mono uppercase text-zinc-500">Loading broker status…</p>
      ) : alpaca ? (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-white">{alpaca.label}</p>
              <p className="text-[10px] font-mono uppercase text-zinc-500 mt-1">
                Mode: {alpaca.mode === 'stub' ? 'STUB (ops keys not set)' : alpaca.environment || 'live'}
              </p>
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${
                alpaca.connected
                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                  : alpaca.configured
                    ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
                    : 'border-amber-500/40 text-amber-200 bg-amber-500/10'
              }`}
            >
              {alpaca.connected ? 'Connected' : alpaca.configured ? 'Ready to connect' : 'Not configured'}
            </span>
          </div>

          {alpaca.connected ? (
            <ul className="text-[11px] font-mono text-zinc-400 space-y-1 mb-4">
              {alpaca.accountId ? <li>Account: {alpaca.accountId}</li> : null}
              {alpaca.connectedAt ? <li>Connected: {new Date(alpaca.connectedAt).toLocaleString()}</li> : null}
              {alpaca.environment ? <li>Environment: {alpaca.environment}</li> : null}
            </ul>
          ) : (
            <p className="text-[11px] text-zinc-500 mb-4">
              {!alpaca.configured
                ? 'Founder: set ALPACA_CLIENT_ID, ALPACA_CLIENT_SECRET, ALPACA_REDIRECT_URI, and BROKER_TOKEN_ENCRYPTION_KEY on Cloud Run (Edit & deploy → Variables). Market data keys are separate.'
                : 'Sign in, then connect to authorize ClearPath to route orders to your Alpaca account.'}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!alpaca.connected && alpaca.configured ? (
              <button
                type="button"
                disabled={busy}
                onClick={onConnect}
                className="rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50"
              >
                Connect Alpaca
              </button>
            ) : null}
            {alpaca.connected ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDisconnect()}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
              >
                Disconnect
              </button>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void refresh()}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Broker status unavailable.</p>
      )}

      {error ? <p className="mt-3 text-xs text-rose-400">{error}</p> : null}

      <p className="mt-4 text-[10px] text-zinc-600 leading-relaxed max-w-2xl">
        ClearPath Trader is not a broker-dealer and does not custody your money. Future chart order tickets will pass through to your connected broker only after you OAuth authorize them. Not investment advice.
      </p>
    </div>
  );
}
