import React, { useEffect, useState } from 'react';
import { TradingHaltController } from '../truth/TradingHaltController';
import FundamentalResearchDesk from './fundamental/FundamentalResearchDesk';

export default function FundamentalsPanel() {
  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  if (halted) {
    return (
      <div className="p-6 bg-black/40 backdrop-blur-md rounded-3xl border border-red-900 border-dashed h-full flex flex-col items-center justify-center text-center">
        <span className="text-red-500 font-extrabold uppercase tracking-widest text-sm mb-2">Research modules paused</span>
        <p className="text-xs text-zinc-400 max-w-sm font-mono uppercase">{haltReason || 'Fundamental desk unavailable during halt'}</p>
      </div>
    );
  }

  return <FundamentalResearchDesk />;
}
