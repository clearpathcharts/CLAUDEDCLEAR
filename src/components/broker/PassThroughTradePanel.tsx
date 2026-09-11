import React, { useState } from 'react';
import { useBrokerConnection } from '../../hooks/useBrokerConnection';
import { submitAlpacaOrder, startAlpacaConnect } from '../../api/brokerConnect';
import {
  NEVER_BROKER_DEALER,
  PASS_THROUGH_ORDER_DISCLAIMER,
  PASS_THROUGH_SUMMARY,
} from '../../lib/passThroughBrokerModel';

type Props = {
  symbol: string;
};

/**
 * TradingView-style chart trade panel — submits to user's connected broker only.
 * ClearPath never executes; pass-through proxy only.
 */
export default function PassThroughTradePanel({ symbol }: Props) {
  const { loading, alpaca, account, refresh } = useBrokerConnection(true);
  const [qty, setQty] = useState('1');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="shrink-0 border-t border-[var(--desk-border)] px-3 py-2 text-[10px] font-mono uppercase text-[var(--desk-muted)]">
        Loading broker pass-through…
      </div>
    );
  }

  if (!alpaca?.configured) {
    return (
      <div className="shrink-0 border-t border-[var(--desk-border)] px-3 py-2 text-[10px] text-[var(--desk-muted)] leading-relaxed">
        <span className="font-black uppercase tracking-wider text-amber-200/90">Pass-through trading · stub</span>
        {' — '}
        Alpaca OAuth keys not on server yet. {NEVER_BROKER_DEALER}
      </div>
    );
  }

  if (!alpaca.connected) {
    return (
      <div className="shrink-0 flex flex-wrap items-center gap-2 border-t border-[var(--desk-border)] px-3 py-2">
        <p className="text-[10px] text-[var(--desk-muted)] max-w-xl leading-relaxed">
          {PASS_THROUGH_SUMMARY}
        </p>
        <button
          type="button"
          onClick={() => startAlpacaConnect('/desk/retail')}
          className="rounded-md border border-cyan-500/50 bg-cyan-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-100"
        >
          Connect {alpaca.label}
        </button>
      </div>
    );
  }

  const onSubmit = async () => {
    setErr(null);
    setMsg(null);
    if (!ack) {
      setErr('Confirm pass-through disclaimer first.');
      return;
    }
    const parsedQty = Number(qty);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setErr('Enter a valid quantity.');
      return;
    }
    setBusy(true);
    try {
      const result = await submitAlpacaOrder({
        symbol: symbol.replace('/', ''),
        qty: parsedQty,
        side,
        type: 'market',
        time_in_force: 'day',
        passThroughAcknowledged: true,
      });
      setMsg(`Sent to ${alpaca.label}: ${result.order?.status || 'submitted'} · id ${result.order?.id || '—'}`);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Order failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="shrink-0 border-t border-[var(--desk-border)] px-3 py-2"
      data-pass-through-trade-panel
    >
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--desk-muted)] mb-1">
            Pass-through · {alpaca.label} {alpaca.environment}
          </p>
          <p className="text-[10px] font-mono text-[var(--desk-text)] tabular-nums">
            BP {account?.buying_power ?? '—'} · {symbol}
          </p>
        </div>
        <div className="flex gap-1">
          {(['buy', 'sell'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className="rounded border px-2 py-1 text-[10px] font-black uppercase"
              style={{
                borderColor: side === s ? (s === 'buy' ? '#34d399' : '#f87171') : 'var(--desk-border)',
                color: side === s ? (s === 'buy' ? '#6ee7b7' : '#fca5a5') : 'var(--desk-muted)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase text-[var(--desk-muted)]">Qty</span>
          <input
            type="number"
            min={0}
            step={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-20 rounded border border-[var(--desk-border)] bg-black/40 px-2 py-1 font-mono text-xs text-[var(--desk-text)]"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSubmit()}
          className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/15 disabled:opacity-50"
        >
          Send to {alpaca.label}
        </button>
      </div>
      <label className="mt-2 flex items-start gap-2 text-[10px] text-[var(--desk-muted)] leading-snug max-w-2xl cursor-pointer">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-0.5"
        />
        <span>{PASS_THROUGH_ORDER_DISCLAIMER}</span>
      </label>
      {msg ? <p className="mt-1 text-[10px] font-mono text-emerald-400">{msg}</p> : null}
      {err ? <p className="mt-1 text-[10px] font-mono text-rose-400">{err}</p> : null}
    </div>
  );
}
