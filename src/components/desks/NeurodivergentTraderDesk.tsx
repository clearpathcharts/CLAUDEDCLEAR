import React from 'react';
import NeurodivergentDashboard from './neuro/NeurodivergentDashboard';
import { DeskHoldScope } from './DeskHoldScope';
import { NEURO_HELD_META } from './heldMeta';

/**
 * Neurodivergent Market desk — calm retail + crypto workstation with
 * pre-built sensory UI profiles (themeProfiles). Stays in the SPA; no
 * hard navigation to /?profile=… that remounts Auth/Dashboard.
 */
export default function NeurodivergentTraderDesk() {
  return (
    <DeskHoldScope
      desk="neurodivergent"
      storageKey="clearpath_held_neuro_v3"
      meta={NEURO_HELD_META}
      defaultHeld={[]}
    >
      <NeurodivergentDashboard />
    </DeskHoldScope>
  );
}
