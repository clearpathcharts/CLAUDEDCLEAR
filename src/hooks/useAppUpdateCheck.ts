import { useEffect, useState } from 'react';
import {
  evaluateUpdateOffer,
  type AppUpdateManifest,
  type UpdateOffer,
} from '../lib/appVersion';

const SNOOZE_KEY = 'cp_app_update_snooze_until';

function snoozed(): boolean {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

export function snoozeUpdate(hours: number): void {
  try {
    const ms = Math.max(1, hours) * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + ms));
  } catch {
    /* ignore */
  }
}

export function clearUpdateSnooze(): void {
  try {
    localStorage.removeItem(SNOOZE_KEY);
  } catch {
    /* ignore */
  }
}

export function useAppUpdateCheck(): {
  offer: UpdateOffer | null;
  snoozeHours: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [offer, setOffer] = useState<UpdateOffer | null>(null);
  const [snoozeHours, setSnoozeHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/app-update', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const manifest = (await res.json()) as AppUpdateManifest;
        if (cancelled) return;
        setSnoozeHours(manifest.policy?.snoozeHours ?? 24);
        const next = evaluateUpdateOffer(manifest);
        if (next && next.severity === 'soft' && snoozed()) {
          setOffer(null);
        } else {
          setOffer(next);
        }
      } catch (err) {
        if (!cancelled) {
          setOffer(null);
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    // Defer so first paint stays snappy
    const t = window.setTimeout(run, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [tick]);

  return {
    offer,
    snoozeHours,
    loading,
    error,
    refresh: () => setTick((n) => n + 1),
  };
}
