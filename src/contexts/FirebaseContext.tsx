import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, query, collection, orderBy, limit, updateDoc, deleteDoc, addDoc } from '../firebase';
import { getAuth, getDb, handleFirestoreError, OperationType } from '../firebase';
import { InterfaceProfile, UserProfile, TimelinePost, AboutContent, AnalysisEntry, JournalSettings, Task, Alert, UserRole, PortfolioPosition } from '../types';

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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const localUser = localStorage.getItem('cp_local_bypass_user');
        if (localUser) {
          return JSON.parse(localUser);
        }
      } catch (e) {}
    }
    return null;
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(defaultUserProfile);
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

  useEffect(() => {
    const authInstance = getAuth();
    if (!authInstance) {
      setLoading(false);
      return;
    }
    const unsubscribe = authInstance.onAuthStateChanged((firebaseUser: any) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        if (typeof localStorage !== 'undefined') {
          try {
            const localUser = localStorage.getItem('cp_local_bypass_user');
            if (localUser) {
              setUser(JSON.parse(localUser));
              setLoading(false);
              return;
            }
          } catch (e) {}
        }
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
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
      updateProfile: async () => {},
      updateUserImages: async () => {},
      updateIntro: async () => {},
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
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'Discovery');
            url.hash = 'Discovery';
            window.history.pushState(null, '', url.toString());
            window.location.href = url.origin + url.pathname + '?tab=Discovery#Discovery';
          } catch (e) {
            window.location.reload();
          }
        }
      },
      purgeAuthCache: () => {
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.clear();
            localStorage.setItem('clearpath_active_tab', 'Discovery');
            localStorage.setItem('clearpath_current_profile_id', 'calm_focus');
          } catch (e) {}
        }
        if (typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'Discovery');
            url.hash = 'Discovery';
            window.history.pushState(null, '', url.toString());
            window.location.href = url.origin + url.pathname + '?tab=Discovery#Discovery';
          } catch (e) {
            window.location.reload();
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

