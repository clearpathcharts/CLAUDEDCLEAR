import React, { useEffect } from 'react';
import TraderDeskChrome from './TraderDeskChrome';
import InstitutionalTraderDesk from './InstitutionalTraderDesk';
import FundamentalTraderDesk from './FundamentalTraderDesk';
import RetailTraderDesk from './RetailTraderDesk';
import NeurodivergentTraderDesk from './NeurodivergentTraderDesk';
import {
  parseDeskPath,
  readRememberedTraderDesk,
  rememberTraderDesk,
  type TraderDeskId,
} from '../../lib/traderDesks';
import { DESK_SEO } from '../../content/traderDesksCopy';
import { TRADER_DESKS } from '../../lib/traderDesks';

function resolveDesk(pathname: string): TraderDeskId {
  const fromPath = parseDeskPath(pathname);
  if (fromPath) return fromPath;
  return readRememberedTraderDesk() ?? 'institutional';
}

export default function DeskRoute({ pathname }: { pathname: string }) {
  const deskId = resolveDesk(pathname);
  const seo = DESK_SEO[deskId];

  useEffect(() => {
    rememberTraderDesk(deskId);
  }, [deskId]);

  let body: React.ReactNode;
  switch (deskId) {
    case 'institutional':
      body = <InstitutionalTraderDesk />;
      break;
    case 'fundamental':
      body = <FundamentalTraderDesk />;
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
      className="flex h-[100dvh] min-h-screen w-full flex-col bg-[#050505] text-white"
      data-trader-desk={deskId}
    >
      <a href="#desk-main" className="cp-skip-link">
        Skip to desk
      </a>
      <TraderDeskChrome active={deskId} />
      <main id="desk-main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col overflow-auto outline-none">
        <h1 className="sr-only">{seo.h1}</h1>
        {pathname.replace(/\/$/, '') === '/desk' && (
          <p className="px-3 pt-2 font-mono text-[10px] uppercase text-zinc-500">
            Opening {TRADER_DESKS[deskId].title}
          </p>
        )}
        {body}
      </main>
    </div>
  );
}
