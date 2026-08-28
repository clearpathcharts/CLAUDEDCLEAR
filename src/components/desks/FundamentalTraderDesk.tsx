import React from 'react';
import FundamentalDashboard from '../fundamental/FundamentalDashboard';

/**
 * Fundamental Trader Door — research workstation.
 * Charts of price action are not the primary surface (see Institutional desk).
 */
export default function FundamentalTraderDesk({ initialSymbol }: { initialSymbol?: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-fundamental-door="true">
      <FundamentalDashboard initialSymbol={initialSymbol || 'NVDA'} />
    </div>
  );
}
