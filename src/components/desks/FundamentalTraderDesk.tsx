import React from 'react';
import FundamentalDashboard from '../fundamental/FundamentalDashboard';

/**
 * Fundamental Trader Door — research workstation with Twelve Data price chart
 * plus FMP/FRED fundamentals (see Institutional for multi-asset market command).
 */
export default function FundamentalTraderDesk({ initialSymbol }: { initialSymbol?: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-fundamental-door="true">
      <FundamentalDashboard initialSymbol={initialSymbol || 'NVDA'} />
    </div>
  );
}
