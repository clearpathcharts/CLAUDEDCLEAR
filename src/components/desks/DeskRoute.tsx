import React, { useEffect } from 'react';
import TraderDeskChrome from './TraderDeskChrome';
import InstitutionalTraderDesk from './InstitutionalTraderDesk';
import FundamentalTraderDesk from './FundamentalTraderDesk';
import RetailTraderDesk from './RetailTraderDesk';
import NeurodivergentTraderDesk from './NeurodivergentTraderDesk';
import { DeskAppearanceProvider, useDeskAppearance } from './DeskAppearanceContext';
import {
  parseDeskPath,
  readRememberedTraderDesk,
  rememberTraderDesk,
  symbolFromDeskPath,
  type TraderDeskId,
} from '../../lib/traderDesks';
import { DESK_SEO } from '../../content/traderDesksCopy';
import { TRADER_DESKS } from '../../lib/traderDesks';
import './deskTheme.css';

function resolveDesk(pathname: string): TraderDeskId {
  const fromPath = parseDeskPath(pathname);
  if (fromPath) return fromPath;
  return readRememberedTraderDesk() ?? 'institutional';
}

function DeskShell({
  pathname,
  deskId,
  seoH1,
}: {
  pathname: string;
  deskId: TraderDeskId;
  seoH1: string;
}) {
  const { paper } = useDeskAppearance();

  let body: React.ReactNode;
  switch (deskId) {
    case 'institutional':
      body = <InstitutionalTraderDesk />;
      break;
    case 'fundamental':
      body = <FundamentalTraderDesk initialSymbol={symbolFromDeskPath(pathname)} />;
      break;
    case 'retail':
      body = <RetailTraderDesk />;
      break;
    case 'neurodivergent':
      body = <NeurodivergentTraderDesk />;
      break;
    default:
      body = <InstitutionalTraderDesk />;
  }

  return (
    <div
      className={`desk-shell flex h-[100dvh] w-full flex-col overflow-hidden ${
        paper === 'white' ? 'bg-white text-zinc-900' : 'bg-[#050505] text-white'
      }`}
      data-trader-desk={deskId}
      data-desk-paper={paper}
    >
      <a href="#desk-main" className="cp-skip-link">
        Skip to desk
      </a>
      <TraderDeskChrome active={deskId} />
      <main id="desk-main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col overflow-auto outline-none">
        <h1 className="sr-only">{seoH1}</h1>
        {pathname.replace(/\/$/, '') === '/desk' && (
          <p className="px-3 pt-2 font-mono text-sm font-bold uppercase text-zinc-500">
            Opening {TRADER_DESKS[deskId].title}
          </p>
        )}
        {body}
      </main>
    </div>
  );
}

export default function DeskRoute({ pathname }: { pathname: string }) {
  const deskId = resolveDesk(pathname);
  const seo = DESK_SEO[deskId];

  useEffect(() => {
    rememberTraderDesk(deskId);
  }, [deskId]);

  return (
    <DeskAppearanceProvider>
      <DeskShell pathname={pathname} deskId={deskId} seoH1={seo.h1} />
    </DeskAppearanceProvider>
  );
}
