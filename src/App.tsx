import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import ExternalAboutPage from './components/ExternalAboutPage';
import TradingReimaginedLanding from './components/TradingReimaginedLanding';
import { TRADING_REIMAGINED_PATH, TRADING_REIMAGINED_SHORT_PATH } from './content/tradingReimaginedLanding';
import { useAuth } from './contexts/FirebaseContext';
import { advancedProfiles } from './lib/advanced/profiles';
import { CptBuddyWidget } from './components/CptBuddyWidget';
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
      const interval = setInterval(handleLocationChange, 500);
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
  // If there is no authenticated session, render the gorgeous waitlist/external landing page
  if (!user) {
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
