import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import { auth } from '../firebase';
import { isFounderSession } from '../lib/founder';

type FounderSessionResponse = { founder?: boolean };

/**
 * Founder gate for CEO UI — combines client emails with the httpOnly private session
 * (server truth). Avoids kicking the founder off /ceo while React auth is still on the
 * default operator@ profile.
 */
export function useFounderAccess() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [serverFounder, setServerFounder] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/founder-session', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data = (await res.json().catch(() => ({}))) as FounderSessionResponse;
        if (!cancelled) setServerFounder(Boolean(data.founder));
      } catch {
        if (!cancelled) setServerFounder(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email, userProfile?.email]);

  const clientFounder = isFounderSession(
    user?.email,
    userProfile?.email,
    auth.currentUser?.email,
  );
  const founder = clientFounder || serverFounder === true;
  const resolving = authLoading || serverFounder === null;

  return { founder, resolving, clientFounder, serverFounder };
}
