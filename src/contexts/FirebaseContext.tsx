import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, query, collection, orderBy, limit, updateDoc, deleteDoc, addDoc } from '../firebase';
import { getAuth, getDb, handleFirestoreError, OperationType } from '../firebase';
import { InterfaceProfile, UserProfile, TimelinePost, AboutContent, AnalysisEntry, JournalSettings, Task, Alert, UserRole, PortfolioPosition } from '../types';
import { clearClientAuthArtifacts, clearPrivateSession, fetchPrivateSession, logoutPrivateAccount } from '../api/privateAuth';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  posts: TimelinePost[];
  analysisEntries: AnalysisEntry[];
  tasks: Task[];
  alerts: Alert[];
  portfolio: PortfolioPosition[];
  journalSettings: JournalSettings | null;
  aboutContent: AboutContent | null;
  quotaExceeded: boolean;
  retryConnection: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserImages: (updates: { avatar?: string; cover?: string }) => Promise<void>;
  updateIntro: (intro: { bio: string; location: string; company: string }) => Promise<void>;
  updateStatuses: (statuses: { id: number; image: string; caption: string; }[]) => Promise<void>;
  createPost: (content: string, media?: { url: string; type: 'image' | 'video' }, market_layer?: string) => Promise<void>;
  toggleLike: (postId: string, currentLikes: number) => Promise<void>;
  updateAbout: (content: Partial<AboutContent>) => Promise<void>;
  addAnalysisEntry: (entry: Omit<AnalysisEntry, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateAnalysisEntry: (id: string, updates: Partial<AnalysisEntry>) => Promise<void>;
  deleteAnalysisEntry: (id: string) => Promise<void>;
  addTask: (title: string, dueDate: any) => Promise<void>;
  toggleTask: (id: string, completed: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addAlert: (alert: Omit<Alert, 'id' | 'uid' | 'createdAt' | 'triggered'>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  addPosition: (symbol: string, price: number, quantity: number) => Promise<void>;
  uploadStrategy: (name: string, result: number) => Promise<void>;
  updateJournalSettings: (settings: Partial<JournalSettings>) => Promise<void>;
  sendMessage: (data: { name: string; email: string; message: string; targetUid: string }) => Promise<void>;
  logout: () => Promise<void>;
  requireVerified: () => boolean;
  purgeAuthCache: () => void;
}

  const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'clearpath_local_state_v1';

const defaultUserProfile: UserProfile = {
  uid: 'ghost-offline',
  email: 'operator@clearpathtrader.com',
  displayName: 'Clear Path Markets Science Agent',
  photoURL: '',
  interfaceType: 'calm_focus' as const,
  createdAt: new Date() as any,
  intro: {
    bio: 'System actively scanning for momentum discrepancies.',
    location: 'Global Grid',
    company: 'Clear Path Markets Science'
  }
};

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  // const getFirestoreDb = () => getDb(); // REMOVED FOR EMERGENCY ROLLBACK
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    let savedImages: { photoURL?: string; coverURL?: string } = {};
    try {
      savedImages = JSON.parse(localStorage.getItem('clearpath_user_images') || '{}');
    } catch {}
    return {
      ...defaultUserProfile,
      photoURL: savedImages.photoURL || '',
      coverURL: savedImages.coverURL || '',
    };
  });
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [analysisEntries, setAnalysisEntries] = useState<AnalysisEntry[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('clearpath_analysis_entries');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load analysis entries:', e);
      }
    }
    return [
      { id: 'mock1', uid: 'operator', createdAt: new Date().toISOString(), pair: 'EUR/USD', direction: 'long', timeframe: 'M15', entry: 1.0820, exitPrice: 1.0855, position: 100000, notes: 'FOMC sentiment sweep, clean logical execution.', sl: 0, tp: 0, rr: 1.5, resultR: 1.5, outcome: 'good', emotion: 'Focused', screenshot: '' },
      { id: 'mock2', uid: 'operator', createdAt: new Date().toISOString(), pair: 'BTC/USD', direction: 'long', timeframe: 'D1', entry: 64200, exitPrice: 65150, position: 2, notes: 'Break out of tactical compression channel.', sl: 0, tp: 0, rr: 1.5, resultR: 1.5, outcome: 'good', emotion: 'Focused', screenshot: '' },
      { id: 'mock3', uid: 'operator', createdAt: new Date().toISOString(), pair: 'GOLD', direction: 'short', timeframe: 'H4', entry: 2340, exitPrice: 2322, position: 50, notes: 'Double top structure breakdown on higher timeframe.', sl: 0, tp: 0, rr: 1.5, resultR: 1.5, outcome: 'good', emotion: 'Focused', screenshot: '' }
    ];
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  const [journalSettings, setJournalSettings] = useState<JournalSettings | null>(null);
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Hydrate auth from httpOnly cookie session (not localStorage).
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    clearPrivateSession(); // drop legacy localStorage auth mirrors
    (async () => {
      const privateSession = await fetchPrivateSession();
      if (cancelled) return;
      if (privateSession) {
        setUser(privateSession as unknown as User);
        setUserProfile((prev) => ({
          ...(prev || defaultUserProfile),
          uid: privateSession.uid,
          email: privateSession.email,
          displayName: privateSession.displayName,
        }));
        setLoading(false);
        return;
      }
      const authInstance = getAuth();
      if (!authInstance) {
        setLoading(false);
        return;
      }
      unsubscribe = authInstance.onAuthStateChanged((firebaseUser: any) => {
        if (cancelled) return;
        setUser(firebaseUser || null);
        setLoading(false);
      });
    })();
    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Helper to save entries
  const saveEntriesToLocalStorage = (entries: AnalysisEntry[]) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('clearpath_analysis_entries', JSON.stringify(entries));
      } catch (e) {
        console.error('Failed to save analysis entries:', e);
      }
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      loading,
      userProfile,
      userRole,
      posts,
      analysisEntries,
      tasks,
      alerts,
      portfolio,
      journalSettings,
      aboutContent,
      quotaExceeded,
      retryConnection: async () => {},
      updateProfile: async (updates: Partial<UserProfile>) => {
        setUserProfile((prev) => {
          const next = { ...(prev || defaultUserProfile), ...updates };
          try {
            localStorage.setItem(
              'clearpath_user_images',
              JSON.stringify({ photoURL: next.photoURL || '', coverURL: next.coverURL || '' })
            );
          } catch {}
          return next;
        });
        const uid = user?.uid;
        if (!uid) return;
        try {
          const { updateBasicProfile } = await import('../services/profileService');
          await updateBasicProfile(uid, {
            displayName: updates.displayName,
            bio: updates.intro?.bio,
            avatarUrl: updates.photoURL,
            coverUrl: updates.coverURL,
          });
        } catch (err) {
          console.warn('[FirebaseContext] Cloud profile sync skipped:', err);
        }
      },
      updateUserImages: async (updates: { avatar?: string; cover?: string }) => {
        const photoURL = updates.avatar;
        const coverURL = updates.cover;
        setUserProfile((prev) => {
          const base = prev || defaultUserProfile;
          const next = {
            ...base,
            photoURL: photoURL !== undefined ? photoURL : base.photoURL,
            coverURL: coverURL !== undefined ? coverURL : base.coverURL,
          };
          try {
            localStorage.setItem(
              'clearpath_user_images',
              JSON.stringify({ photoURL: next.photoURL || '', coverURL: next.coverURL || '' })
            );
          } catch {}
          return next;
        });
        const uid = user?.uid;
        const payload: Record<string, string> = {};
        if (uid) payload.uid = uid;
        if (photoURL !== undefined) payload.avatarUrl = photoURL;
        if (coverURL !== undefined) payload.coverUrl = coverURL;
        try {
          const { saveProfileToServer } = await import('../api/profileApi');
          const result = await saveProfileToServer(payload);
          if (result.ok) return;
        } catch (err) {
          console.warn('[FirebaseContext] Server image sync skipped:', err);
        }
        if (!uid) return;
        try {
          const { updateBasicProfile } = await import('../services/profileService');
          const fsPayload: Record<string, string> = {};
          if (photoURL !== undefined) fsPayload.avatarUrl = photoURL;
          if (coverURL !== undefined) fsPayload.coverUrl = coverURL;
          await updateBasicProfile(uid, fsPayload);
        } catch (err) {
          console.warn('[FirebaseContext] Cloud image sync skipped (local save kept):', err);
        }
      },
      updateIntro: async (intro: { bio: string; location: string; company: string }) => {
        setUserProfile((prev) => ({ ...(prev || defaultUserProfile), intro }));
      },
      updateStatuses: async () => {},
      createPost: async () => {},
      toggleLike: async () => {},
      updateAbout: async () => {},
      addAnalysisEntry: async (entry: Omit<AnalysisEntry, 'uid' | 'createdAt'>) => {
        const newEntry: AnalysisEntry = {
          ...entry,
          id: 'entry-' + Math.random().toString(36).substr(2, 9),
          uid: 'ghost-offline',
          createdAt: new Date().toISOString()
        };
        setAnalysisEntries(prev => {
          const updated = [...prev, newEntry];
          saveEntriesToLocalStorage(updated);
          return updated;
        });
      },
      updateAnalysisEntry: async (id: string, entry: Partial<AnalysisEntry>) => {
        setAnalysisEntries(prev => {
          const updated = prev.map(item => item.id === id ? { ...item, ...entry } : item);
          saveEntriesToLocalStorage(updated);
          return updated;
        });
      },
      deleteAnalysisEntry: async (id: string) => {
        setAnalysisEntries(prev => {
          const updated = prev.filter(item => item.id !== id);
          saveEntriesToLocalStorage(updated);
          return updated;
        });
      },
      addTask: async () => {},
      toggleTask: async () => {},
      deleteTask: async () => {},
      addAlert: async () => {},
      deleteAlert: async () => {},
      addPosition: async () => {},
      uploadStrategy: async () => {},
      updateJournalSettings: async () => {},
      sendMessage: async () => {},
      requireVerified: () => true,
      logout: async () => {
        try {
          await logoutPrivateAccount();
        } catch {
          clearPrivateSession();
        }
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.removeItem('cp_local_bypass_user');
            localStorage.removeItem('founders_unlocked');
            localStorage.setItem('clearpath_active_tab', 'Discovery');
            localStorage.setItem('clearpath_current_profile_id', 'calm_focus');
          } catch (e) {}
        }
        if (typeof window !== 'undefined') {
          try {
            window.location.href = '/';
          } catch (e) {
            window.location.reload();
          }
        }
      },
      purgeAuthCache: () => {
        // Hard reset of client caches ONLY — never logout.
        // Keep httpOnly session cookie intact so the user stays signed in.
        clearClientAuthArtifacts();
        if (typeof localStorage !== 'undefined') {
          try {
            const keepProfile = localStorage.getItem('clearpath_current_profile_id') || 'calm_focus';
            const keepImages = localStorage.getItem('clearpath_user_images');
            const keysToWipe: string[] = [];
            for (let i = 0; i < localStorage.length; i += 1) {
              const key = localStorage.key(i);
              if (!key) continue;
              // Preserve profile chrome; wipe chart/layout/cache junk that causes desync.
              if (
                key === 'clearpath_current_profile_id' ||
                key === 'clearpath_user_images' ||
                key === 'clearpath_active_tab'
              ) {
                continue;
              }
              keysToWipe.push(key);
            }
            for (const key of keysToWipe) localStorage.removeItem(key);
            localStorage.setItem('clearpath_active_tab', 'Discovery');
            localStorage.setItem('clearpath_current_profile_id', keepProfile);
            if (keepImages) localStorage.setItem('clearpath_user_images', keepImages);
          } catch (e) {}
        }
        if (typeof indexedDB !== 'undefined') {
          try {
            // Clear Firestore offline persistence DBs that the button claims to fix.
            const dbNames = ['firestore', 'firestore/[DEFAULT]', 'firebase-heartbeat-database', 'firebaseLocalStorageDb'];
            for (const name of dbNames) {
              try {
                indexedDB.deleteDatabase(name);
              } catch {
                /* ignore */
              }
            }
          } catch {
            /* ignore */
          }
        }
        if (typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'Discovery');
            url.hash = 'Discovery';
            // Soft navigate to main/HOME (Discovery) while staying authenticated.
            window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}#Discovery`);
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            window.dispatchEvent(new Event('clearpath-location'));
            // Soft reload keeps the session cookie; do not hit logout or Auth.
            window.location.reload();
          } catch (e) {
            window.location.assign('/?tab=Discovery#Discovery');
          }
        }
      }
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
}

