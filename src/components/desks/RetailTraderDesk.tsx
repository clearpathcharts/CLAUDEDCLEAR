import React from 'react';
import RetailDashboard from './retail/RetailDashboard';
import { DeskHoldScope } from './DeskHoldScope';
import { RETAIL_HELD_META } from './heldMeta';

/** Retail Market workstation — chart-centered daily cockpit. */
export default function RetailTraderDesk() {
  return (
    <DeskHoldScope
      desk="retail"
      storageKey="clearpath_held_retail_v3"
      meta={RETAIL_HELD_META}
      defaultHeld={[]}
    >
      <RetailDashboard />
    </DeskHoldScope>
  );
}
