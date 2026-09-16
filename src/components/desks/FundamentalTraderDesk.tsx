import React from 'react';
import FundamentalDashboard from '../fundamental/FundamentalDashboard';
import { DeskHoldScope } from './DeskHoldScope';
import { FUNDAMENTAL_HELD_META, FUNDAMENTAL_CHART_FIRST_HELD } from './heldMeta';

/**
 * Fundamental Trader Door — research workstation.
 * Charts of price action are not the primary surface (see Institutional desk).
 */
export default function FundamentalTraderDesk({ initialSymbol }: { initialSymbol?: string }) {
  return (
    <DeskHoldScope
      desk="fundamental"
      storageKey="clearpath_held_fundamental_v4"
      meta={FUNDAMENTAL_HELD_META}
      defaultHeld={FUNDAMENTAL_CHART_FIRST_HELD}
    >
      <div className="flex w-full flex-col" data-fundamental-door="true">
        <FundamentalDashboard initialSymbol={initialSymbol || 'NVDA'} />
      </div>
    </DeskHoldScope>
  );
}
