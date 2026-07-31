import React, { useState, useEffect, lazy, Suspense } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import ExternalAboutPage from './components/ExternalAboutPage';
import AffiliateTermsPage from './components/AffiliateTermsPage';
import TradingReimaginedLanding from './components/TradingReimaginedLanding';
import PressKitPage from './components/PressKitPage';
import SocialOsPage from './components/SocialOsPage';
import { TRADING_REIMAGINED_PATH, TRADING_REIMAGINED_SHORT_PATH } from './content/tradingReimaginedLanding';
import { useAuth } from './contexts/FirebaseContext';
import { advancedProfiles } from './lib/advanced/profiles';
import { CptBuddyWidget } from './components/CptBuddyWidget';
import AppUpdateBanner from './components/AppUpdateBanner';
import { AppShellProvider, useAppShell } from './contexts/AppShellContext';

const EncyclopediaLayout = lazy(() => import('./components/encyclopedia/EncyclopediaLayout'));
const ClearPathEducation = lazy(() => import('./education/ClearPathEducation'));
const LiteracyOSPage = lazy(() => import('./literacy/LiteracyOSPage'));

function AuthenticatedShell({
  profile,
  onProfileChange,
}: {
  profile: (typeof advancedProfiles)[keyof typeof advancedProfiles];
  onProfileChange: (id: string) => void;
}) {
  const { isAppShell } = useAppShell();
  return (
    <div className="clearpath-glass-root">
      <Dashboard profile={profile} onProfileChange={onProfileChange} />
      {!isAppShell && <CptBuddyWidget />}
    </div>
  );
}

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
      <a href="#learn-main" className="cp-skip-link">
        Skip to main content
      </a>
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-black/90 backdrop-blur-xl px-4 py-3">
        <nav aria-label="Learning desks" className="flex items-center justify-between gap-3">
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
            <a href="/ui" className="text-[10px] font-black uppercase tracking-wider text-[#B026FF]/80 hover:text-[#B026FF]">UI Modes</a>
          </div>
        </nav>
      </header>
      <main id="learn-main" tabIndex={-1} className="outline-none">
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
              Loading learning desk...
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
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
  // Capture ?ref=CODE into httpOnly affiliate cookie for signup attribution
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (!ref || !/^[A-Za-z0-9]{4,16}$/.test(ref)) return;
      void fetch('/api/affiliate/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: ref }),
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLocationChange = () => {
        setCurrentPath(window.location.pathname);
      };
      window.addEventListener('popstate', handleLocationChange);
      window.addEventListener('clearpath-location', handleLocationChange);

      // Patch history so in-app pushState/replaceState refreshes views immediately
      const hist = window.history;
      const originalPush = hist.pushState.bind(hist);
      const originalReplace = hist.replaceState.bind(hist);
      hist.pushState = (...args: Parameters<History['pushState']>) => {
        originalPush(...args);
        window.dispatchEvent(new Event('clearpath-location'));
      };
      hist.replaceState = (...args: Parameters<History['replaceState']>) => {
        originalReplace(...args);
        window.dispatchEvent(new Event('clearpath-location'));
      };

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
        window.removeEventListener('clearpath-location', handleLocationChange);
        hist.pushState = originalPush;
        hist.replaceState = originalReplace;
      };
    }
  }, [currentProfileId]);
  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-dashed border-[#FF1493]/20 border-t-[#00FFFF] rounded-full animate-spin shadow-[0_0_30px_rgba(0,255,255,0.15)]" />
        <p className="text-zinc-500 font-mono text-[9px] mt-4 uppercase tracking-[0.3em] animate-pulse">Initializing Neural Gateway...</p>
      </div>
    );
  } else if (currentPath === '/about') {
    content = <ExternalAboutPage />;
  } else if (currentPath === '/affiliate-terms') {
    content = <AffiliateTermsPage />;
  } else if (currentPath === '/press' || currentPath === '/press-kit') {
    content = <PressKitPage />;
  } else if (currentPath === '/ops/social' || currentPath === '/social-os') {
    content = <SocialOsPage />;
  } else if (currentPath === TRADING_REIMAGINED_PATH || currentPath === TRADING_REIMAGINED_SHORT_PATH) {
    content = <TradingReimaginedLanding />;
  } else if (!user) {
    // Public learning desks when logged out (Auth marketing links + direct URLs)
    if (isEncyclopediaPath(currentPath)) {
      content = (
        <PublicLearnShell>
          <EncyclopediaLayout />
        </PublicLearnShell>
      );
    }
    // Encyclopedia of Indicators SPA hub hidden while videos are broken (component kept).
    else if (isEducationPath(currentPath)) {
      content = (
        <PublicLearnShell>
          <ClearPathEducation
            onNavigate={(tabId) => {
              if (tabId === 'Encyclopedia') window.location.assign('/encyclopedia');
              else if (tabId === 'EncyclopediaOfIndicators') { /* hidden while videos broken */ }
              else if (tabId === 'LiteracyOS') window.location.assign('/literacy');
            }}
          />
        </PublicLearnShell>
      );
    } else if (isLiteracyPath(currentPath)) {
      content = (
        <PublicLearnShell>
          <LiteracyOSPage
            onNavigate={(tabId) => {
              if (tabId === 'Encyclopedia') window.location.assign('/encyclopedia');
              else if (tabId === 'EncyclopediaOfIndicators') { /* hidden while videos broken */ }
              else if (tabId === 'ClearPathEducation') window.location.assign('/education');
              else if (tabId === 'Yours') window.location.assign('/');
            }}
          />
        </PublicLearnShell>
      );
    } else {
      content = <Auth />;
    }
  } else {
    const profile = (advancedProfiles as any)[currentProfileId] || advancedProfiles.calm_focus;
    content = (
      <AppShellProvider>
        <AuthenticatedShell profile={profile} onProfileChange={handleProfileChange} />
      </AppShellProvider>
    );
  }

  return (
    <>
      {content}
      {/* Consent-first web/APK update prompt — never silent install */}
      <AppUpdateBanner />
    </>
  );
}
