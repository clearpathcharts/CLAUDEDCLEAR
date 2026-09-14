import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { parseDeskScreenPane } from '../../lib/deskMonitorTree';
import DeskScreenWorkspace from './DeskScreenWorkspace';
import { DESK_SEO } from '../../content/traderDesksCopy';
import { PRODUCT_URL } from '../../content/productIdentity';
import { TRADER_DESKS } from '../../lib/traderDesks';
import { CptBuddyWidget } from '../CptBuddyWidget';
import DeskErrorBoundary from './DeskErrorBoundary';
import './deskTheme.css';
import './colorChart.css';
import './heldFile.css';

function resolveDesk(pathname: string): TraderDeskId {
  const fromPath = parseDeskPath(pathname);
  if (fromPath) return fromPath;
  return readRememberedTraderDesk() ?? 'institutional';
}

/** Defer Buddy on neuro desk so chart paint wins the main thread first (accessibility). */
function DeferredDeskBuddy({ deskId }: { deskId: TraderDeskId }) {
  const defer = deskId === 'neurodivergent';
  const [ready, setReady] = useState(!defer);

  useEffect(() => {
    if (!defer || ready) return;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(() => setReady(true), { timeout: 5000 });
      return () => win.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setReady(true), 2000);
    return () => window.clearTimeout(t);
  }, [defer, ready]);

  if (!ready) return null;
  return <CptBuddyWidget />;
}

function DeskShell({
  pathname,
  deskId,
  seoH1,
  satellitePane,
}: {
  pathname: string;
  deskId: TraderDeskId;
  seoH1: string;
  satellitePane: ReturnType<typeof parseDeskScreenPane>;
}) {
  const { paper, cssVars, overrides } = useDeskAppearance();

  let body: React.ReactNode;
  if (satellitePane) {
    body = <DeskScreenWorkspace deskId={deskId} pane={satellitePane} />;
  } else {
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
  }

  return (
    <div
      className={`desk-shell flex min-h-[100dvh] min-h-screen w-full flex-col ${
        satellitePane ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : ''
      } ${paper === 'white' ? 'bg-white text-zinc-900' : 'bg-[#050505] text-white'}`}
      data-trader-desk={deskId}
      data-desk-paper={paper}
      data-desk-satellite={satellitePane || undefined}
      data-desk-color-bg={overrides.background ? '1' : undefined}
      data-desk-color-bento={overrides.bento ? '1' : undefined}
      style={cssVars as React.CSSProperties}
    >
      <a href="#desk-main" className="cp-skip-link">
        Skip to desk
      </a>
      <TraderDeskChrome active={deskId} satellitePane={satellitePane} />
      <main
        id="desk-main"
        tabIndex={-1}
        className={`flex w-full flex-1 flex-col outline-none ${
          satellitePane ? 'min-h-0 overflow-hidden pb-0' : 'overflow-visible pb-36'
        }`}
      >
        <h1 className="sr-only">{seoH1}</h1>
        {pathname.replace(/\/$/, '') === '/desk' && (
          <p className="px-3 pt-2 font-mono text-sm font-bold uppercase text-zinc-500">
            Opening {TRADER_DESKS[deskId].title}
          </p>
        )}
        <DeskErrorBoundary deskLabel={TRADER_DESKS[deskId].title}>
          {body}
        </DeskErrorBoundary>
      </main>
    </div>
  );
}

export default function DeskRoute({ pathname }: { pathname: string }) {
  const deskId = resolveDesk(pathname);
  const seo = DESK_SEO[deskId];
  const satellitePane = parseDeskScreenPane(pathname);
  const canonical = `${PRODUCT_URL}${TRADER_DESKS[deskId].href}`;

  useEffect(() => {
    rememberTraderDesk(deskId);
  }, [deskId]);

  return (
    <DeskAppearanceProvider deskId={deskId}>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${PRODUCT_URL}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        {satellitePane ? <meta name="robots" content="noindex, follow" /> : null}
      </Helmet>
      <DeskShell pathname={pathname} deskId={deskId} seoH1={seo.h1} satellitePane={satellitePane} />
      {satellitePane ? null : <DeferredDeskBuddy deskId={deskId} />}
    </DeskAppearanceProvider>
  );
}
