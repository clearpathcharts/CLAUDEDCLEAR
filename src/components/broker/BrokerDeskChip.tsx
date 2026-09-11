import React from 'react';
import { useBrokerConnection } from '../../hooks/useBrokerConnection';
import { startAlpacaConnect } from '../../api/brokerConnect';
import { NEVER_BROKER_DEALER } from '../../lib/passThroughBrokerModel';

/** TradingView-style broker status chip — pass-through only, never ClearPath as broker. */
export default function BrokerDeskChip() {
  const { loading, alpaca } = useBrokerConnection(false);

  if (loading) {
    return (
      <span
        className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
        title={NEVER_BROKER_DEALER}
      >
        Broker…
      </span>
    );
  }

  if (!alpaca) return null;

  if (alpaca.connected) {
    return (
      <a
        href="/?tab=Biography#Biography"
        className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/20"
        title={`${NEVER_BROKER_DEALER} Connected: ${alpaca.label} (${alpaca.environment || 'paper'})`}
      >
        {alpaca.label} · {alpaca.environment === 'live' ? 'LIVE' : 'PAPER'}
      </a>
    );
  }

  if (!alpaca.configured) {
    return (
      <span
        className="rounded-md border border-amber-500/30 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200/80"
        title="Broker OAuth keys not set on server — pass-through connect unavailable"
      >
        Broker · ops keys
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => startAlpacaConnect('/desk/retail')}
      className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/20"
      title={`${NEVER_BROKER_DEALER} Connect your ${alpaca.label} account (OAuth).`}
    >
      Connect {alpaca.label}
    </button>
  );
}
