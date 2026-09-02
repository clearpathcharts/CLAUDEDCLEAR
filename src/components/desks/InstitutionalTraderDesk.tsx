import React from 'react';
import InstitutionalDashboard from './institutional/InstitutionalDashboard';
import { DeskHoldScope } from './DeskHoldScope';
import { INSTITUTIONAL_HELD_META } from './heldMeta';

/** Institutional Door — bento market-intelligence terminal. */
export default function InstitutionalTraderDesk() {
  return (
    <DeskHoldScope
      desk="institutional"
      storageKey="clearpath_held_institutional_v3"
      meta={INSTITUTIONAL_HELD_META}
      defaultHeld={[]}
    >
      <InstitutionalDashboard />
    </DeskHoldScope>
  );
}
