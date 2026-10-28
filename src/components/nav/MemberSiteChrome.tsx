/**
 * Global member header: breaking feed + full ClearNav (HOME, Y.W.C., PLANS, …).
 * Shown on trader desks (default member home) and reusable anywhere logged-in members land.
 */
import React from 'react';
import BreakingNewsTicker from '../BreakingNewsTicker';
import { ClearNav } from './ClearNav';
import { useAuth } from '../../contexts/FirebaseContext';
import { navigateMemberTab } from '../../lib/memberTabNavigation';
import type { TraderDeskId } from '../../lib/traderDesks';

export function activeTabForDesk(deskId: TraderDeskId): string {
  if (deskId === 'fundamental') return 'Fundamentals';
  return 'StrictlyCharts';
}

export function MemberSiteChrome({
  activeTab,
  lean = false,
}: {
  activeTab: string;
  lean?: boolean;
}) {
  const { logout } = useAuth();

  return (
    <div data-member-site-chrome className="shrink-0">
      {!lean ? <BreakingNewsTicker /> : null}
      {/* CEO tab stays off this bar — founder opens /ceo or the desk CEO pill. */}
      <ClearNav
        activeTab={activeTab}
        onNavigate={navigateMemberTab}
        isFounder={false}
        onLogout={() => void logout()}
        lean={lean}
      />
    </div>
  );
}
