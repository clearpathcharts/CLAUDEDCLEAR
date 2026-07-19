import React, { useState, useEffect, lazy, Suspense } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import ExternalAboutPage from './components/ExternalAboutPage';
import TradingReimaginedLanding from './components/TradingReimaginedLanding';
import { TRADING_REIMAGINED_PATH, TRADING_REIMAGINED_SHORT_PATH } from './content/tradingReimaginedLanding';
import { useAuth } from './contexts/FirebaseContext';
import { advancedProfiles } from './lib/advanced/profiles';
import { CptBuddyWidget } from './components/CptBuddyWidget';

const EncyclopediaLayout = lazy(() => import('./components/encyclopedia/EncyclopediaLayout'));
const EncyclopediaOfIndicators = lazy(() => import('./components/EncyclopediaOfIndicators'));
const ClearPathEducation = lazy(() => import('./education/ClearPathEducation'));
const LiteracyOSPage = lazy(() => import('./literacy/LiteracyOSPage'));

function isEncyclopediaPath(path: string): boolean {
  const p = path.toLowerCase().trim();
  return (
    p === '/encyclopedia' ||
    p === '/financial-encyclopedia' ||
    p === '/stocks' ||
    p.startsWith('/stocks/') ||
    p.startsWith('/companies/') ||
    p.startsWith('/crypto/') ||
    p.startsWith('/forex/') ||
    p.startsWith('/commodities/') ||
    p.startsWith('/economy/') ||
    p === '/crypto' ||
    p === '/companies' ||
    p === '/companies/' ||
    p === '/forex' ||
    p === '/commodities'
  );
}

function isIndicatorsPath(path: string): boolean {
  const p = path.toLowerCase().trim();
  // Hub only — /indicators/:slug is server-rendered static HTML for crawlability.
  return p === '/indicators' || p === '/encyclopedia-of-indicators';
}

function isEducationPath(path: string): boolean {
  const p = path.toLowerCase().trim();
  // Hub only — /education/:school/... is server-rendered static HTML for crawlability.
  return p === '/education' || p === '/clearpath-education';
}

function isLiteracyPath(path: string): boolean {
  const p = path.toLowerCase().trim();
  return p === '/literacy' || p === '/literacy-os';
}

function PublicLearnShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-white">
      <div className="sticky top-0 z-[100] border-b border-white/10 bg-black/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3">
        <a
          href="/"
          className="text-xs font-black uppercase tracking-widest text-[#00E5FF] hover:text-white transition-colors"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          ← ClearPath Home
        </a>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <a href="/education" className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF]/80 hover:text-[#00E5FF]">Education</a>
          <a href="/literacy" className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF]/80 hover:text-[#00E5FF]">Literacy OS</a>
          <a href="/encyclopedia" className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF]/80 hover:text-[#00E5FF]">Encyclopedia</a>
          <a href="/indicators" className="text-[10px] font-black uppercase tracking-wider text-[#FF00C8]/80 hover:text-[#FF00C8]">Indicators</a>
          <a href="/ui" className="text-[10px] font-black uppercase tracking-wider text-[#B026FF]/80 hover:text-[#B026FF]">UI Modes</a>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
            Loading learning desk...
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });
  const [currentProfileId, setCurrentProfileId] = useState(() => {
    // 1. Check URL query parameters
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlProfile = params.get('profile');
        if (urlProfile && (advancedProfiles as any)[urlProfile]) {
          return urlProfile;
        }
      } catch (e) {
        console.error('Failed to parse URL query param:', e);
      }
    }
    // 2. Check local storage
    if (typeof localStorage !== 'undefined') {
      try {
        const savedProfile = localStorage.getItem('clearpath_current_profile_id');
        if (savedProfile && (advancedProfiles as any)[savedProfile]) {
          return savedProfile;
        }
      } catch (e) {
        console.error('Failed to load profile from localStorage:', e);
      }
    }
    return 'calm_focus';
  });
  const handleProfileChange = (newProfileId: string) => {
    setCurrentProfileId(newProfileId);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('clearpath_current_profile_id', newProfileId);
      } catch (e) {
        console.error('Failed to save profile to localStorage:', e);
      }
    }
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLocationChange = () => {
        setCurrentPath(window.location.pathname);
      };
      window.addEventListener('popstate', handleLocationChange);
      
      // Periodically check path in case hash routing / pushState is triggered from inside code
      const interval = setInterval(handleLocationChange, 2000);
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('profile') !== currentProfileId) {
          params.set('profile', currentProfileId);
          const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
          window.history.replaceState({ ...window.history.state }, '', newUrl);
        }
      } catch (e) {
        console.error('Failed to sync profile query param:', e);
      }
      return () => {
        window.removeEventListener('popstate', handleLocationChange);
        clearInterval(interval);
      };
    }
  }, [currentProfileId]);
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-dashed border-[#FF1493]/20 border-t-[#00FFFF] rounded-full animate-spin shadow-[0_0_30px_rgba(0,255,255,0.15)]" />
        <p className="text-zinc-500 font-mono text-[9px] mt-4 uppercase tracking-[0.3em] animate-pulse">Initializing Neural Gateway...</p>
      </div>
    );
  }
  // Route: /about should directly load the accessible disclosure page
  if (currentPath === '/about') {
    return <ExternalAboutPage />;
  }
  if (currentPath === TRADING_REIMAGINED_PATH || currentPath === TRADING_REIMAGINED_SHORT_PATH) {
    return <TradingReimaginedLanding />;
  }
  // Public learning desks when logged out (Auth marketing links + direct URLs)
  if (!user) {
    if (isEncyclopediaPath(currentPath)) {
      return (
        <PublicLearnShell>
          <EncyclopediaLayout />
        </PublicLearnShell>
      );
    }
    if (isIndicatorsPath(currentPath)) {
      return (
        <PublicLearnShell>
          <EncyclopediaOfIndicators />
        </PublicLearnShell>
      );
    }
    if (isEducationPath(currentPath)) {
      return (
        <PublicLearnShell>
          <ClearPathEducation
            onNavigate={(tabId) => {
              if (tabId === 'Encyclopedia') window.location.assign('/encyclopedia');
              else if (tabId === 'EncyclopediaOfIndicators') window.location.assign('/indicators');
              else if (tabId === 'LiteracyOS') window.location.assign('/literacy');
            }}
          />
        </PublicLearnShell>
      );
    }
    if (isLiteracyPath(currentPath)) {
      return (
        <PublicLearnShell>
          <LiteracyOSPage
            onNavigate={(tabId) => {
              if (tabId === 'Encyclopedia') window.location.assign('/encyclopedia');
              else if (tabId === 'EncyclopediaOfIndicators') window.location.assign('/indicators');
              else if (tabId === 'ClearPathEducation') window.location.assign('/education');
              else if (tabId === 'Yours') window.location.assign('/');
            }}
          />
        </PublicLearnShell>
      );
    }
    return <Auth />;
  }
  const profile = (advancedProfiles as any)[currentProfileId] || advancedProfiles.calm_focus;
  return (
    <div className="clearpath-glass-root">
      <Dashboard profile={profile} onProfileChange={handleProfileChange} />
      <CptBuddyWidget />
    </div>
  );
}
