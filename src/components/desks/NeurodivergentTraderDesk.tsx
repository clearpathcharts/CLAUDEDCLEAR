import React from 'react';
import NeurodivergentDashboard from './neuro/NeurodivergentDashboard';

/**
 * Neurodivergent Market desk — calm retail + crypto workstation with
 * pre-built sensory UI profiles (themeProfiles). Stays in the SPA; no
 * hard navigation to /?profile=… that remounts Auth/Dashboard.
 */
export default function NeurodivergentTraderDesk() {
  return <NeurodivergentDashboard />;
}
